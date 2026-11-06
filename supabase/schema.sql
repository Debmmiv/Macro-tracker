-- MacroTrack schema. Run in Supabase Dashboard > SQL Editor.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age int check (age between 13 and 120),
  gender text check (gender in ('male','female','other')),
  height_cm numeric check (height_cm between 80 and 260),
  weight_kg numeric check (weight_kg between 20 and 400),
  fitness_goal text check (fitness_goal in ('lose_weight','maintain_weight','build_muscle')),
  activity_level text check (activity_level in ('sedentary','lightly_active','moderately_active','very_active','extremely_active')),
  bmi numeric,
  bmr numeric,
  tdee numeric,
  daily_calorie_target int,
  protein_target int,
  carbs_target int,
  fat_target int,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null check (char_length(food_name) between 1 and 120),
  serving_size text,
  calories numeric not null default 0 check (calories >= 0),
  protein numeric not null default 0 check (protein >= 0),
  carbohydrates numeric not null default 0 check (carbohydrates >= 0),
  fat numeric not null default 0 check (fat >= 0),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snacks')),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_entries_user_date_idx on public.food_entries (user_id, entry_date);

-- Keep updated_at fresh
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger food_entries_updated_at before update on public.food_entries
  for each row execute function public.set_updated_at();

-- Create an empty profile row for every new user
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.food_entries enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "food_select_own" on public.food_entries for select using (auth.uid() = user_id);
create policy "food_insert_own" on public.food_entries for insert with check (auth.uid() = user_id);
create policy "food_update_own" on public.food_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "food_delete_own" on public.food_entries for delete using (auth.uid() = user_id);
