import { PrismaClient } from '@prisma/client'

// Configure connection options from environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/skillsflow'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
      // SSL/TLS Configuration (FR-012)
      connection: {
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: true }
          : false,
        sslmode: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
      }
    }
  },
  // Connection Pool Configuration (FR-024)
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

// Metrics collection middleware (FR-021-023)
prisma.$use(async (params, next) => {
  const start = Date.now()

  const result = await next(params)

  const duration = Date.now() - start
  if (duration > 100) {
    // Log slow queries for metrics collection
    console.warn(`Slow query: ${params.model}.${params.action} took ${duration}ms`)
  }

  return result
})

// Retry logic with 100-200ms delay (FR-020)
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 1
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        // Exponential backoff with base 100ms
        const delay = 100 * Math.pow(1.5, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

// Generic repository interface (FR-014)
export class BaseRepository<T> {
  protected model: any

  constructor(model: any) {
    this.model = model
  }

  async create(data: Partial<T>): Promise<T> {
    return executeWithRetry(() => this.model.create({ data }))
  }

  async findById(id: string): Promise<T | null> {
    return executeWithRetry(() => this.model.findUnique({ where: { id } }))
  }

  async findMany(params?: any): Promise<T[]> {
    return executeWithRetry(() => this.model.findMany(params))
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return executeWithRetry(() => this.model.update({
      where: { id },
      data
    }))
  }

  async delete(id: string): Promise<T> {
    return executeWithRetry(() => this.model.delete({ where: { id } }))
  }

  // Transaction support (FR-017)
  async inTransaction<R>(fn: (tx: any) => Promise<R>): Promise<R> {
    return prisma.$transaction(fn)
  }
}

// Export enhanced Prisma client
export { prisma, executeWithRetry }

// Example usage with a specific model
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma.user)
  }

  // Custom methods specific to user operations
  async findByEmail(email: string): Promise<User | null> {
    return executeWithRetry(() =>
      prisma.user.findUnique({ where: { email } })
    )
  }
}

export type User = {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}