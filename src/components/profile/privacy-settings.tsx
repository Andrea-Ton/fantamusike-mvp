'use client';

import React, { useState } from 'react';
import { updateEmailPreferences } from '@/app/actions/email-preferences';
import { Bell, Sparkles } from 'lucide-react';

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
        // Clear message
        setTimeout(() => setMessage(null), 5000);
    };

    return (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 relative z-10">
                <div className="flex gap-4">
                    <div className="p-3 bg-white/5 rounded-xl h-fit border border-white/5 flex-shrink-0">
                        <Bell size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg mb-1 flex items-center gap-2 flex-wrap">
                            Aggiornamenti & Novità
                            <Sparkles size={14} className="text-yellow-400" />
                        </h4>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                            Ricevi notifiche su nuove funzionalità, sondaggi esclusivi e promozioni speciali. Nessuno spam, promesso.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end w-full sm:w-auto">
                    <button
                        onClick={handleToggle}
                        disabled={isLoading}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1a1a24] ${optIn
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                            : 'bg-white/10'
                            } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} flex-shrink-0`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${optIn ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {message && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm font-medium text-center animate-fade-in-up text-purple-300 flex items-center justify-center gap-2">
                    <Sparkles size={14} />
                    {message}
                </div>
            )}
        </div>
    );
}
