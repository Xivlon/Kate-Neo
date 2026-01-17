# Authentication and Authorization

This document describes the authentication and authorization system implemented for the Kate Neo IDE.

## Overview

The Kate Neo IDE uses session-based authentication to protect sensitive endpoints, particularly file operation APIs. The authentication system is built using:

- **Passport.js** - Authentication middleware for Node.js
- **express-session** - Session management
- **express-rate-limit** - Rate limiting to prevent abuse

## Architecture

### Components

1. **AuthService** (`server/services/auth-service.ts`)
   - Handles user credential verification
   - Manages user creation
   - Password hashing (⚠️ Currently uses SHA-256 for development; **must** be replaced with bcrypt/argon2 in production)

2. **Authentication Middleware** (`server/middleware/auth-middleware.ts`)
   - `requireAuth` - Strictly requires authentication
   - `requireAuthOrDev` - Requires authentication in production, allows bypass in development mode
   - `optionalAuth` - Makes authentication optional

3. **Rate Limiting** (`server/middleware/rate-limit.ts`)
   - `authLimiter` - 5 requests per 15 minutes for authentication endpoints
   - `fileOperationLimiter` - 50 requests per 15 minutes for file operations
   - `apiLimiter` - 100 requests per 15 minutes for general API endpoints

### Protected Endpoints

The following endpoints require authentication:

- `POST /api/agent/file-operation` - File read/write/delete operations
- `POST /api/agent/execute` - Task execution (can perform file operations)
- `POST /api/agent/settings` - Update agent settings

### Authentication Endpoints

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/session` - Check authentication status

## Configuration

### Environment Variables

- `SESSION_SECRET` - **Required in production**. Secret key for session signing. Use a strong, random value (e.g., generate with `openssl rand -base64 32`)
- `NODE_ENV` - Set to `production` for production environments

### Session Settings

Sessions are configured with the following settings:

```javascript
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}
```

## Security Considerations

### ⚠️ Password Hashing

**CRITICAL**: The current implementation uses SHA-256 for password hashing, which is **NOT** secure for production use. Before deploying to production, you **MUST** replace this with a proper password hashing algorithm:

**Recommended: bcrypt**
```javascript
import bcrypt from 'bcrypt';
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Alternative: argon2**
```javascript
import argon2 from 'argon2';
const hashedPassword = await argon2.hash(password);
const isValid = await argon2.verify(hashedPassword, password);
```

### Rate Limiting

Rate limiting is automatically disabled in development mode (`NODE_ENV=development`) but enforced in production to prevent:

- Brute force attacks on login endpoints
- API abuse and DoS attacks
- Resource exhaustion

### Path Traversal Protection

The agent service includes built-in path traversal protection:

- Blocks `..` and `~` in file paths
- Validates all paths are within the workspace directory
- Rejects absolute paths outside the workspace

## Development Mode

In development mode (`NODE_ENV=development`):

- Authentication can be bypassed using `requireAuthOrDev` middleware
- Rate limiting is disabled
- A default session secret is used (must be changed in production)

This allows developers to work without setting up authentication, but **all security features are enforced in production**.

## Production Deployment

Before deploying to production:

1. ✅ Set `NODE_ENV=production`
2. ✅ Set a strong `SESSION_SECRET` environment variable
3. ⚠️ **Replace SHA-256 password hashing with bcrypt or argon2**
4. ✅ Ensure HTTPS is enabled (cookies will only be sent over HTTPS)
5. ✅ Configure proper CORS settings if needed
6. ✅ Review and adjust rate limiting thresholds based on expected usage

## API Usage

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}' \
  -c cookies.txt
```

### Check Session
```bash
curl -X GET http://localhost:5000/api/auth/session \
  -b cookies.txt
```

### Perform File Operation
```bash
curl -X POST http://localhost:5000/api/agent/file-operation \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"operation": "read", "path": "README.md"}'
```

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

## Testing

Authentication service tests are located in `server/services/auth-service.test.ts`. Run tests with:

```bash
npm test server/services/auth-service.test.ts
```

## Future Enhancements

Potential improvements for the authentication system:

- [ ] Replace SHA-256 with bcrypt/argon2
- [ ] Add OAuth2/OpenID Connect support
- [ ] Implement role-based access control (RBAC)
- [ ] Add multi-factor authentication (MFA)
- [ ] Session persistence using Redis or database
- [ ] Password reset functionality
- [ ] Account lockout after failed attempts
- [ ] Audit logging for security events
