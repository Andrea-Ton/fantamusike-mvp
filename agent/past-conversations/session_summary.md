# Session Summary: FantaMusiké MVP

## Overview
We have initialized the **FantaMusiké** MVP, a fantasy music league application. The stack is **Next.js 14 (App Router)**, **TailwindCSS**, and **Supabase**.

## Completed Features

### 1. Infrastructure & Setup
-   **Framework**: Next.js 14 with TypeScript.
-   **Styling**: TailwindCSS with a custom "Glassmorphism" dark theme (`globals.css`).
-   **Icons**: Lucide React.
-   **Database**: Supabase (PostgreSQL).

### 2. Authentication (Supabase)
-   **Method**: Spotify OAuth.
-   **Flow**:
    -   Login via `signInWithOAuth` (Spotify).
    -   Callback route `src/app/auth/callback/route.ts` exchanges code for session.
    -   Middleware `src/middleware.ts` protects `/dashboard`.
-   **User Management**:
    -   Trigger `on_auth_user_created` automatically creates a `profiles` entry.
    -   Extracts `username` and `avatar_url` from Spotify metadata.

### 3. Database Schema
Tables created in Supabase:
-   `profiles`: Stores user stats (`total_score`, `musi_coins`, `team_name`).
-   `teams`: Links users to artists (slots: Headliner, Rising Star, etc.).
-   `artists_cache`: Caches Spotify artist data to reduce API calls.
-   `weekly_scores`: Tracks artist performance per week.

### 4. UI Components
-   **Landing Page**: Hero section, Feature cards, responsive Navbar.
-   **Dashboard**:
    -   **Sidebar/BottomNav**: Responsive navigation.
    -   **Stats**: Real-time display of MusiCoins and Total Score.
    -   **Roster**: Visual representation of the user's team (currently using mock data for slots).
-   **Talent Scout**: Search interface for artists.
-   **Leaderboard**: Static UI implementation.

### 5. Spotify API Integration
-   **Client Credentials Flow**: Implemented in `src/lib/spotify.ts` to fetch access tokens server-side.
-   **Artist Search**:
    -   Server Action: `searchArtistsAction` in `src/app/actions/spotify.ts`.
    -   Frontend: Real-time, debounced search in `/dashboard/draft` connected to the live Spotify API.

## Current State
-   Users can **log in** with their Spotify account.
-   Users are redirected to the **Dashboard**.
-   Dashboard displays **real user profile data** (Score/Coins).
-   **Talent Scout** page allows searching for **real artists** via Spotify API.

## Next Steps for the Next Agent
1.  **Team Management**:
    -   Implement "Add to Team" functionality in Talent Scout.
    -   Save selected artists to the `teams` table in Supabase.
    -   Enforce budget (`musi_coins`) and slot constraints.
2.  **Roster Visualization**:
    -   Fetch and display the user's real team in `/dashboard` (replacing `MOCK_TEAM`).
3.  **Leaderboard Logic**:
    -   Implement backend logic to calculate and display real rankings.
4.  **Scoring System**:
    -   Define how artists earn points (e.g., based on Spotify popularity delta).

## Key Files
-   `src/utils/supabase/*`: Supabase client/server utilities.
-   `src/lib/spotify.ts`: Spotify API wrapper.
-   `src/app/dashboard/page.tsx`: Main dashboard logic.
-   `src/app/dashboard/draft/page.tsx`: Artist search page.
-   `supabase/schema.sql`: Database definitions.
