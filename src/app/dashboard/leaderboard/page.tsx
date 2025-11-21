

import React from 'react';
import { Zap, LogOut, Crown } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { getLeaderboardAction } from '@/app/actions/leaderboard';
import { getCurrentSeasonAction } from '@/app/actions/season';
import LogoutButton from '@/components/logout-button';

export default async function LeaderboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch real leaderboard data (top 50)
    const leaderboard = await getLeaderboardAction(50);

    // Fetch Current Season
    const currentSeason = await getCurrentSeasonAction();
    const seasonName = currentSeason?.name || 'Season Zero';

    const topThree = leaderboard.slice(0, 3);
    const restOfLeaderboard = leaderboard.slice(3);

    // Helper to get initials
    const getInitials = (name: string) => name.substring(0, 1).toUpperCase();

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden pt-12 px-6 flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="FantaMusiké Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">FantaMusiké</h1>
                        <p className="text-xs text-gray-400">{seasonName}</p>
                    </div>
                </div>
                <LogoutButton />
            </div>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-24">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Classifica Globale</h1>
                        <p className="text-gray-400">Competi con i migliori manager d'Italia.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm font-bold text-green-500">Live Update</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Podium (Left/Top on Desktop) */}
                    <div className="lg:col-span-5 order-1 lg:order-1">
                        <div className="bg-[#1a1a24]/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 relative overflow-hidden shadow-2xl shadow-purple-500/10">
                            {/* Glassmorphic Glows */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-purple-500/20 blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none"></div>

                            <h3 className="text-center text-lg font-bold text-white mb-12 pb-12 relative z-10 flex items-center justify-center gap-2">
                                <Zap className="text-yellow-400 fill-yellow-400" size={20} />
                                Top 3 Managers
                            </h3>

                            <div className="flex items-end justify-center gap-2 sm:gap-4 relative z-10 pb-4">
                                {/* 2nd Place */}
                                {topThree[1] && (
                                    <div className="flex flex-col items-center group">
                                        <div className="relative mb-3 transition-transform duration-300 group-hover:-translate-y-2">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-b from-gray-300 to-gray-600 shadow-lg shadow-gray-500/20">
                                                <div className="w-full h-full rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center relative">
                                                    {topThree[1].avatar_url ? (
                                                        <Image src={topThree[1].avatar_url} alt={topThree[1].username || ''} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-gray-300">{getInitials(topThree[1].username || 'U')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-500 shadow-md">
                                                #2
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-white max-w-[80px] truncate text-center">{topThree[1].username}</span>
                                        <span className="text-xs text-gray-400 font-mono">{topThree[1].total_score}</span>
                                    </div>
                                )}

                                {/* 1st Place */}
                                {topThree[0] && (
                                    <div className="flex flex-col items-center -mt-8 z-20 group">
                                        <div className="relative mb-3 transition-transform duration-300 group-hover:-translate-y-2">
                                            <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400 animate-bounce" size={32} />
                                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-[3px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-500 shadow-xl shadow-yellow-500/30">
                                                <div className="w-full h-full rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center relative">
                                                    {topThree[0].avatar_url ? (
                                                        <Image src={topThree[0].avatar_url} alt={topThree[0].username || ''} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-3xl font-bold text-yellow-500">{getInitials(topThree[0].username || 'U')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-black px-4 py-0.5 rounded-full border-2 border-[#1a1a24] shadow-lg">
                                                #1
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-white max-w-[100px] truncate text-center mt-1">{topThree[0].username}</span>
                                        <span className="text-sm text-yellow-400 font-bold font-mono">{topThree[0].total_score} pts</span>
                                    </div>
                                )}

                                {/* 3rd Place */}
                                {topThree[2] && (
                                    <div className="flex flex-col items-center group">
                                        <div className="relative mb-3 transition-transform duration-300 group-hover:-translate-y-2">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-b from-amber-600 to-amber-800 shadow-lg shadow-amber-700/20">
                                                <div className="w-full h-full rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center relative">
                                                    {topThree[2].avatar_url ? (
                                                        <Image src={topThree[2].avatar_url} alt={topThree[2].username || ''} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-amber-600">{getInitials(topThree[2].username || 'U')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-900 text-amber-100 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-700 shadow-md">
                                                #3
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-white max-w-[80px] truncate text-center">{topThree[2].username}</span>
                                        <span className="text-xs text-gray-400 font-mono">{topThree[2].total_score}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ranking List (Right/Bottom on Desktop) */}
                    <div className="lg:col-span-7 order-2 lg:order-2">
                        <div className="bg-[#1a1a24]/80 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                            <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">
                                <div className="col-span-2 text-center">#</div>
                                <div className="col-span-7 md:col-span-7">Utente</div>
                                <div className="col-span-3 md:col-span-3 text-right">Punteggio</div>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                {restOfLeaderboard.length > 0 ? (
                                    restOfLeaderboard.map((entry) => {
                                        const isCurrentUser = entry.id === user?.id;
                                        return (
                                            <div
                                                key={entry.id}
                                                className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors ${isCurrentUser ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''
                                                    }`}
                                            >
                                                <div className="col-span-2 text-center font-mono text-gray-500 font-bold">{entry.rank}</div>
                                                <div className="col-span-7 md:col-span-7 flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden ${isCurrentUser ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                                        {entry.avatar_url ? (
                                                            <div className="relative w-full h-full">
                                                                <Image src={entry.avatar_url} alt={entry.username || ''} fill className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            getInitials(entry.username || 'U')
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm truncate ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                                                            {entry.username}
                                                        </span>
                                                        {isCurrentUser && <span className="text-[10px] text-gray-500 uppercase">Tu</span>}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 md:col-span-3 text-right font-mono font-bold text-white">
                                                    {entry.total_score}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        Nessun altro utente in classifica.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
