-- CRON & NET Extensions (for automated jobs)
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'perform-weekly-snapshot-job',
  '0 4 * * 1',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/perform-weekly-snapshot',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  ) as request_id;
  $$
);
-- 2. Schedule Daily Scoring (Daily 02:00 UTC)
select cron.schedule(
  'calculate-daily-scores-job',
  '03 * * *',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/calculate-daily-scores',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  ) as request_id;
  $$
);

-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  total_score integer default 0,
  listen_score integer default 0, -- New column for Spotify Listen to Win points
  musi_coins integer default 50,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  marketing_opt_in boolean default false
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create artists_cache table
create table artists_cache (
  spotify_id text primary key,
  name text,
  image_url text,
  current_popularity integer,
  current_followers integer,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

alter table artists_cache enable row level security;

create policy "Artists cache is viewable by everyone."
  on artists_cache for select
  using ( true );

-- Create teams table
create table teams (
  user_id uuid references profiles.id,
  week_number integer default 1,
  slot_1_id text references artists_cache.spotify_id,
  slot_2_id text references artists_cache.spotify_id,
  slot_3_id text references artists_cache.spotify_id,
  slot_4_id text references artists_cache.spotify_id,
  slot_5_id text references artists_cache.spotify_id,
  captain_id text references artists_cache.spotify_id,
  season_id uuid references seasons.id,
  locked_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, week_number, season_id)
);

alter table teams enable row level security;

create policy "Teams are viewable by everyone."
  on teams for select
  using ( true );

create policy "Users can insert their own team."
  on teams for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own team."
  on teams for update
  using ( auth.uid() = user_id );

