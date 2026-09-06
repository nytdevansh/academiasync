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

export const getEmailTransportMode = (): 'smtp' | 'ethereal' | 'mock_logger' => {
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
 * Dispatch an email to a single recipient.
 * If SMTP is configured, performs real delivery and surfaces legitimate errors if it fails.
 * If SMTP is NOT configured (dev mode), previews in console and returns success.
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
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'notifications@academiasync.edu';
    const from = `"${fromName}" <${fromAddress}>`;

    const transporter = await getTransporter();

    // ── Case A: Real SMTP was configured but transporter could not be initialized ──
    if (!transporter && cachedTransportMode === 'smtp') {
      const err = 'SMTP host was configured, but connection could not be established. Check SMTP_HOST, port, and credentials in .env.';
      console.error(`❌ [EmailService] Delivery aborted to "${to}": ${err}`);
      return {
        success: false,
        error: err,
      };
    }

    // ── Case B: No SMTP Configured (Local Dev / Offline Mock Logger) ──
    if (!transporter && cachedTransportMode === 'mock_logger') {
      console.log('\n' + '─'.repeat(70));
      console.log('📧 [Console Email Preview] (Local Dev / No SMTP Configured in .env)');
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



