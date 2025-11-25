import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { LeaderboardEntry } from '@/app/actions/leaderboard';

interface LeaderboardCardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
}

export default function LeaderboardCard({ entries, currentUserId }: LeaderboardCardProps) {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown size={18} className="text-yellow-400 fill-yellow-400/20" />;
            case 2: return <Medal size={18} className="text-gray-300" />;
            case 3: return <Medal size={18} className="text-amber-600" />;
            default: return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
        }
    };

    return (
        <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-[400px] lg:h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Trophy size={20} className="text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Top Managers</h3>
                </div>
                <button className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    Vedi Tutti
                </button>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {entries.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                        Ancora nessuna classifica disponibile.
                    </div>
                ) : (
                    entries.map((entry) => {
                        const isCurrentUser = entry.id === currentUserId;
                        return (
                            <div
                                key={entry.id}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${isCurrentUser
                                    ? 'bg-purple-500/20 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 flex justify-center">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${isCurrentUser ? 'text-white' : 'text-gray-200'}`}>
                                            {entry.username}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">Tu</span>
                                        )}
                                    </div>
                                </div>
                                <div className="font-mono font-bold text-white">
                                    {entry.total_score} <span className="text-xs text-gray-500 font-normal">pts</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
