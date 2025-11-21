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
        images: [{ url: a.image_url, height: 0, width: 0 }],
        popularity: a.current_popularity,
        genres: [],
        followers: { total: a.current_followers }
    }));
}
