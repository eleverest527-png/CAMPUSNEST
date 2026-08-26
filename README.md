# CampusNest

CampusNest is a mobile-first accommodation platform for students around DELSU Abraka and FUPRE in Delta State, Nigeria. Students can browse approved listings, save homes and contact agents. Agents can submit listings for review, while administrators moderate the marketplace.

## Technology

- Vanilla HTML, CSS and JavaScript frontend
- Node.js and Express API
- Supabase PostgreSQL, Auth and Storage
- Render-ready single service deployment

## Run locally

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add the Supabase URL, anon key and service-role key.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. Run `npm run dev`, then open `http://localhost:3000`.

Without Supabase variables, the server still starts and `/api/health` works, but listings and authentication are unavailable until configuration is added.

## Supabase setup

Run the supplied schema once. It creates profiles, properties, images, favorites, messages, indexes, the new-user profile trigger, RLS policies and a public `property-images` Storage bucket. The service-role key belongs only in the backend `.env`; never expose it in frontend code.

Enable Email provider under Authentication. Registration stores the selected role in Auth metadata, and the database trigger creates the matching profile. For an admin, register normally, then change that profile's role to `admin` in the Supabase dashboard. Review Storage policies before production and consider limiting uploads to authenticated listing owners.

## API

`GET /api/health`, `GET /api/properties`, `GET /api/properties/:id`, `POST/PUT/DELETE /api/properties/:id`, `GET/POST/DELETE /api/favorites`, and `GET/PATCH /api/users/profile` are implemented. Admin overview and moderation are under `/api/admin`. Protected routes require `Authorization: Bearer <Supabase access token>`.

## Deploy to Render

Create a Web Service from this repository. Build command: `npm install`. Start command: `npm start`. Add `PORT` (Render supplies this), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `FRONTEND_URL` in the Render environment settings. The service serves both the frontend and API, so no separate frontend host is required.

## Security and production notes

Passwords are handled by Supabase Auth and never stored by CampusNest. Validate and constrain image uploads before enabling the upload UI in your preferred Storage flow. Keep the service-role key private, rotate it if exposed, use a real frontend origin instead of `*`, and add email verification, rate limiting and abuse/report review before a public launch.
