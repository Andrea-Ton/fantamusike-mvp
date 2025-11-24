'use server';

import { createClient } from '@/utils/supabase/server';
import { SpotifyArtist } from '@/lib/spotify';
import { ScoutSuggestion } from './scout';

export async function getCuratedRosterAction(): Promise<ScoutSuggestion[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('curated_roster')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching curated roster:', error);
        return [];
    }

    return data.map(item => ({
        spotify_id: item.spotify_id,
        name: item.name,
        image_url: item.image_url,
        genre: item.genre,
        popularity: item.popularity
    }));
}

export async function addToCuratedRosterAction(artist: SpotifyArtist): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    const { error } = await supabase.from('curated_roster').insert({
        spotify_id: artist.id,
        name: artist.name,
        image_url: artist.images[0]?.url || '',
        genre: artist.genres[0] || 'Unknown',
        popularity: artist.popularity,
        is_active: true
    });

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: false, message: 'Artist already in roster' };
        }
        console.error('Error adding to roster:', error);
        return { success: false, message: 'Failed to add artist' };
    }

    return { success: true, message: 'Artist added to roster' };
}

export async function removeFromCuratedRosterAction(spotifyId: string): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    const { data, error } = await supabase
        .from('curated_roster')
        .delete()
        .eq('spotify_id', spotifyId)
        .select('spotify_id');

    if (error) {
        console.error('Error removing from roster:', error);
        return { success: false, message: 'Failed to remove artist: ' + error.message };
    }

    if (!data || data.length === 0) {
        return { success: false, message: 'Artist not found or already removed' };
    }

    return { success: true, message: 'Artist removed from roster' };
}
