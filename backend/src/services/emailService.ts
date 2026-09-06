/**
 * emailService.ts
 *
 * Institutional Email Dispatch Service for AcademiaSync.
 * Sends emails via the official Google Gmail REST API (v1) over HTTPS (Port 443) using OAuth2.
 * Falls back to local console logger preview when OAuth2 credentials are not set in .env.
 */

import { google } from 'googleapis';

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

export type EmailTransportMode = 'gmail_api' | 'mock_logger';

export const isNodemailerInstalled = (): boolean => false;

/**
 * Checks whether Gmail OAuth2 credentials are configured in .env.
 */
export const getEmailTransportMode = (): EmailTransportMode => {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

  if (clientId && clientSecret && refreshToken) {
    return 'gmail_api';
  }
  return 'mock_logger';
};

// Cached OAuth2 client and Gmail API instance
let oauth2ClientInstance: any = null;
let gmailClientInstance: any = null;

/**
 * Returns a cached Gmail API client instance authorized via OAuth2 refresh token.
 */
const getGmailClient = (): any => {
  if (gmailClientInstance) return gmailClientInstance;

  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

  if (clientId && clientSecret && refreshToken) {
    try {
      oauth2ClientInstance = new google.auth.OAuth2(
        clientId,
        clientSecret,
        process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
      );
      oauth2ClientInstance.setCredentials({ refresh_token: refreshToken });
      gmailClientInstance = google.gmail({ version: 'v1', auth: oauth2ClientInstance });
      return gmailClientInstance;
    } catch (err: any) {
      console.error('❌ [EmailService] Failed to initialize Gmail OAuth2 client:', err?.message || err);
      return null;
    }
  }

  return null;
};

/**
 * Builds an RFC 2822 email string with UTF-8 support and encodes it as base64url.
 */
const createRawEmail = ({
  from,
  to,
  subject,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): string => {
  // UTF-8 MIME encoding for Subject to support emojis, accents, and special characters
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
  ];

  const rawMessage = `${headers.join('\r\n')}\r\n\r\n${html}`;

  // Base64URL-encode (standard base64, with '+' -> '-', '/' -> '_', and stripped '=')
  return Buffer.from(rawMessage, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Dispatch an email to a single recipient.
 * Routes through Google Gmail API over HTTPS (Port 443), or falls back to local dev preview logger.
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
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER || 'me';
    const from = fromAddress.includes('@') ? `"${fromName}" <${fromAddress}>` : fromAddress;

    const gmail = getGmailClient();

    // ── Dev / Fallback Mode (When OAuth2 credentials are not configured) ──
    if (!gmail) {
      console.log('\n' + '─'.repeat(70));
      console.log('📧 [Console Email Preview] (Local Dev / Gmail OAuth2 Not Configured in .env)');
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

    // ── Production Mode (Google Gmail API v1 over HTTPS Port 443) ──
    console.log(`📧 [EmailService:Gmail API] Dispatching email to "${to}" via Gmail API...`);
    const encodedRaw = createRawEmail({ from, to, subject, html });

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedRaw,
      },
    });

    const messageId = response.data?.id || undefined;
    console.log(`✅ [Email Sent Successfully via Gmail API] "${subject}" -> ${to} (id: ${messageId})`);

    return {
      success: true,
      messageId,
    };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error?.message || err?.message || 'Gmail API request failed';
    console.error(`❌ [EmailService:Gmail API Error] Delivery failed to "${to}":`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Diagnostic utility to verify Gmail API credentials and authentication.
 */
export const verifySmtpConnection = async (): Promise<{ success: boolean; mode: string; error?: string }> => {
  const mode = getEmailTransportMode();
  if (mode === 'mock_logger') {
    return { success: true, mode: 'mock_logger' };
  }

  try {
    const gmail = getGmailClient();
    if (!gmail) {
      return { success: false, mode: 'gmail_api', error: 'Gmail OAuth2 client could not be initialized' };
    }
    await gmail.users.getProfile({ userId: 'me' });
    return { success: true, mode: 'gmail_api' };
  } catch (err: any) {
    const errorMsg = err?.response?.data?.error?.message || err?.message || String(err);
    return { success: false, mode: 'gmail_api', error: errorMsg };
  }
};
