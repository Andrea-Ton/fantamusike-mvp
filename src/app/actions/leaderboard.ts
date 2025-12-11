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
    neighborhood: LeaderboardEntry[];
    totalCount: number;
    userRank: number | null;
};

export async function getLeaderboardAction(userId?: string): Promise<LeaderboardResponse> {
    const supabase = await createClient();

    try {
        // Fetch all profiles to sort by combined score in memory (MVP solution)
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_score, listen_score');

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return { podium: [], neighborhood: [], totalCount: 0, userRank: null };
        }

        if (!profiles) return { podium: [], neighborhood: [], totalCount: 0, userRank: null };

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
        const podium = rankedProfiles.slice(0, 3);
        let neighborhood: LeaderboardEntry[] = [];
        let userRank = null;

        if (userId) {
            const userIndex = rankedProfiles.findIndex(p => p.id === userId);
            if (userIndex !== -1) {
                userRank = rankedProfiles[userIndex].rank;
                // Get 10 above and 10 below
                const start = Math.max(3, userIndex - 10); // Start after podium (index 3) or 10 above
                const end = Math.min(totalCount, userIndex + 11); // 10 below

                // If the user is in the podium, we still might want to show the list starting from 4
                // But specifically the request is "10 above and 10 below". 
                // If user is #1, show #2-#11 (but #2, #3 are in podium). 
                // Typically podium is separate. Let's return the list starting from rank 4, 
                // but focused on the user if they are further down.

                let sliceStart = start;
                // Ensure we don't show podium members in the list if the user is high up, 
                // unless we want to duplicate? Usually podium is exclusive.
                if (sliceStart < 3) sliceStart = 3;

                neighborhood = rankedProfiles.slice(sliceStart, end);

                // If user is in podium (rank 1, 2, 3), show top 20 after podium
                if (userIndex < 3) {
                    neighborhood = rankedProfiles.slice(3, 23);
                }
            } else {
                // User not found (shouldn't happen), show top 20 after podium
                neighborhood = rankedProfiles.slice(3, 23);
            }
        } else {
            // No user logged in, show top 20 after podium
            neighborhood = rankedProfiles.slice(3, 23);
        }

        return {
            podium,
            neighborhood,
            totalCount,
            userRank
        };

    } catch (error) {
        console.error('Unexpected error fetching leaderboard:', error);
        return { podium: [], neighborhood: [], totalCount: 0, userRank: null };
    }
}

