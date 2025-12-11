

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

    // Fetch real leaderboard data
    const leaderboardData = await getLeaderboardAction(user?.id);

    // Fetch Current Season
    const currentSeason = await getCurrentSeasonAction();
    const seasonName = currentSeason?.name || 'Season Zero';

    const topThree = leaderboardData.podium;
    const restOfLeaderboard = leaderboardData.neighborhood;

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

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-5">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Classifica Globale</h1>
                        <p className="text-gray-400">Competi con i migliori manager d'Italia.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
                        <span className="text-sm font-bold text-purple-400">Managers: {leaderboardData.totalCount}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">


                    {/* Podium (Left/Top on Desktop) */}
                    <div className="lg:col-span-5 order-1 lg:order-1 flex flex-col">
                        <div className="bg-[#1a1a24]/60 backdrop-blur-xl rounded-3xl p-5 border border-white/10 relative overflow-hidden shadow-2xl shadow-purple-500/10">
                            {/* Glassmorphic Glows */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-purple-500/20 blur-[50px] pointer-events-none"></div>

                            <div className="relative z-10 mb-12 text-center">
                                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                                    Podio
                                </h3>
                            </div>

                            <div className="flex items-end justify-center gap-2 relative z-10 pb-2 flex-1">
                                {/* 2nd Place (Left) */}
                                {topThree[1] && (
                                    <div className="flex flex-col items-center group w-1/3">
                                        <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                                            <div className="relative">
                                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-b from-gray-300 to-gray-600 shadow-lg shadow-gray-500/20 z-20 relative">
                                                    <div className="w-full h-full rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center relative">
                                                        {topThree[1].avatar_url ? (
                                                            <Image src={topThree[1].avatar_url} alt={topThree[1].username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-lg font-bold text-gray-300">{getInitials(topThree[1].username || 'U')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-500 z-30 shadow-md">
                                                    #2
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center w-full bg-gradient-to-t from-gray-500/10 to-gray-500/5 backdrop-blur-sm rounded-t-lg pt-3 pb-2 border-t border-l border-r border-white/5 h-24 w-full group-hover:bg-white/5 transition-colors">
                                            <span className="text-xs font-bold text-white truncate max-w-[90%] text-center">{topThree[1].username}</span>
                                            <span className="text-[9px] text-gray-400 font-mono mt-0.5">{topThree[1].total_score}</span>
                                        </div>
                                    </div>
                                )}

                                {/* 1st Place (Center) */}
                                {topThree[0] && (
                                    <div className="flex flex-col items-center z-20 w-1/3 -mx-1 group">
                                        <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-2">
                                            <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" size={24} />
                                            <div className="relative">
                                                <div className="w-18 h-18 md:w-22 md:h-22 rounded-full p-[3px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-500 shadow-2xl shadow-yellow-500/30 ring-4 ring-yellow-500/10 z-20 relative">
                                                    <div className="w-full h-full rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center relative">
                                                        {topThree[0].avatar_url ? (
                                                            <Image src={topThree[0].avatar_url} alt={topThree[0].username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-2xl font-bold text-yellow-500">{getInitials(topThree[0].username || 'U')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#1a1a24] z-30 shadow-lg">
                                                    #1
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center w-full bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 backdrop-blur-md rounded-t-xl pt-4 pb-2 border-t border-l border-r border-yellow-500/20 h-32 w-full shadow-[0_-4px_20px_-4px_rgba(234,179,8,0.1)] group-hover:bg-white/5 transition-colors">
                                            <span className="text-sm font-bold text-white truncate max-w-[90%] text-center">{topThree[0].username}</span>
                                            <span className="text-[10px] text-yellow-500 font-bold font-mono mt-0.5">{topThree[0].total_score} pts</span>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Place (Right) */}
                                {topThree[2] && (
                                    <div className="flex flex-col items-center group w-1/3">
                                        <div className="relative mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                                            <div className="relative">
                                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-b from-amber-600 to-amber-800 shadow-lg shadow-amber-700/20 z-20 relative">
                                                    <div className="w-full h-full rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center relative">
                                                        {topThree[2].avatar_url ? (
                                                            <Image src={topThree[2].avatar_url} alt={topThree[2].username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-lg font-bold text-amber-600">{getInitials(topThree[2].username || 'U')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-900 text-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-700 z-30 shadow-md">
                                                    #3
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center w-full bg-gradient-to-t from-amber-700/10 to-amber-700/5 backdrop-blur-sm rounded-t-lg pt-3 pb-2 border-t border-l border-r border-white/5 h-16 w-full group-hover:bg-white/5 transition-colors">
                                            <span className="text-xs font-bold text-white truncate max-w-[90%] text-center">{topThree[2].username}</span>
                                            <span className="text-[9px] text-gray-400 font-mono mt-0.5">{topThree[2].total_score}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ranking List (Right/Bottom on Desktop) */}
                    <div className="lg:col-span-7 order-2 lg:order-2">
                        <div className="bg-[#1a1a24]/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-xl h-full flex flex-col">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-white">Classifica</h3>
                                <LogOut className="text-gray-500 w-4 h-4 opacity-0" /> {/* Spacer */}
                            </div>
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <div className="col-span-2 text-center">#</div>
                                <div className="col-span-7">Manager</div>
                                <div className="col-span-3 text-right">Pts</div>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                                {restOfLeaderboard.length > 0 ? (
                                    restOfLeaderboard.map((entry) => {
                                        const isCurrentUser = entry.id === user?.id;
                                        return (
                                            <div
                                                key={entry.id}
                                                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors ${isCurrentUser ? 'bg-purple-500/10 border-l-4 border-l-purple-500 pl-[20px]' : ''
                                                    }`}
                                            >
                                                <div className="col-span-2 text-center font-mono text-gray-500 font-bold">{entry.rank}</div>
                                                <div className="col-span-7 flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden ${isCurrentUser ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                                        {entry.avatar_url ? (
                                                            <div className="relative w-full h-full">
                                                                <Image src={entry.avatar_url} alt={entry.username || ''} fill className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            getInitials(entry.username || 'U')
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`font-bold text-sm truncate ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                                                            {entry.username}
                                                        </span>
                                                        {isCurrentUser && <span className="text-[10px] text-gray-500 uppercase">Tu</span>}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 text-right font-mono font-bold text-white">
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
