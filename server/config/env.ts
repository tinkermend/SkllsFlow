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
 * Node environment validator
 */
const nodeEnvValidator = makeValidator<string>((value) => {
  const validEnvs = ['development', 'production', 'test'];
  if (validEnvs.includes(value)) {
    return value;
  }
  throw new Error(`Invalid NODE_ENV: must be one of ${validEnvs.join(', ')}`);
});

/**
 * Environment configuration validation
 */
export const env = cleanEnv(process.env, {
  // Environment
  NODE_ENV: nodeEnvValidator({ default: 'development', desc: 'Node environment (development, production, test)' }),

  // Server
  BACKEND_HOST: str({ default: '127.0.0.1', desc: 'Backend server host address (IP or domain name)' }),
  BACKEND_PORT: port({ default: 3001, desc: 'Backend server port (Node.js Express service)' }),

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
  JWT_SECRET: str({ desc: 'JWT signing secret key' }),
  JWT_EXPIRES_IN: str({ default: '15m', desc: 'JWT access token expiration time' }),
  REFRESH_TOKEN_EXPIRES_IN: str({ default: '7d', desc: 'Refresh token expiration time' }),
});

/**
 * Type-safe environment variables
 */
export type Env = typeof env;
