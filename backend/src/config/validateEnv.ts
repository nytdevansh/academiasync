import dotenv from 'dotenv';
dotenv.config();

export interface ValidatedEnv {
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  URL_ENC_KEY: string;
  NODE_ENV: string;
}

/**
 * Validates critical environment variables and security secrets at startup.
 * Fails fast with process.exit(1) if any secret is missing or fails length/format checks.
 */
export const validateEnv = (): ValidatedEnv => {
  const errors: string[] = [];

  // 1. JWT_SECRET check
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is missing in environment variables.');
  } else if (jwtSecret.length < 32) {
    errors.push(`JWT_SECRET is too short (${jwtSecret.length} chars). Minimum length is 32 characters.`);
  }

  // 2. URL_ENC_KEY check (Must be a 32-byte hex string = 64 hex characters)
  const urlEncKey = process.env.URL_ENC_KEY;
  if (!urlEncKey) {
    errors.push('URL_ENC_KEY is missing in environment variables. Required for AES-256-GCM encryption.');
  } else if (!/^[0-9a-fA-F]{64}$/.test(urlEncKey)) {
    errors.push(
      `URL_ENC_KEY must be a 64-character hex string (32 bytes). Found ${urlEncKey.length} characters with invalid format.`
    );
  }

  // 3. MongoDB connection string check
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
  if (!mongoUri) {
    errors.push('MongoDB connection string (MONGO_URI / MONGODB_ATLAS_URI) is missing.');
  }

  if (errors.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ FATAL STARTUP CONFIGURATION ERROR:');
    errors.forEach((err, idx) => console.error(`   ${idx + 1}. ${err}`));
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }

  console.log('🔒 Security secrets and environment configuration validated successfully.');

  return {
    PORT: Number(process.env.PORT) || 5000,
    MONGO_URI: mongoUri as string,
    JWT_SECRET: jwtSecret as string,
    URL_ENC_KEY: urlEncKey as string,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
};
