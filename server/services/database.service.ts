import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';

/**
 * Database Service
 * Manages Prisma client lifecycle with connection pooling and SSL/TLS
 */
class DatabaseService {
  private static instance: PrismaClient | null = null;
  private static pool: Pool | null = null;

  /**
   * Establish connection to PostgreSQL database
   * Creates singleton PrismaClient instance with connection pool configuration
   */
  static async connect(): Promise<PrismaClient> {
    if (!this.instance) {
      // Create connection pool
      this.pool = new Pool({
        connectionString: env.DATABASE_URL,
        min: env.DB_POOL_MIN,
        max: env.DB_POOL_MAX,
      });

      // Create Prisma Client with PostgreSQL adapter
      const adapter = new PrismaPg(this.pool);
      this.instance = new PrismaClient({
        adapter,
        log: env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
      });

      await this.instance.$connect();

      // Verify database connection with actual query
      await this.instance.$queryRaw`SELECT 1`;

      console.log('✅ Database connected');
    }

    return this.instance;
  }

  /**
   * Disconnect from database
   * Graceful shutdown helper
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    console.log('🔌 Database disconnected');
  }

  /**
   * Get current PrismaClient instance
   * Throws error if database not connected
   */
  static getInstance(): PrismaClient {
    if (!this.instance) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.instance;
  }
}

export { DatabaseService };
