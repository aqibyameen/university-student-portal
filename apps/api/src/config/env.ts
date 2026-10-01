import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(5),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  SMTP_HOST: z.string().optional(),
  SWAGGER_ENABLED: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌  Invalid environment configuration:');
  Object.entries(parsed.error.flatten().fieldErrors).forEach(([k, v]) => {
    console.error(`   ${k}: ${v?.join(', ')}`);
  });
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && /change-this/i.test(parsed.data.JWT_SECRET)) {
  console.error('❌  Refusing to start in production with the default JWT secret.');
  process.exit(1);
}

export const env = parsed.data;
