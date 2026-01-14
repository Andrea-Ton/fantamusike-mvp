import React, { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserTeamAction } from '@/app/actions/team';
import { getCurrentSeasonAction } from '@/app/actions/season';
import Image from 'next/image';
import LogoutButton from '@/components/logout-button';
import InviteButton from '@/components/dashboard/invite-button';
import { getCurrentWeekAction } from '@/app/actions/game';
import StatsSection from '@/components/dashboard/stats-section';
import RosterSection from '@/components/dashboard/roster-section';
import LeaderboardSection from '@/components/dashboard/leaderboard-section';
import { StatsSkeleton, RosterSkeleton, LeaderboardSkeleton } from '@/components/dashboard/skeletons';
import { getUnseenScoreLogsAction } from '@/app/actions/dashboard';
import { DailyRecapModalWrapper } from '@/components/dashboard/daily-recap-modal-wrapper';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const musiCoins = profile?.musi_coins || 0;

    // --- Fast Data Fetching (Blocking) ---
    // Fetch Current Season & Week (Fast)
    const currentSeason = await getCurrentSeasonAction();
    const seasonName = currentSeason?.name || 'Season Zero';
    const currentWeek = await getCurrentWeekAction();

    // --- Slow Data Fetching (Non-Blocking / Streaming) ---
    // Start fetching team data but don't await yet
    const userTeamPromise = getUserTeamAction(currentWeek);
    const unseenLogs = await getUnseenScoreLogsAction();

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

            {/* Mobile Stats Row */}
            <div className="md:hidden px-6 mb-2 mt-2 flex gap-3">
                <div className="px-2 py-2 bg-[#1a1a24] rounded-lg border border-white/10 text-sm font-medium text-yellow-400 flex items-center gap-2 flex-1 justify-center">
                    <span>MusiCoins:</span>
                    <span className="font-bold">{musiCoins}</span>
                </div>
                <div className="flex-1">
                    <InviteButton referralCode={profile?.referral_code} />
                </div>
            </div>

            {unseenLogs && unseenLogs.length > 0 && (
                <DailyRecapModalWrapper logs={unseenLogs} />
            )}

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <header className="hidden md:flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Bentornato {profile?.username},</h1>
                        <p className="text-gray-400">Controlla come sta andando la tua Label.</p>
                        <p className="text-gray-400">Promuovi i tuoi artisti preferiti per guadagnare punti extra e vincere MusiCoins!</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Status indicators */}
                        <div className="px-4 py-2 bg-[#1a1a24] rounded-lg border border-white/10 text-sm font-medium text-yellow-400 flex items-center gap-2">
                            <span>MusiCoins:</span>
                            <span className="font-bold">{musiCoins}</span>
                        </div>
                        <InviteButton referralCode={profile?.referral_code} />
                    </div>
                </header>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Stats & Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Score Card Section */}
                        <Suspense fallback={<StatsSkeleton />}>
                            <StatsSection
                                userId={user.id}
                                userTeamPromise={userTeamPromise}
                                totalScore={(profile?.total_score || 0) + (profile?.listen_score || 0)}
                            />
                        </Suspense>

                        {/* Leaderboard Card - Hidden on Mobile, Visible on Desktop */}
                        <Suspense fallback={<LeaderboardSkeleton />}>
                            <LeaderboardSection userId={user.id} />
                        </Suspense>
                    </div>

                    {/* Right Column: Roster */}
                    <Suspense fallback={<RosterSkeleton />}>
                        <RosterSection userTeamPromise={userTeamPromise} userId={user.id} />
                    </Suspense>

                    {/* Leaderboard Card - Visible on Mobile (After Roster), Hidden on Desktop */}
                    <Suspense fallback={<LeaderboardSkeleton />}>
                        <LeaderboardSection userId={user.id} isMobile={true} />
                    </Suspense>
                </div>
            </main>
        </>
    );
}
