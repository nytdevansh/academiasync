/**
 * emailService.ts
 *
 * Institutional Email Dispatch Service for AcademiaSync.
 * Supports:
 *  1. Production SMTP (e.g. Gmail SMTP with App Password, SendGrid, Amazon SES)
 *  2. Local Dev with Ethereal Email (auto-generates disposable test inbox & logs preview URL)
 *  3. Pre-install Fallback Mock Logger (keeps compilation & testing green if nodemailer is not yet installed)
 */

import dns from 'dns';

// Enforce IPv4-first lookup globally across Node.js to eliminate ENETUNREACH on IPv6 addresses
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Explicit IPv4-only DNS lookup — bypasses any ambiguity in pooled-transport DNS handling
const forceIPv4Lookup = (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
) => {
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    callback(err, address as string, family as number);
  });
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

// Dynamically load nodemailer to prevent crashes if not installed in node_modules
let nodemailerModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nodemailerModule = require('nodemailer');
} catch {
  nodemailerModule = null;
}

let cachedTransporter: any = null;
let cachedTransportMode: 'smtp' | 'ethereal' | 'mock_logger' = 'mock_logger';
let transporterInitialized = false;
let initPromise: Promise<any> | null = null;

export const isNodemailerInstalled = (): boolean => Boolean(nodemailerModule);

export type EmailTransportMode = 'resend' | 'sendgrid' | 'smtp' | 'ethereal' | 'mock_logger';

export const getEmailTransportMode = (): EmailTransportMode => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return 'resend';
  }
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()) {
    return 'sendgrid';
  }
  if (!nodemailerModule) return 'mock_logger';
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  if (host && user && pass) {
    return 'smtp';
  }
  return cachedTransportMode;
};


/**
 * Initializes and returns an active email transporter.
 * Reuses a single pooled Transporter instance at module scope.
 */
const getTransporter = async (): Promise<any> => {
  if (transporterInitialized) return cachedTransporter;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!nodemailerModule) {
      cachedTransportMode = 'mock_logger';
      transporterInitialized = true;
      return null;
    }

    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || process.env.SMTP_USERNAME || '').trim();
    // Google displays app passwords with spaces (e.g. "abcd efgh ijkl mnop"). Strip any spaces automatically:
    const rawPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
    const pass = rawPass.replace(/\s+/g, '').trim();

    // ── Tier 1: Real Production SMTP Configuration (Gmail, SendGrid, SES, etc.) ──
    if (host && user && pass) {

      cachedTransportMode = 'smtp';
      try {
        const port = Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE === 'true' ? 465 : 587));
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;

        // Pooled connection reuse across multiple emails to eliminate repeated TLS handshakes
        cachedTransporter = nodemailerModule.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          pool: true,
          family: 4,
          lookup: forceIPv4Lookup,
          maxConnections: 5,
          maxMessages: 100,
          connectionTimeout: 15000, // 15s to accommodate Gmail TLS handshake
          greetingTimeout: 15000,   // 15s for SMTP banner greeting
          socketTimeout: 20000,     // 20s socket timeout
        });


        transporterInitialized = true;
        console.log(`📧 [EmailService] Initialized pooled SMTP transporter on ${host}:${port} (secure: ${secure})`);
        return cachedTransporter;
      } catch (err: any) {
        console.error('❌ [EmailService] Failed to create SMTP transporter:', err?.message || err);
        cachedTransporter = null;
        transporterInitialized = true;
        return null;
      }
    }

    // ── Tier 2: Local Dev Ethereal Disposable Account (1.5s discovery timeout) ──
    try {
      const testAccountPromise = nodemailerModule.createTestAccount();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ethereal discovery timeout (1500ms)')), 1500)
      );
      const testAccount: any = await Promise.race([testAccountPromise, timeoutPromise]);

      cachedTransporter = nodemailerModule.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });
      cachedTransportMode = 'ethereal';
      transporterInitialized = true;
      console.log(`📧 [EmailService] Initialized Ethereal test inbox: ${testAccount.user}`);
      return cachedTransporter;
    } catch (err: any) {
      // No SMTP configured and Ethereal unavailable -> Clean fallback to mock preview logger
      console.log('ℹ️  [EmailService] No SMTP configured in .env (offline/local dev mode), active channel: Console Preview Logger');
      cachedTransportMode = 'mock_logger';
      cachedTransporter = null;
      transporterInitialized = true;
      return null;
    }
  })();

  return initPromise;
};

