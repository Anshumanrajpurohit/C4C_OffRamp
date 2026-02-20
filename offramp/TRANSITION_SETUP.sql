-- ============================================================
--  OffRamp — Transition Personalization System
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. user_preferences
-- Stores each user's diet transition goals and reminder settings.
create table if not exists public.user_preferences (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  target_goal             text not null,          -- e.g. 'vegan', 'vegetarian'
  transition_period_weeks integer not null default 12,
  baseline_nonveg_meals   integer not null default 7,
  preferred_cuisine       text,
  effort_level            text check (effort_level in ('easy', 'moderate', 'intensive')),
  reminder_time           time,                   -- UTC HH:MM for daily cron check
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users manage own preferences"
  on public.user_preferences
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow service role (admin client) full access
create policy "Service role full access on preferences"
  on public.user_preferences
  using (auth.role() = 'service_role');


-- 2. weekly_plans
-- Generated swap schedule, one row per week per user.
create table if not exists public.weekly_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  week_number       integer not null,
  meals_to_replace  integer not null,
  swap_days         text[] not null default '{}',  -- e.g. ['monday','tuesday']
  created_at        timestamptz default now(),
  unique (user_id, week_number)
);

alter table public.weekly_plans enable row level security;

create policy "Users read own weekly plans"
  on public.weekly_plans for select
  using (auth.uid() = user_id);

create policy "Service role full access on weekly_plans"
  on public.weekly_plans
  using (auth.role() = 'service_role');


-- 3. user_progress
-- Single progress record per user, updated as swaps are completed.
create table if not exists public.user_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  total_meals_replaced  integer not null default 0,
  current_week          integer not null default 1,
  updated_at            timestamptz default now()
);

alter table public.user_progress enable row level security;

create policy "Users read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Service role full access on user_progress"
  on public.user_progress
  using (auth.role() = 'service_role');


-- 4. daily_swaps
-- One row per user per day to track whether that day's swap was triggered.
create table if not exists public.daily_swaps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  swap_date   date not null,
  week_number integer not null,
  completed   boolean not null default false,
  created_at  timestamptz default now(),
  unique (user_id, swap_date)
);

alter table public.daily_swaps enable row level security;

create policy "Users read own daily swaps"
  on public.daily_swaps for select
  using (auth.uid() = user_id);

create policy "Service role full access on daily_swaps"
  on public.daily_swaps
  using (auth.role() = 'service_role');
