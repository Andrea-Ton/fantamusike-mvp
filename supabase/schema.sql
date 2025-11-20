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
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