/**
 * Dispatches an email via Resend's REST API over HTTPS (Port 443).
 * Compatible with all cloud hosts (Render, Vercel, Railway) that block raw SMTP ports.
 */
const sendViaResendHttp = async ({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions & { from: string }): Promise<SendEmailResult> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured in .env' };
  }

  // Resend requires a verified domain or its default onboarding sender for testing:
  const resendFrom = process.env.RESEND_FROM || (from.includes('@') ? from : 'AcademiaSync <onboarding@resend.dev>');

  try {
    console.log(`📧 [EmailService:Resend] Dispatching to "${to}" via HTTPS API (Port 443)...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''),
      }),
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Resend API error (${response.status} ${response.statusText})`;
      console.error(`❌ [EmailService:Resend Error] Delivery failed to "${to}":`, errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`✅ [Email Sent Successfully via Resend HTTPS] "${subject}" -> ${to} (id: ${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    console.error(`❌ [EmailService:Resend Network Error] Failed to reach Resend API for "${to}":`, err?.message || err);
    return { success: false, error: err?.message || 'Resend HTTP request failed' };
  }
};

/**
 * Dispatches an email via SendGrid's v3 Mail Send REST API over HTTPS (Port 443).
 */
const sendViaSendgridHttp = async ({
  to,
  subject,
  html,
  text,
  fromName,
  fromAddress,
}: SendEmailOptions & { fromName: string; fromAddress: string }): Promise<SendEmailResult> => {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY is not configured in .env' };
  }

  try {
    console.log(`📧 [EmailService:SendGrid] Dispatching to "${to}" via HTTPS API (Port 443)...`);
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromAddress, name: fromName },
        subject,
        content: [
          { type: 'text/html', value: html },
          ...(text ? [{ type: 'text/plain', value: text }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`❌ [EmailService:SendGrid Error] Delivery failed to "${to}":`, errorText);
      return { success: false, error: errorText || `SendGrid error (${response.status})` };
    }

    console.log(`✅ [Email Sent Successfully via SendGrid HTTPS] "${subject}" -> ${to}`);
    return { success: true, messageId: `sg-${Date.now()}` };
  } catch (err: any) {
    console.error(`❌ [EmailService:SendGrid Network Error] Failed to reach SendGrid API for "${to}":`, err?.message || err);
    return { success: false, error: err?.message || 'SendGrid HTTP request failed' };
  }
};

/**
 * Dispatch an email to a single recipient.
 * Routes automatically through Resend (HTTPS), SendGrid (HTTPS), SMTP, or Local Dev Logger.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<SendEmailResult> => {
  try {
    if (!to || !subject) {
      return { success: false, error: 'Recipient address (to) and subject are required.' };
    }

    const fromName = process.env.EMAIL_FROM_NAME || 'AcademiaSync Portal';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'onboarding@resend.dev';
    const from = `"${fromName}" <${fromAddress}>`;

    const mode = getEmailTransportMode();

    // ── Tier 1: Resend REST API over HTTPS (Port 443) ──
    if (mode === 'resend') {
      return await sendViaResendHttp({ to, subject, html, text, from });
    }

    // ── Tier 2: SendGrid REST API over HTTPS (Port 443) ──
    if (mode === 'sendgrid') {
      return await sendViaSendgridHttp({ to, subject, html, text, fromName, fromAddress });
    }

    // ── Tier 3: SMTP (Local dev or unblocked servers) ──
    const transporter = await getTransporter();

    // Case A: Real SMTP was configured but transporter could not be initialized
    if (!transporter && cachedTransportMode === 'smtp') {
      const err = 'SMTP host was configured, but connection could not be established. Note: Render blocks outbound SMTP ports 25, 465, and 587. To send emails from Render, add RESEND_API_KEY to your environment variables.';
      console.error(`❌ [EmailService] Delivery aborted to "${to}": ${err}`);
      return {
        success: false,
        error: err,
      };
    }

    // Case B: No SMTP or API Key Configured (Local Dev / Offline Mock Logger)
    if (!transporter && cachedTransportMode === 'mock_logger') {
      console.log('\n' + '─'.repeat(70));
      console.log('📧 [Console Email Preview] (Local Dev / No RESEND_API_KEY or SMTP Configured in .env)');
      console.log(`   To:      ${to}`);
      console.log(`   From:    ${from}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: ${text || html.slice(0, 150).replace(/<[^>]+>/g, '')}...`);
      console.log('─'.repeat(70) + '\n');

      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        previewUrl: 'console-preview',
      };
    }


    // ── Case C: Active SMTP / Ethereal Transporter Delivery ──
    try {
      console.log(`📧 [EmailService] Initiating dispatch to "${to}" via ${cachedTransportMode}...`);
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''),
      });

      // 25-second safeguard timeout for slow Gmail handshakes
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP sendMail timed out after 25000ms. Gmail connection or auth was cut off.')), 25000)
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);

      let previewUrl: string | undefined;
      if (cachedTransportMode === 'ethereal' && nodemailerModule?.getTestMessageUrl) {
        previewUrl = nodemailerModule.getTestMessageUrl(info) || undefined;
        if (previewUrl) {
          console.log(`📧 [Ethereal Preview URL] ${subject} -> ${previewUrl}`);
        }
      } else {
        console.log(`✅ [Email Sent Successfully] "${subject}" -> ${to} (id: ${info.messageId})`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
      };
    } catch (deliveryErr: any) {
      // When real SMTP is configured, do NOT silently swallow errors! Surface the real failure!
      const errorMsg = deliveryErr?.message || 'SMTP delivery failed';
      console.error(`❌ [EmailService Error] Real SMTP delivery failed for "${to}":`, errorMsg);

      // Reset pool on network/socket connection errors to prevent dead socket inheritance
      const isConnectionError =
        deliveryErr?.code === 'ENETUNREACH' ||
        deliveryErr?.code === 'ETIMEDOUT' ||
        deliveryErr?.code === 'ECONNREFUSED' ||
        deliveryErr?.code === 'ECONNRESET' ||
        deliveryErr?.code === 'ESOCKET' ||
        (typeof errorMsg === 'string' && (errorMsg.includes('timed out') || errorMsg.includes('ENETUNREACH') || errorMsg.includes('Connection timeout')));

      if (isConnectionError) {
        console.warn(`⚠️  [EmailService] Network/socket failure detected (${deliveryErr?.code || 'timeout'}). Resetting pooled transporter.`);
        try { cachedTransporter?.close?.(); } catch {}
        cachedTransporter = null;
        transporterInitialized = false;
        initPromise = null;
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    console.error(`❌ [EmailService Unexpected Error] Failed to process email "${subject}" to "${to}":`, err?.message || err);
    return {
      success: false,
      error: err?.message || 'Email delivery failed',
    };
  }
};

/**
 * Diagnostic utility to verify SMTP connectivity and credentials.
 */
export const verifySmtpConnection = async (): Promise<{ success: boolean; mode: string; error?: string }> => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return { success: true, mode: cachedTransportMode };
    }
    await transporter.verify();
    return { success: true, mode: cachedTransportMode };
  } catch (err: any) {
    return { success: false, mode: cachedTransportMode, error: err?.message || String(err) };
  }
};



