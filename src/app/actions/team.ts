'use server';

import { createClient } from '@/utils/supabase/server';
import { SpotifyArtist } from '@/lib/spotify';
import { revalidatePath } from 'next/cache';
import { getCurrentSeasonAction } from './season';
import { ARTIST_TIERS } from '@/config/game';

export type TeamSlots = {
    slot_1: SpotifyArtist | null;
    slot_2: SpotifyArtist | null;
    slot_3: SpotifyArtist | null;
    slot_4: SpotifyArtist | null;
    slot_5: SpotifyArtist | null;
};

export type SaveTeamResult = {
    success: boolean;
    message: string;
    errors?: Record<string, string>;
};

export async function saveTeamAction(slots: TeamSlots, captainId: string | null): Promise<SaveTeamResult> {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, message: 'Unauthorized' };
    }

    // 2. Get Active Season & Previous Team (Moved up for validation context)
    const currentSeason = await getCurrentSeasonAction();
    if (!currentSeason) {
        return { success: false, message: 'No active season found' };
    }

    // Fetch Previous Team (Latest Saved) for Validation & Cost Calculation
    const { data: previousTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .eq('season_id', currentSeason.id)
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    // 3. Validation
    const errors: Record<string, string> = {};
    const artists: SpotifyArtist[] = [];

    // Helper to validate slot
    const validateSlot = (slotKey: keyof TeamSlots, artist: SpotifyArtist | null, minPop: number, maxPop: number, label: string, previousArtistId?: string | null) => {
        if (!artist) {
            errors[slotKey] = 'Slot is empty';
            return;
        }

        // Grandfathering Check: If artist hasn't changed, skip popularity validation
        if (previousArtistId && artist.id === previousArtistId) {
            artists.push(artist);
            return;
        }

        if (artist.popularity < minPop || artist.popularity > maxPop) {
            errors[slotKey] = `Artist must be ${label} (Pop: ${minPop}-${maxPop === 100 ? '100' : maxPop})`;
        }
        artists.push(artist);
    };

    validateSlot('slot_1', slots.slot_1, ARTIST_TIERS.BIG.min, ARTIST_TIERS.BIG.max, `${ARTIST_TIERS.BIG.label} (>65)`, previousTeam?.slot_1_id);
    validateSlot('slot_2', slots.slot_2, ARTIST_TIERS.MID.min, ARTIST_TIERS.MID.max, `${ARTIST_TIERS.MID.label} (${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max})`, previousTeam?.slot_2_id);
    validateSlot('slot_3', slots.slot_3, ARTIST_TIERS.MID.min, ARTIST_TIERS.MID.max, `${ARTIST_TIERS.MID.label} (${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max})`, previousTeam?.slot_3_id);
    validateSlot('slot_4', slots.slot_4, ARTIST_TIERS.NEW_GEN.min, ARTIST_TIERS.NEW_GEN.max, `${ARTIST_TIERS.NEW_GEN.label} (<55)`, previousTeam?.slot_4_id);
    validateSlot('slot_5', slots.slot_5, ARTIST_TIERS.NEW_GEN.min, ARTIST_TIERS.NEW_GEN.max, `${ARTIST_TIERS.NEW_GEN.label} (<55)`, previousTeam?.slot_5_id);

    // Validate Captain
    if (captainId) {
        const isCaptainInTeam = artists.some(a => a.id === captainId);
        if (!isCaptainInTeam) {
            errors['captain'] = 'Captain must be one of the selected artists';
        }
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, message: 'Validation failed', errors };
    }

    try {
        // 4. Determine Target Week
        // Fetch the latest snapshot week to determine current week
        const { data: latestSnap } = await supabase
            .from('weekly_snapshots')
            .select('week_number')
            .order('week_number', { ascending: false })
            .limit(1)
            .single();

        const currentWeek = latestSnap?.week_number || 1;

        // Check if user has ANY team for this season
        const { data: existingSeasonTeam } = await supabase
            .from('teams')
            .select('week_number')
            .eq('user_id', user.id)
            .eq('season_id', currentSeason.id)
            .limit(1);

        // UX Nuance: If First Team of Season -> Current Week. Else -> Next Week.
        const targetWeek = (!existingSeasonTeam || existingSeasonTeam.length === 0) ? currentWeek : currentWeek + 1;

        // Previous Team is already fetched above

        const { data: profile } = await supabase
            .from('profiles')
            .select('musi_coins, total_score')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return { success: false, message: 'Profile not found' };
        }

        // 6. Calculate Cost
        // 6. Calculate Cost
        let cost = 0;

        // Calculate changes against the LAST SAVED team (previousTeam)
        // This ensures incremental updates (paying only for new changes)
        if (previousTeam) {
            let changedArtists = 0;
            const newIds = [slots.slot_1!.id, slots.slot_2!.id, slots.slot_3!.id, slots.slot_4!.id, slots.slot_5!.id];
            const oldIds = [previousTeam.slot_1_id, previousTeam.slot_2_id, previousTeam.slot_3_id, previousTeam.slot_4_id, previousTeam.slot_5_id];

            for (let i = 0; i < 5; i++) {
                if (newIds[i] !== oldIds[i]) {
                    changedArtists++;
                }
            }

            cost += changedArtists * 20;

            if (previousTeam.captain_id && captainId && previousTeam.captain_id !== captainId) {
                cost += 10;
            }
        }
        // If no previousTeam (First team of season), cost remains 0 (Free)
        if (!previousTeam) {
            // IMMEDIATE SNAPSHOT LOGIC
            // Ensure selected artists are in the current week's snapshot
            const artistIds = artists.map(a => a.id);

            // Check existing snapshots for these artists
            const { data: existingSnapshots } = await supabase
                .from('weekly_snapshots')
                .select('artist_id')
                .eq('week_number', currentWeek)
                .in('artist_id', artistIds);

            const existingSnapshotIds = new Set(existingSnapshots?.map(s => s.artist_id) || []);

            const missingArtists = artists.filter(a => !existingSnapshotIds.has(a.id));

            if (missingArtists.length > 0) {
                const newSnapshots = missingArtists.map(artist => ({
                    week_number: currentWeek,
                    artist_id: artist.id,
                    popularity: artist.popularity,
                    followers: artist.followers.total
                }));

                const { error: snapError } = await supabase
                    .from('weekly_snapshots')
                    .insert(newSnapshots);

                if (snapError) {
                    console.error('Immediate Snapshot Error:', snapError);
                    // Non-blocking error, but worth logging
                }
            }

            // INSTANT SCORING LOGIC (UX Only)
            // Use already saved scores for the current week if any
            try {
                const { data: currentScores } = await supabase
                    .from('weekly_scores')
                    .select('artist_id, total_points')
                    .eq('week_number', currentWeek)
                    .in('artist_id', artistIds);

                const { data: featured } = await supabase.from('featured_artists').select('spotify_id');
                const featuredIds = new Set(featured?.map(f => f.spotify_id) || []);
                const scoreMap = Object.fromEntries(currentScores?.map(s => [s.artist_id, s.total_points]) || []);

                let instantScore = 0;
                for (const artist of artists) {
                    let points = scoreMap[artist.id] || 0;

                    // Apply Multipliers
                    if (captainId === artist.id) {
                        points = Math.round(points * (featuredIds.has(artist.id) ? 2 : 1.5));
                    }
                    instantScore += points;
                }

                if (instantScore > 0) {
                    await supabase
                        .from('profiles')
                        .update({ total_score: (profile?.total_score || 0) + instantScore })
                        .eq('id', user.id);
                }
            } catch (scoringError) {
                console.error('Instant Scoring Error:', scoringError);
            }
        }

        // 7. Check Balance & Deduct
        if (cost > 0) {
            if (profile.musi_coins < cost) {
                return { success: false, message: `Insufficient MusiCoins. Cost: ${cost}, Available: ${profile.musi_coins}` };
            }

            // Deduct coins
            const { error: deductError } = await supabase
                .from('profiles')
                .update({ musi_coins: profile.musi_coins - cost })
                .eq('id', user.id);

            if (deductError) {
                console.error('Coin Deduction Error:', deductError);
                return { success: false, message: 'Failed to process payment' };
            }
        }

        // 7. Cache Artists
        const artistsToUpsert = artists.map(artist => ({
            spotify_id: artist.id,
            name: artist.name,
            image_url: artist.images[0]?.url || '',
            current_popularity: artist.popularity,
            current_followers: artist.followers.total,
            last_updated: new Date().toISOString()
        }));

        const { error: cacheError } = await supabase
            .from('artists_cache')
            .upsert(artistsToUpsert, { onConflict: 'spotify_id' });

        if (cacheError) {
            console.error('Cache Error:', cacheError);
            return { success: false, message: 'Failed to cache artists' };
        }

        // 8. Save Team (Versioned)
        const teamData = {
            user_id: user.id,
            week_number: targetWeek,
            slot_1_id: slots.slot_1!.id,
            slot_2_id: slots.slot_2!.id,
            slot_3_id: slots.slot_3!.id,
            slot_4_id: slots.slot_4!.id,
            slot_5_id: slots.slot_5!.id,
            captain_id: captainId,
            season_id: currentSeason.id,
            locked_at: new Date().toISOString()
        };

        const { error: teamError } = await supabase
            .from('teams')
            .upsert(teamData, { onConflict: 'user_id, week_number, season_id' });

        if (teamError) {
            console.error('Team Save Error:', teamError);
            return { success: false, message: 'Failed to save team' };
        }

        revalidatePath('/dashboard');
        return { success: true, message: `Team saved for Week ${targetWeek}!` };

    } catch (error) {
        console.error('Unexpected Error:', error);
        return { success: false, message: 'An unexpected error occurred' };
    }
}

