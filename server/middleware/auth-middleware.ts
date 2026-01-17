/**
 * Authentication Middleware
 *
 * Provides middleware functions for protecting routes with authentication.
 */

import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user session
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
    }
  }
}

/**
 * Middleware to require authentication
 * Checks if user is authenticated via session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in to access this resource.',
  });
}

/**
 * Middleware to require authentication with optional bypass for development
 * In development mode without authentication setup, requests are allowed through
 */
export function requireAuthOrDev(req: Request, res: Response, next: NextFunction): void {
  // In development mode, allow requests through
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] Development mode: Bypassing authentication for', req.path);
    return next();
  }

  // Production mode - require authentication
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in to access this resource.',
  });
}

/**
 * Optional middleware - allows both authenticated and unauthenticated access
 * Sets req.user if authenticated
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // Just continue - user will be populated by passport if authenticated
  next();
}
