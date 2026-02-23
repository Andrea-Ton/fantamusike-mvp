'use server';

import { createClient } from '@/utils/supabase/server';
import { searchArtists, SpotifyArtist } from '@/lib/spotify';
import { getFeaturedArtistsAction } from './artist';
import { getCuratedRosterAction } from './scout';

export async function searchDraftArtistsAction(
    query: string,
    mode: 'search' | 'featured' | 'suggested'
): Promise<{ success: boolean; data: SpotifyArtist[]; error?: string }> {
    const supabase = await createClient();
    const cleanQuery = query.trim().toLowerCase();

    try {
        if (mode === 'search') {
            if (!cleanQuery || cleanQuery.length < 2) {
                return { success: true, data: [] };
            }

            // 1. Search in Artists Cache
            const { data: cacheResults, error: cacheError } = await supabase
                .from('artists_cache')
                .select('*')
                .ilike('name', `%${cleanQuery}%`)
                .order('current_popularity', { ascending: false })
                .limit(10);

            let artists: SpotifyArtist[] = (cacheResults || []).map(a => ({
                id: a.spotify_id,
                name: a.name,
                external_urls: { spotify: '' },
                images: [{ url: a.image_url, height: 0, width: 0 }],
                popularity: a.current_popularity,
                genres: [],
                followers: { total: a.current_followers }
            }));

            // 2. If results < 10, fill with Spotify
            if (artists.length < 10) {
                const spotifyResults = await searchArtists(query);

                // Merge and avoid duplicates
                const existingIds = new Set(artists.map(a => a.id));
                const newArtists: SpotifyArtist[] = [];

                for (const sa of spotifyResults) {
                    if (!existingIds.has(sa.id)) {
                        newArtists.push(sa);
                        // Proactively upsert new artist to cache
                        await supabase.from('artists_cache').upsert({
                            spotify_id: sa.id,
                            name: sa.name,
                            image_url: sa.images[0]?.url || '',
                            current_popularity: sa.popularity,
                            current_followers: sa.followers.total,
                            last_updated: new Date().toISOString()
                        }, { onConflict: 'spotify_id' });
                    }
                }

                artists = [...artists, ...newArtists].slice(0, 10);
            }

            // Re-sort to ensure exact matches are at the top if any
            artists.sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                const isExactA = nameA === cleanQuery;
                const isExactB = nameB === cleanQuery;
                if (isExactA && !isExactB) return -1;
                if (!isExactA && isExactB) return 1;
                return b.popularity - a.popularity;
            });

            return { success: true, data: artists };
        }

        if (mode === 'featured') {
            const featured = await getFeaturedArtistsAction();
            if (!cleanQuery) return { success: true, data: featured };

            const filtered = featured.filter(a =>
                a.name.toLowerCase().includes(cleanQuery)
            );
            return { success: true, data: filtered };
        }

        if (mode === 'suggested') {
            const suggested = await getCuratedRosterAction();
            // Map ScoutSuggestion to SpotifyArtist
            const mapped: SpotifyArtist[] = suggested.map(s => ({
                id: s.spotify_id,
                name: s.name,
                external_urls: { spotify: '' },
                images: [{ url: s.image_url, height: 0, width: 0 }],
                popularity: s.popularity,
                genres: [],
                followers: { total: s.followers || 0 }
            }));

            if (!cleanQuery) return { success: true, data: mapped };

            const filtered = mapped.filter(a =>
                a.name.toLowerCase().includes(cleanQuery)
            );
            return { success: true, data: filtered };
        }

        return { success: true, data: [] };
    } catch (err) {
        console.error('Draft Search Action Error:', err);
        return { success: false, data: [], error: 'Search failed' };
    }
}
