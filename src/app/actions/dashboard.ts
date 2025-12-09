'use server';

import { createClient } from '@/utils/supabase/server';

export async function getWeeklyScoresAction(artistIds: string[], captainId?: string | null) {
    const supabase = await createClient();

    // 1. Get the latest snapshot week number
    const { data: latestSnapshot } = await supabase
        .from('weekly_snapshots')
        .select('week_number')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    const latestSnapshotWeek = latestSnapshot?.week_number || 0;

    // 2. Get the latest score week number
    const { data: latestScore } = await supabase
        .from('weekly_scores')
        .select('week_number')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    const latestScoreWeek = latestScore?.week_number || 0;

    // 3. User Logic: Only show scores if scoring (latestScoreWeek) has caught up to snapshot (latestSnapshotWeek)
    let targetWeek = 0;
    if (latestScoreWeek >= latestSnapshotWeek) {
        targetWeek = latestScoreWeek;
    } else {
        // Scoring is lagging (e.g. new week started but no scores yet)
        return {
            week: latestSnapshotWeek,
            scores: {}
        };
    }

    // 4. Fetch scores for the target week
    const { data: scores } = await supabase
        .from('weekly_scores')
        // Removing is_featured from selection as it's not reliably in this table
        .select('artist_id, total_points')
        .in('artist_id', artistIds)
        .eq('week_number', targetWeek);

    // 5. Fetch Featured Artists for Multiplier (Fixing missing is_featured bug)
    const { data: featured } = await supabase
        .from('featured_artists')
        .select('spotify_id');

    const featuredIds = new Set(featured?.map(f => f.spotify_id) || []);

    // 6. Return a map of artistId -> score
    const scoreMap: Record<string, number> = {};

    if (scores) {
        scores.forEach(score => {
            let points = score.total_points;

            // Apply Multipliers
            if (captainId && score.artist_id === captainId) {
                if (featuredIds.has(score.artist_id)) {
                    points = Math.round(points * 2); // Featured Captain x2
                } else {
                    points = Math.round(points * 1.5); // Regular Captain x1.5
                }
            }

            scoreMap[score.artist_id] = points;
        });
    }

    return {
        week: targetWeek,
        scores: scoreMap
    };
}
