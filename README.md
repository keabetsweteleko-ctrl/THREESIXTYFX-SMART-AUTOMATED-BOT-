# THREESIXTYFX — Build 02

Standalone React + Express trading automation platform foundation.

## Build 02 adds

- Supabase authentication with email + password
- Sign up / sign in / sign out
- User profile creation from `auth.users`
- User settings record created automatically
- Row Level Security policies so users can only access their own app data
- Database schema for profiles, bots, trading accounts, trades, subscriptions and settings
- Existing Paystack server foundation retained from Build 01

## 1. Create Supabase project

Create a Supabase project, then open **SQL Editor** and run:

`supabase/001_initial_schema.sql`

Supabase's current React quickstart uses `@supabase/supabase-js` and environment variables for the project URL and publishable key. Keep server-only secrets such as the Paystack secret key on the server. See the official docs for the current setup. 

## 2. Add environment variables

Copy `.env.example` to `.env` / the environment settings used by your hosting provider and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_CALLBACK_URL`

Never commit secret keys to GitHub.

## 3. Install and run

```bash
npm install
npm run dev 