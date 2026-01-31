import { type Request, type Response, type NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Error handler middleware
 * Catches and formats errors with appropriate HTTP status codes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error occurred:', {
    message: err.message,
    type: err.constructor.name,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Prisma unique constraint violation (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Unique constraint violation',
        details: 'A record with this identifier already exists',
      });
      return;
    }

    // Prisma record not found (P2025)
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
        details: err.message,
      });
      return;
    }

    // Other Prisma errors
    res.status(500).json({
      error: 'Database error',
      message: env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  // Prisma initialization error
  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed',
    });
    return;
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: 'Bad request',
      details: err.message,
    });
    return;
  }

  // Generic error
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
