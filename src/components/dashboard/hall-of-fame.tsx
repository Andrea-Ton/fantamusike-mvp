import React from 'react';
import { Crown, Trophy, Medal, Star } from 'lucide-react';
import Image from 'next/image';
import { HallOfFameEntry } from '@/app/actions/leaderboard';

interface HallOfFameProps {
    winners: HallOfFameEntry[];
}

export default function HallOfFame({ winners }: HallOfFameProps) {
    if (winners.length === 0) {
        return (
            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-12 text-center backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6 border border-yellow-500/20">
                    <Trophy className="text-yellow-600/40" size={32} />
                </div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Ancora nessun Campione</h3>
                <p className="text-gray-500 font-medium max-w-xs">Sii il primo ad entrare nella Hall of Fame vincendo la prossima settimana!</p>
            </div>
        );
    }

    const getInitials = (name: string) => name.substring(0, 1).toUpperCase();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-3xl shadow-2xl group/hof">
                {/* Animated Background Accents - Golden Theme */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-500/10 blur-[100px] rounded-full group-hover/hof:bg-yellow-500/20 transition-colors duration-1000" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full group-hover/hof:bg-orange-500/20 transition-colors duration-1000" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 shadow-lg shadow-yellow-500/20">
                            <Crown className="text-black" size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Hall of Fame</h2>
                            <p className="text-yellow-500/60 text-[10px] font-black uppercase tracking-widest mt-1">Leggende di FantaMusiké</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {winners.map((winner, index) => (
                            <div key={winner.id} className="relative group/winner">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-[2rem] blur-xl opacity-0 group-hover/winner:opacity-100 transition-opacity duration-500" />
                                <div className="relative p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:border-yellow-500/30 transition-all duration-300 flex items-center gap-5 overflow-hidden backdrop-blur-sm">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 shadow-xl group-hover/winner:scale-105 transition-transform duration-500">
                                            <div className="w-full h-full rounded-[0.9rem] bg-[#0a0a0f] overflow-hidden flex items-center justify-center relative">
                                                {winner.avatar_url ? (
                                                    <Image src={winner.avatar_url} alt={winner.username} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-2xl font-black text-yellow-500">{getInitials(winner.username)}</span>
                                                )}
                                            </div>
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute -top-2 -left-2 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg rotate-[-12deg] z-20">
                                                KING
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-lg font-black text-white italic tracking-tighter truncate leading-tight group-hover:text-yellow-400 transition-colors pr-2">
                                            {winner.username}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Trophy size={12} className="text-yellow-500" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {winner.wins_count} {winner.wins_count === 1 ? 'Vittoria' : 'Vittorie'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Background Star pattern for extra flair */}
                                    <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Star size={40} className="text-yellow-500 fill-yellow-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
