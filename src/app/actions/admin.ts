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

    // 1. Admin Check (TODO: Implement real admin check)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return { success: false, message: 'Unauthorized' };

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
            // Avoid division by zero
            const startFollowers = snapshot.followers > 0 ? snapshot.followers : 1;
            const followerDelta = current.current_followers - snapshot.followers;
            const growthPercent = (followerDelta / startFollowers) * 100;
            const fanbaseScore = Math.round(growthPercent * 10); // 10 points per 1% growth? 
            // Spec says: ((Current - Start) / Start) * 100 -> This is just the percentage.
            // Example: 1000 -> 1100 (+10%). Score = 10. 
            // So Fanbase Score = Growth Percent.
            const finalFanbaseScore = Math.round(growthPercent);

            const totalPoints = hypeScore + finalFanbaseScore;

            // 4. Save Weekly Score
            await supabase.from('weekly_scores').insert({
                week_number: weekNumber,
                artist_id: snapshot.artist_id,
                popularity_gain: popDelta,
                follower_gain_percent: growthPercent,
                release_bonus: 0, // TODO: Implement Release Radar
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
        const { data: teams } = await supabase.from('teams').select('*');

        if (teams) {
            for (const team of teams) {
                let teamScore = 0;
                const slots = [team.slot_1_id, team.slot_2_id, team.slot_3_id, team.slot_4_id, team.slot_5_id];

                // Fetch scores for these artists for this week
                const { data: scores } = await supabase
                    .from('weekly_scores')
                    .select('total_points')
                    .eq('week_number', weekNumber)
                    .in('artist_id', slots);

                if (scores) {
                    teamScore = scores.reduce((acc, curr) => acc + curr.total_points, 0);

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
