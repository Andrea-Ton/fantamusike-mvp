-- CRON & NET Extensions (for automated jobs)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Schedule Weekly Snapshots (Mondays 05:00 UTC)
select cron.schedule(
  'perform-weekly-snapshot-job',
  '0 5 * * 1',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/perform-weekly-snapshot',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  ) as request_id;
  $$
);

-- 2. Schedule Daily Scoring (Daily 03:00 UTC)
select cron.schedule(
  'calculate-daily-scores-job',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/calculate-daily-scores',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  ) as request_id;
  $$
);

-- 3. Schedule Weekly Leaderboard Processing (Mondays 04:00 UTC)
-- Runs after final weekly scoring and before new weekly snapshot
select cron.schedule(
  'process-weekly-leaderboard-job',
  '0 4 * * 1',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/process-weekly-leaderboard',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  ) as request_id;
  $$
);

-- 3. PROFILES Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  total_score integer default 0,
  listen_score integer default 0,
  musi_coins integer default 50,
  is_admin boolean default false,
  marketing_opt_in boolean default false,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  has_completed_onboarding boolean default false,
  has_used_free_label boolean default false,
  last_login_at timestamp with time zone,
  current_streak integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. CLAIMED REWARDS Table
create table public.claimed_rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reward_slug text not null,
  claimed_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, reward_slug)
);

alter table public.claimed_rewards enable row level security;
create policy "Users can view their own claimed rewards." on public.claimed_rewards for select using ( auth.uid() = user_id );
create policy "Users can insert their own claimed rewards." on public.claimed_rewards for insert with check ( auth.uid() = user_id );

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- 4. ARTISTS CACHE Table
create table public.artists_cache (
  spotify_id text primary key,
  name text,
  image_url text,
  current_popularity integer,
  current_followers integer,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

alter table public.artists_cache enable row level security;
create policy "Artists cache is viewable by everyone." on public.artists_cache for select using ( true );
create policy "Authenticated users can upsert artists." on public.artists_cache for insert with check ( auth.role() = 'authenticated' );
create policy "Authenticated users can update artists." on public.artists_cache for update using ( auth.role() = 'authenticated' );

-- 5. SEASONS Table
create table public.seasons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean default false,
  status text check (status in ('upcoming', 'active', 'calculating', 'completed')) default 'upcoming',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.seasons enable row level security;
create policy "Seasons are viewable by everyone." on public.seasons for select using ( true );
create policy "Admins can manage seasons." on public.seasons for all 
  using ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

-- 6. TEAMS Table
create table public.teams (
  user_id uuid references public.profiles.id,
  week_number integer default 1,
  slot_1_id text references public.artists_cache.spotify_id,
  slot_2_id text references public.artists_cache.spotify_id,
  slot_3_id text references public.artists_cache.spotify_id,
  slot_4_id text references public.artists_cache.spotify_id,
  slot_5_id text references public.artists_cache.spotify_id,
  captain_id text references public.artists_cache.spotify_id,
  season_id uuid references public.seasons.id,
  locked_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, week_number, season_id)
);

alter table public.teams enable row level security;
create policy "Teams are viewable by everyone." on public.teams for select using ( true );
create policy "Users can insert their own team." on public.teams for insert with check ( auth.uid() = user_id );
create policy "Users can update own team." on public.teams for update using ( auth.uid() = user_id );

-- 7. WEEKLY SCORES Table
create table public.weekly_scores (
  id uuid default uuid_generate_v4() primary key,
  week_number integer,
  artist_id text references public.artists_cache.spotify_id,
  popularity_gain integer,
  follower_gain_percent float,
  release_bonus integer,
  total_points integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (week_number, artist_id)
);

alter table public.weekly_scores enable row level security;
create policy "Weekly scores are viewable by everyone." on public.weekly_scores for select using ( true );
create policy "Admins can manage weekly scores." on public.weekly_scores for all
  using ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

