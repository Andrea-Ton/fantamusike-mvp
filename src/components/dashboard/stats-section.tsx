
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import SyncButton from '@/components/dashboard/sync-button';
import { createClient } from '@/utils/supabase/server';
import { getWeeklyScoresAction } from '@/app/actions/dashboard';
import { UserTeamResponse } from '@/app/actions/team';

interface StatsSectionProps {
    userId: string;
    userTeamPromise: Promise<UserTeamResponse>;
    totalScore: number;
}

export default async function StatsSection({ userId, userTeamPromise, totalScore }: StatsSectionProps) {
    const supabase = await createClient();
    const userTeam = await userTeamPromise;

    // Check Spotify Connection
    const { count: spotifyTokensCount } = await supabase
        .from('spotify_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const hasSpotify = (spotifyTokensCount || 0) > 0;

    let weeklyTrend = 0;

    if (userTeam) {
        const artistIds = [
            userTeam.slot_1?.id,
            userTeam.slot_2?.id,
            userTeam.slot_3?.id,
            userTeam.slot_4?.id,
            userTeam.slot_5?.id
        ].filter(Boolean) as string[];

        const { scores } = await getWeeklyScoresAction(artistIds, userTeam.captain_id);

        weeklyTrend = artistIds.reduce((total, artistId) => {
            return total + (scores[artistId] || 0);
        }, 0);
    }

    // --- Listen to Win Trend ---
    // Fetch latest snapshot date
    const { data: latestSnapshot } = await supabase
        .from('weekly_snapshots')
        .select('created_at')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    const lastSnapshotDate = latestSnapshot?.created_at || new Date(0).toISOString();

    // Fetch Listen Points since last snapshot
    const { data: listenTrendData } = await supabase
        .from('listen_history')
        .select('points_awarded')
        .eq('user_id', userId)
        .gt('created_at', lastSnapshotDate);

    const listenTrend = listenTrendData?.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0) || 0;

    // Add Listen Trend to Total Weekly Trend
    weeklyTrend += listenTrend;

    return (
        <div className="w-full rounded-3xl bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-purple-200 text-sm font-medium mb-2">Punteggio Totale</p>
                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">{totalScore}</h2>
                    </div>
                    <SyncButton isConnected={hasSpotify} />
                </div>

                <div className="mt-8 flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Trend Settimanale</span>
                        <div className={`flex items-center gap-1 text-lg font-bold ${weeklyTrend > 0 ? 'text-green-300' : weeklyTrend < 0 ? 'text-red-300' : 'text-gray-300'}`}>
                            {weeklyTrend > 0 ? <TrendingUp size={18} /> : weeklyTrend < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                            {weeklyTrend > 0 ? '+' : ''}{weeklyTrend} pts
                        </div>
                    </div>
                </div>
            </div>
            {/* Decorative */}
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
            <div className="absolute bottom-0 right-0 opacity-20">
                <svg width="150" height="120" viewBox="0 0 100 80" fill="none">
                    <path d="M0 80 L40 40 L70 60 L100 10" stroke="white" strokeWidth="4" fill="none" />
                </svg>
            </div>
        </div>
    );
}
