/**
 * emailService.ts
 *
 * Institutional Email Dispatch Service for AcademiaSync.
 * Supports:
 *  1. Production SMTP (e.g. Gmail SMTP with App Password, SendGrid, Amazon SES)
 *  2. Local Dev with Ethereal Email (auto-generates disposable test inbox & logs preview URL)
 *  3. Pre-install Fallback Mock Logger (keeps compilation & testing green if nodemailer is not yet installed)
 */

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

export const isNodemailerInstalled = (): boolean => Boolean(nodemailerModule);

export const getEmailTransportMode = (): 'smtp' | 'ethereal' | 'mock_logger' => {
  if (!nodemailerModule) return 'mock_logger';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return 'smtp';
  }
  return 'ethereal';
};

/**
 * Initializes and returns an active email transporter.
 */
const getTransporter = async (): Promise<any> => {
  if (cachedTransporter) return cachedTransporter;

  if (!nodemailerModule) {
    cachedTransportMode = 'mock_logger';
    return null;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Production or Explicit SMTP Configuration
  if (host && user && pass) {
    cachedTransporter = nodemailerModule.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    cachedTransportMode = 'smtp';
    console.log(`📧 [EmailService] Initialized SMTP transporter on ${host}`);
    return cachedTransporter;
  }

  // Local Dev: Ethereal Disposable Test Account
  try {
    const testAccount = await nodemailerModule.createTestAccount();
    cachedTransporter = nodemailerModule.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedTransportMode = 'ethereal';
    console.log(`📧 [EmailService] Initialized Ethereal test inbox: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err: any) {
    console.warn('⚠️  [EmailService] Failed to create Ethereal account, falling back to console preview:', err?.message);
    cachedTransportMode = 'mock_logger';
    return null;
  }
};

/**
 * Dispatch an email to a single recipient.
 * Never throws to the caller — returns { success: boolean } with diagnostic info.
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
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'notifications@academiasync.edu';
    const from = `"${fromName}" <${fromAddress}>`;

    const transporter = await getTransporter();

    // ── Tier 1: Fallback Mock Logger (when nodemailer is not installed or Ethereal failed) ──
    if (!transporter) {
      console.log('\n' + '─'.repeat(70));
      console.log('📧 [Console Email Preview] (nodemailer not installed or dev logger active)');
      console.log(`   To:      ${to}`);
      console.log(`   From:    ${from}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: ${text || html.slice(0, 150).replace(/<[^>]+>/g, '')}...`);
      console.log('─'.repeat(70) + '\n');

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        previewUrl: 'console-preview',
      };
    }

    // ── Tier 2 & 3: Real SMTP / Ethereal Sending ──
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });

    let previewUrl: string | undefined;
    if (cachedTransportMode === 'ethereal' && nodemailerModule?.getTestMessageUrl) {
      previewUrl = nodemailerModule.getTestMessageUrl(info) || undefined;
      if (previewUrl) {
        console.log(`📧 [Ethereal Preview URL] ${subject} -> ${previewUrl}`);
      }
    } else {
      console.log(`📧 [Email Sent] ${subject} -> ${to} (id: ${info.messageId})`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err: any) {
    console.error(`❌ [EmailService Error] Failed to send email "${subject}" to ${to}:`, err?.message || err);
    return {
      success: false,
      error: err?.message || 'Email delivery failed',
    };
  }
};
