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
  updated_at timestamp with time zone default timezone('utc'::text, now())
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
    referred_by
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when referrer_id is not null then default_coins + bonus_coins else default_coins end,
    new_referral_code,
    referrer_id
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

-- LISTEN TO WIN FEATURE
-- 1. Add last_spotify_sync to profiles
alter table profiles add column if not exists last_spotify_sync timestamp with time zone;

-- 2. Create spotify_tokens table
create table spotify_tokens (
  user_id uuid references profiles.id primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null, -- Unix timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table spotify_tokens enable row level security;

create policy "Users can manage their own spotify tokens."
  on spotify_tokens for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- 3. Create listen_history table
create table listen_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles.id not null,
  artist_id text not null, -- Spotify Artist ID
  track_name text not null,
  played_at timestamp with time zone not null,
  points_awarded integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Prevent duplicate processing of the same stream
  unique(user_id, played_at) 
);

alter table listen_history enable row level security;

create policy "Users can view their own listen history."
  on listen_history for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own listen history."
  on listen_history for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own listen history."
  on listen_history for update
  using ( auth.uid() = user_id );
