/**
 * Authentication Service Tests
 *
 * Tests for the authentication service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth-service';

// Mock the storage module
vi.mock('../core/storage', () => {
  const users = new Map();
  return {
    storage: {
      getUserByUsername: vi.fn(async (username: string) => {
        return users.get(username);
      }),
      createUser: vi.fn(async (user: { username: string; password: string }) => {
        const newUser = { id: 'test-id-123', ...user };
        users.set(user.username, newUser);
        return newUser;
      }),
      getUser: vi.fn(async (id: string) => {
        for (const user of users.values()) {
          if ((user as any).id === id) {
            return user;
          }
        }
        return undefined;
      }),
      _clearForTest: () => users.clear(),
    },
  };
});

describe('AuthService', () => {
  beforeEach(async () => {
    // Clear any existing users
    const { storage } = await import('../core/storage');
    (storage as any)._clearForTest();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const user = await authService.createUser('testuser', 'password123');

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.password).not.toBe('password123'); // Password should be hashed
      expect(user.password).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash is 64 hex chars
    });

    it('should hash passwords consistently', async () => {
      const user1 = await authService.createUser('user1', 'samepassword');
      const user2 = await authService.createUser('user2', 'samepassword');

      // Note: SHA-256 without salt produces same hash for same password
      // This test will need to be updated when migrating to bcrypt/argon2
      // which should produce DIFFERENT hashes due to unique salts per user
      expect(user1.password).toBe(user2.password);
    });
  });

  describe('verifyCredentials', () => {
    it('should verify valid credentials', async () => {
      // Create a user
      await authService.createUser('testuser', 'password123');

      // Verify credentials
      const user = await authService.verifyCredentials('testuser', 'password123');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should reject invalid password', async () => {
      await authService.createUser('testuser', 'password123');

      const user = await authService.verifyCredentials('testuser', 'wrongpassword');

      expect(user).toBeNull();
    });

    it('should reject non-existent user', async () => {
      const user = await authService.verifyCredentials('nonexistent', 'password123');

      expect(user).toBeNull();
    });

    it('should be case-sensitive for passwords', async () => {
      await authService.createUser('testuser', 'Password123');

      const user1 = await authService.verifyCredentials('testuser', 'Password123');
      const user2 = await authService.verifyCredentials('testuser', 'password123');

      expect(user1).toBeDefined();
      expect(user2).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by ID', async () => {
      const createdUser = await authService.createUser('testuser', 'password123');

      const user = await authService.getUserById(createdUser.id);

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should return undefined for non-existent ID', async () => {
      const user = await authService.getUserById('nonexistent-id');

      expect(user).toBeUndefined();
    });
  });
});
