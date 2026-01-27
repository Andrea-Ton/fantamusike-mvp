
import React from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { Slot } from '@/components/dashboard/artist-card';
import ArtistPromoCard from '@/components/dashboard/artist-promo-card';
import { UserTeamResponse } from '@/app/actions/team';
import { getWeeklyScoresAction } from '@/app/actions/dashboard';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import { getDailyPromoStatusAction, ArtistPromoStatus } from '@/app/actions/promo';
import { getArtistReleases } from '@/lib/spotify';
import { ARTIST_TIERS } from '@/config/game';

interface RosterSectionProps {
    userTeamPromise: Promise<UserTeamResponse>;
    userId?: string;
}

export default async function RosterSection({ userTeamPromise, userId }: RosterSectionProps) {
    const userTeam = await userTeamPromise;
    const hasTeam = userTeam !== null;

    let weeklyScores: Record<string, number> = {};
    let fantaScores: Record<string, number> = {};
    let promoScores: Record<string, number> = {};
    const featuredArtists = await getFeaturedArtistsAction();
    const featuredIds = new Set(featuredArtists.map(a => a.id));
    let promoStatus: Record<string, ArtistPromoStatus> = {};
    let artistReleases: Record<string, { latest?: string; revival?: string }> = {};

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
            const [scoresResult, statusResult, ...releasesResults] = await Promise.all([
                getWeeklyScoresAction(artistIds, userTeam.captain_id, userId),
                getDailyPromoStatusAction(artistIds),
                // Fetch releases for each artist
                ...artistIds.map(id => getArtistReleases(id).then(releases => {
                    const latest = releases[0]?.external_urls?.spotify;
                    let revival = undefined;
                    if (releases.length > 1) {
                        // Pick a random one from indices 1 to end
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

            promoStatus = statusResult;

            // Map releases
            releasesResults.forEach((r: any) => {
                artistReleases[r.id] = { latest: r.latest, revival: r.revival };
            });
        } catch (error) {
            console.error('Error in parallel data fetching:', error);
            // Default empty status
            artistIds.forEach(id => {
                if (!promoStatus[id]) promoStatus[id] = { profile_click: false, release_click: false, share: false };
            });
        }
    }

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
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_1.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_1.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_1.id,
                multiplier: userTeam.captain_id === userTeam.slot_1.id ? (featuredIds.has(userTeam.slot_1.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_1.id}` }
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
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_2.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_2.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_2.id,
                multiplier: userTeam.captain_id === userTeam.slot_2.id ? (featuredIds.has(userTeam.slot_2.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_2.id}` }
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
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_3.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_3.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_3.id,
                multiplier: userTeam.captain_id === userTeam.slot_3.id ? (featuredIds.has(userTeam.slot_3.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_3.id}` }
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
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_4.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_4.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_4.id,
                multiplier: userTeam.captain_id === userTeam.slot_4.id ? (featuredIds.has(userTeam.slot_4.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_4.id}` }
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
                fantaTrend: typeof fantaScores !== 'undefined' ? fantaScores[userTeam.slot_5.id] || 0 : 0,
                promoTrend: typeof promoScores !== 'undefined' ? promoScores[userTeam.slot_5.id] || 0 : 0,
                isCaptain: userTeam.captain_id === userTeam.slot_5.id,
                multiplier: userTeam.captain_id === userTeam.slot_5.id ? (featuredIds.has(userTeam.slot_5.id) ? 2 : 1.5) : undefined,
                external_urls: { spotify: `https://open.spotify.com/artist/${userTeam.slot_5.id}` }
            } : null
        },
    ];

    return (
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
                        <ArtistPromoCard
                            key={slot.id}
                            slot={slot}
                            promoStatus={slot.artist ? promoStatus[slot.artist.id] : { profile_click: false, release_click: false, share: false }} // Fallback
                            spotifyUrl={slot.artist?.external_urls?.spotify}
                            releaseUrl={slot.artist ? artistReleases[slot.artist.id]?.latest : undefined}
                            revivalUrl={slot.artist ? artistReleases[slot.artist.id]?.revival : undefined}
                        />
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
    );
}
