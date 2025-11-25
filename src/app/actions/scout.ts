'use server';

import { createClient } from '@/utils/supabase/server';

export type ScoutSuggestion = {
    spotify_id: string;
    name: string;
    image_url: string;
    genre: string | null;
    popularity: number;
};

export async function getScoutSuggestionsAction(): Promise<ScoutSuggestion[]> {
    const supabase = await createClient();

    // Fetch 3 random active artists
    // Note: 'random()' is a PostgreSQL function. Supabase JS client doesn't support .order('random()') directly in a clean way for large datasets,
    // but for a small curated list, we can fetch active ones and shuffle in JS, or use a stored procedure.
    // Given the MVP nature and likely small size of curated_roster (<100), fetching all active and shuffling is acceptable and robust.

    const { data: artists, error } = await supabase
        .from('curated_roster')
        .select('*')
        .eq('is_active', true);

    if (error || !artists) {
        console.error('Error fetching curated roster:', error);
        return [];
    }

    // Shuffle and pick 3
    const shuffled = artists.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(a => ({
        spotify_id: a.spotify_id,
        name: a.name,
        image_url: a.image_url,
        genre: a.genre,
        popularity: a.popularity,
    }));
}
