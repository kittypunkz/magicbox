import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  const isDev = c.env.NODE_ENV === 'development';
  
  // Log error
  console.error(`[Error] ${err.message}`, err.stack);
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    }, 400);
  }
  
  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: err.message,
    }, err.status);
  }
  
  // Generic error response (don't leak internal details in production)
  return c.json({
    success: false,
    error: 'Internal server error',
    ...(isDev && {
      message: err.message,
      stack: err.stack,
    }),
  }, 500);
};
