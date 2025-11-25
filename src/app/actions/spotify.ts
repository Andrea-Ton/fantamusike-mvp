'use server';

import { searchArtists, SpotifyArtist } from '@/lib/spotify';

export async function searchArtistsAction(query: string): Promise<{ success: boolean; data?: SpotifyArtist[]; error?: string }> {
    try {
        if (!query || query.trim().length < 2) {
            return { success: true, data: [] };
        }

        const artists = await searchArtists(query);
        return { success: true, data: artists };
    } catch (error) {
        console.error('Spotify Search Error:', error);
        return { success: false, error: 'Failed to search artists' };
    }
}
