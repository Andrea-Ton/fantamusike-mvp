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
import { getPendingBetResultAction } from '@/app/actions/promo';
import { BetResultModalWrapper } from '@/components/dashboard/bet-result-modal-wrapper';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import { getCuratedRosterAction } from '@/app/actions/scout';
import OnboardingWrapper from '@/components/dashboard/onboarding-wrapper';

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
    const pendingBetResult = await getPendingBetResultAction();

    // Onboarding Data
    const featuredArtists = await getFeaturedArtistsAction();
    const curatedRoster = await getCuratedRosterAction();
    // Map ScoutSuggestion to SpotifyArtist for the modal
    const mappedCuratedRoster = curatedRoster.map(s => ({
        id: s.spotify_id,
        name: s.name,
        external_urls: { spotify: '' },
        images: [{ url: s.image_url, height: 0, width: 0 }],
        popularity: s.popularity || 0,
        genres: [],
        followers: { total: s.followers || 0 }
    }));

    return (
        <>
            <OnboardingWrapper
                hasCompletedOnboarding={!!profile?.has_completed_onboarding}
                featuredArtists={featuredArtists}
                curatedRoster={mappedCuratedRoster}
                username={profile?.username || 'Gamer'}
            />

            {/* Mobile Header */}
            <div className="md:hidden pt-12 px-6 flex justify-between items-center mb-4 bg-[#0a0a0e]/80 backdrop-blur-xl border-b border-white/5 pb-4 sticky top-0 z-30">
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
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{seasonName}</p>
                    </div>
                </div>
                <LogoutButton />
            </div>

            {/* Mobile Stats Row */}
            <div className="md:hidden px-6 mb-6 flex gap-3">
                <div className="px-4 py-2.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md text-sm font-black text-yellow-400 flex items-center gap-2 flex-1 justify-between shadow-inner">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">MusiCoins</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-base">{musiCoins}</span>
                    </div>
                </div>
                <div className="flex-1">
                    <InviteButton referralCode={profile?.referral_code} />
                </div>
            </div>

            {unseenLogs && unseenLogs.length > 0 && (
                <DailyRecapModalWrapper logs={unseenLogs} />
            )}

            {/* MusiBet Result Modal */}
            {pendingBetResult && (
                <BetResultModalWrapper result={pendingBetResult} />
            )}

            {/* Content Area */}
            <main className="flex-1 p-6 mb-4 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <header className="hidden md:flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-px bg-purple-500"></span>
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Management Dashboard</span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Bentornato {profile?.username},</h1>
                        <p className="text-gray-500 mt-3 font-medium text-lg">Controlla la tua Label e scala le classifiche mondiali.</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Status indicators */}
                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md text-sm font-black text-yellow-400 flex items-center gap-4 shadow-inner group transition-all hover:bg-white/10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-none mb-1">MUSICOINS</span>
                                <div className='flex justify-center items-center'><span className="text-xl tracking-tighter ">{musiCoins}</span></div>
                            </div>
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
