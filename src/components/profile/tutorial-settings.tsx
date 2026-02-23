'use client';

import React, { useState } from 'react';
import { HelpCircle, RefreshCcw, Check } from 'lucide-react';
import { resetTutorialAction } from '@/app/actions/tour';
import { useRouter } from 'next/navigation';

export default function TutorialSettings() {
    const [isResetting, setIsResetting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        setIsResetting(true);
        const result = await resetTutorialAction();

        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                router.push('/dashboard');
            }, 1500);
        }
        setIsResetting(false);
    };

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden mt-8">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Aiuto & Tutorial</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Guide e Istruzioni</p>
                    </div>
                    <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                        <HelpCircle size={20} className="text-purple-400" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-md">
                        <h4 className="text-white font-black uppercase tracking-widest text-[11px] mb-2">Riavvia Tutorial</h4>
                        <p className="text-gray-500 text-sm font-medium">
                            Vuoi rivedere la panoramica iniziale delle funzionalità? Clicca sul tasto dedicato per riavviare il tour guidato.
                        </p>
                    </div>

                    <button
                        onClick={handleReset}
                        disabled={isResetting || isSuccess}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-tighter italic transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 min-w-[200px] justify-center ${isSuccess
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-purple-500/20'
                            }`}
                    >
                        {isResetting ? (
                            <RefreshCcw size={18} className="animate-spin" />
                        ) : isSuccess ? (
                            <>
                                <Check size={18} />
                                <span>Pronto!</span>
                            </>
                        ) : (
                            <>
                                <RefreshCcw size={18} />
                                <span>Riavvia Tour</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
