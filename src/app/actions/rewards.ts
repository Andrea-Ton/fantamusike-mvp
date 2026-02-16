'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type RewardMission = {
    slug: string;
    title: string;
    description: string;
    reward: number;
    goal: number;
    current: number;
    isClaimed: boolean;
    canClaim: boolean;
};

export async function updateLoginStreakAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: profile } = await supabase
        .from('profiles')
        .select('last_login_at, current_streak')
        .eq('id', user.id)
        .single();

    if (!profile) return { success: false };

    const now = new Date();
    const lastLogin = profile.last_login_at ? new Date(profile.last_login_at) : null;

    // Check if same day
    if (lastLogin && lastLogin.toDateString() === now.toDateString()) {
        return { success: true, streak: profile.current_streak };
    }

    let newStreak = 1;
    if (lastLogin) {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);

        if (lastLogin.toDateString() === yesterday.toDateString()) {
            newStreak = (profile.current_streak || 0) + 1;
        }
    }

    await supabase
        .from('profiles')
        .update({
            last_login_at: now.toISOString(),
            current_streak: newStreak
        })
        .eq('id', user.id);

    return { success: true, streak: newStreak };
}

export async function getRewardsStateAction(): Promise<{ success: boolean; missions: RewardMission[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, missions: [] };

    // Fetch Profile, Daily Promos (for Clean Sweep / Commitment), and Claimed Rewards
    const [profileRes, promosRes, claimedRes] = await Promise.all([
        supabase.from('profiles').select('current_streak').eq('id', user.id).single(),
        supabase.from('daily_promos').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('claimed_rewards').select('reward_slug').eq('user_id', user.id)
    ]);

    const profile = profileRes.data;
    const allPromos = promosRes.data || [];
    const claimedSlugs = new Set(claimedRes.data?.map(c => c.reward_slug) || []);

    // 1. Daily Streak (5 days)
    const streakMission: RewardMission = {
        slug: 'daily-streak-5',
        title: 'Daily Streak',
        description: 'Accedi al Fantamusiké per 5 giorni consecutivi',
        reward: 15,
        goal: 5,
        current: profile?.current_streak || 0,
        isClaimed: claimedSlugs.has('daily-streak-5'),
        canClaim: (profile?.current_streak || 0) >= 5 && !claimedSlugs.has('daily-streak-5')
    };

    // 2. Clean Sweep (Complete all 3 today)
    const today = new Date().toISOString().split('T')[0];
    const todayPromo = allPromos.find(p => p.date === today);
    const todayDone = todayPromo ? (todayPromo.quiz_done && todayPromo.bet_done && todayPromo.boost_done) : false;

    // Special case for Clean Sweep: we want to allow claiming even if it's already claimed for *today*? 
    // Actually, mission slugs should probably be unique per instance if repeatable.
    // For now, let's treat it as a "one-off" or "resetting" reward.
    // Let's refine the slug for daily: clean-sweep-YYYY-MM-DD
    const cleanSweepSlug = `clean-sweep-${today}`;
    const cleanSweepMission: RewardMission = {
        slug: cleanSweepSlug,
        title: 'Clean Sweep',
        description: 'Completa tutte le missioni promo di oggi',
        reward: 5,
        goal: 1,
        current: todayDone ? 1 : 0,
        isClaimed: claimedSlugs.has(cleanSweepSlug),
        canClaim: todayDone && !claimedSlugs.has(cleanSweepSlug)
    };

    // 3. Weekly Commitment (3 promos for 5 days in last 7 days)
    // Anchor to Monday 5:00 AM UTC
    const getGamingWeekStart = () => {
        const d = new Date();
        const day = d.getUTCDay(); // 0: Sun, 1: Mon, ..., 6: Sat
        const diff = (day === 0 ? 6 : day - 1); // Days since last Monday

        const start = new Date(d);
        start.setUTCDate(d.getUTCDate() - diff);
        start.setUTCHours(5, 0, 0, 0);

        // If it's Monday but before 5 AM, go back 7 days
        if (d < start) {
            start.setUTCDate(start.getUTCDate() - 7);
        }
        return start;
    };

    const weekStart = getGamingWeekStart();
    const currentWeekPromos = allPromos.filter(p => {
        const pDate = new Date(p.date); // daily_promos.date is just a date string, so it represents the start of the day
        return pDate >= new Date(weekStart.toISOString().split('T')[0]);
    });

    const daysFullyCompleted = currentWeekPromos.filter(p => p.quiz_done && p.bet_done && p.boost_done).length;

    // Weekly slug changes every Monday 5 AM
    const weeklySlug = `weekly-commitment-${weekStart.getTime()}`;

    const weeklyMission: RewardMission = {
        slug: weeklySlug,
        title: 'Weekly Commitment',
        description: 'Completa tutte le missioni promo per 5 giorni questa settimana',
        reward: 25,
        goal: 5,
        current: daysFullyCompleted,
        isClaimed: claimedSlugs.has(weeklySlug),
        canClaim: daysFullyCompleted >= 5 && !claimedSlugs.has(weeklySlug)
    };

    // 4. Loyalty Milestone (100 total promo actions)
    const totalActions = allPromos.reduce((acc, p) => {
        return acc + (p.quiz_done ? 1 : 0) + (p.bet_done ? 1 : 0) + (p.boost_done ? 1 : 0);
    }, 0);

    const milestoneMission: RewardMission = {
        slug: 'loyalty-milestone-100',
        title: 'Loyalty Milestone',
        description: 'Raggiungi 100 azioni promozionali totali',
        reward: 100,
        goal: 100,
        current: totalActions,
        isClaimed: claimedSlugs.has('loyalty-milestone-100'),
        canClaim: totalActions >= 100 && !claimedSlugs.has('loyalty-milestone-100')
    };

    return {
        success: true,
        missions: [streakMission, cleanSweepMission, weeklyMission, milestoneMission]
    };
}

export async function claimRewardAction(slug: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };

    // 1. Verify if already claimed
    const { data: existing } = await supabase
        .from('claimed_rewards')
        .select('id')
        .eq('user_id', user.id)
        .eq('reward_slug', slug)
        .maybeSingle();

    if (existing) return { success: false, message: 'Premio già riscattato' };

    // 2. Re-verify eligibility (safety check)
    const state = await getRewardsStateAction();
    const mission = state.missions.find(m => m.slug === slug);

    if (!mission || !mission.canClaim) {
        return { success: false, message: 'Requisiti non soddisfatti' };
    }

    // 3. Award MusiCoins
    const { data: profile } = await supabase
        .from('profiles')
        .select('musi_coins')
        .eq('id', user.id)
        .single();

    if (!profile) return { success: false, message: 'Profilo non trovato' };

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ musi_coins: profile.musi_coins + mission.reward })
        .eq('id', user.id);

    if (updateError) throw updateError;

    // 4. Record claim
    await supabase
        .from('claimed_rewards')
        .insert({
            user_id: user.id,
            reward_slug: slug
        });

    revalidatePath('/dashboard');
    return { success: true, message: `Hai ricevuto ${mission.reward} MusiCoins!` };
}
