'use server';

import { createClient } from '@/utils/supabase/server';
import { SpotifyArtist } from '@/lib/spotify';
import { revalidatePath } from 'next/cache';
import { getCurrentSeasonAction } from './season';

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

    validateSlot('slot_1', slots.slot_1, 76, 100, 'Big (>75)', previousTeam?.slot_1_id);
    validateSlot('slot_2', slots.slot_2, 30, 75, 'Mid Tier (30-75)', previousTeam?.slot_2_id);
    validateSlot('slot_3', slots.slot_3, 30, 75, 'Mid Tier (30-75)', previousTeam?.slot_3_id);
    validateSlot('slot_4', slots.slot_4, 0, 29, 'New Gen (<30)', previousTeam?.slot_4_id);
    validateSlot('slot_5', slots.slot_5, 0, 29, 'New Gen (<30)', previousTeam?.slot_5_id);

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
            .select('musi_coins')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return { success: false, message: 'Profile not found' };
        }

        // 6. Calculate Cost
        let cost = 0;

        // Fetch "Active Team" (Week <= Current) for this season
        const { data: activeTeam } = await supabase
            .from('teams')
            .select('*')
            .eq('user_id', user.id)
            .eq('season_id', currentSeason.id) // Filter by Season (New Season = Free)
            .lte('week_number', currentWeek)
            .order('week_number', { ascending: false })
            .limit(1)
            .single();

        if (activeTeam) {
            // Calculate changes from Active Team
            let changedArtists = 0;
            const newIds = [slots.slot_1!.id, slots.slot_2!.id, slots.slot_3!.id, slots.slot_4!.id, slots.slot_5!.id];
            const oldIds = [activeTeam.slot_1_id, activeTeam.slot_2_id, activeTeam.slot_3_id, activeTeam.slot_4_id, activeTeam.slot_5_id];

            for (let i = 0; i < 5; i++) {
                if (newIds[i] !== oldIds[i]) {
                    changedArtists++;
                }
            }

            cost += changedArtists * 20;

            if (activeTeam.captain_id && captainId && activeTeam.captain_id !== captainId) {
                cost += 10;
            }
        }
        // If no activeTeam (First team of season), cost remains 0 (Free)

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

    let query = supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id);

    if (weekNumber) {
        // Fetch specific week
        query = query.eq('week_number', weekNumber);
    } else {
        // Fetch latest week (Draft Mode default)
        query = query.order('week_number', { ascending: false }).limit(1);
    }

    const { data: teams, error } = await query;

    // Handle single result from array
    const team = teams && teams.length > 0 ? teams[0] : null;

    if (!team) {
        // If requesting specific week and not found, try to find the latest previous week to "carry over"
        if (weekNumber) {
            const { data: prevTeams } = await supabase
                .from('teams')
                .select('*')
                .eq('user_id', user.id)
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
