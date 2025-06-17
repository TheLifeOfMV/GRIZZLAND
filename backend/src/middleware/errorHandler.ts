import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '../types';

/**
 * Custom application error class
 */
export class ApplicationError extends Error implements AppError {
  public status: number;
  public code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApplicationError';
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Structured logging for errors
 */
export const logError = (error: any, req: Request, userId?: string): void => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message,
    stack: error.stack,
    status: error.status || 500,
    code: error.code || 'UNKNOWN_ERROR',
    userId: userId || 'anonymous',
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query
  };

  console.error('API Error:', JSON.stringify(errorLog, null, 2));
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): void => {
  // Log the error
  const userId = (req as any).user?.id;
  logError(error, req, userId);

  // Determine response status and message
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (error instanceof ApplicationError) {
    status = error.status;
    message = error.message;
    code = error.code;
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid data format';
    code = 'INVALID_FORMAT';
  } else if (error.code === '23505') { // PostgreSQL unique violation
    status = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    status = 400;
    message = 'Referenced resource not found';
    code = 'INVALID_REFERENCE';
  } else if (error.message.includes('JWT')) {
    status = 401;
    message = 'Authentication failed';
    code = 'AUTH_ERROR';
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.details || error.message
    })
  });
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): void => {
  const error = new ApplicationError(
    `Route ${req.method} ${req.url} not found`,
    404,
    'NOT_FOUND'
  );
  
  next(error);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request timeout middleware
 */
export const timeoutHandler = (timeout: number = 10000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Set timeout for request
    const timer = setTimeout(() => {
      const error = new ApplicationError(
        'Request timeout',
        408,
        'REQUEST_TIMEOUT'
      );
      next(error);
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
}; 