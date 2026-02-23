'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserTeamAction, UserTeamResponse } from './team';

export type WeeklyRecap = {
    id: string;
    week_number: number;
    rank: number;
    score: number;
    reward_musicoins: number;
    team?: UserTeamResponse;
    percentile?: string;
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

export type HallOfFameEntry = {
    id: string;
    username: string;
    avatar_url: string;
    wins_count: number;
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

    // Enhance recap with historical team data
    const team = await getUserTeamAction(data.week_number);

    // Calculate percentile for THAT specific week
    let percentile = undefined;
    const { count: totalParticipants } = await supabase
        .from('weekly_leaderboard_history')
        .select('*', { count: 'exact', head: true })
        .eq('week_number', data.week_number);

    if (totalParticipants && totalParticipants > 1) {
        const topPercentage = Math.max(1, Math.ceil((data.rank / totalParticipants) * 100));
        if (topPercentage <= 50) {
            percentile = `${topPercentage}%`;
        }
    }

    return {
        ...(data as WeeklyRecap),
        team: team || undefined,
        percentile: percentile
    };
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
        .select('id, username, avatar_url, total_score, listen_score, combined_score, rank')
        .order('rank', { ascending: true })
        .limit(3);

    const podium = podiumData || [];

    // 3. Fetch Paginated Entries
    const from = (page - 1) * pageSize;
    const { data: entriesData } = await supabase
        .from('leaderboard_view')
        .select('id, username, avatar_url, total_score, listen_score, combined_score, rank')
        .order('rank', { ascending: true })
        .range(from, from + pageSize - 1);

    const entries = entriesData || [];

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
            .select('rank')
            .eq('id', userId)
            .maybeSingle();

        if (userEntry) {
            userRank = userEntry.rank;
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

export async function getHallOfFameAction(): Promise<HallOfFameEntry[]> {
    const supabase = await createClient();

    // Fetch users who achieved rank 1 at least once
    // We group by user_id to count how many times they reached 1st place
    const { data, error } = await supabase
        .from('weekly_leaderboard_history')
        .select(`
            user_id,
            profiles:user_id (
                username,
                avatar_url
            )
        `)
        .eq('rank', 1);

    if (error || !data) {
        console.error('Error fetching Hall of Fame:', error);
        return [];
    }

    // Count wins per user
    const winsMap: Record<string, { username: string; avatar_url: string; wins_count: number }> = {};

    data.forEach((entry: any) => {
        const userId = entry.user_id;
        const profile = entry.profiles;
        if (!winsMap[userId]) {
            winsMap[userId] = {
                username: profile?.username || 'Unknown',
                avatar_url: profile?.avatar_url || '',
                wins_count: 0
            };
        }
        winsMap[userId].wins_count += 1;
    });

    const winners = Object.entries(winsMap).map(([id, info]) => ({
        id,
        ...info
    }));

    // Sort by wins_count DESC
    return winners.sort((a, b) => b.wins_count - a.wins_count);
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
