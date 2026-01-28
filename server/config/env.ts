import 'dotenv/config';
import { cleanEnv, str, num, port, bool, makeValidator } from 'envalid';

/**
 * Session status validator
 */
const sessionStatusValidator = makeValidator<string>((value) => {
  if (value === 'ACTIVE' || value === 'DELETE') {
    return value;
  }
  throw new Error('Invalid session status');
});

/**
 * Environment configuration validation
 */
export const env = cleanEnv(process.env, {
  // Server
  PORT: port({ default: 3001, desc: 'Server port' }),

  // Database
  DATABASE_URL: str({ desc: 'PostgreSQL database connection URL' }),
  DIRECT_URL: str({ desc: 'Direct PostgreSQL database connection URL' }),
  DB_POOL_MIN: num({ default: 5, desc: 'Minimum database connection pool size' }),
  DB_POOL_MAX: num({ default: 20, desc: 'Maximum database connection pool size' }),

  // OpenCode
  OPENCODE_API_URL: str({ default: 'http://localhost:4096', desc: 'OpenCode API URL' }),

  // Metrics
  METRICS_SAMPLING_RATE: num({ default: 1.0, desc: 'Metrics sampling rate (0-1)' }),

  // Authentication
  REQUIRE_AUTH: bool({ default: false, desc: 'Require authentication for API requests' }),
});

/**
 * Type-safe environment variables
 */
export type Env = typeof env;
