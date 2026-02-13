import React, { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserTeamAction } from '@/app/actions/team';
import Image from 'next/image';
import LogoutButton from '@/components/logout-button';
import { getCurrentWeekAction } from '@/app/actions/game';
import StatsSection from '@/components/dashboard/stats-section';
import RosterSection from '@/components/dashboard/roster-section';
import { StatsSkeleton, RosterSkeleton } from '@/components/dashboard/skeletons';
import { getDashboardMetadataAction } from '@/app/actions/dashboard-init';
import { getLeaderboardAction } from '@/app/actions/leaderboard';
import DashboardModals from '@/components/dashboard/dashboard-modals';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import { getCuratedRosterAction } from '@/app/actions/scout';
import OnboardingWrapper from '@/components/dashboard/onboarding-wrapper';
import ShareButton from '@/components/dashboard/share-button';
import { UserTeamResponse } from '@/app/actions/team';
import { LeaderboardResponse } from '@/app/actions/leaderboard';
import { updateLoginStreakAction, getRewardsStateAction } from '@/app/actions/rewards';
import MusiRewards from '@/components/dashboard/musi-rewards';
import MusiCoinBalance from '@/components/dashboard/musicoin-balance';

export default async function DashboardPage() {
    const metadata = await getDashboardMetadataAction();

    if (!metadata) {
        redirect('/');
    }

    // Update Streak & Fetch Rewards State
    await updateLoginStreakAction();
    const { missions } = await getRewardsStateAction();

    const {
        user,
        profile,
        season,
        week: currentWeek,
        unseenLogs,
        pendingBet,
        dailyPromoState,
        featured: featuredArtists,
        referralCount
    } = metadata;

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
                    </div>
                </div>
                <LogoutButton />
            </div>

            {/* Mobile Action Bar */}
            <div className="md:hidden px-6 mb-5 flex flex-col gap-3">
                <MusiCoinBalance musiCoins={musiCoins} referralCode={profile?.referral_code} referralCount={referralCount} />
            </div>

            {/* Sequential Modals: Weekly Recap -> Daily Recap -> MusiBet Results */}
            <DashboardModals
                unseenLogs={unseenLogs}
                pendingBet={pendingBet}
                unseenWeeklyRecap={metadata.unseenWeeklyRecap}
                username={profile?.username || 'Manager'}
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
                    <MusiCoinBalance musiCoins={musiCoins} referralCode={profile?.referral_code} referralCount={referralCount} />
                </header>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 1. Stats Section - Top Left on Desktop, Top on Mobile */}
                    <div className="lg:col-span-5 order-1">
                        <Suspense fallback={<StatsSkeleton />}>
                            <StatsSection
                                userId={user.id}
                                userTeamPromise={userTeamPromise}
                                totalScore={(profile?.total_score || 0) + (profile?.listen_score || 0)}
                            />
                        </Suspense>
                    </div>

                    {/* 2. Roster Section - Right on Desktop, Middle on Mobile */}
                    <div className="lg:col-span-7 lg:row-span-2 order-2">
                        <Suspense fallback={<RosterSkeleton />}>
                            <RosterSection
                                userTeamPromise={userTeamPromise}
                                userId={user.id}
                                featuredArtists={featuredArtists}
                                dailyPromoState={dailyPromoState}
                                username={profile?.username || 'Manager'}
                                totalScore={(profile?.total_score || 0) + (profile?.listen_score || 0)}
                                seasonName={season?.name || 'Season 1'}
                                weekNumber={currentWeek}
                                leaderboardPromise={leaderboardPromise}
                            />
                        </Suspense>
                    </div>

                    {/* 3. MusiRewards - Below Stats on Desktop, Bottom on Mobile */}
                    <div className="lg:col-span-5 order-3">
                        <MusiRewards initialMissions={missions} />
                    </div>
                </div>
            </main>
        </>
    );
}
