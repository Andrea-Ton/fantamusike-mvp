-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  total_score integer default 0,
  musi_coins integer default 50,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
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
  user_id uuid references profiles.id primary key,
  slot_1_id text references artists_cache.spotify_id,
  slot_2_id text references artists_cache.spotify_id,
  slot_3_id text references artists_cache.spotify_id,
  slot_4_id text references artists_cache.spotify_id,
  slot_5_id text references artists_cache.spotify_id,
  captain_id text,
  locked_at timestamp with time zone
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

alter table weekly_scores enable row level security;

create policy "Weekly scores are viewable by everyone."
  on weekly_scores for select
  using ( true );

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
create or replace function increment_score(user_id_param uuid, score_delta integer)
returns void as $$
begin
  update profiles
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
