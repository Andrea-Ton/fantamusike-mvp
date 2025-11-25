const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
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
};

export type SearchArtistsResponse = {
    artists: {
        items: SpotifyArtist[];
    };
};

async function getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        next: { revalidate: 3500 }, // Cache for slightly less than 1 hour (3600s)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Spotify token: ${response.statusText}`);
    }

    const data: SpotifyToken = await response.json();
    return data.access_token;
}

export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
    const token = await getAccessToken();

    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to search artists: ${response.statusText}`);
    }

    const data: SearchArtistsResponse = await response.json();
    return data.artists.items;
}

export type SpotifyAlbum = {
    id: string;
    name: string;
    release_date: string;
    album_type: 'album' | 'single' | 'compilation';
    total_tracks: number;
};

export async function getArtistReleases(artistId: string): Promise<SpotifyAlbum[]> {
    const token = await getAccessToken();

    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=5&market=IT`,
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
    return data.items;
}
