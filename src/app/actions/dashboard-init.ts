'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentSeasonAction } from './season';
import { getCurrentWeekAction } from './game';
import { getUnseenScoreLogsAction } from './dashboard';
import { getPendingBetResultAction, getDailyPromoStateAction } from './promo';
import { getFeaturedArtistsAction } from './artist';

import { getUnseenWeeklyRecapAction } from './leaderboard';

export async function getDashboardMetadataAction() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    // Level 1: Fetch metadata in parallel
    const [
        season,
        week,
        profileRes,
        unseenLogs,
        pendingBet,
        dailyPromoState,
        featured,
        unseenWeeklyRecap,
        referralCountRes,
        hallOfFameWinsRes
    ] = await Promise.all([
        getCurrentSeasonAction(),
        getCurrentWeekAction(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        getUnseenScoreLogsAction(),
        getPendingBetResultAction(),
        getDailyPromoStateAction(),
        getFeaturedArtistsAction(),
        getUnseenWeeklyRecapAction(),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', user.id),
        supabase.from('weekly_leaderboard_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('rank', 1)
    ]);

    const profile = profileRes.data;
    const referralCount = referralCountRes.count || 0;
    const hallOfFameWins = hallOfFameWinsRes.count || 0;

    return {
        user,
        profile,
        season,
        week,
        unseenLogs,
        pendingBet,
        dailyPromoState,
        featured,
        unseenWeeklyRecap,
        referralCount,
        hallOfFameWins
    };
}
