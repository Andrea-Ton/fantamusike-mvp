'use client';

import React, { useState } from 'react';
import { updateEmailPreferences } from '@/app/actions/email-preferences';
import { Loader2 } from 'lucide-react';

export default function PrivacySettings({ initialOptIn }: { initialOptIn: boolean }) {
    const [optIn, setOptIn] = useState(initialOptIn);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleToggle = async () => {
        setIsLoading(true);
        setMessage(null);

        const newValue = !optIn;
        const result = await updateEmailPreferences(newValue);

        if (result.success) {
            setOptIn(newValue);
            setMessage(newValue ? 'Hai attivato le comunicazioni marketing.' : 'Hai disattivato le comunicazioni marketing.');
        } else {
            setMessage('Errore durante l\'aggiornamento. Riprova.');
        }

        setIsLoading(false);
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="bg-[#0b0b10] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">Email Marketing e Aggiornamenti</h4>
                    <p className="text-sm text-gray-400">
                        Ricevi notizie su nuove funzionalità, sondaggi e promozioni speciali.
                    </p>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1a1a24] ${optIn ? 'bg-purple-600' : 'bg-gray-600'
                        } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${optIn ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {message && (
                <div className="mt-4 text-sm text-center animate-fade-in font-medium text-purple-400">
                    {message}
                </div>
            )}
        </div>
    );
}
