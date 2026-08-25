# CampusNest

A mobile-first student accommodation platform for students in Delta State, Nigeria.

## Included in this first production-ready foundation

- Responsive student housing homepage
- Search and filtering
- Listing cards and detail pages
- Saved/favorite homes
- Email/password authentication through Supabase
- Student/landlord/agent profile roles in the database
- Property submission workflow (`pending` until reviewed)
- Row Level Security policies
- Supabase database schema
- Mobile-friendly UI
- Demo listings so the frontend works before Supabase is connected

## Run

```bash
npm install
npm run dev
```

## Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Add your Supabase URL and anon key.
6. Restart the dev server.

Never put the Supabase service-role key in this frontend.

## Next production modules

- Supabase Storage for listing images
- Admin moderation dashboard
- Landlord/agent verification
- Real-time messaging
- WhatsApp/deep-link contact
- Notifications
- Map/location support
- Payment gateway and featured listings
- Report/scam protection workflow
- Terms, privacy and safety pages
- Analytics
- Play Store packaging/PWA
