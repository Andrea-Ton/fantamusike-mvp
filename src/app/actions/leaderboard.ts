'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type LeaderboardConfig = {
    tier: string;
    reward_musicoins: number;
    label: string;
};

export type WeeklyRecap = {
    id: string;
    week_number: number;
    rank: number;
    score: number;
    reward_musicoins: number;
};

export type LeaderboardEntry = {
    id: string;
    username: string;
    avatar_url: string;
    total_score: number;
    listen_score: number;
    combined_score: number;
    rank: number;
};

export type LeaderboardResponse = {
    podium: LeaderboardEntry[];
    entries: LeaderboardEntry[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    currentWeek: number;
    userRank?: number;
};

/**
 * NEW: Weekly Recap Actions
 */
// ... (omitting lines for brevity in instruction, will apply to correct range)
export async function getLeaderboardConfigAction(): Promise<LeaderboardConfig[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('leaderboard_config')
        .select('*');

    if (error) {
        console.error('Error fetching leaderboard config:', error);
        return [];
    }

    return data as LeaderboardConfig[];
}

export async function updateLeaderboardConfigAction(tier: string, reward: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    const { error } = await supabase
        .from('leaderboard_config')
        .update({ reward_musicoins: reward })
        .eq('tier', tier);

    if (error) return { success: false, message: 'Failed to update config' };
    revalidatePath('/admin/leaderboard');
    return { success: true, message: 'Config updated successfully' };
}

export async function getUnseenWeeklyRecapAction(): Promise<WeeklyRecap | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('weekly_leaderboard_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_seen', false)
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;
    return data as WeeklyRecap;
}

export async function markWeeklyRecapSeenAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase
        .from('weekly_leaderboard_history')
        .update({ is_seen: true })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { success: false };
    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * RESTORED: Ranking Actions
 */
export async function getLeaderboardAction(userId?: string, page: number = 1): Promise<LeaderboardResponse> {
    const supabase = await createClient();
    const pageSize = 10;

    // 1. Fetch Total Count
    const { count } = await supabase
        .from('leaderboard_view')
        .select('*', { count: 'exact', head: true });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. Fetch Podium (Top 3)
    const { data: podiumData } = await supabase
        .from('leaderboard_view')
        .select('id, username, avatar_url, total_score, listen_score, combined_score')
        .order('combined_score', { ascending: false })
        .order('listen_score', { ascending: false })
        .limit(3);

    const podium = (podiumData || []).map((p, i) => ({ ...p, rank: i + 1 }));

    // 3. Fetch Paginated Entries
    const from = (page - 1) * pageSize;
    const { data: entriesData } = await supabase
        .from('leaderboard_view')
        .select('id, username, avatar_url, total_score, listen_score, combined_score')
        .order('combined_score', { ascending: false })
        .order('listen_score', { ascending: false })
        .range(from, from + pageSize - 1);

    const entries = (entriesData || []).map((e, i) => ({ ...e, rank: from + i + 1 }));

    // NEW: Fetch current game week
    const { data: latestSnap } = await supabase
        .from('weekly_snapshots')
        .select('week_number')
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    const currentWeek = Number(latestSnap?.week_number || 1);

    // Find user rank if userId is provided
    let userRank = undefined;
    if (userId) {
        const { data: userEntry } = await supabase
            .from('leaderboard_view')
            .select('id, combined_score')
            .eq('id', userId)
            .maybeSingle();

        if (userEntry) {
            const { count: rankCount } = await supabase
                .from('leaderboard_view')
                .select('*', { count: 'exact', head: true })
                .gt('combined_score', userEntry.combined_score);

            userRank = (rankCount || 0) + 1;
        }
    }

    return {
        podium: podium as LeaderboardEntry[],
        entries: entries as LeaderboardEntry[],
        totalCount,
        currentPage: page,
        totalPages,
        currentWeek,
        userRank
    };
}

export async function triggerWeeklyLeaderboardAction() {
    return await triggerEdgeFunction('process-weekly-leaderboard');
}

export async function triggerDailyScoringAction() {
    return await triggerEdgeFunction('calculate-daily-scores');
}

export async function triggerWeeklySnapshotAction() {
    return await triggerEdgeFunction('perform-weekly-snapshot');
}

async function triggerEdgeFunction(functionName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (response.ok) {
            revalidatePath('/dashboard');
            revalidatePath('/admin/leaderboard');
            return { success: true, message: data.message || 'Success' };
        } else {
            return { success: false, message: data.error || 'Failed to process' };
        }
    } catch (err) {
        console.error(`Trigger Error (${functionName}):`, err);
        return { success: false, message: 'Network error calling Edge Function' };
    }
}
