const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing Spotify Client ID or Secret');
}

type SpotifyToken = {
    access_token: string;
    token_type: string;
    expires_in: number;
};

export type SpotifyArtist = {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    popularity: number;
    genres: string[];
    followers: { total: number };
    external_urls: { spotify: string };
};

export type SearchArtistsResponse = {
    artists: {
        items: SpotifyArtist[];
    };
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
    try {
        const response = await fetch(url, options);

        if (response.ok) return response;

        // Retry on 429 (Rate Limit) or 5xx (Server Errors like 503)
        if ((response.status === 429 || response.status >= 500) && retries > 0) {
            console.warn(`Spotify API error ${response.status}. Retrying in ${backoff}ms... (${retries} attempts left)`);
            await wait(backoff);
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed: ${error}. Retrying...`);
            await wait(backoff);
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}

async function getAccessToken(): Promise<string | null> {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    try {
        const response = await fetchWithRetry('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            next: { revalidate: 3500 },
        });

        if (!response.ok) {
            console.error(`Failed to fetch Spotify token: ${response.statusText}`);
            return null;
        }

        const data: SpotifyToken = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error in getAccessToken:', error);
        return null;
    }
}

export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
    const token = await getAccessToken();
    if (!token) return [];

    try {
        const response = await fetchWithRetry(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            console.error(`Failed to search artists: ${response.statusText}`);
            return [];
        }

        const data: SearchArtistsResponse = await response.json();
        return data.artists.items;
    } catch (error) {
        console.error('Error in searchArtists:', error);
        return [];
    }
}

export type SpotifyAlbum = {
    id: string;
    name: string;
    release_date: string;
    album_type: 'album' | 'single' | 'compilation';
    total_tracks: number;
    external_urls: { spotify: string };
};

export async function getArtistReleases(artistId: string): Promise<SpotifyAlbum[]> {
    const token = await getAccessToken();
    if (!token) return [];

    try {
        const response = await fetchWithRetry(
            `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on&limit=50&market=IT`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                next: { revalidate: 3600 }
            }
        );

        if (!response.ok) {
            console.error(`Failed to fetch releases for ${artistId}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const items = (data.items || []) as SpotifyAlbum[];

        // Filter out compilations to avoid "Collections" noise
        const filteredItems = items.filter(item => item.album_type !== 'compilation');

        // Explicitly sort by release_date descending to mix albums and singles chronologically
        return filteredItems.sort((a, b) => b.release_date.localeCompare(a.release_date));
    } catch (error) {
        console.error(`Error in getArtistReleases for ${artistId}:`, error);
        return [];
    }
}

export async function getArtist(artistId: string): Promise<SpotifyArtist | null> {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await fetchWithRetry(
            `https://api.spotify.com/v1/artists/${artistId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                next: { revalidate: 3600 }
            }
        );

        if (!response.ok) {
            console.error(`Failed to fetch artist ${artistId}: ${response.statusText}`);
            return null;
        }

        const data: SpotifyArtist = await response.json();
        return data;
    } catch (error) {
        console.error(`Error in getArtist for ${artistId}:`, error);
        return null;
    }
}
