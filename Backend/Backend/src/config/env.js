import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/ets'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:5000'),
  FRONTEND_BASE_URL: z.string().url().default('http://localhost:5173'),
  // Key used to encrypt secrets (e.g. Stripe keys) stored in the settings collection.
  SETTINGS_ENCRYPTION_KEY: z.string().min(32).default('ets-dev-settings-encryption-key-change-me'),
  UPLOAD_DIR: z.string().default('uploads'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  
  OPENAI_API_KEY: z.string().default(''),

  // Dev/test-only payment bypass: checkout endpoints skip Stripe and mint a
  // `test_<purchaseId>` session id that confirm endpoints fulfill directly.
  // Hard-blocked in production regardless of the value.
  PAYMENT_TEST_MODE: z
    .string()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),

  // Auth & Email settings
  JWT_SECRET: z.string().default('super-secret-jwt-key'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default('santoshkumarsharma6367@gmail.com'),
  SMTP_PASS: z.string().default('icqxhfjzfwresfis'),
  SMTP_FROM: z.string().default('Santosh <santoshkumarsharma6367@gmail.com>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (
  env.NODE_ENV === 'production' &&
  env.SETTINGS_ENCRYPTION_KEY === 'ets-dev-settings-encryption-key-change-me'
) {
  console.warn(
    'WARNING: SETTINGS_ENCRYPTION_KEY is using the default dev value in production. Set a strong unique key.',
  );
}
