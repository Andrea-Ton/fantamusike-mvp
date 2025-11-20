'use client';

import React from 'react';
import { Zap, LogOut } from 'lucide-react';
import Image from 'next/image';

// --- Mock Data ---
const RANKING = [
    { rank: 1, user: 'MusicGod_99', score: 1450, avatar: 'bg-pink-500' },
    { rank: 2, user: 'TrapperKeeper', score: 1320, avatar: 'bg-purple-500' },
    { rank: 3, user: 'IndieLover', score: 1280, avatar: 'bg-blue-500' },
    { rank: 4, user: 'PopStar', score: 1200, avatar: 'bg-green-500' },
    { rank: 5, user: 'RockFan', score: 1150, avatar: 'bg-red-500' },
    { rank: 6, user: 'JazzCat', score: 1100, avatar: 'bg-yellow-500' },
    { rank: 42, user: 'Tu (You)', score: 850, avatar: 'bg-gradient-to-br from-purple-600 to-blue-500' },
];

export default function LeaderboardPage() {
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
                        <p className="text-xs text-gray-400">Season Zero</p>
                    </div>
                </div>
                <button><LogOut className="text-gray-400" size={22} /></button>
            </div>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
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

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Podium (Left/Top) */}
                    <div className="lg:w-1/3">
                        <div className="bg-[#1a1a24] rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none"></div>

                            <h3 className="text-center text-lg font-bold text-white mb-8 relative z-10">Top 3 della Settimana</h3>

                            <div className="flex items-end justify-center gap-4 relative z-10">
                                {/* 2nd */}
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-500 p-1 relative mb-2">
                                        <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                                            <span className="text-xl font-bold text-white">2</span>
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-600">2</div>
                                    </div>
                                    <span className="text-sm font-bold text-white">{RANKING[1].user}</span>
                                    <span className="text-xs text-gray-400">{RANKING[1].score} pts</span>
                                </div>
                                {/* 1st */}
                                <div className="flex flex-col items-center -mt-8">
                                    <Zap className="text-yellow-400 fill-yellow-400 mb-2 animate-bounce" size={28} />
                                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1 shadow-lg shadow-orange-500/30 relative mb-2">
                                        <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">1</span>
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-sm font-black px-3 py-0.5 rounded-full border-2 border-[#1a1a24]">1</div>
                                    </div>
                                    <span className="text-lg font-bold text-white">{RANKING[0].user}</span>
                                    <span className="text-sm text-yellow-500 font-bold">{RANKING[0].score} pts</span>
                                </div>
                                {/* 3rd */}
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 p-1 relative mb-2">
                                        <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                                            <span className="text-xl font-bold text-white">3</span>
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-600">3</div>
                                    </div>
                                    <span className="text-sm font-bold text-white">{RANKING[2].user}</span>
                                    <span className="text-xs text-gray-400">{RANKING[2].score} pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ranking List (Right/Bottom) */}
                    <div className="lg:w-2/3">
                        <div className="bg-[#1a1a24] rounded-3xl border border-white/5 overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5">
                                <div className="col-span-2 text-center">#</div>
                                <div className="col-span-7 md:col-span-7">Utente</div>
                                <div className="col-span-3 md:col-span-3 text-right">Punteggio</div>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto">
                                {RANKING.slice(3).map((user, i) => (
                                    <div key={i} className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors ${user.rank === 42 ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''}`}>
                                        <div className="col-span-2 text-center font-mono text-gray-500">{user.rank}</div>
                                        <div className="col-span-7 md:col-span-7 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full ${user.avatar} flex items-center justify-center text-xs font-bold text-white`}>
                                                {user.user.substring(0, 1)}
                                            </div>
                                            <span className={`font-bold text-sm ${user.rank === 42 ? 'text-purple-400' : 'text-white'}`}>{user.user}</span>
                                        </div>
                                        <div className="col-span-3 md:col-span-3 text-right font-mono font-bold text-white">{user.score}</div>
                                    </div>
                                ))}
                                {/* Fillers for scrolling */}
                                {[43, 44, 45, 46, 47, 48].map((rank) => (
                                    <div key={rank} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <div className="col-span-2 text-center font-mono text-gray-600">{rank}</div>
                                        <div className="col-span-7 md:col-span-7 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">U</div>
                                            <span className="font-medium text-sm text-gray-500">User_{rank}</span>
                                        </div>
                                        <div className="col-span-3 md:col-span-3 text-right font-mono font-medium text-gray-600">{800 - (rank * 5)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
