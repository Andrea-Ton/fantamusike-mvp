'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, Music, Check, AlertCircle } from 'lucide-react';
import { syncListeningHistory } from '@/app/actions/listen-to-win';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface SyncButtonProps {
    isConnected: boolean;
}

export default function SyncButton({ isConnected }: SyncButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        points: number;
        count: number;
        message: string;
        details?: any[];
    } | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'spotify',
                options: {
                    scopes: 'user-read-recently-played',
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                    queryParams: { show_dialog: 'true' }
                },
            });

            if (data?.url) {
                window.location.href = data.url;
            } else if (error) {
                console.error('Connection Error:', error);
                alert('Errore di connessione: ' + error.message);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Connection Error:', error);
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await syncListeningHistory();

            setResult({
                success: response.success,
                points: response.pointsEarned || 0,
                count: response.tracksProcessed || 0,
                message: response.message || 'Errore sconosciuto',
                details: response.details
            });
            setIsOpen(true);
            router.refresh();
        } catch (error) {
            setResult({
                success: false,
                points: 0,
                count: 0,
                message: 'Errore di comunicazione col server.',
            });
            setIsOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = isConnected ? handleSync : handleConnect;

    return (
        <>
            <button
                onClick={handleClick}
                disabled={isLoading}
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors cursor-pointer group"
            >
                {isLoading ? (
                    <RefreshCw size={18} className="text-white animate-spin" />
                ) : (
                    <div className="relative w-5 h-5 flex-shrink-0">
                        <Image
                            src="/spotify_icon_white.png"
                            alt="Spotify"
                            fill
                            className="object-contain"
                        />
                    </div>
                )}
                <span className="text-sm font-bold text-white">
                    {isLoading ? 'Loading...' : (isConnected ? 'Ottieni punti' : 'Collega Spotify')}
                </span>
            </button>

            {/* Result Modal - Portaled to body to escape parent transforms */}
            {isOpen && result && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 relative z-[101]">

                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {result.success ? <Check size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">
                                    {result.success ? 'Sincronizzazione Completata' : 'Errore'}
                                </h3>
                                <p className="text-sm text-gray-400">{result.message}</p>
                            </div>
                        </div>

                        {result.success && result.points > 0 && (
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                                <p className="text-purple-200 text-sm font-medium">Hai guadagnato</p>
                                <p className="text-4xl font-bold text-white my-1">+{result.points}</p>
                                <p className="text-purple-200 text-sm">Punti FantaMusiké</p>
                            </div>
                        )}

                        {result.details && result.details.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {result.details.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Music size={12} className="text-gray-500 flex-shrink-0" />
                                            <span className="text-gray-300 truncate">{item.track}</span>
                                        </div>
                                        <span className={`font-bold ${item.points > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                            +{item.points}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
