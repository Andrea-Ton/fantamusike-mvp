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
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_score')
            .order('total_score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        if (!profiles) return [];

        // Add rank to each entry
        return profiles.map((profile, index) => ({
            id: profile.id,
            username: profile.username || 'Unknown User',
            avatar_url: profile.avatar_url,
            total_score: profile.total_score || 0,
            rank: index + 1
        }));

    } catch (error) {
        console.error('Unexpected error fetching leaderboard:', error);
        return [];
    }
}
