'use server';

import { createClient } from '@/utils/supabase/server';

export async function getWeeklyScoresAction(artistIds: string[], captainId?: string | null) {
    const supabase = await createClient();

    // 1. Get the latest week number
    const { data: latestWeek } = await supabase
        .from('weekly_scores')
        .select('week_number')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    const currentWeek = latestWeek?.week_number || 1;

    // 2. Fetch scores for the given artists for the current week
    const { data: scores } = await supabase
        .from('weekly_scores')
        .select('artist_id, total_points, is_featured')
        .in('artist_id', artistIds)
        .eq('week_number', currentWeek);

    // 3. Return a map of artistId -> score
    const scoreMap: Record<string, number> = {};

    if (scores) {
        scores.forEach(score => {
            let points = score.total_points;

            // Apply Multipliers
            if (captainId && score.artist_id === captainId) {
                if (score.is_featured) {
                    points = Math.round(points * 2); // Featured Captain x2
                } else {
                    points = Math.round(points * 1.5); // Regular Captain x1.5
                }
            }

            scoreMap[score.artist_id] = points;
        });
    }

    return {
        week: currentWeek,
        scores: scoreMap
    };
}
