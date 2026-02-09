
import React from 'react';
import { Trophy, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Slot } from '@/components/dashboard/artist-card';
import ArtistPromoCard from '@/components/dashboard/artist-promo-card';
import { UserTeamResponse } from '@/app/actions/team';
import { getWeeklyScoresAction } from '@/app/actions/dashboard';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import { getDailyPromoStateAction, DailyPromoState } from '@/app/actions/promo';
import { getArtistReleases } from '@/lib/spotify';
import { ARTIST_TIERS } from '@/config/game';
import DailyPromoFeature from './daily-promo-feature';
import { SpotifyArtist } from '@/lib/spotify';
import ShareButton from './share-button';
import { LeaderboardResponse } from '@/app/actions/leaderboard';

interface RosterSectionProps {
    userTeamPromise: Promise<UserTeamResponse>;
    userId?: string;
    featuredArtists?: SpotifyArtist[];
    dailyPromoState?: DailyPromoState;
    username: string;
    totalScore: number;
    seasonName: string;
    leaderboardPromise: Promise<LeaderboardResponse>;
    weekNumber: number;
}

export default async function RosterSection({
    userTeamPromise,
    userId,
    featuredArtists: initialFeatured,
    dailyPromoState: initialPromoState,
    username,
    totalScore,
    seasonName,
    leaderboardPromise,
    weekNumber
}: RosterSectionProps) {
    const [userTeam, leaderboard] = await Promise.all([
        userTeamPromise,
        leaderboardPromise
    ]);
    const hasTeam = userTeam !== null;

    let weeklyScores: Record<string, number> = {};
    let fantaScores: Record<string, number> = {};
    let promoScores: Record<string, number> = {};

    // Use provided featuredArtists or fetch if missing
    const featuredArtists = initialFeatured || await getFeaturedArtistsAction();
    const featuredIds = new Set(featuredArtists.map(a => a.id));

    // Use provided dailyPromoState or fetch if missing
    const dailyPromoState = initialPromoState || await getDailyPromoStateAction();

    // Maps for URLs to pass to client feature
    let spotifyUrls: Record<string, string | undefined> = {};
    let releaseUrls: Record<string, string | undefined> = {};
    let revivalUrls: Record<string, string | undefined> = {};

    if (userTeam) {
        const artistIds = [
            userTeam.slot_1?.id,
            userTeam.slot_2?.id,
            userTeam.slot_3?.id,
            userTeam.slot_4?.id,
            userTeam.slot_5?.id
        ].filter(Boolean) as string[];

        // Parallel data fetching
        try {
            const [scoresResult, ...releasesResults] = await Promise.all([
                getWeeklyScoresAction(artistIds, userTeam.captain_id, userId),
                // Fetch releases for each artist
                ...artistIds.map(id => getArtistReleases(id).then(releases => {
                    const latest = releases[0]?.external_urls?.spotify;
                    let revival = undefined;
                    if (releases.length > 1) {
                        const randomIndex = Math.floor(Math.random() * (releases.length - 1)) + 1;
                        revival = releases[randomIndex]?.external_urls?.spotify;
                    }
                    return { id, latest, revival };
                }).catch(err => {
                    console.error(`Error fetching releases for ${id}:`, err);
                    return { id, latest: undefined, revival: undefined };
                }))
            ]);

            weeklyScores = scoresResult.scores;
            fantaScores = scoresResult.fantaScores || {};
            promoScores = scoresResult.promoScores || {};

            // Map URLs
            releasesResults.forEach((r: any) => {
                releaseUrls[r.id] = r.latest;
                revivalUrls[r.id] = r.revival;
                // Assuming spotify URL is constructing in artist object, but we map it here for consistency if needed or extract from team
            });

            // Construct Spotify URLs map from Team Data
            if (userTeam.slot_1) spotifyUrls[userTeam.slot_1.id] = `https://open.spotify.com/artist/${userTeam.slot_1.id}`;
            if (userTeam.slot_2) spotifyUrls[userTeam.slot_2.id] = `https://open.spotify.com/artist/${userTeam.slot_2.id}`;
            if (userTeam.slot_3) spotifyUrls[userTeam.slot_3.id] = `https://open.spotify.com/artist/${userTeam.slot_3.id}`;
            if (userTeam.slot_4) spotifyUrls[userTeam.slot_4.id] = `https://open.spotify.com/artist/${userTeam.slot_4.id}`;
            if (userTeam.slot_5) spotifyUrls[userTeam.slot_5.id] = `https://open.spotify.com/artist/${userTeam.slot_5.id}`;

        } catch (error) {
            console.error('Error in parallel data fetching:', error);
        }
    }

    const teamSlots: Slot[] = [
        {
            id: 1,
            type: ARTIST_TIERS.BIG.label,
            label: ARTIST_TIERS.BIG.label,
            requirement: `Popolarità > ${ARTIST_TIERS.BIG.min - 1}`,
            artist: userTeam?.slot_1 ? {
                id: userTeam.slot_1.id,
                name: userTeam.slot_1.name,
                image: userTeam.slot_1.images[0]?.url || '',
                popularity: userTeam.slot_1.popularity,
                category: ARTIST_TIERS.BIG.label,
                trend: weeklyScores[userTeam.slot_1.id] || 0,
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_1.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_1.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_1.id,
                multiplier: userTeam.captain_id === userTeam.slot_1.id ? (featuredIds.has(userTeam.slot_1.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_1.id}` }
            } : null
        },
        {
            id: 2,
            type: ARTIST_TIERS.MID.label,
            label: ARTIST_TIERS.MID.label,
            requirement: `Popolarità ${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max}`,
            artist: userTeam?.slot_2 ? {
                id: userTeam.slot_2.id,
                name: userTeam.slot_2.name,
                image: userTeam.slot_2.images[0]?.url || '',
                popularity: userTeam.slot_2.popularity,
                category: ARTIST_TIERS.MID.label,
                trend: weeklyScores[userTeam.slot_2.id] || 0,
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_2.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_2.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_2.id,
                multiplier: userTeam.captain_id === userTeam.slot_2.id ? (featuredIds.has(userTeam.slot_2.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_2.id}` }
            } : null
        },
        {
            id: 3,
            type: ARTIST_TIERS.MID.label,
            label: ARTIST_TIERS.MID.label,
            requirement: `Popolarità ${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max}`,
            artist: userTeam?.slot_3 ? {
                id: userTeam.slot_3.id,
                name: userTeam.slot_3.name,
                image: userTeam.slot_3.images[0]?.url || '',
                popularity: userTeam.slot_3.popularity,
                category: ARTIST_TIERS.MID.label,
                trend: weeklyScores[userTeam.slot_3.id] || 0,
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_3.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_3.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_3.id,
                multiplier: userTeam.captain_id === userTeam.slot_3.id ? (featuredIds.has(userTeam.slot_3.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_3.id}` }
            } : null
        },
        {
            id: 4,
            type: ARTIST_TIERS.NEW_GEN.label,
            label: ARTIST_TIERS.NEW_GEN.label,
            requirement: `Popolarità < ${ARTIST_TIERS.NEW_GEN.max + 1}`,
            artist: userTeam?.slot_4 ? {
                id: userTeam.slot_4.id,
                name: userTeam.slot_4.name,
                image: userTeam.slot_4.images[0]?.url || '',
                popularity: userTeam.slot_4.popularity,
                category: ARTIST_TIERS.NEW_GEN.label,
                trend: weeklyScores[userTeam.slot_4.id] || 0,
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_4.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_4.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_4.id,
                multiplier: userTeam.captain_id === userTeam.slot_4.id ? (featuredIds.has(userTeam.slot_4.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_4.id}` }
            } : null
        },
        {
            id: 5,
            type: ARTIST_TIERS.NEW_GEN.label,
            label: ARTIST_TIERS.NEW_GEN.label,
            requirement: `Popolarità < ${ARTIST_TIERS.NEW_GEN.max + 1}`,
            artist: userTeam?.slot_5 ? {
                id: userTeam.slot_5.id,
                name: userTeam.slot_5.name,
                image: userTeam.slot_5.images[0]?.url || '',
                popularity: userTeam.slot_5.popularity,
                category: ARTIST_TIERS.NEW_GEN.label,
                trend: weeklyScores[userTeam.slot_5.id] || 0,
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_5.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_5.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_5.id,
                multiplier: userTeam.captain_id === userTeam.slot_5.id ? (featuredIds.has(userTeam.slot_5.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_5.id}` }
            } : null
        },
    ];

    // Calculate share data
    const captain = [
        userTeam?.slot_1,
        userTeam?.slot_2,
        userTeam?.slot_3,
        userTeam?.slot_4,
        userTeam?.slot_5
    ].find(a => a?.id === userTeam?.captain_id) || null;

    const roster = [
        userTeam?.slot_1 || null,
        userTeam?.slot_2 || null,
        userTeam?.slot_3 || null,
        userTeam?.slot_4 || null,
        userTeam?.slot_5 || null
    ];

    let percentile: string | undefined;
    if (leaderboard.userRank && leaderboard.totalCount > 1) {
        const topPercentage = Math.max(1, Math.ceil((leaderboard.userRank / leaderboard.totalCount) * 100));
        if (topPercentage <= 50) {
            percentile = `${topPercentage}%`;
        }
    }

    return (
        <div className="lg:col-span-7">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Settimana corrente</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">La tua Label</h3>
                        {hasTeam && (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/dashboard/draft"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                    title="Modifica Label"
                                >
                                    <Pencil size={14} className="text-gray-500 group-hover:text-white" />
                                </Link>

                                <ShareButton
                                    username={username}
                                    totalScore={totalScore}
                                    rank={leaderboard.userRank || 0}
                                    captain={captain}
                                    roster={roster}
                                    weekNumber={weekNumber}
                                    seasonName={seasonName}
                                    percentile={percentile}
                                    variant="iconOnly"
                                />
                            </div>
                        )}
                    </div>
                </div>
                {hasTeam && (
                    <div className="flex flex-col md:items-end gap-2">
                        <DailyPromoFeature
                            teamSlots={teamSlots}
                            initialState={dailyPromoState}
                            spotifyUrls={spotifyUrls}
                            releaseUrls={releaseUrls}
                            revivalUrls={revivalUrls}
                        />
                    </div>
                )}
            </div>

            {hasTeam ? (
                <div className="grid grid-cols-1 gap-4">
                    {teamSlots.map((slot) => (
                        <ArtistPromoCard
                            key={slot.id}
                            slot={slot}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                        <Trophy className="text-purple-400" size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Nessun Team Trovato</h3>
                    <p className="text-gray-500 mb-8 max-w-sm font-medium">Non hai ancora creato la tua etichetta discografica. Inizia subito a fare scouting per vincere MusiCoins!</p>
                    <Link
                        href="/dashboard/draft"
                        className="group relative px-10 py-4 bg-white text-black font-black uppercase tracking-tighter italic rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        <span className="relative z-10">Inizia il Draft</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl"></div>
                    </Link>
                </div>
            )}
        </div>
    );
}
