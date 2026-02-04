'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentSeasonAction } from './season';
import { getCurrentWeekAction } from './game';
import { getUnseenScoreLogsAction } from './dashboard';
import { getPendingBetResultAction, getDailyPromoStateAction } from './promo';
import { getFeaturedArtistsAction } from './artist';

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
        featured
    ] = await Promise.all([
        getCurrentSeasonAction(),
        getCurrentWeekAction(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getUnseenScoreLogsAction(),
        getPendingBetResultAction(),
        getDailyPromoStateAction(),
        getFeaturedArtistsAction()
    ]);

    const profile = profileRes.data;

    return {
        user,
        profile,
        season,
        week,
        unseenLogs,
        pendingBet,
        dailyPromoState,
        featured
    };
}
