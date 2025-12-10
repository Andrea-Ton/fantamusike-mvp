'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { Loader2, Music, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { disconnectSpotify } from '@/app/actions/listen-to-win';

export default function SpotifyConnect({ isConnected }: { isConnected: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check for error in hash (Supabase Auth redirects often use hash for errors)
        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            const params = new URLSearchParams(hash.substring(1)); // remove #
            const errorCode = params.get('error_code');
            const errorDescription = params.get('error_description');

            if (errorCode === 'identity_already_exists') {
                setErrorMsg('Questo account Spotify è già collegato a un altro utente FantaMusiké.');
            } else if (errorDescription) {
                // Decode + to space if needed
                setErrorMsg(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
            }
        }
    }, []);

    const handleConnect = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            // we use linkIdentity to attach Spotify to the existing user
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'spotify',
                options: {
                    scopes: 'user-read-recently-played',
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`,
                    queryParams: {
                        show_dialog: 'true'
                    }
                },
            });

            if (error) {
                console.error('Spotify Auth Error:', error);
                setErrorMsg(error.message);
                setIsLoading(false);
            } else if (data?.url) {
                // linkIdentity returns a URL we must redirect to
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Connection failed:', error);
            setErrorMsg('Errore di connessione. Riprova.');
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Sei sicuro di voler scollegare il tuo account Spotify?')) return;

        setIsLoading(true);
        try {
            // 1. Unlink identity from Supabase Auth
            const { data: { user } } = await supabase.auth.getUser();
            const spotifyIdentity = user?.identities?.find(id => id.provider === 'spotify');

            if (spotifyIdentity) {
                const { error: unlinkError } = await supabase.auth.unlinkIdentity(spotifyIdentity);
                if (unlinkError) {
                    console.error('Unlink Error:', unlinkError);
                    throw new Error(unlinkError.message);
                }
            }

            // 2. Clean up our custom tokens table
            const result = await disconnectSpotify();
            if (!result.success) {
                // We don't block here if unlink worked, but good to know
                console.error('Token cleanup failed:', result.message);
            }

            // Refresh to update UI
            router.refresh();

        } catch (error: any) {
            console.error('Disconnect failed:', error);
            setErrorMsg(error.message || 'Errore durante la disconnessione.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isConnected) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="p-2 bg-green-500/20 rounded-full">
                        <Music className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-white">Spotify Connesso</h4>
                        <p className="text-sm text-gray-400">Account collegato correttamente</p>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Disconnetti
                    </button>
                </div>
                {errorMsg && (
                    <div className="text-xs text-red-400 flex items-center gap-1 pl-1">
                        <AlertCircle className="w-3 h-3" />
                        {errorMsg}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 bg-black/20 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1DB954]/20 rounded-full">
                    <Music className="w-6 h-6 text-[#1DB954]" />
                </div>
                <div>
                    <h4 className="font-semibold text-white">Collega Spotify</h4>
                    <p className="text-sm text-gray-400">
                        Collega il tuo account per guadagnare punti ascoltando i tuoi artisti.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}

            <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connessione in corso...
                    </>
                ) : (
                    'Connetti Account'
                )}
            </button>
        </div>
    );
}
