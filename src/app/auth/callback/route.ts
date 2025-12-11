import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.session) {
            // Check if we have provider tokens (from Spotify login)
            const { provider_token, provider_refresh_token, user } = data.session;

            if (provider_token && provider_refresh_token && user) {
                // Store/Update Spotify tokens
                const { error: tokenError } = await supabase
                    .from('spotify_tokens')
                    .upsert({
                        user_id: user.id,
                        access_token: provider_token,
                        refresh_token: provider_refresh_token,
                        expires_at: Math.floor(Date.now() / 1000) + 3600, // Assuming 1 hour expiry which is standard
                        updated_at: new Date().toISOString()
                    });

                if (tokenError) {
                    console.error('Error saving Spotify tokens:', tokenError);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
