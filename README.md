# Authentication System

A Node.js + Express authentication API with MongoDB, JWT-based access/refresh tokens, email OTP verification, and session management.

## Features

- User registration with hashed password storage (SHA-256)
- Email OTP verification flow
- Login with access token + refresh token cookie
- Get current user profile from access token
- Refresh access token using refresh token
- Logout current session
- Logout all active sessions
- Session tracking by IP and user agent

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Token (JWT)
- Nodemailer (Gmail SMTP)
- Morgan
- Cookie Parser

## Project Structure

```text
.
├── package.json
├── server.js
└── src
    ├── app.js
    ├── config
    │   ├── config.js
    │   └── database.js
    ├── controllers
    │   └── auth.controller.js
    ├── models
    │   ├── otp.model.js
    │   ├── session.model.js
    │   └── user.model.js
    ├── routes
    │   └── auth.routes.js
    ├── services
    │   └── email.service.js
    └── utils
        └── utils.js
```

## Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)
- Gmail account/app password for SMTP

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

3. Start the server:

```bash
npm run dev
```

Server runs on:

- `http://localhost:3000`

## API Base URL

- `/api/auth`

## Endpoints

### 1. Register

- Method: `POST`
- Path: `/api/auth/register`
- Body:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "your_password"
}
```

- Response: Creates user and sends OTP to email.

### 2. Verify Email

- Method: `POST`
- Path: `/api/auth/verify-email`
- Body:

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

- Notes:
- OTP expires in 5 minutes
- Max 3 attempts

### 3. Login

- Method: `POST`
- Path: `/api/auth/login`
- Body:

```json
{
  "email": "john@example.com",
  "password": "your_password"
}
```

- Response:
- Returns `accessToken`
- Sets `refreshToken` as HTTP-only cookie

### 4. Get Current User

- Method: `POST`
- Path: `/api/auth/get-me`
- Header:

```text
Authorization: Bearer <accessToken>
```

### 5. Refresh Token

- Method: `POST`
- Path: `/api/auth/refresh-token`
- Requires `refreshToken` cookie
- Response: Returns a new access token and rotates refresh token

### 6. Logout (Current Session)

- Method: `GET`
- Path: `/api/auth/logout`
- Requires `refreshToken` cookie

### 7. Logout All Sessions

- Method: `GET`
- Path: `/api/auth/logout-all`
- Requires `refreshToken` cookie

## Notes

- Refresh token cookie is configured with:
- `httpOnly: true`
- `secure: true`
- `sameSite: strict`

Because `secure: true` is enabled, cookies are sent only over HTTPS.

## Future Improvements

- Add input validation (Joi/Zod/express-validator)
- Replace SHA-256 password hashing with bcrypt/argon2
- Add rate limiting and brute-force protection
- Add automated tests
- Add API docs (OpenAPI/Swagger)

## License

ISC
