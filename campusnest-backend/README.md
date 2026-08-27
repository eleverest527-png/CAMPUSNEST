# CampusNest Backend

Express.js + Supabase PostgreSQL backend for the CampusNest student housing marketplace.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. In your Supabase SQL Editor, run `schema.sql` to create tables and indexes.

4. Seed the database with sample data and test users:
   ```bash
   npm run seed
   ```

5. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The server listens on port 3000 (or `PORT` env var) and serves both the API and the frontend static files from the `public/` folder.

## Test Credentials

After seeding, use these credentials to test:

- **Admin**: `admin@campusnest.test` / `admin123`
- **Landlord**: `landlord@campusnest.test` / `landlord123`

⚠️ **Change these in production!**

## API Endpoints

### Users
- `POST /api/users/register` — Register a new user
- `POST /api/users/login` — Log in and get JWT token
- `GET /api/users/me` — Get current user profile (requires auth)

### Properties
- `GET /api/properties` — Browse verified properties (public, with filters)
- `GET /api/properties/:id` — Get property details (public)
- `GET /api/properties/mine` — Get your listings (auth required)
- `POST /api/properties` — Create a new listing (landlord/admin)
- `PATCH /api/properties/:id` — Update your listing (owner/admin)
- `DELETE /api/properties/:id` — Delete your listing (owner/admin)

### Favorites
- `GET /api/favorites` — Get your favorited properties (auth required)
- `POST /api/favorites/:id` — Toggle favorite on a property (auth required)

### Admin
- `GET /api/admin/properties` — Get all properties with status filter (admin only)
- `PATCH /api/admin/properties/:id` — Approve/reject a property (admin only)

## Verification/Approval Flow

1. Landlord creates a property → verification_status = `pending`
2. Admin approves it → verification_status = `verified`
3. Only `verified` properties show on the public browse
4. Landlords see all their listings (any status) in their dashboard
5. Admin can also reject listings → verification_status = `rejected`

## Database Schema

- **users** — Full name, email, phone, password hash, role (student/landlord/admin)
- **properties** — Listing details, owner reference, images array, amenities array, verification status
- **favorites** — User-property associations for wishlisting

See `schema.sql` for the complete schema with indexes and triggers.

## Authentication

JWT-based. Token is returned on login/register and must be included as:
```
Authorization: Bearer <token>
```

Tokens expire in 7 days by default (configurable via `JWT_EXPIRES_IN`).

## Notes

- The server serves the frontend from `public/` — copy/build the frontend there
- All database calls are wrapped in try/catch and return consistent JSON error responses
- The `/api/health` endpoint is always available for deployment checks
