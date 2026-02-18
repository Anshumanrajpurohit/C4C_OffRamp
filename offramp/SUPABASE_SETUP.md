# Supabase Setup Instructions

## ✅ Auth Flow Fixed

Your authentication flow is now properly configured and ready to use.

## 🔧 What Was Fixed

1. **Environment Variables**: Updated `.env` to use the correct Supabase key name:
   - Changed `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Server Client**: Fixed async/await patterns in `lib/supabaseServer.ts`:
   - Made functions async to properly handle Next.js 14's `cookies()` Promise
   - Added `getSupabaseServerClient` alias function

3. **Profile API Route**: Completed `app/api/profile/route.ts`:
   - POST endpoint for saving/updating user profiles
   - GET endpoint for fetching user profiles
   - Proper error handling and authentication checks

## 🗄️ Database Setup Required

You need to create the `profiles` table in your Supabase database. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/tfngebzpygbxfliabtaw/sql/new) and run:

```sql
-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Store password hashes for custom verification (matches current API expectations)
create table if not exists public.users (
  id uuid not null default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  region text,
  budget_level text check (budget_level in ('low', 'medium', 'high')),
  city text default 'Bangalore',
  created_at timestamptz default timezone('utc'::text, now()),
  primary key (id)
);

alter table public.users enable row level security;

-- Preference form: diet transition fields (From -> To)
alter table public.users
  add column if not exists transition_from_diet text,
  add column if not exists transition_to_diet text;

create policy "Only service role can read"
  on public.users for select
  using (auth.role() = 'service_role');

create policy "Only service role can insert"
  on public.users for insert
  with check (auth.role() = 'service_role');

```

## 🔐 Required Environment Variables

Add the following to your `.env.local` (values from your Supabase dashboard):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

If you prefer private names, the app will also accept `SUPABASE_URL` and `SUPABASE_ANON_KEY` as fallbacks. The publishable key takes precedence when present so browser + RSC clients always use a scoped credential. The service role key is only accessed inside API routes to hash and verify passwords in the `users` table—never expose it to the browser.

## 📧 Email Configuration

To test magic link authentication:

1. Go to your [Supabase Authentication settings](https://supabase.com/dashboard/project/tfngebzpygbxfliabtaw/auth/providers)
2. Ensure "Email" provider is enabled
3. Configure your email template (optional)
4. For local development, check email links in your Supabase logs

## 🚀 Test Your Auth Flow

1. Start your dev server:
  ```bash
  npm run dev
  ```

2. Visit `http://localhost:3000/auth`

3. Create an account with Name, Email, Password, and optional details

4. After registering, sign in using the same credentials

5. Update your profile or preferences to confirm the authenticated APIs work end-to-end

## 🎯 Features

Your auth system now includes:

- ✅ Email + password sign-up and login powered by Supabase Auth
- ✅ Automatic session cookies managed by Supabase SSR helpers
- ✅ Profile creation and updates backed by Row Level Security
- ✅ Robust validation and error handling in API routes
- ✅ Client and server-side authentication helpers ready for reuse

## 📝 Files Modified

- `.env` - Fixed environment variable names
- `lib/supabaseServer.ts` - Made async and added alias function
- `app/api/profile/route.ts` - Completed profile endpoints
- `app/auth/page.tsx` - Already had proper UI (no changes needed)

## 🔐 Security Notes

- Never commit your `.env` file (already in `.gitignore`)
- The anon key is safe to use in client-side code
- RLS policies ensure users can only access their own data
- If you later add a service role key for admin tasks, keep it on the server only
