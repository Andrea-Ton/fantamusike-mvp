import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Info, LogOut, Share2 } from 'lucide-react';
import ArtistCard, { Slot } from '@/components/dashboard/artist-card';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserTeamAction } from '@/app/actions/team';
import { getLeaderboardAction } from '@/app/actions/leaderboard';
import { getCurrentSeasonAction } from '@/app/actions/season';
import { getWeeklyScoresAction } from '@/app/actions/dashboard';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import LeaderboardCard from '@/components/dashboard/leaderboard-card';
import Link from 'next/link';
import LogoutButton from '@/components/logout-button';
import InviteButton from '@/components/dashboard/invite-button';
import SyncButton from '@/components/dashboard/sync-button';
import { getCurrentWeekAction } from '@/app/actions/game';
import { ARTIST_TIERS } from '@/config/game';

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

    const totalScore = (profile?.total_score || 0) + (profile?.listen_score || 0);
    const musiCoins = profile?.musi_coins || 0;

    // Determine Current Week
    const currentWeek = await getCurrentWeekAction();

    // Fetch User Team for Current Week
    const userTeam = await getUserTeamAction(currentWeek);

    // Fetch Weekly Scores
    let weeklyScores: Record<string, number> = {};
    let weeklyTrend = 0;

    // Fetch Featured Artists for Multiplier Calculation
    const featuredArtists = await getFeaturedArtistsAction();
    const featuredIds = new Set(featuredArtists.map(a => a.id));

    if (userTeam) {
        const artistIds = [
            userTeam.slot_1?.id,
            userTeam.slot_2?.id,
            userTeam.slot_3?.id,
            userTeam.slot_4?.id,
            userTeam.slot_5?.id
        ].filter(Boolean) as string[];

        const { scores } = await getWeeklyScoresAction(artistIds, userTeam.captain_id);
        weeklyScores = scores;

        weeklyTrend = artistIds.reduce((total, artistId) => {
            return total + (scores[artistId] || 0);
        }, 0);
    }

    // --- ADDED: Listen to Win Trend ---
    // Fetch latest snapshot date
    const { data: latestSnapshot } = await supabase
        .from('weekly_snapshots')
        .select('created_at')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    const lastSnapshotDate = latestSnapshot?.created_at || new Date(0).toISOString();

    // Fetch Listen Points since last snapshot
    const { data: listenTrendData } = await supabase
        .from('listen_history')
        .select('points_awarded')
        .eq('user_id', user.id)
        .gt('created_at', lastSnapshotDate); // Using created_at or played_at? created_at helps for "points earned SINCE snapshot"

    const listenTrend = listenTrendData?.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0) || 0;

    // Add Listen Trend to Total Weekly Trend
    weeklyTrend += listenTrend;


    // Fetch Leaderboard
    const { podium, neighborhood } = await getLeaderboardAction(user.id);
    const leaderboardEntries = [...podium, ...neighborhood];

    // Fetch Current Season
    const currentSeason = await getCurrentSeasonAction();
    const seasonName = currentSeason?.name || 'Season Zero';



    // Transform to Slot format for UI
    const teamSlots: Slot[] = [
        {
            id: 1,
            type: 'Big',
            label: 'Headliner',
            requirement: `Popolarità > ${ARTIST_TIERS.BIG.min - 1}`,
            artist: userTeam?.slot_1 ? {
                id: userTeam.slot_1.id,
                name: userTeam.slot_1.name,
                image: userTeam.slot_1.images[0]?.url || '',
                popularity: userTeam.slot_1.popularity,
                category: 'Big',
                trend: weeklyScores[userTeam.slot_1.id] || 0,
                isCaptain: userTeam.captain_id === userTeam.slot_1.id,
                multiplier: userTeam.captain_id === userTeam.slot_1.id ? (featuredIds.has(userTeam.slot_1.id) ? 2 : 1.5) : undefined
            } : null
        },
        {
            id: 2,
            type: 'Mid',
            label: 'Rising Star 1',
            requirement: `Popolarità ${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max}`,
            artist: userTeam?.slot_2 ? {
                id: userTeam.slot_2.id,
                name: userTeam.slot_2.name,
                image: userTeam.slot_2.images[0]?.url || '',
                popularity: userTeam.slot_2.popularity,
                category: 'Mid',
                trend: weeklyScores[userTeam.slot_2.id] || 0,
                isCaptain: userTeam.captain_id === userTeam.slot_2.id,
                multiplier: userTeam.captain_id === userTeam.slot_2.id ? (featuredIds.has(userTeam.slot_2.id) ? 2 : 1.5) : undefined
            } : null
        },
        {
            id: 3,
            type: 'Mid',
            label: 'Rising Star 2',
            requirement: `Popolarità ${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max}`,
            artist: userTeam?.slot_3 ? {
                id: userTeam.slot_3.id,
                name: userTeam.slot_3.name,
                image: userTeam.slot_3.images[0]?.url || '',
                popularity: userTeam.slot_3.popularity,
                category: 'Mid',
                trend: weeklyScores[userTeam.slot_3.id] || 0,
                isCaptain: userTeam.captain_id === userTeam.slot_3.id,
                multiplier: userTeam.captain_id === userTeam.slot_3.id ? (featuredIds.has(userTeam.slot_3.id) ? 2 : 1.5) : undefined
            } : null
        },
        {
            id: 4,
            type: 'New Gen',
            label: 'Scout Pick 1',
            requirement: `Popolarità < ${ARTIST_TIERS.NEW_GEN.max + 1}`,
            artist: userTeam?.slot_4 ? {
                id: userTeam.slot_4.id,
                name: userTeam.slot_4.name,
                image: userTeam.slot_4.images[0]?.url || '',
                popularity: userTeam.slot_4.popularity,
                category: 'New Gen',
                trend: weeklyScores[userTeam.slot_4.id] || 0,
                isCaptain: userTeam.captain_id === userTeam.slot_4.id,
                multiplier: userTeam.captain_id === userTeam.slot_4.id ? (featuredIds.has(userTeam.slot_4.id) ? 2 : 1.5) : undefined
            } : null
        },
        {
            id: 5,
            type: 'New Gen',
            label: 'Scout Pick 2',
            requirement: `Popolarità < ${ARTIST_TIERS.NEW_GEN.max + 1}`,
            artist: userTeam?.slot_5 ? {
                id: userTeam.slot_5.id,
                name: userTeam.slot_5.name,
                image: userTeam.slot_5.images[0]?.url || '',
                popularity: userTeam.slot_5.popularity,
                category: 'New Gen',
                trend: weeklyScores[userTeam.slot_5.id] || 0,
                isCaptain: userTeam.captain_id === userTeam.slot_5.id,
                multiplier: userTeam.captain_id === userTeam.slot_5.id ? (featuredIds.has(userTeam.slot_5.id) ? 2 : 1.5) : undefined
            } : null
        },
    ];

    const hasTeam = userTeam !== null;

    // Check Spotify Connection
    const { count: spotifyTokensCount } = await supabase
        .from('spotify_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const hasSpotify = (spotifyTokensCount || 0) > 0;

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

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <header className="hidden md:flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-gray-400">Benvenuto, Manager. Ecco come sta andando la tua Label.</p>
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
                        {/* Score Card */}
                        <div className="w-full rounded-3xl bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium mb-2">Punteggio Totale</p>
                                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">{totalScore}</h2>
                                    </div>
                                    <SyncButton isConnected={hasSpotify} />

                                </div>

                                <div className="mt-8 flex gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Trend Settimanale</span>
                                        <div className={`flex items-center gap-1 text-lg font-bold ${weeklyTrend > 0 ? 'text-green-300' : weeklyTrend < 0 ? 'text-red-300' : 'text-gray-300'}`}>
                                            {weeklyTrend > 0 ? <TrendingUp size={18} /> : weeklyTrend < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                                            {weeklyTrend > 0 ? '+' : ''}{weeklyTrend} pts
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative */}
                            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                            <div className="absolute bottom-0 right-0 opacity-20">
                                <svg width="150" height="120" viewBox="0 0 100 80" fill="none">
                                    <path d="M0 80 L40 40 L70 60 L100 10" stroke="white" strokeWidth="4" fill="none" />
                                </svg>
                            </div>
                        </div>

                        {/* Leaderboard Card - Hidden on Mobile, Visible on Desktop */}
                        <div className="hidden lg:block h-[400px]">
                            <LeaderboardCard entries={leaderboardEntries} currentUserId={user.id} />
                        </div>
                    </div>

                    {/* Right Column: Roster */}
                    <div className="lg:col-span-7">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">La tua Label <span className="text-gray-400 text-sm font-normal md:ml-2 block md:inline">(Settimana Corrente)</span></h3>
                            <Link
                                href="/dashboard/draft"
                                className="px-4 py-2 rounded-full bg-[#1a1a24] border border-white/10 text-sm text-purple-400 font-medium hover:bg-purple-500 hover:text-white transition-all whitespace-nowrap"
                            >
                                {hasTeam ? 'Gestisci Roster' : 'Crea Team'}
                            </Link>
                        </div>

                        {hasTeam ? (
                            <div className="grid grid-cols-1 gap-4">
                                {teamSlots.map((slot) => (
                                    <ArtistCard key={slot.id} slot={slot} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#1a1a24] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Trophy className="text-purple-400" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Nessun Team Trovato</h3>
                                <p className="text-gray-400 mb-6 max-w-md">Non hai ancora creato la tua etichetta discografica. Inizia subito a fare scouting per vincere la stagione!</p>
                                <Link
                                    href="/dashboard/draft"
                                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                                >
                                    Inizia il Draft
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Leaderboard Card - Visible on Mobile (After Roster), Hidden on Desktop */}
                    <div className="lg:hidden h-[400px]">
                        <LeaderboardCard entries={leaderboardEntries} currentUserId={user.id} />
                    </div>
                </div>
            </main>
        </>
    );
}