-- 8. WEEKLY SNAPSHOTS Table
create table public.weekly_snapshots (
  id uuid default uuid_generate_v4() primary key,
  week_number integer,
  artist_id text references public.artists_cache.spotify_id,
  popularity integer,
  followers integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.weekly_snapshots enable row level security;
create policy "Weekly snapshots are viewable by everyone." on public.weekly_snapshots for select using ( true );
create policy "Authenticated users can insert snapshots." on public.weekly_snapshots for insert with check ( auth.role() = 'authenticated' );
create index weekly_snapshots_week_artist_idx on public.weekly_snapshots(week_number, artist_id);

-- 9. SEASON RANKINGS Table
create table public.season_rankings (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references public.seasons.id not null,
  user_id uuid references public.profiles.id not null,
  rank integer not null,
  total_score integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.season_rankings enable row level security;
create policy "Season rankings are viewable by everyone." on public.season_rankings for select using ( true );
create policy "Admins can insert season rankings." on public.season_rankings for insert
  with check ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

-- 10. FEATURED ARTISTS Table
create table public.featured_artists (
  id uuid default uuid_generate_v4() primary key,
  spotify_id text references public.artists_cache.spotify_id not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.featured_artists enable row level security;
create policy "Featured artists are viewable by everyone." on public.featured_artists for select using ( true );
create policy "Admins can manage featured artists." on public.featured_artists for all
  using ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

-- 11. CURATED ROSTER Table
create table public.curated_roster (
  spotify_id text primary key,
  name text not null,
  image_url text,
  genre text,
  popularity integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.curated_roster enable row level security;
create policy "Curated roster is viewable by everyone." on public.curated_roster for select using ( true );
create policy "Admins can manage curated roster." on public.curated_roster for all
  using ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

-- 12. DAILY PROMOS Table
create table public.daily_promos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  artist_id text references public.artists_cache(spotify_id) not null,
  date date not null default current_date,
  quiz_done boolean default false,
  bet_done boolean default false,
  boost_done boolean default false,
  quiz_snapshot jsonb,
  bet_snapshot jsonb,
  bet_resolved boolean default false,
  bet_result_seen boolean default false,
  boost_snapshot jsonb,
  total_points integer default 0,
  total_coins integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, date)
);

alter table public.daily_promos enable row level security;
create policy "Users can manage their own daily promo." on public.daily_promos for all using ( auth.uid() = user_id );

-- 13. DAILY SCORE LOGS Table
create table public.daily_score_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  points_gained integer not null,
  breakdown jsonb,
  seen_by_user boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.daily_score_logs enable row level security;
create index daily_score_logs_user_unseen_idx on public.daily_score_logs(user_id, seen_by_user);
create policy "Users can view their own score logs." on public.daily_score_logs for select using ( auth.uid() = user_id );
create policy "Users can update their own score logs." on public.daily_score_logs for update using ( auth.uid() = user_id );

-- 14. BADGE SYSTEM
create table public.badges (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.badges enable row level security;
create policy "Badges are viewable by everyone." on public.badges for select using ( true );
create policy "Admins can manage badges." on public.badges for all
  using ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;
create policy "User badges are viewable by everyone." on public.user_badges for select using ( true );
create policy "Admins can award badges." on public.user_badges for insert 
  with check ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

-- Seed Pioneer Badge
insert into public.badges (name, description, image_url)
select 'Pioneer', 'Membro fondatore di FantaMusiké MVP', '/badges/pioneer.png'
where not exists (select 1 from public.badges where name = 'Pioneer');

-- 15. LEADERBOARD SYSTEM
create table public.weekly_leaderboard_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    week_number integer not null,
    rank integer not null,
    score integer not null,
    reward_musicoins integer not null,
    is_seen boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.weekly_leaderboard_history enable row level security;
create policy "Users can view their own leaderboard history." on public.weekly_leaderboard_history for select using ( auth.uid() = user_id );
create policy "Admins can view all leaderboard history." on public.weekly_leaderboard_history for select
  using ( exists ( select 1 from public.profiles where id = auth.uid() and is_admin = true ) );

create policy "Users can update their own leaderboard history." on public.weekly_leaderboard_history for update 
  using ( auth.uid() = user_id );

-- Seed a "Global" Season if none exists (Internal use only)
insert into public.seasons (id, name, start_date, end_date, is_active, status)
values ('00000000-0000-0000-0000-000000000001', 'Global Season', '2024-01-01', '2099-12-31', true, 'active')
on conflict (id) do nothing;

-- 16. STORAGE SETUP
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
create policy "Anyone can update their own avatar." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'avatars' );

-- 16. FUNCTIONS & TRIGGERS

-- Function to generate random code
create or replace function public.generate_referral_code() returns text as $$
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

-- Final handle_new_user function (with referrals and onboarding)
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
    marketing_opt_in,
    has_completed_onboarding,
    has_used_free_label
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when referrer_id is not null then default_coins + bonus_coins else default_coins end,
    new_referral_code,
    referrer_id,
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
    false,
    false
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

-- Re-create the trigger consistently
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC to increment score safely
create or replace function public.increment_score(user_id_param uuid, score_delta integer)
returns void as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set total_score = total_score + score_delta
  where id = user_id_param;
end;
$$ language plpgsql security definer;

-- 17. LEADERBOARD VIEW (Combined Score)
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
    *,
    (total_score + listen_score) as combined_score
FROM public.profiles;

-- 18. MYSTERY BOXES System
CREATE TABLE public.mystery_boxes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    type TEXT CHECK (type IN ('physical', 'digital')) NOT NULL,
    price_musicoins INTEGER NOT NULL,
    total_copies INTEGER, -- NULL for unlimited
    available_copies INTEGER,
    max_copies_per_user INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    prizes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { name, probability, is_certain, image_url? }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mystery_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mystery boxes viewable by everyone" ON public.mystery_boxes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage mystery boxes" ON public.mystery_boxes FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE public.mystery_box_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    box_id UUID REFERENCES public.mystery_boxes(id) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'shipped', 'completed')) DEFAULT 'pending',
    prize_won JSONB, -- The specific prize assigned from the box
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mystery_box_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.mystery_box_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.mystery_box_orders FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 19. STORAGE POLICIES (Marketplace Bucket)
-- Assuming the bucket 'marketplace' is created via Supabase Dashboard

-- Allow public access to view images
CREATE POLICY "Public Access Marketplace" ON storage.objects FOR SELECT 
USING ( bucket_id = 'marketplace' );

-- Allow admins to upload/manage images
CREATE POLICY "Admin Manage Marketplace" ON storage.objects FOR ALL
USING (
    bucket_id = 'marketplace' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
)
WITH CHECK (
    bucket_id = 'marketplace' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);
