/**
 * Passport Configuration
 *
 * Configures passport authentication strategies and serialization.
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { authService } from '../services/auth-service';
import type { User } from '../../shared/schema';

/**
 * Configure passport with local strategy for username/password authentication
 */
export function configurePassport(): void {
  // Configure local authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await authService.verifyCredentials(username, password);
        
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authService.getUserById(id);
      
      if (!user) {
        return done(null, false);
      }
      
      // Only pass necessary user info to session
      done(null, { id: user.id, username: user.username });
    } catch (error) {
      done(error);
    }
  });
}
