'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

export default function InviteButton({ referralCode }: { referralCode?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
                <Share2 size={16} />
                Invita Amico
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-[#1a1a24] border border-white/10 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="text-white font-bold mb-1">Invita un amico</h4>
                        <p className="text-xs text-gray-400 mb-3">Condividi il tuo codice. Entrambi riceverete <span className="text-yellow-400 font-bold">30 MusiCoins</span>!</p>

                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/5">
                            <code className="flex-1 text-center font-mono font-bold text-purple-300 text-lg tracking-wider">
                                {referralCode || 'LOADING...'}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/10 rounded-md transition-colors"
                                title="Copia codice"
                            >
                                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
