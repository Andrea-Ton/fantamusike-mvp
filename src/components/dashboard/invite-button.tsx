'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { sendGTMEvent } from '@next/third-parties/google';

export default function InviteButton({ referralCode }: { referralCode?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            setCopied(true);
            sendGTMEvent({ event: 'referral_code_copy', category: 'engagement', source: 'invite_button' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl text-white text-sm font-black uppercase tracking-tighter italic hover:bg-white/10 transition-all shadow-inner flex items-center gap-3 h-full"
            >
                <Share2 size={18} className="text-purple-400" />
                <span>Invita&nbsp;Amico</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-4 w-72 bg-[#0f0f13] border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Invita un amico</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 font-medium">Condividi il tuo codice. Entrambi riceverete <span className="text-yellow-400 font-black">30 MusiCoins</span>!</p>

                        <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-3 border border-white/10 shadow-inner group">
                            <code className="flex-1 text-center font-black italic text-purple-400 text-xl tracking-tighter">
                                {referralCode || 'LOADING...'}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                                title="Copia codice"
                            >
                                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400 group-hover:text-white transition-colors" />}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
