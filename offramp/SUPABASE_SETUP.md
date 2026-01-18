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
```

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

2. Navigate to: `http://localhost:3000/auth`

3. Enter your email and click "Send magic link"

4. Check your email for the magic link

5. Click the link to complete authentication

6. Once signed in, you can update your profile (name and avatar)

## 🎯 Features

Your auth system now includes:

- ✅ Magic link (passwordless) authentication
- ✅ Session management with automatic refresh
- ✅ Profile creation and updates
- ✅ Row Level Security (RLS) for data protection
- ✅ Proper error handling
- ✅ Client and server-side authentication helpers

## 📝 Files Modified

- `.env` - Fixed environment variable names
- `lib/supabaseServer.ts` - Made async and added alias function
- `app/api/profile/route.ts` - Completed profile endpoints
- `app/auth/page.tsx` - Already had proper UI (no changes needed)

## 🔐 Security Notes

- Never commit your `.env` file (already in `.gitignore`)
- The anon key is safe to use in client-side code
- RLS policies ensure users can only access their own data
- Service role key (if you add one later) should NEVER be exposed client-side
