/**
 * Authentication Service
 *
 * Provides authentication and authorization for API endpoints.
 * Uses session-based authentication with passport.
 */

import { storage } from '../core/storage';
import type { User } from '../../shared/schema';
import crypto from 'crypto';

export class AuthService {
  /**
   * Verify user credentials
   */
  async verifyCredentials(username: string, password: string): Promise<User | null> {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return null;
    }

    // Hash the provided password and compare with stored hash
    const hashedPassword = this.hashPassword(password);
    
    // Use constant-time comparison to prevent timing attacks
    const storedHashBuffer = Buffer.from(user.password, 'hex');
    const providedHashBuffer = Buffer.from(hashedPassword, 'hex');
    
    if (storedHashBuffer.length !== providedHashBuffer.length) {
      return null;
    }
    
    const isValid = crypto.timingSafeEqual(storedHashBuffer, providedHashBuffer);
    
    if (isValid) {
      return user;
    }

    return null;
  }

  /**
   * Hash password using SHA-256
   * 
   * WARNING: SHA-256 is NOT secure for password hashing in production!
   * This is a placeholder implementation for development/testing only.
   * 
   * For production, you MUST use:
   * - bcrypt (recommended): npm install bcrypt
   * - argon2 (modern alternative): npm install argon2
   * - scrypt (built into Node.js crypto module)
   * 
   * These algorithms are specifically designed for password hashing with:
   * - Automatic salting
   * - Configurable computational cost
   * - Resistance to GPU/ASIC attacks
   * - Protection against rainbow tables
   * 
   * Example with bcrypt:
   * ```
   * import bcrypt from 'bcrypt';
   * const saltRounds = 10;
   * return await bcrypt.hash(password, saltRounds);
   * ```
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Create a new user
   */
  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = this.hashPassword(password);
    return await storage.createUser({
      username,
      password: hashedPassword,
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    return await storage.getUser(id);
  }
}

export const authService = new AuthService();
