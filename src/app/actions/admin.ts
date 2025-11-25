'use server';

import { createClient } from '@/utils/supabase/server';
import { SpotifyArtist } from '@/lib/spotify';

// Helper to fetch fresh data (simulated for now if we don't want to spam Spotify API, 
// but ideally this calls the real Spotify API via our service)
// For this MVP, we will assume artists_cache is "fresh enough" or we would trigger a refresh here.
// To keep it simple and robust, we will re-fetch from Spotify for every artist in cache.
import { searchArtists } from '@/lib/spotify'; // We might need a getArtist(id) function in spotify.ts

// We need to extend spotify.ts to support getArtist by ID if we want true fresh data.
// For now, let's assume we iterate through the cache and update it.

export async function createWeeklySnapshotAction(weekNumber: number) {
    const supabase = await createClient();

    // 1. Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    try {
        // 2. Fetch all cached artists
        const { data: artists, error: fetchError } = await supabase
            .from('artists_cache')
            .select('*');

        if (fetchError || !artists) {
            return { success: false, message: 'Failed to fetch artists' };
        }

        // 3. Create Snapshots
        const snapshots = artists.map(artist => ({
            week_number: weekNumber,
            artist_id: artist.spotify_id,
            popularity: artist.current_popularity,
            followers: artist.current_followers
        }));

        const { error: insertError } = await supabase
            .from('weekly_snapshots')
            .insert(snapshots);

        if (insertError) {
            console.error('Snapshot Error:', insertError);
            return { success: false, message: 'Failed to create snapshot' };
        }

        return { success: true, message: `Snapshot created for Week ${weekNumber} (${snapshots.length} artists)` };

    } catch (error) {
        console.error('Unexpected Error:', error);
        return { success: false, message: 'An unexpected error occurred' };
    }
}

export async function calculateScoresAction(weekNumber: number) {
    const supabase = await createClient();

    // 1. Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    try {
        // 1. Fetch Snapshots for the week
        const { data: snapshots, error: snapError } = await supabase
            .from('weekly_snapshots')
            .select('*')
            .eq('week_number', weekNumber);

        if (snapError || !snapshots) {
            return { success: false, message: 'Failed to fetch snapshots' };
        }

        // 2. Fetch Current Data (Live)
        // In a real app, we would fetch FRESH data from Spotify here.
        // For this MVP, we'll use the current state of artists_cache 
        // (assuming it has been updated via user searches or a separate job).
        const { data: currentArtists, error: artError } = await supabase
            .from('artists_cache')
            .select('*');

        if (artError || !currentArtists) {
            return { success: false, message: 'Failed to fetch current artists' };
        }

        let totalUpdates = 0;

        // 3. Calculate Scores
        for (const snapshot of snapshots) {
            const current = currentArtists.find(a => a.spotify_id === snapshot.artist_id);
            if (!current) continue;

            // A. Hype Score (Pop Delta)
            const popDelta = current.current_popularity - snapshot.popularity;
            const hypeScore = popDelta * 10;

            // B. Fanbase Score (% Growth)
            // Formula: ((Current - Start) / Start) * 100
            const startFollowers = snapshot.followers > 0 ? snapshot.followers : 1;
            const followerDelta = current.current_followers - snapshot.followers;
            const growthPercent = (followerDelta / startFollowers) * 100;
            // Score is the percentage itself (e.g. 10% growth = 10 points)
            const finalFanbaseScore = Math.round(growthPercent);

            // C. Release Bonus
            // Fetch releases from Spotify
            // In a real scenario, we might want to batch this or cache it better, 
            // but for MVP with < 50 artists in roster, it's manageable.
            let releaseBonus = 0;
            try {
                const { getArtistReleases } = await import('@/lib/spotify');
                const releases = await getArtistReleases(snapshot.artist_id);

                // Check for releases since the snapshot was created (start of week)
                const weekStart = new Date(snapshot.created_at);

                for (const release of releases) {
                    const releaseDate = new Date(release.release_date);
                    // Check if release is after week start
                    if (releaseDate >= weekStart) {
                        if (release.album_type === 'single') {
                            releaseBonus += 20;
                        } else if (release.album_type === 'album') {
                            releaseBonus += 50;
                        }
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch releases for ${snapshot.artist_id}`, e);
            }

            const totalPoints = hypeScore + finalFanbaseScore + releaseBonus;

            // 4. Save Weekly Score
            await supabase.from('weekly_scores').insert({
                week_number: weekNumber,
                artist_id: snapshot.artist_id,
                popularity_gain: popDelta,
                follower_gain_percent: growthPercent,
                release_bonus: releaseBonus,
                total_points: totalPoints
            });

            // 5. Update User Scores
            // Find all teams that have this artist
            // This is inefficient for large scale, but fine for MVP
            // Better approach: Batch update or SQL function

            // We will do a simplified approach: 
            // We need to update profiles.total_score based on the teams.
            // Let's leave the profile update for a separate step or SQL trigger to keep this action clean?
            // Or we can do it here.

            // Let's just log it for now to verify calculation logic first.
            totalUpdates++;
        }

        // 6. Update Profiles (Bulk)
        // This is the heavy part. For MVP, let's run a SQL function if possible, 
        // or just iterate teams.
        // 6. Update Profiles (Bulk)
        const { data: teams } = await supabase.from('teams').select('*');

        // Fetch Featured Artists for Multiplier Check
        const { data: featuredArtists } = await supabase.from('featured_artists').select('spotify_id');
        const featuredIds = new Set(featuredArtists?.map(f => f.spotify_id) || []);

        if (teams) {
            for (const team of teams) {
                let teamScore = 0;
                const slots = [team.slot_1_id, team.slot_2_id, team.slot_3_id, team.slot_4_id, team.slot_5_id];

                // Fetch scores for these artists for this week
                const { data: scores } = await supabase
                    .from('weekly_scores')
                    .select('artist_id, total_points')
                    .eq('week_number', weekNumber)
                    .in('artist_id', slots);

                if (scores) {
                    for (const score of scores) {
                        let points = score.total_points;

                        // Apply Multipliers
                        if (team.captain_id === score.artist_id) {
                            if (featuredIds.has(score.artist_id)) {
                                points = Math.round(points * 2); // Featured Captain x2
                            } else {
                                points = Math.round(points * 1.5); // Regular Captain x1.5
                            }
                        }

                        teamScore += points;
                    }

                    // Update Profile
                    await supabase.rpc('increment_score', {
                        user_id_param: team.user_id,
                        score_delta: teamScore
                    });
                }
            }
        }

        return { success: true, message: `Scoring complete. Processed ${totalUpdates} artists.` };

    } catch (error) {
        console.error('Unexpected Error:', error);
        return { success: false, message: 'An unexpected error occurred' };
    }
}
