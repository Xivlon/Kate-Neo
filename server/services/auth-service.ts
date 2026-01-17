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
    if (hashedPassword === user.password) {
      return user;
    }

    return null;
  }

  /**
   * Hash password using SHA-256
   * In production, use bcrypt or argon2 for better security
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
