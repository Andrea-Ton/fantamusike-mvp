'use server';

import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import { getCurrentSeasonAction } from './season';

export interface WeeklyScoresResult {
    week: number;
    scores: Record<string, number>;
    fantaScores: Record<string, number>;
    promoScores: Record<string, number>;
}

export const getWeeklyScoresAction = cache(async (artistIds: string[], captainId?: string | null, userId?: string): Promise<WeeklyScoresResult> => {
    const supabase = await createClient();

    // 0. Get current season for isolation
    const currentSeason = await getCurrentSeasonAction();
    if (!currentSeason) return { week: 0, scores: {}, fantaScores: {}, promoScores: {} };

    // 1. Get the latest snapshot week number AND timestamp (start of week) - filtered by season
    const { data: latestSnapshot } = await supabase
        .from('weekly_snapshots')
        .select('week_number, created_at')
        .gte('created_at', currentSeason.start_date)
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    const latestSnapshotWeek = latestSnapshot?.week_number || 0;
    const weekStartDate = latestSnapshot?.created_at;

    // 2. Get the latest score week number - filtered by season
    const { data: latestScore } = await supabase
        .from('weekly_scores')
        .select('week_number')
        .gte('created_at', currentSeason.start_date)
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    const latestScoreWeek = latestScore?.week_number || 0;

    // 3. User Logic: Only show scores if scoring (latestScoreWeek) has caught up to snapshot (latestSnapshotWeek)
    let targetWeek = 0;
    if (latestScoreWeek >= latestSnapshotWeek) {
        targetWeek = latestScoreWeek;
    }
    // Note: If scoring is lagging, targetWeek remains 0, so we won't fetch weekly_scores, 
    // BUT we might still want to fetch promo points if they are real-time.

    // 4. Fetch scores for the target week (if valid)
    let scores: any[] = [];
    if (targetWeek > 0) {
        const result = await supabase
            .from('weekly_scores')
            .select('artist_id, total_points')
            .in('artist_id', artistIds)
            .eq('week_number', targetWeek);

        if (result.data) {
            scores = result.data;
        }
    }

    // 5. Fetch Featured Artists for Multiplier
    const { data: featured } = await supabase
        .from('featured_artists')
        .select('spotify_id');

    const featuredIds = new Set(featured?.map(f => f.spotify_id) || []);

    // 6. Return a map of artistId -> score
    const scoreMap: Record<string, number> = {};
    const fantaScoreMap: Record<string, number> = {};
    const promoScoreMap: Record<string, number> = {};

    // Initialize with 0
    artistIds.forEach(id => {
        scoreMap[id] = 0;
        fantaScoreMap[id] = 0;
        promoScoreMap[id] = 0;
    });

    // Add Weekly Scores (Fanta Points)
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

        fantaScoreMap[score.artist_id] = points;
        scoreMap[score.artist_id] += points;
    });

    // 7. Add Promo Points (Real-time)
    if (userId && weekStartDate) {
        // Fetch daily_promos for this user, where artist is one of the requested IDs, since week start
        const { data: promos } = await supabase
            .from('daily_promos')
            .select('artist_id, total_points')
            .eq('user_id', userId)
            .in('artist_id', artistIds)
            .gte('created_at', weekStartDate);

        if (promos) {
            promos.forEach(promo => {
                if (scoreMap[promo.artist_id] === undefined) scoreMap[promo.artist_id] = 0;
                // Add total_points stored in the daily_promo row
                const points = promo.total_points || 0;
                promoScoreMap[promo.artist_id] = (promoScoreMap[promo.artist_id] || 0) + points;
                scoreMap[promo.artist_id] += points;
            });
        }
    }

    return {
        week: Math.max(targetWeek, latestSnapshotWeek), // Return current week context even if scores are lagging
        scores: scoreMap,
        fantaScores: fantaScoreMap,
        promoScores: promoScoreMap
    };
});
export async function getUnseenScoreLogsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('daily_score_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('seen_by_user', false)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching score logs:', error);
        return null;
    }

    return data;
}

export async function markScoreLogsSeenAction(logIds: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase
        .from('daily_score_logs')
        .update({ seen_by_user: true })
        .in('id', logIds)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error marking score logs as seen:', error);
        return { success: false };
    }

    return { success: true };
}
