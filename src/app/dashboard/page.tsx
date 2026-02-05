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
import { getDashboardMetadataAction } from '@/app/actions/dashboard-init';
import { getLeaderboardAction } from '@/app/actions/leaderboard';
import DashboardModals from '@/components/dashboard/dashboard-modals';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import { getCuratedRosterAction } from '@/app/actions/scout';
import OnboardingWrapper from '@/components/dashboard/onboarding-wrapper';
import ShareButton from '@/components/dashboard/share-button';
import { UserTeamResponse } from '@/app/actions/team';
import { LeaderboardResponse } from '@/app/actions/leaderboard';

export default async function DashboardPage() {
    const metadata = await getDashboardMetadataAction();

    if (!metadata) {
        redirect('/');
    }

    const {
        user,
        profile,
        season,
        week: currentWeek,
        unseenLogs,
        pendingBet,
        dailyPromoState,
        featured: featuredArtists
    } = metadata;

    const seasonName = season?.name || 'Season Zero';
    const musiCoins = profile?.musi_coins || 0;

    // Background Promises (Non-Blocking)
    const userTeamPromise = getUserTeamAction(currentWeek);
    const leaderboardPromise = getLeaderboardAction(user.id);

    // Dynamic Curated Roster mapping (only for onboarding)
    const getMappedCuratedRoster = async () => {
        if (profile?.has_completed_onboarding) return [];
        const curatedRoster = await getCuratedRosterAction();
        return curatedRoster.map(s => ({
            id: s.spotify_id,
            name: s.name,
            external_urls: { spotify: '' },
            images: [{ url: s.image_url, height: 0, width: 0 }],
            popularity: s.popularity || 0,
            genres: [],
            followers: { total: s.followers || 0 }
        }));
    };

    const mappedCuratedRoster = await getMappedCuratedRoster();

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

            {/* Mobile Action Bar */}
            <div className="md:hidden px-6 mb-6 flex flex-col gap-3">
                <div className="flex gap-3">
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
                <div className="w-full">
                    <Suspense fallback={<div className="h-12 w-full bg-white/5 animate-pulse rounded-2xl" />}>
                        <ShareButtonWrapper
                            username={profile?.username || 'Manager'}
                            totalScore={(profile?.total_score || 0) + (profile?.listen_score || 0)}
                            userTeamPromise={userTeamPromise}
                            leaderboardPromise={leaderboardPromise}
                            seasonName={seasonName}
                        />
                    </Suspense>
                </div>
            </div>

            {/* Sequential Modals: Daily Recap -> MusiBet Results */}
            <DashboardModals
                unseenLogs={unseenLogs}
                pendingBet={pendingBet}
            />

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
                    <div className="flex gap-4 items-center h-12">
                        {/* Status indicators */}
                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md text-sm font-black text-yellow-400 flex items-center gap-4 shadow-inner group transition-all hover:bg-white/10 h-full">
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold leading-none mb-1">MUSICOINS</span>
                                <div className='flex justify-center items-center'><span className="text-xl tracking-tighter leading-none">{musiCoins}</span></div>
                            </div>
                        </div>
                        <div className="h-full">
                            <Suspense fallback={<div className="h-full w-32 bg-white/5 animate-pulse rounded-2xl" />}>
                                <ShareButtonWrapper
                                    username={profile?.username || 'Manager'}
                                    totalScore={(profile?.total_score || 0) + (profile?.listen_score || 0)}
                                    userTeamPromise={userTeamPromise}
                                    leaderboardPromise={leaderboardPromise}
                                    seasonName={seasonName}
                                />
                            </Suspense>
                        </div>
                        <div className="h-full">
                            <InviteButton referralCode={profile?.referral_code} />
                        </div>
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
                            <LeaderboardSection userId={user.id} leaderboardPromise={leaderboardPromise} />
                        </Suspense>
                    </div>

                    {/* Right Column: Roster */}
                    <Suspense fallback={<RosterSkeleton />}>
                        <RosterSection
                            userTeamPromise={userTeamPromise}
                            userId={user.id}
                            featuredArtists={featuredArtists}
                            dailyPromoState={dailyPromoState}
                        />
                    </Suspense>

                    {/* Leaderboard Card - Visible on Mobile (After Roster), Hidden on Desktop */}
                    <Suspense fallback={<LeaderboardSkeleton />}>
                        <LeaderboardSection userId={user.id} isMobile={true} leaderboardPromise={leaderboardPromise} />
                    </Suspense>
                </div>
            </main>
        </>
    );
}

async function ShareButtonWrapper({
    username,
    totalScore,
    userTeamPromise,
    leaderboardPromise,
    seasonName
}: {
    username: string;
    totalScore: number;
    userTeamPromise: Promise<UserTeamResponse>;
    leaderboardPromise: Promise<LeaderboardResponse>;
    seasonName: string;
}) {
    const userTeam = await userTeamPromise;
    const leaderboard = await leaderboardPromise;

    if (!userTeam) return null;

    const captain = [
        userTeam.slot_1,
        userTeam.slot_2,
        userTeam.slot_3,
        userTeam.slot_4,
        userTeam.slot_5
    ].find(a => a?.id === userTeam.captain_id) || null;

    const roster = [
        userTeam.slot_1,
        userTeam.slot_2,
        userTeam.slot_3,
        userTeam.slot_4,
        userTeam.slot_5
    ];

    // Calculate percentile: "Better than X% of managers"
    let percentile: string | undefined;
    if (leaderboard.userRank && leaderboard.totalCount > 1) {
        const betterThanCount = leaderboard.totalCount - leaderboard.userRank;
        const percentage = Math.floor((betterThanCount / leaderboard.totalCount) * 100);
        // Only show if it's significant (e.g., > 10%) or if it's top tier
        if (percentage >= 1) {
            percentile = `${percentage}%`;
        }
    }

    return (
        <ShareButton
            username={username}
            totalScore={totalScore}
            rank={leaderboard.userRank || 0}
            captain={captain}
            roster={roster}
            seasonName={seasonName}
            percentile={percentile}
        />
    );
}
