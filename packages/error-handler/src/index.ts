import type { Request, Response, NextFunction } from 'express';
import { sendLog } from '@biashara-mall/kafka';

export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request data', details?: unknown) {
    super(message, 400, true, details);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', details?: unknown) {
    super(message, 500, false, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429);
  }
}

// Mount last, and keep all four parameters: Express only treats a handler as
// an error handler when its arity is 4.
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  if (err instanceof AppError) {
    console.error(`[${req.method} ${req.originalUrl}] ${err.statusCode}: ${err.message}`);
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error(`[${req.method} ${req.originalUrl}] unhandled:`, err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong, please try again later',
  });
}

// Same handler, plus a `logs` topic event tagged with the service name, so the
// admin log stream and Loki see failures from every service in one place.
export function createErrorMiddleware(source: string) {
  return function loggedErrorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const status = err instanceof AppError ? err.statusCode : 500;
    void sendLog({
      type: status >= 500 ? 'error' : 'warning',
      message: `${req.method} ${req.originalUrl} ${status}: ${err.message}`,
      source,
    });
    errorMiddleware(err, req, res, next);
  };
}
