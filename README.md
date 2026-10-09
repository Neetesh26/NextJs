# NestJS JWT authentication API

A small backend example that uses NestJS, MongoDB/Mongoose, DTO validation,
hashed passwords, and JWT access tokens.

## Run locally

Requirements: Node.js, npm, and MongoDB.

In PowerShell, create a signing secret for this terminal session and start the
API:

```powershell
$env:JWT_SECRET = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$env:MONGODB_URI = "mongodb://localhost:27017/nest-auth-db"
npm install
npm run start:dev
```

`JWT_SECRET` is required and must have at least 32 characters. Keep it private;
do not commit it. `MONGODB_URI` defaults to the local MongoDB URL above.

## Authentication flow

1. `POST /auth/register` validates a username and password, hashes the password,
   and stores the user in MongoDB.
2. `POST /auth/login` checks the password hash and returns a short-lived JWT.
3. Send that token as `Authorization: Bearer <access_token>` to `GET /auth/profile`.
   The JWT guard verifies it before the controller runs.

Example request bodies:

```json
{ "username": "alice", "password": "a-strong-password" }
```

Registration usernames must be 3-30 letters, numbers, or underscores. Passwords
must be 8-128 characters. Extra request properties are rejected.

## Backend layout

- `src/auth/`: auth controller/service, login and registration DTOs, JWT guard,
  strategy, signing configuration, and password hashing.
- `src/users/`: Mongoose user schema and database service.
- `src/common/interceptors/`: global request logging interceptor. It logs the
  HTTP method, path, and duration without changing response bodies.

`ValidationPipe` is global: it transforms DTOs, strips nothing silently, and
rejects unrecognized fields. The interceptor runs around controller handlers
and logs completion while leaving errors/responses to NestJS unchanged.

## Verify

```powershell
npm run build
npm test -- --runInBand
```
