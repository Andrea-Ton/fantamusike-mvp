

import React from 'react';
import { Zap, LogOut } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { getLeaderboardAction, getHallOfFameAction } from '@/app/actions/leaderboard';
import { getNextResetDateAction } from '@/app/actions/game';
import LogoutButton from '@/components/logout-button';
import LeaderboardTabs from '@/components/dashboard/leaderboard-tabs';

interface PageProps {
    searchParams: Promise<{ page?: string; tab?: 'weekly' | 'hof' }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const sParams = await searchParams;
    const page = sParams.page ? parseInt(sParams.page) : undefined;
    const activeTab = sParams.tab || 'weekly';

    // Level 1: Fetch everything in parallel
    const [leaderboardData, hofWinners, nextResetDateStr] = await Promise.all([
        getLeaderboardAction(user?.id, page),
        getHallOfFameAction(),
        getNextResetDateAction()
    ]);
    const nextResetDate = new Date(nextResetDateStr);
    const now = new Date();
    const diff = nextResetDate.getTime() - now.getTime();

    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diff / (1000 * 60 * 60)) % 24);

    const weekNumber = leaderboardData.currentWeek || 1;
    const isResetSoon = daysLeft === 0 && hoursLeft <= 12;

    return (
        <>
            {/* Mobile Header */}
            <div
                className="md:hidden pt-4 px-6 flex justify-between items-center mb-4 bg-[#0a0a0e]/80 backdrop-blur-xl border-b border-white/5 pb-4 sticky z-30 transition-all duration-300"
                style={{ top: 'var(--notification-height, 0px)' }}
            >
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
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">FantaMusiké</h1>
                        <p className="hidden text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Settimana {weekNumber}</p>
                    </div>
                </div>
                <LogoutButton />
            </div>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-24 lg:pb-10">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Global Ranking</p>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">Classifica</h1>
                        <p className="text-gray-500 text-sm font-medium">Competi con i migliori manager d'Italia e scala la vetta.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                        {/* Weekly Reset Countdown */}
                        <div className={`flex items-center justify-between px-6 py-3 rounded-2xl border ${isResetSoon ? 'bg-red-500/10 border-red-500/20' : 'bg-purple-500/10 border-purple-500/20'} backdrop-blur-xl shadow-inner group transition-all hover:bg-white/10`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Termine Classifica</span>
                                <span className={`text-lg font-black italic uppercase tracking-tighter leading-none ${isResetSoon ? 'text-red-400 animate-pulse' : 'text-purple-400'}`}>
                                    {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft} ore`}
                                </span>
                            </div>
                            <div className={`ml-4 p-2 rounded-lg ${isResetSoon ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-400'} hidden sm:block`}>
                                <Zap size={16} className={isResetSoon ? 'animate-pulse' : ''} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl shadow-inner">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#050507] bg-gray-800 flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-purple-500/20" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Managers attivi</span>
                                <span className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{leaderboardData.totalCount} <span className="text-[10px] not-italic text-purple-400 ml-1">Managers</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <LeaderboardTabs
                    initialTab={activeTab}
                    leaderboardData={leaderboardData}
                    hofWinners={hofWinners}
                    userId={user?.id}
                />
            </main >
        </>
    );
}
