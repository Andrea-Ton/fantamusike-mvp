import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { LeaderboardEntry } from '@/app/actions/leaderboard';
import Link from 'next/link';

interface LeaderboardCardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
}

export default function LeaderboardCard({ entries, currentUserId }: LeaderboardCardProps) {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown size={16} className="text-yellow-400 fill-yellow-400/20" />;
            case 2: return <Medal size={16} className="text-gray-400" />;
            case 3: return <Medal size={16} className="text-amber-700" />;
            default: return <span className="text-[10px] font-black text-gray-600 italic">#{rank}</span>;
        }
    };

    return (
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col h-[400px] lg:h-full relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors duration-700"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 shadow-inner">
                        <Trophy size={18} className="text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.1em]">Top Managers</h3>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Classifica Mondiale</p>
                    </div>
                </div>
                <Link href="/dashboard/leaderboard" className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-all bg-purple-500/5 px-3 py-1.5 rounded-lg border border-purple-500/10 hover:bg-purple-500/10">
                    Vedi Tutti
                </Link>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {entries.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                        Ancora nessuna classifica disponibile.
                    </div>
                ) : (
                    entries.map((entry, index) => {
                        const isCurrentUser = entry.id === currentUserId;
                        const prevEntry = entries[index - 1];
                        const showSeparator = prevEntry && (entry.rank - prevEntry.rank > 1);

                        return (
                            <React.Fragment key={entry.id}>
                                {showSeparator && (
                                    <div className="flex justify-center py-2 gap-1 opacity-30">
                                        <div className="h-1 w-1 bg-white rounded-full"></div>
                                        <div className="h-1 w-1 bg-white rounded-full"></div>
                                        <div className="h-1 w-1 bg-white rounded-full"></div>
                                    </div>
                                )}
                                <div
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all relative overflow-hidden border ${isCurrentUser
                                        ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    {isCurrentUser && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 flex justify-center">
                                            {getRankIcon(entry.rank)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black tracking-tight ${isCurrentUser ? 'text-white' : 'text-gray-400'}`}>
                                                {entry.username || 'Utente'}
                                            </span>
                                            {isCurrentUser && (
                                                <span className="text-[8px] text-purple-400 uppercase tracking-widest font-black mt-0.5">La tua posizione</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm font-black italic uppercase text-white tracking-tighter">
                                        {entry.total_score} <span className="text-[9px] text-gray-500 not-italic font-bold ml-0.5">PTS</span>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </div>
    );
}
