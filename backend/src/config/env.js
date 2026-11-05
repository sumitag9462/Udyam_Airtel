import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

// Attempt to load .env file if running locally and process.loadEnvFile is available
if (typeof process.loadEnvFile === 'function') {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(process.cwd(), 'server/.env'),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        break;
      } catch {
        // Ignore parsing errors or permissions
      }
    }
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    PORT: z.coerce.number().int().positive().default(3001),

    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),

    MONGO_URI: z
      .string({ required_error: 'MONGO_URI is required' })
      .min(1, 'MONGO_URI must not be empty'),

    JWT_ACCESS_SECRET: z
      .string({ required_error: 'JWT_ACCESS_SECRET is required' })
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),

    JWT_REFRESH_SECRET: z
      .string({ required_error: 'JWT_REFRESH_SECRET is required' })
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

    OTP_MODE: z.enum(['simulated']).default('simulated'),

    LLM_PROVIDER: z.enum(['anthropic', 'mock']).default('mock'),

    ANTHROPIC_API_KEY: z.string().optional(),

    LLM_MODEL: z.string().default('claude-sonnet-4-20250514'),

    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),

    PRICING_MODE: z.enum(['min', 'mid', 'max']).default('min'),

    SELF_SERVE_SEGMENTS: z.string().default('prof,micro'),

    KYC_REFERENCE_DATE: z.string().date().default('2026-07-15'),

    KYC_ADDRESS_PROOF_MAX_DAYS: z.coerce.number().int().positive().default(90),

    FILE_ENC_KEY: z.string({ required_error: 'FILE_ENC_KEY is required' }).refine(
      (val) => {
        try {
          return Buffer.from(val, 'base64').length === 32;
        } catch {
          return false;
        }
      },
      { message: 'FILE_ENC_KEY must be a base64-encoded 32-byte key' }
    ),

    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),

    RETENTION_REJECTED_DAYS: z.coerce.number().int().positive().default(30),

    RETENTION_APPROVED_DAYS: z.coerce.number().int().positive().default(180),

    SIM_TIME_SCALE: z.coerce.number().positive().default(1),

    QUOTE_TTL_DAYS: z.coerce.number().int().positive().default(7),

    STAFF_SEED_PASSWORD: z.string().optional(),

    FEATURE_VOICE: z.coerce.boolean().default(false),

    FEATURE_WHATSAPP: z.coerce.boolean().default(false),

    DEMO_MODE: z.coerce.boolean().default(false),
  })
  .refine((data) => data.LLM_PROVIDER !== 'anthropic' || Boolean(data.ANTHROPIC_API_KEY), {
    message: 'ANTHROPIC_API_KEY is required when LLM_PROVIDER is set to "anthropic"',
    path: ['ANTHROPIC_API_KEY'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  process.stderr.write(
    `\n╔══════════════════════════════════════════════╗\n` +
      `║  FATAL: Environment validation failed        ║\n` +
      `╚══════════════════════════════════════════════╝\n\n` +
      `${formatted}\n\n`
  );
  process.exit(1);
}

export const config = Object.freeze(parsed.data);

/* Log active provider on import (using stderr before logger is available) */
process.stderr.write(
  `[env] LLM_PROVIDER=${config.LLM_PROVIDER} | NODE_ENV=${config.NODE_ENV} | PORT=${config.PORT}\n`
);
