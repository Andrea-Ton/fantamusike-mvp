'use server';

import { createClient } from '@/utils/supabase/server';

export async function getWeeklyScoresAction(artistIds: string[]) {
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
        .select('artist_id, total_points')
        .in('artist_id', artistIds)
        .eq('week_number', currentWeek);

    // 3. Return a map of artistId -> score
    const scoreMap: Record<string, number> = {};

    if (scores) {
        scores.forEach(score => {
            scoreMap[score.artist_id] = score.total_points;
        });
    }

    return {
        week: currentWeek,
        scores: scoreMap
    };
}
