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
        <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-500 shadow-2xl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>

            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 relative z-10">
                <div className="flex gap-5">
                    <div className="p-4 bg-white/5 rounded-2xl h-fit border border-white/5 flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Bell size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <h4 className="font-black text-white italic uppercase tracking-tighter text-lg mb-1 flex items-center gap-2 flex-wrap">
                            Aggiornamenti & Novità
                            <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                        </h4>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed max-w-sm group-hover:text-gray-400 transition-colors">
                            Ricevi notifiche su nuove funzionalità, sondaggi esclusivi e promozioni speciali. Nessuno spam.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end w-full sm:w-auto">
                    <button
                        onClick={handleToggle}
                        disabled={isLoading}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 ${optIn
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                            : 'bg-white/10 border border-white/10'
                            } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} flex-shrink-0 group/toggle`}
                    >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-2xl transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${optIn ? 'translate-x-7 scale-90' : 'translate-x-1 scale-90'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {message && (
                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-fade-in-up text-purple-400 flex items-center justify-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></div>
                    {message}
                </div>
            )}
        </div>
    );
}
