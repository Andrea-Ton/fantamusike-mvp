
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // Fetch the external image
        const response = await fetch(url, {
            headers: {
                // Mimic a browser request to avoid some bot protections
                'User-Agent': 'Mozilla/5.0 (compatible; FantaMusikeBot/1.0)',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch image: ${response.status}` }, { status: response.status });
        }

        const blob = await response.blob();
        const headers = new Headers(response.headers);

        // Ensure we send back the correct content type and generous CORS headers for the canvas
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Content-Type', headers.get('Content-Type') || 'image/jpeg');

        return new NextResponse(blob, {
            status: 200,
            headers: headers,
        });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