-- Create weekly_scores table
create table weekly_scores (
  id uuid default uuid_generate_v4() primary key,
  week_number integer,
  artist_id text references artists_cache.spotify_id,
  popularity_gain integer,
  follower_gain_percent float,
  release_bonus integer,
  total_points integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE public.weekly_scores 
ADD CONSTRAINT weekly_scores_week_artist_unique UNIQUE (week_number, artist_id);

alter table weekly_scores enable row level security;

create policy "Weekly scores are viewable by everyone."
  on weekly_scores for select
  using ( true );

create policy "Admins can manage weekly scores."
  on weekly_scores for all
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  for each row execute procedure public.handle_new_user();

-- REFERRAL SYSTEM UPDATES (Added for Invite a Friend Feature)

-- 1. Add columns to profiles
alter table profiles add column if not exists referral_code text unique;
alter table profiles add column if not exists referred_by uuid references profiles(id);

-- 2. Function to generate random code
create or replace function generate_referral_code() returns text as $$
declare
  chars text[] := '{A,B,C,D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9}';
  result text := '';
  i integer := 0;
begin
  for i in 1..8 loop
    result := result || chars[1+floor(random()*array_length(chars, 1))];
  end loop;
  return result;
end;
$$ language plpgsql;

-- 3. Update Trigger Function to handle referrals
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_referral_code text;
  referrer_id uuid;
  bonus_coins int := 30;
  default_coins int := 50;
  used_code text;
begin
  -- Generate unique referral code
  loop
    new_referral_code := public.generate_referral_code();
    if not exists (select 1 from public.profiles where referral_code = new_referral_code) then
      exit;
    end if;
  end loop;

  -- Check for used referral code
  used_code := new.raw_user_meta_data->>'referral_code_used';
  referrer_id := null;

  if used_code is not null then
    select id into referrer_id from public.profiles where referral_code = used_code;
  end if;

  -- Insert profile
  insert into public.profiles (
    id,
    username,
    avatar_url,
    musi_coins,
    referral_code,
    referred_by,
    marketing_opt_in
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when referrer_id is not null then default_coins + bonus_coins else default_coins end,
    new_referral_code,
    referrer_id,
    (new.raw_user_meta_data->>'marketing_opt_in')::boolean
  );

  -- Award bonus to referrer
  if referrer_id is not null then
    update public.profiles
    set musi_coins = musi_coins + bonus_coins
    where id = referrer_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create weekly_snapshots table (Monday Baseline)
create table weekly_snapshots (
  id uuid default uuid_generate_v4() primary key,
  week_number integer,
  artist_id text references artists_cache.spotify_id,
  popularity integer,
  followers integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table weekly_snapshots enable row level security;

create policy "Weekly snapshots are viewable by everyone."
  on weekly_snapshots for select
  using ( true );

create index weekly_snapshots_week_artist_idx on weekly_snapshots(week_number, artist_id);

-- RPC to increment score safely
create or replace function public.increment_score(user_id_param uuid, score_delta integer)
returns void as $$
begin
  -- Check if the executing user is an admin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set total_score = total_score + score_delta
  where id = user_id_param;
end;
$$ language plpgsql security definer;


-- Create seasons table
create table seasons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean default false,
  status text check (status in ('upcoming', 'active', 'calculating', 'completed')) default 'upcoming',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table seasons enable row level security;

create policy "Seasons are viewable by everyone."
  on seasons for select
  using ( true );

create policy "Admins can insert seasons."
  on seasons for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

create policy "Admins can update seasons."
  on seasons for update
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- Create season_rankings table (Historical Data)
create table season_rankings (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons.id not null,
  user_id uuid references profiles.id not null,
  rank integer not null,
  total_score integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table season_rankings enable row level security;

create policy "Season rankings are viewable by everyone."
  on season_rankings for select
  using ( true );

create policy "Admins can insert season rankings."
  on season_rankings for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- Create featured_artists table
create table featured_artists (
  id uuid default uuid_generate_v4() primary key,
  spotify_id text references artists_cache.spotify_id not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table featured_artists enable row level security;

create policy "Featured artists are viewable by everyone."
  on featured_artists for select
  using ( true );

create policy "Admins can manage featured artists."
  on featured_artists for all
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- Curated Roster for Scout Report
create table curated_roster (
  spotify_id text primary key,
  name text not null,
  image_url text,
  genre text,
  popularity integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table curated_roster enable row level security;

create policy "Curated roster is viewable by everyone."
  on curated_roster for select
  using ( true );

create policy "Admins can manage curated roster."
  on curated_roster for all
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- STORAGE SETUP
-- Create the storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up security policies for the avatars bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

-- DAILY PROMO SYSTEM (Daily Hype)

create type daily_promo_action_type as enum ('profile_click', 'release_click', 'share');

create table daily_promo_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  artist_id text references artists_cache(spotify_id) not null,
  action_type daily_promo_action_type not null,
  points_awarded integer not null default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  log_date date generated always as ((created_at at time zone 'UTC')::date) stored
);

-- Index to enforce one action TYPE per artist per day per user
create unique index daily_promo_logs_action_unique_idx 
  on daily_promo_logs (user_id, artist_id, action_type, log_date);

alter table daily_promo_logs enable row level security;

create policy "Users can insert their own promo logs."
  on daily_promo_logs for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own promo logs."
  on daily_promo_logs for select
  using ( auth.uid() = user_id );

-- DAILY SCORE LOGS (Deferred Scoring UI)

create table daily_score_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  points_gained integer not null,
  breakdown jsonb, -- [{ artist: "Lazza", pts: 5 }, { artist: "Anna", pts: 2 }]
  seen_by_user boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for performance
create index daily_score_logs_user_unseen_idx on daily_score_logs(user_id, seen_by_user);

alter table daily_score_logs enable row level security;

create policy "Users can view their own score logs."
    on daily_score_logs for select
    using ( auth.uid() = user_id );

create policy "Users can update their own score logs (mark as seen)."
    on daily_score_logs for update
    using ( auth.uid() = user_id )
    with check ( auth.uid() = user_id );

-- BADGE SYSTEM

-- 1. Create badges table
create table badges (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table badges enable row level security;

create policy "Badges are viewable by everyone."
  on badges for select
  using ( true );
  
create policy "Admins can manage badges."
  on badges for all
  using ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- 2. Create user_badges table
create table user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  badge_id uuid references badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, badge_id)
);

alter table user_badges enable row level security;

create policy "User badges are viewable by everyone."
  on user_badges for select
  using ( true );

create policy "Admins can award badges."
  on user_badges for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and is_admin = true ) );

-- SEED DATA FOR BADGES (Pioneers)

-- Insert 'Pioneer' Badge if it doesn't exist
insert into badges (name, description, image_url)
select 'Pioneer', 'Membro fondatore di FantaMusiké MVP', '/badges/pioneer.png'
where not exists (select 1 from badges where name = 'Pioneer');
