'use server';

import { createClient } from '@/utils/supabase/server';

export type LeaderboardEntry = {
    id: string;
    username: string | null;
    avatar_url: string | null;
    total_score: number;
    rank: number;
};

export async function getLeaderboardAction(limit: number = 10): Promise<LeaderboardEntry[]> {
    const supabase = await createClient();

    try {
        // Fetch all profiles to sort by combined score in memory (MVP solution)
        // For larger scale, use a Postgres Computed Column or View.
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_score, listen_score');

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        if (!profiles) return [];

        // Calculate combined score and sort
        const rankedProfiles = profiles
            .map(p => ({
                ...p,
                effective_score: (p.total_score || 0) + (p.listen_score || 0)
            }))
            .sort((a, b) => b.effective_score - a.effective_score)
            .slice(0, limit);

        // Add rank
        return rankedProfiles.map((profile, index) => ({
            id: profile.id,
            username: profile.username || 'Unknown User',
            avatar_url: profile.avatar_url,
            total_score: profile.effective_score, // We return the combined score as 'total_score' for the UI
            rank: index + 1
        }));

    } catch (error) {
        console.error('Unexpected error fetching leaderboard:', error);
        return [];
    }
}
