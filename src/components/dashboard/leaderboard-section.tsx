
import React from 'react';
import LeaderboardCard from '@/components/dashboard/leaderboard-card';
import { getLeaderboardAction } from '@/app/actions/leaderboard';

interface LeaderboardSectionProps {
    userId: string;
    isMobile?: boolean;
}

export default async function LeaderboardSection({ userId, isMobile = false }: LeaderboardSectionProps) {
    const { podium, entries } = await getLeaderboardAction(userId);

    // Filter out podium members from entries to avoid duplicates (especially on Page 1)
    const filteredEntries = entries.filter(entry => !podium.some(p => p.id === entry.id));
    const leaderboardEntries = [...podium, ...filteredEntries];

    if (isMobile) {
        return (
            <div className="lg:hidden h-[400px]">
                <LeaderboardCard entries={leaderboardEntries} currentUserId={userId} />
            </div>
        );
    }

    return (
        <div className="hidden lg:block h-[400px]">
            <LeaderboardCard entries={leaderboardEntries} currentUserId={userId} />
        </div>
    );
}
