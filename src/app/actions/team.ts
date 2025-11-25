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

    // 2. Validation
    const errors: Record<string, string> = {};
    const artists: SpotifyArtist[] = [];

    // Helper to validate slot
    const validateSlot = (slotKey: keyof TeamSlots, artist: SpotifyArtist | null, minPop: number, maxPop: number, label: string) => {
        if (!artist) {
            errors[slotKey] = 'Slot is empty';
            return;
        }
        if (artist.popularity < minPop || artist.popularity > maxPop) {
            errors[slotKey] = `Artist must be ${label} (Pop: ${minPop}-${maxPop === 100 ? '100' : maxPop})`;
        }
        artists.push(artist);
    };

    validateSlot('slot_1', slots.slot_1, 76, 100, 'Big (>75)');
    validateSlot('slot_2', slots.slot_2, 30, 75, 'Mid Tier (30-75)');
    validateSlot('slot_3', slots.slot_3, 30, 75, 'Mid Tier (30-75)');
    validateSlot('slot_4', slots.slot_4, 0, 29, 'New Gen (<30)');
    validateSlot('slot_5', slots.slot_5, 0, 29, 'New Gen (<30)');

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
        // 3. Get Active Season
        const currentSeason = await getCurrentSeasonAction();
        if (!currentSeason) {
            return { success: false, message: 'No active season found' };
        }

        // 4. Fetch Current Team & Profile (for coins)
        const { data: currentTeam } = await supabase
            .from('teams')
            .select('*')
            .eq('user_id', user.id)
            .single();

        const { data: profile } = await supabase
            .from('profiles')
            .select('musi_coins')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return { success: false, message: 'Profile not found' };
        }

        // 5. Calculate Cost
        let cost = 0;
        const isNewSeasonEntry = !currentTeam?.season_id || currentTeam.season_id !== currentSeason.id;

        if (!isNewSeasonEntry && currentTeam) {
            // Calculate changes
            let changedArtists = 0;
            const newIds = [slots.slot_1!.id, slots.slot_2!.id, slots.slot_3!.id, slots.slot_4!.id, slots.slot_5!.id];
            const oldIds = [currentTeam.slot_1_id, currentTeam.slot_2_id, currentTeam.slot_3_id, currentTeam.slot_4_id, currentTeam.slot_5_id];

            // Simple index-based comparison as slots are fixed positions
            for (let i = 0; i < 5; i++) {
                if (newIds[i] !== oldIds[i]) {
                    changedArtists++;
                }
            }

            cost += changedArtists * 20;

            // Captain change cost
            if (currentTeam.captain_id && captainId && currentTeam.captain_id !== captainId) {
                cost += 10;
            }
        }

        // 6. Check Balance & Deduct
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

        // 8. Save Team
        const teamData = {
            user_id: user.id,
            slot_1_id: slots.slot_1!.id,
            slot_2_id: slots.slot_2!.id,
            slot_3_id: slots.slot_3!.id,
            slot_4_id: slots.slot_4!.id,
            slot_5_id: slots.slot_5!.id,
            captain_id: captainId,
            season_id: currentSeason.id, // Always update to current season
            locked_at: new Date().toISOString()
        };

        const { error: teamError } = await supabase
            .from('teams')
            .upsert(teamData, { onConflict: 'user_id' });

        if (teamError) {
            console.error('Team Save Error:', teamError);
            return { success: false, message: 'Failed to save team' };
        }

        revalidatePath('/dashboard');
        return { success: true, message: 'Team saved successfully!' };

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
} | null;

export async function getUserTeamAction(): Promise<UserTeamResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch team
    const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!team) return null;

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
        const artistData = artists.find(a => a.spotify_id === id);
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
        season_id: team.season_id
    };
}
