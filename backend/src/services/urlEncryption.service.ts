import crypto from 'crypto';

export class TokenExpiredError extends Error {
  constructor(message = 'Token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class TokenTamperedError extends Error {
  constructor(message = 'Token integrity check failed or data was tampered with') {
    super(message);
    this.name = 'TokenTamperedError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message = 'Invalid token structure or format') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

const getEncryptionKey = (): Buffer => {
  const hexKey = process.env.URL_ENC_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('URL_ENC_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
};

/**
 * Encrypts a payload into an authenticated, tamper-proof, URL-safe string using AES-256-GCM.
 * Automatically embeds an expiration timestamp if expiresInSeconds is provided.
 */
export const encryptPayload = (payload: any, expiresInSeconds?: number): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM

  const exp = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined;
  const wrappedPayload = JSON.stringify({ data: payload, exp });

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(wrappedPayload, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  // Format: [12 bytes IV][16 bytes AuthTag][Ciphertext]
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64url');
};

/**
 * Decrypts and validates an authenticated AES-256-GCM URL-safe token.
 * Throws typed errors (TokenExpiredError, TokenTamperedError, InvalidTokenError)
 * so callers can distinguish between expired and fraudulent requests.
 */
export const decryptPayload = <T = any>(token: string): T => {
  if (!token || typeof token !== 'string') {
    throw new InvalidTokenError('Empty or invalid token provided');
  }

  let combined: Buffer;
  try {
    combined = Buffer.from(token, 'base64url');
  } catch {
    throw new InvalidTokenError('Failed to parse base64url token');
  }

  // Minimum length: 12 (IV) + 16 (Tag) + 1 (Ciphertext) = 29 bytes
  if (combined.length < 29) {
    throw new InvalidTokenError('Token is too short or malformed');
  }

  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decryptedStr: string;
  try {
    decryptedStr = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new TokenTamperedError();
  }

  let parsed: { data: T; exp?: number };
  try {
    parsed = JSON.parse(decryptedStr);
  } catch {
    throw new InvalidTokenError('Decrypted payload is not valid JSON');
  }

  if (parsed.exp && Date.now() > parsed.exp) {
    throw new TokenExpiredError(`Token expired at ${new Date(parsed.exp).toISOString()}`);
  }

  return parsed.data;
};
