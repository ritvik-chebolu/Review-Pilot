# Auth Approach for ReviewPilot

**Chosen: Option B — Email + Password with bcrypt + JWT**

## Rationale
- Self-contained: no external auth provider dependency
- Works with our shared SQLite (Turso-synced) database
- Standard, secure, well-understood pattern
- Easy to add OAuth (Google, etc.) on top later

## Implementation Plan

1. **Database**: Add `password_hash` column to `users` table
2. **Dependencies**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT)
3. **Server-side auth library** (`src/lib/auth.server.ts`):
   - `hashPassword(password)` — bcrypt hash
   - `verifyPassword(password, hash)` — bcrypt compare
   - `createToken(user)` — sign JWT with user id + email
   - `verifyToken(token)` — verify and decode JWT
   - `teamDbExec(sql)` — exec `team-db` CLI from server
4. **API routes** (using `createServerFn`):
   - Signup: validate email/pw, hash pw, insert user, return JWT
   - Login: find user by email, verify pw, return JWT
   - Me: verify JWT from header, return user info
5. **Pages**: Signup and Login forms (routes)
6. **Auth context** (React): store JWT, expose login/logout/signup/me
7. **Protected route wrapper**: redirect to login if no valid JWT

## Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT with 7-day expiry
- httpOnly cookie for JWT storage
- Server validates all inputs