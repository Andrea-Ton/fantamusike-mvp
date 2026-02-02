'use server';

import { createClient } from '@/utils/supabase/server';


export type LeaderboardEntry = {
    id: string;
    username: string | null;
    avatar_url: string | null;
    total_score: number;
    rank: number;
};

export type LeaderboardResponse = {
    podium: LeaderboardEntry[];
    entries: LeaderboardEntry[];
    totalCount: number;
    userRank: number | null;
    totalPages: number;
    currentPage: number;
};

export async function getLeaderboardAction(userId?: string, requestedPage?: number, pageSize: number = 20): Promise<LeaderboardResponse> {
    const supabase = await createClient();

    try {
        // Fetch all profiles to sort by combined score in memory (MVP solution)
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_score, listen_score');

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return { podium: [], entries: [], totalCount: 0, userRank: null, totalPages: 0, currentPage: 1 };
        }

        if (!profiles) return { podium: [], entries: [], totalCount: 0, userRank: null, totalPages: 0, currentPage: 1 };

        // Calculate combined score and sort
        const rankedProfiles = profiles
            .map(p => ({
                id: p.id,
                username: p.username || 'Unknown User',
                avatar_url: p.avatar_url,
                total_score: (p.total_score || 0) + (p.listen_score || 0),
            }))
            .sort((a, b) => b.total_score - a.total_score)
            .map((p, index) => ({
                ...p,
                rank: index + 1
            }));

        const totalCount = rankedProfiles.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const podium = rankedProfiles.slice(0, 3);

        let userRank = null;
        let userPage = 1;

        if (userId) {
            const userIndex = rankedProfiles.findIndex(p => p.id === userId);
            if (userIndex !== -1) {
                userRank = rankedProfiles[userIndex].rank;
                userPage = Math.ceil(userRank / pageSize);
            }
        }

        // Determine which page to show
        let currentPage = requestedPage || userPage;
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Slice data for the current page
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const entries = rankedProfiles.slice(start, end);

        return {
            podium,
            entries,
            totalCount,
            userRank,
            totalPages,
            currentPage
        };

    } catch (error) {
        console.error('Unexpected error fetching leaderboard:', error);
        return { podium: [], entries: [], totalCount: 0, userRank: null, totalPages: 0, currentPage: 1 };
    }
}