export type UserTeamResponse = {
    slot_1: SpotifyArtist | null;
    slot_2: SpotifyArtist | null;
    slot_3: SpotifyArtist | null;
    slot_4: SpotifyArtist | null;
    slot_5: SpotifyArtist | null;
    captain_id?: string | null;
    season_id?: string | null;
    week_number: number;
} | null;

export async function getUserTeamAction(weekNumber?: number): Promise<UserTeamResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get Active Season
    const currentSeason = await getCurrentSeasonAction();
    if (!currentSeason) return null;

    let query = supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .eq('season_id', currentSeason.id);

    if (weekNumber) {
        // Fetch specific week
        query = query.eq('week_number', weekNumber);
    } else {
        // Fetch latest week (Draft Mode default)
        query = query.order('week_number', { ascending: false }).limit(1);
    }

    const { data: teams } = await query;

    // Handle single result from array
    const team = teams && teams.length > 0 ? teams[0] : null;

    if (!team) {
        // If requesting specific week and not found, try to find the latest previous week to "carry over"
        if (weekNumber) {
            const { data: prevTeams } = await supabase
                .from('teams')
                .select('*')
                .eq('user_id', user.id)
                .eq('season_id', currentSeason.id)
                .lt('week_number', weekNumber)
                .order('week_number', { ascending: false })
                .limit(1);

            if (prevTeams && prevTeams.length > 0) {
                const prevTeam = prevTeams[0];
                return fetchArtistsForTeam(prevTeam, supabase);
            }
        }
        return null;
    }

    return fetchArtistsForTeam(team, supabase);
}

