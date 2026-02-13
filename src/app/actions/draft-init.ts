'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentSeasonAction } from './season';
import { getCurrentWeekAction } from './game';
import { getUserTeamAction } from './team';
import { getFeaturedArtistsAction } from './artist';
import { getCuratedRosterAction } from './scout';

export async function getDraftInitialDataAction() {
    const supabase = await createClient();

    // Fetch everything in parallel on the server
    const [
        season,
        week,
        userRes,
        featured,
        suggested,
        dbTeam
    ] = await Promise.all([
        getCurrentSeasonAction(),
        getCurrentWeekAction(),
        supabase.auth.getUser(),
        getFeaturedArtistsAction(),
        getCuratedRosterAction(),
        getUserTeamAction()
    ]);

    const user = userRes.data.user;
    let referralCount = 0;
    let profile = null;
    if (user) {
        const [profileRes, countRes] = await Promise.all([
            supabase
                .from('profiles')
                .select('musi_coins, referral_code')
                .eq('id', user.id)
                .maybeSingle(),
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by', user.id)
        ]);
        profile = profileRes.data;
        referralCount = countRes.count || 0;
    }

    return {
        season,
        week,
        profile,
        featured,
        suggested,
        dbTeam,
        user,
        referralCount
    };
}
