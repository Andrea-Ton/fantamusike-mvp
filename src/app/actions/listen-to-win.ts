'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Configuration
const DAILY_CAP_TRACKS_PER_ARTIST = 5;

interface SpotifyTrack {
    track: {
        id: string;
        name: string;
        artists: { id: string; name: string }[];
    };
    played_at: string;
}

export async function disconnectSpotify() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Utente non autenticato' };
    }

    // Delete tokens from spotify_tokens table
    const { error } = await supabase
        .from('spotify_tokens')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error disconnecting Spotify:', error);
        return { success: false, message: 'Errore durante la disconnessione' };
    }

    // Also clear last_spotify_sync to allow re-syncing from scratch if they reconnect
    await supabase.from('profiles').update({ last_spotify_sync: null }).eq('id', user.id);

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'Disconnesso con successo' };
}

export async function syncListeningHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Non autenticato.' };
    }

    // 1. Get Spotify Tokens
    const { data: tokens, error: tokenError } = await supabase
        .from('spotify_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (tokenError || !tokens) {
        return { success: false, message: 'Account Spotify non collegato.' };
    }

    // 2. Check Expiry & Refresh if needed
    let accessToken = tokens.access_token;
    if (Date.now() / 1000 > tokens.expires_at) {
        const refreshResult = await refreshSpotifyToken(tokens.refresh_token);
        if (!refreshResult.success) {
            return { success: false, message: 'Sessione Spotify scaduta. Ricollega l\'account.' };
        }
        accessToken = refreshResult.accessToken;
        // Update DB
        await supabase.from('spotify_tokens').update({
            access_token: accessToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
    }

    // 3. Fetch Recently Played from Spotify
    // We get 50 items. Note: Spotify allows fetching 'after' timestamp, 
    // but the cursor is unix timestamp in ms.

    // Get last sync time to optimize
    const { data: profile } = await supabase
        .from('profiles')
        .select('last_spotify_sync')
        .eq('id', user.id)
        .single();

    const lastSyncTime = profile?.last_spotify_sync ? new Date(profile.last_spotify_sync).getTime() : 0;

    const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${lastSyncTime}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        console.error('Spotify API Error:', await response.text());
        return { success: false, message: 'Errore API Spotify.' };
    }

    const spotifyData = await response.json();
    const items: SpotifyTrack[] = spotifyData.items || [];

    if (items.length === 0) {
        return { success: true, pointsEarned: 0, tracksProcessed: 0, message: 'Nessun nuovo ascolto trovato.' };
    }

    // 4. Fetch User's Roster (Team) & Artist Popularity
    // We need to know which artists are in the user's team
    const { data: team } = await supabase
        .from('teams')
        .select(`
            slot_1_id, slot_2_id, slot_3_id, slot_4_id, slot_5_id,
            a1:slot_1_id(current_popularity),
            a2:slot_2_id(current_popularity),
            a3:slot_3_id(current_popularity),
            a4:slot_4_id(current_popularity),
            a5:slot_5_id(current_popularity)
        `)
        .eq('user_id', user.id)
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    if (!team) {
        return { success: false, message: 'Nessuna squadra attiva trovata.' };
    }

    // Create a Map of ArtistID -> Popularity
    const rosterMap = new Map<string, number>();
    if (team.slot_1_id) rosterMap.set(team.slot_1_id, (team.a1 as any)?.current_popularity || 0);
    if (team.slot_2_id) rosterMap.set(team.slot_2_id, (team.a2 as any)?.current_popularity || 0);
    if (team.slot_3_id) rosterMap.set(team.slot_3_id, (team.a3 as any)?.current_popularity || 0);
    if (team.slot_4_id) rosterMap.set(team.slot_4_id, (team.a4 as any)?.current_popularity || 0);
    if (team.slot_5_id) rosterMap.set(team.slot_5_id, (team.a5 as any)?.current_popularity || 0);

    // 5. Process Tracks
    let totalPoints = 0;
    let validTracksCount = 0;
    let processedDetails: any[] = [];

    // Sort items by played_at ascending so we process oldest first
    const sortedItems = items.sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime());

    let newLastSync = null;

    for (const item of sortedItems) {
        const playedAt = new Date(item.played_at);
        newLastSync = item.played_at; // Keep track of the latest timestamp processed

        // Skip if older than last sync (redundant if using 'after' param, but safe)
        if (playedAt.getTime() <= lastSyncTime) continue;

        // Check if any artist on the track is in the roster
        const rosterArtist = item.track.artists.find(a => rosterMap.has(a.id));

        if (!rosterArtist) continue;

        const popularity = rosterMap.get(rosterArtist.id)!;

        // Calculate Points
        // Formula: Floor((100 - Pop) / 10)
        let points = Math.floor((100 - popularity) / 10);
        if (points < 1) points = 1;

        // Check Daily Limit
        // Get start of day for the played_at time (using UTC)
        const dayStart = new Date(playedAt);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(playedAt);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const { count } = await supabase
            .from('listen_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('artist_id', rosterArtist.id)
            .gt('points_awarded', 0) // Only count scored streams
            .gte('played_at', dayStart.toISOString())
            .lte('played_at', dayEnd.toISOString());

        // Check local batch count as well (if user played same artist multiple times in this batch)
        const localCount = processedDetails.filter(p =>
            p.artist_id === rosterArtist.id &&
            new Date(p.played_at).toDateString() === playedAt.toDateString() &&
            p.points > 0
        ).length;

        if ((count || 0) + localCount >= DAILY_CAP_TRACKS_PER_ARTIST) {
            points = 0; // Cap reached
        }

        // Add to batch
        processedDetails.push({
            user_id: user.id,
            artist_id: rosterArtist.id,
            track_name: item.track.name,
            played_at: item.played_at,
            points_awarded: points,
            // helper for batch count
            points: points
        });

        if (points > 0) {
            // We calculate points here, but add to totalPoints only after successful insert
        }
    }

    // 6. Insert & Process Points
    if (processedDetails.length > 0) {
        // We process inserts sequentially (or could be parallel) to handle duplicates individually.
        // If we used batch insert, one duplicate would fail the whole batch (OR we'd need complex upsert logic).
        // Given max 50 items, sequential processing is acceptable and robust.

        for (const detail of processedDetails) {
            // Remove the helper 'points' property we added for local counting
            const { points, ...dbRow } = detail;

            const { error: insertError } = await supabase
                .from('listen_history')
                .insert(dbRow);

            if (!insertError) {
                // Insert success -> This is a NEW record
                if (detail.points_awarded > 0) {
                    totalPoints += detail.points_awarded;
                    validTracksCount++;
                }
            } else if (insertError.code === '23505') {
                // Duplicate detected (User ID + Played At constraint)
                // We ignore it. It means we already processed this stream.
                // We do NOT add points.
            } else {
                console.error('Error saving listen history:', insertError);
                // We continue processing other tracks even if one fails
            }
        }

        // 7. Update User Score with Actual Points Earned
        if (totalPoints > 0) {
            const { data: currentProfile } = await supabase.from('profiles').select('total_score').eq('id', user.id).single();
            const newScore = (currentProfile?.total_score || 0) + totalPoints;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ total_score: newScore })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating score:', updateError);
            }
        }
    }

    // Update Last Sync (even if no points, to advance cursor)
    if (newLastSync) {
        await supabase.from('profiles').update({ last_spotify_sync: newLastSync }).eq('id', user.id);
    }

    revalidatePath('/dashboard');
    return {
        success: true,
        pointsEarned: totalPoints,
        tracksProcessed: validTracksCount,
        details: processedDetails.map(p => ({
            artist: p.artist_id, // We might want artist name here, but we have rosterMap with IDs. The UI can try to look it up or we pass name. 
            // Wait, I didn't save artist name in processedDetails, only ID.
            // Let's rely on track_name for now or update processedDetails to include artist name.
            track: p.track_name,
            points: p.points,
            played_at: p.played_at
        })),
        message: `Sincronizzazione completata! +${totalPoints} Punti.`
    };
}

async function refreshSpotifyToken(refreshToken: string) {
    // Spotify Refresh Token Flow
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('Missing Spotify Credentials in Env');
        return { success: false };
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Refresh Failed:', data);
            return { success: false };
        }

        return { success: true, accessToken: data.access_token };
    } catch (e) {
        return { success: false };
    }
}
