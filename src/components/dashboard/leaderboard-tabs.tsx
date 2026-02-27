'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Crown, Medal, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import HallOfFame from '@/components/dashboard/hall-of-fame';

interface Entry {
    id: string;
    username: string | null;
    avatar_url: string | null;
    combined_score: number;
    rank: number;
}

interface LeaderboardData {
    entries: Entry[];
    podium: Entry[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    currentWeek: number | null;
}

interface LeaderboardTabsProps {
    initialTab: 'weekly' | 'hof';
    leaderboardData: LeaderboardData;
    hofWinners: any[];
    userId?: string;
}

export default function LeaderboardTabs({
    initialTab,
    leaderboardData,
    hofWinners,
    userId
}: LeaderboardTabsProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'weekly' | 'hof'>(initialTab);

    // Sync state if URL changes externally
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleTabChange = (tab: 'weekly' | 'hof') => {
        if (activeTab === tab) return;
        // Optimistic update
        setActiveTab(tab);
        // Background URL update
        router.push(`/dashboard/leaderboard?tab=${tab}`, { scroll: false });
    };

    const topThree = leaderboardData.podium;
    const entries = leaderboardData.entries;

    const getInitials = (name: string) => name.substring(0, 1).toUpperCase();

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown size={18} className="text-yellow-400 fill-yellow-400/20" />;
            case 2: return <Medal size={18} className="text-gray-400" />;
            case 3: return <Medal size={18} className="text-amber-700" />;
            default: return <span className="text-sm font-black italic text-gray-600">#{rank}</span>;
        }
    };

    return (
        <>
            {/* Tab Switcher */}
            <div className="flex bg-white/[0.03] border border-white/10 p-1.5 rounded-2xl mb-8 w-fit backdrop-blur-xl">
                <button
                    onClick={() => handleTabChange('weekly')}
                    className={`px-6 py-2.5 rounded-xl font-black italic uppercase tracking-tighter text-sm transition-all focus:outline-none ${activeTab === 'weekly' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    Classifica Settimanale
                </button>
                <button
                    onClick={() => handleTabChange('hof')}
                    className={`px-6 py-2.5 rounded-xl font-black italic uppercase tracking-tighter text-sm transition-all flex items-center gap-2 focus:outline-none ${activeTab === 'hof' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    <Crown size={14} className={activeTab === 'hof' ? 'fill-black/20' : ''} />
                    Hall of Fame
                </button>
            </div>

            {activeTab === 'hof' ? (
                <HallOfFame winners={hofWinners} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Podium Section */}
                    <div className="lg:col-span-5 order-1 lg:order-1 flex flex-col">
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-3xl shadow-2xl group/podium">
                            {/* Animated Background Accents */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full group-hover/podium:bg-purple-500/20 transition-colors duration-1000" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover/podium:bg-blue-500/20 transition-colors duration-1000" />

                            <div className="relative z-10 space-y-8">
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                        <Crown size={12} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Podio</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Top Managers</h2>
                                </div>

                                <div className="flex items-end justify-center gap-1 sm:gap-4 relative pt-12 pb-2">
                                    {/* 2nd Place */}
                                    {topThree[1] && (
                                        <div className="flex flex-col items-center flex-1 min-w-0 group/p2">
                                            <div className="relative mb-6">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[1px] bg-gradient-to-b from-slate-300 to-slate-500 shadow-xl group-hover/p2:scale-105 transition-transform duration-500">
                                                    <div className="w-full h-full rounded-2xl bg-[#0a0a0f] overflow-hidden flex items-center justify-center relative">
                                                        {topThree[1].avatar_url ? (
                                                            <Image src={topThree[1].avatar_url} alt={topThree[1].username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-black text-slate-300">{getInitials(topThree[1].username || 'U')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-slate-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-[#050507] shadow-lg">
                                                    #2
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/[0.03] border border-white/5 rounded-t-2xl pt-6 pb-4 px-2 text-center relative overflow-hidden h-28">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-500/50" />
                                                <div className="marquee-container w-full mb-1">
                                                    <span className="block text-xs font-black text-white italic tracking-tighter group-hover/p2:animate-marquee">{topThree[1].username}</span>
                                                </div>
                                                <span className="block text-sm font-black text-slate-400 italic uppercase tracking-tighter">{topThree[1].combined_score} <span className="text-[8px] not-italic opacity-50">Pts</span></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 1st Place */}
                                    {topThree[0] && (
                                        <div className="flex flex-col items-center flex-1 min-w-0 z-20 group/p1">
                                            <div className="relative mb-8">
                                                <Crown size={28} className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] p-[2px] bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-500 shadow-[0_0_50px_-12px_rgba(234,179,8,0.5)] group-hover/p1:scale-110 transition-transform duration-500">
                                                    <div className="w-full h-full rounded-[1.4rem] bg-[#0a0a0f] overflow-hidden flex items-center justify-center relative">
                                                        {topThree[0].avatar_url ? (
                                                            <Image src={topThree[0].avatar_url} alt={topThree[0].username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-3xl font-black text-yellow-500">{getInitials(topThree[0].username || 'U')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[12px] font-black px-3 py-1 rounded-xl border-2 border-[#050507] shadow-xl">
                                                    #1
                                                </div>
                                            </div>
                                            <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-t-3xl pt-8 pb-6 px-2 text-center relative overflow-hidden h-40 shadow-2xl">
                                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 to-orange-500" />
                                                <div className="marquee-container w-full mb-2">
                                                    <span className="block text-sm font-black text-white italic tracking-tighter group-hover/p1:animate-marquee">{topThree[0].username}</span>
                                                </div>
                                                <span className="block text-sm font-black text-yellow-500 italic uppercase tracking-tighter">{topThree[0].combined_score} <span className="text-[8px] not-italic opacity-50">Pts</span></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3rd Place */}
                                    {topThree[2] && (
                                        <div className="flex flex-col items-center flex-1 min-w-0 group/p3">
                                            <div className="relative mb-6">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[1px] bg-gradient-to-b from-amber-600 to-amber-800 shadow-xl group-hover/p3:scale-105 transition-transform duration-500">
                                                    <div className="w-full h-full rounded-2xl bg-[#0a0a0f] overflow-hidden flex items-center justify-center relative">
                                                        {topThree[2].avatar_url ? (
                                                            <Image src={topThree[2].avatar_url} alt={topThree[2].username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-black text-amber-600">{getInitials(topThree[2].username || 'U')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-[#050507] shadow-lg">
                                                    #3
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/[0.03] border border-white/5 rounded-t-2xl pt-6 pb-4 px-2 text-center relative overflow-hidden h-24">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-amber-700/50" />
                                                <div className="marquee-container w-full mb-1">
                                                    <span className="block text-xs font-black text-white italic tracking-tighter group-hover/p3:animate-marquee">{topThree[2].username}</span>
                                                </div>
                                                <span className="block text-sm font-black text-amber-600 italic uppercase tracking-tighter">{topThree[2].combined_score} <span className="text-[8px] not-italic opacity-50">Pts</span></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ranking List Table */}
                    <div className="lg:col-span-7 order-2 lg:order-2">
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl h-full flex flex-col">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Classifica Globale</h3>
                                </div>
                                <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                                    {leaderboardData.currentPage} / {leaderboardData.totalPages}
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-white/[0.02] text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                <div className="col-span-2 text-center">Rank</div>
                                <div className="col-span-7">Manager</div>
                                <div className="col-span-3 text-right">Punti Totali</div>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                                {entries.length > 0 ? (
                                    entries.map((entry) => {
                                        const isCurrentUser = entry.id === userId;
                                        return (
                                            <div
                                                key={entry.id}
                                                className={`grid grid-cols-12 gap-4 px-8 py-5 items-center border-b border-white/5 transition-all duration-300 group ${isCurrentUser ? 'bg-purple-500/10' : 'hover:bg-white/[0.02]'}`}
                                            >
                                                <div className={`col-span-2 text-center flex justify-center items-center ${isCurrentUser ? 'scale-110' : ''}`}>
                                                    {getRankIcon(entry.rank)}
                                                </div>
                                                <div className="col-span-7 flex items-center gap-4">
                                                    <div className={`relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border-2 ${isCurrentUser ? 'border-purple-500' : 'border-white/10 group-hover:border-white/20'}`}>
                                                        {entry.avatar_url ? (
                                                            <Image src={entry.avatar_url} alt={entry.username || ''} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-sm font-black text-gray-400">
                                                                {getInitials(entry.username || 'U')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                                                        <div className="marquee-container w-full">
                                                            <span className={`font-black italic tracking-tighter text-base truncate block group-hover:animate-marquee pr-2 ${isCurrentUser ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                                {entry.username}
                                                            </span>
                                                        </div>
                                                        {isCurrentUser && (
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                                                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Profilo Manager</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 text-right">
                                                    <span className={`font-black italic uppercase tracking-tighter text-lg ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                                                        {entry.combined_score}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 ml-1">pts</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                            <LogOut className="text-gray-600 rotate-90" size={24} />
                                        </div>
                                        <p className="text-gray-500 font-black italic uppercase tracking-tighter">Nessun altro manager in classifica</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {leaderboardData.totalPages > 1 && (
                                <div className="p-6 bg-[#0a0a0f]/50 border-t border-white/5 backdrop-blur-xl flex items-center justify-center gap-4">
                                    <Link
                                        href={`/dashboard/leaderboard?page=${leaderboardData.currentPage - 1}`}
                                        prefetch={true}
                                        className={`p-3 rounded-xl border border-white/10 flex items-center justify-center transition-all ${leaderboardData.currentPage === 1 ? 'opacity-30 pointer-events-none' : 'bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                        scroll={false}
                                    >
                                        <ChevronLeft size={20} className="text-white" />
                                    </Link>

                                    <div className="flex items-center gap-2">
                                        {/* Show subset of pages if too many */}
                                        {Array.from({ length: Math.min(5, leaderboardData.totalPages) }, (_, i) => {
                                            let pageNum = i + 1;
                                            // Dynamic windowing
                                            if (leaderboardData.totalPages > 5) {
                                                if (leaderboardData.currentPage > 3) {
                                                    pageNum = leaderboardData.currentPage - 2 + i;
                                                    if (pageNum + (4 - i) > leaderboardData.totalPages) {
                                                        pageNum = leaderboardData.totalPages - 4 + i;
                                                    }
                                                }
                                            }

                                            if (pageNum > leaderboardData.totalPages) return null;

                                            const isActive = pageNum === leaderboardData.currentPage;
                                            return (
                                                <Link
                                                    key={pageNum}
                                                    href={`/dashboard/leaderboard?page=${pageNum}`}
                                                    prefetch={true}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic tracking-tighter transition-all border ${isActive
                                                        ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-110 z-10'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                    scroll={false}
                                                >
                                                    {pageNum}
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    <Link
                                        href={`/dashboard/leaderboard?page=${leaderboardData.currentPage + 1}`}
                                        prefetch={true}
                                        className={`p-3 rounded-xl border border-white/10 flex items-center justify-center transition-all ${leaderboardData.currentPage === leaderboardData.totalPages ? 'opacity-30 pointer-events-none' : 'bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                        scroll={false}
                                    >
                                        <ChevronRight size={20} className="text-white" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
