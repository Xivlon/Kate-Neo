/**
 * Rate Limiting Middleware
 *
 * Provides rate limiting for API endpoints to prevent abuse.
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development mode
  skip: (req) => process.env.NODE_ENV === 'development',
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Skip rate limiting in development mode
  skip: (req) => process.env.NODE_ENV === 'development',
});

/**
 * Moderate rate limiter for file operations
 * 50 requests per 15 minutes per IP
 */
export const fileOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 file operation requests per windowMs
  message: {
    success: false,
    error: 'Too many file operations, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development mode
  skip: (req) => process.env.NODE_ENV === 'development',
});