async function fetchArtistsForTeam(team: any, supabase: any): Promise<UserTeamResponse> {
    // Fetch artists for all slots
    const artistIds = [
        team.slot_1_id,
        team.slot_2_id,
        team.slot_3_id,
        team.slot_4_id,
        team.slot_5_id
    ].filter(Boolean);

    if (artistIds.length === 0) return null;

    const { data: artists } = await supabase
        .from('artists_cache')
        .select('*')
        .in('spotify_id', artistIds);

    if (!artists) return null;

    // Map artists back to slots
    const getArtist = (id: string | null): SpotifyArtist | null => {
        if (!id) return null;
        const artistData = artists.find((a: any) => a.spotify_id === id);
        if (!artistData) return null;

        return {
            id: artistData.spotify_id,
            name: artistData.name,
            external_urls: { spotify: '' },
            images: [{ url: artistData.image_url, height: 0, width: 0 }],
            popularity: artistData.current_popularity,
            genres: [], // Not stored in cache currently
            followers: { total: artistData.current_followers }
        };
    };

    return {
        slot_1: getArtist(team.slot_1_id),
        slot_2: getArtist(team.slot_2_id),
        slot_3: getArtist(team.slot_3_id),
        slot_4: getArtist(team.slot_4_id),
        slot_5: getArtist(team.slot_5_id),
        captain_id: team.captain_id,
        season_id: team.season_id,
        week_number: team.week_number
    };
}
