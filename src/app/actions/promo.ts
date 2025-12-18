'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentWeekAction } from './game';
import { UserTeamResponse, getUserTeamAction } from './team';
import { PROMO_POINTS, ArtistCategory, PROMO_LUCKY_DROP } from '@/config/promo';
import { ARTIST_TIERS } from '@/config/game';

export type PromoActionType = 'profile_click' | 'release_click' | 'share';

export type ClaimPromoResult = {
    success: boolean;
    message: string;
    newScore?: number;
    pointsAwarded?: number;
    musiCoinsAwarded?: number;
    dropLabel?: string;
    error?: string;
};

// Helper to determine artist category
function getArtistCategory(popularity: number): ArtistCategory {
    if (popularity >= ARTIST_TIERS.BIG.min) return 'Big';
    if (popularity >= ARTIST_TIERS.MID.min) return 'Mid';
    return 'New Gen';
}

export async function claimPromoAction(artistId: string, actionType: PromoActionType): Promise<ClaimPromoResult> {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        // 2. Validation: Is artist in active team?
        const currentWeek = await getCurrentWeekAction();
        const userTeam = await getUserTeamAction(currentWeek);

        if (!userTeam) {
            return { success: false, message: 'No active team found' };
        }

        // Find the artist in the team to get popularity for Tier calculation
        const slots = [userTeam.slot_1, userTeam.slot_2, userTeam.slot_3, userTeam.slot_4, userTeam.slot_5];
        const artistSlot = slots.find(s => s && s.id === artistId);

        if (!artistSlot) {
            return { success: false, message: 'Artist not in your active team' };
        }

        // 3. Validation: Already claimed THIS action today?
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { count } = await supabase
            .from('daily_promo_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('artist_id', artistId)
            .eq('action_type', actionType)
            .filter('created_at', 'gte', `${today}T00:00:00+00:00`);

        if (count && count > 0) {
            return { success: false, message: 'This specific promo action already claimed today' };
        }        // 4. Determine Rewards
        const category = getArtistCategory(artistSlot.popularity);
        const standardPoints = PROMO_POINTS[category][actionType];

        // 5. Calculate Lucky Drop FIRST
        let musiCoinsAwarded = 0;
        let dropLabel = '';
        const dropTiers = PROMO_LUCKY_DROP[category];

        if (dropTiers && dropTiers.length > 0) {
            const roll = Math.random();
            let accumulatedProbability = 0;
            for (const tier of dropTiers) {
                accumulatedProbability += tier.probability;
                if (roll < accumulatedProbability) {
                    musiCoinsAwarded = tier.amount;
                    dropLabel = tier.label;
                    break;
                }
            }
        }

        // 6. Point Logic: IF MusiCoins won, Points = 0. Else, Points = Standard.
        const points = musiCoinsAwarded > 0 ? 0 : standardPoints;

        // 7. Execute Claim (Log)
        const { error: insertError } = await supabase
            .from('daily_promo_logs')
            .insert({
                user_id: user.id,
                artist_id: artistId,
                action_type: actionType,
                points_awarded: points
            });

        if (insertError) {
            if (insertError.code === '23505') { // Unique violation
                return { success: false, message: 'Promo action already claimed today' };
            }
            console.error('Promo Log Error:', insertError);
            return { success: false, message: 'Failed to log promo' };
        }

        // 8. Award Rewards to Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('listen_score, musi_coins')
            .eq('id', user.id)
            .single();

        let updateData: any = {};
        let newScore = profile?.listen_score || 0;

        if (points > 0) {
            newScore += points;
            updateData.listen_score = newScore;
        }

        if (musiCoinsAwarded > 0) {
            updateData.musi_coins = (profile?.musi_coins || 0) + musiCoinsAwarded;
        }

        if (Object.keys(updateData).length > 0 && profile) {
            await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);
        }

        revalidatePath('/dashboard');
        return {
            success: true,
            message: musiCoinsAwarded > 0
                ? `Promo claimed! You won MusiCoins!`
                : `Promo claimed! +${points} Points`,
            newScore,
            pointsAwarded: points,
            musiCoinsAwarded: musiCoinsAwarded > 0 ? musiCoinsAwarded : undefined,
            dropLabel: dropLabel || undefined
        };

    } catch (error) {
        console.error('Claim Promo Error:', error);
        return { success: false, message: 'An unexpected error occurred' };
    }
}

// Map of Action Type -> Boolean (Claimed/Not Claimed)
export type ArtistPromoStatus = Record<PromoActionType, boolean>;

export async function getDailyPromoStatusAction(artistIds: string[]): Promise<Record<string, ArtistPromoStatus>> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || artistIds.length === 0) return {};

    const today = new Date().toISOString().split('T')[0];

    // Fetch all logs for these artists today
    const { data: logs } = await supabase
        .from('daily_promo_logs')
        .select('artist_id, action_type')
        .eq('user_id', user.id)
        .in('artist_id', artistIds)
        .gte('created_at', `${today}T00:00:00+00:00`);

    // Initialize map
    const statusMap: Record<string, ArtistPromoStatus> = {};
    const defaultStatus: ArtistPromoStatus = { profile_click: false, release_click: false, share: false };

    artistIds.forEach(id => {
        statusMap[id] = { ...defaultStatus };
    });

    if (logs) {
        logs.forEach((log: { artist_id: string; action_type: PromoActionType }) => {
            if (statusMap[log.artist_id]) {
                statusMap[log.artist_id][log.action_type] = true;
            }
        });
    }

    return statusMap;
}
