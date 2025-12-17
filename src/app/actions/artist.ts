'use server';

import { createClient } from '@/utils/supabase/server';
import { SpotifyArtist } from '@/lib/spotify';

export async function getFeaturedArtistsAction(): Promise<SpotifyArtist[]> {
    const supabase = await createClient();

    // 1. Fetch Featured Artists IDs
    const { data: featured, error } = await supabase
        .from('featured_artists')
        .select('spotify_id');

    if (error || !featured || featured.length === 0) {
        return [];
    }

    const featuredIds = featured.map(f => f.spotify_id);

    // 2. Fetch Artist Details from Cache
    const { data: artists, error: artistError } = await supabase
        .from('artists_cache')
        .select('*')
        .in('spotify_id', featuredIds);

    if (artistError || !artists) {
        return [];
    }

    // 3. Map to SpotifyArtist type
    return artists.map(a => ({
        id: a.spotify_id,
        name: a.name,
        external_urls: { spotify: '' },
        images: [{ url: a.image_url, height: 0, width: 0 }],
        popularity: a.current_popularity,
        genres: [],
        followers: { total: a.current_followers }
    }));
}

export async function toggleFeaturedArtistAction(artistId: string, shouldBeFeatured: boolean) {
    const supabase = await createClient();

    // Check Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    if (shouldBeFeatured) {
        const { error } = await supabase.from('featured_artists').insert({ spotify_id: artistId });
        if (error) {
            // Ignore duplicate key error
            if (error.code === '23505') return { success: true };
            return { success: false, message: error.message };
        }
    } else {
        const { error } = await supabase.from('featured_artists').delete().eq('spotify_id', artistId);
        if (error) return { success: false, message: error.message };
    }

    return { success: true };
}

export async function getArtistAction(artistId: string): Promise<SpotifyArtist | null> {
    const supabase = await createClient();

    const { data: artist, error } = await supabase
        .from('artists_cache')
        .select('*')
        .eq('spotify_id', artistId)
        .single();

    if (error || !artist) {
        return null;
    }

    return {
        id: artist.spotify_id,
        name: artist.name,
        external_urls: { spotify: '' },
        images: [{ url: artist.image_url, height: 0, width: 0 }],
        popularity: artist.current_popularity,
        genres: [],
        followers: { total: artist.current_followers }
    };
}
