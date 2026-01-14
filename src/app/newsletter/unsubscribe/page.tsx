'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { unsubscribeUser } from '@/app/actions/email-preferences';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function UnsubscribePage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Caricamento...</h2>
                </div>
            </div>
        }>
            <UnsubscribeContent />
        </React.Suspense>
    );
}

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!id) {
            setStatus('error');
            setMessage('Link non valido. ID utente mancante.');
            return;
        }

        const performUnsubscribe = async () => {
            try {
                // Pass token if present (for secure unsubscribe)
                const result = await unsubscribeUser(id, token || undefined);
                if (result.success) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setMessage(result.error || 'Errore durante la disiscrizione.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Si è verificato un errore inaspettato.');
            }
        };

        performUnsubscribe();
    }, [id]);

    return (
        <div className="min-h-screen bg-[#0b0b10] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-3xl p-8 shadow-2xl text-center">

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Elaborazione...</h2>
                        <p className="text-gray-400">Ti stiamo disiscrivendo dalla newsletter.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="text-green-500 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Disiscrizione completata</h2>
                        <p className="text-gray-400 mb-6">
                            Non riceverai più email di marketing da FantaMusiké. Le comunicazioni di servizio relative al tuo account rimarranno attive.
                        </p>
                        <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                            Torna alla Home
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="text-red-500 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Qualcosa è andato storto</h2>
                        <p className="text-red-400 mb-6">{message}</p>
                        <Link href="/" className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                            Torna alla Home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
