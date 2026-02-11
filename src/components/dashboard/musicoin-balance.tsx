'use client';

import React, { useState } from 'react';
import { Coins, Zap, CreditCard, Sparkles, Share2, Copy, Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MusiCoinBalanceProps {
    musiCoins: number;
    referralCode?: string;
}

export default function MusiCoinBalance({ musiCoins, referralCode }: MusiCoinBalanceProps) {
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const packages = [
        { coins: 50, price: '0.99', label: 'Starter' },
        { coins: 120, price: '1.99', label: 'Popular', popular: true },
        { coins: 350, price: '4.99', label: 'Pro' },
        { coins: 1000, price: '9.99', label: 'Legend' },
    ];

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex items-center gap-3 md:gap-4 h-full">
            {/* Balance Display */}
            <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-4 shadow-inner group transition-all hover:bg-white/10 h-16 min-w-[140px] md:min-w-[170px]">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                    <Coins size={22} />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black leading-none mb-1">IL TUO SALDO</span>
                    <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-2xl font-black text-yellow-400 tracking-tighter italic leading-none">{musiCoins}</span>
                        <span className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest italic leading-none pt-0.5">MC</span>
                    </div>
                </div>
            </div>

            {/* Recharge Trigger Button */}
            <div className="h-16">
                <button
                    onClick={() => setShowModal(true)}
                    className="h-full px-5 bg-yellow-500 text-black font-black uppercase tracking-tighter italic transition-all flex items-center gap-2 shadow-[0_5px_20px_rgba(234,179,8,0.3)] hover:scale-[1.05] active:scale-95 rounded-2xl group"
                    title="Ricarica MusiCoins"
                >
                    <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[11px] tracking-widest leading-none">Ricarica</span>
                </button>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg max-h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-20"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-6 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar">
                                <header className="mb-6 md:mb-8 pr-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Coins size={18} className="text-yellow-500" />
                                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">MusiCoin Center</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Ottieni MusiCoin</h2>
                                </header>

                                <div className="space-y-6 md:space-y-8">
                                    {/* FREE OPTION: INVITE */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Metodo Gratuito</h4>
                                        </div>
                                        <div
                                            onClick={handleCopy}
                                            className="p-4 sm:p-5 rounded-3xl bg-purple-500/5 border border-purple-500/20 flex flex-col gap-4 hover:bg-purple-500/10 transition-all cursor-pointer group/invite"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                                        <Share2 size={20} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-white uppercase tracking-tight leading-none mb-1 text-sm sm:text-base">Invita un Amico</h5>
                                                        <p className="text-[10px] text-gray-500 font-medium">Entrambi bonus MC</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] sm:text-xs font-black text-purple-400 bg-purple-400/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">+30 MC</div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-2 sm:p-3 border border-white/5">
                                                <code className="flex-1 text-center font-black italic text-purple-400 tracking-tighter text-base sm:text-lg uppercase truncate">
                                                    {referralCode || '...'}
                                                </code>
                                                <div className="p-2 bg-white/5 rounded-xl group-hover/invite:bg-purple-500 group-hover/invite:text-white transition-all shrink-0">
                                                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400 group-hover/invite:text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* SEPARATOR */}
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/5"></div>
                                        </div>
                                        <span className="relative px-4 bg-[#0a0a0f] text-[8px] font-black text-gray-600 uppercase tracking-[0.4em]">Acquista Pacchetti</span>
                                    </div>

                                    {/* PAID OPTIONS */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {packages.map((pkg) => (
                                            <button
                                                key={pkg.coins}
                                                className={`p-4 rounded-3xl border flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:gap-2 transition-all group/pkg relative overflow-hidden ${pkg.popular
                                                    ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50 sm:h-32'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20 sm:h-32'
                                                    }`}
                                            >
                                                {pkg.popular && (
                                                    <div className="absolute top-0 right-0 p-1.5 bg-yellow-500 text-[8px] font-black text-black uppercase tracking-widest italic rounded-bl-xl sm:rounded-bl-xl rounded-tr-none">
                                                        Best Choice
                                                    </div>
                                                )}
                                                <div className={`p-2 rounded-xl shrink-0 ${pkg.popular ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white opacity-40'}`}>
                                                    <Zap size={16} fill={pkg.popular ? 'currentColor' : 'none'} />
                                                </div>
                                                <div className="text-left sm:text-center flex-1 sm:flex-initial">
                                                    <div className="text-base sm:text-lg font-black text-white italic tracking-tighter leading-none">{pkg.coins} <span className="text-[10px] opacity-50 uppercase tracking-widest">MC</span></div>
                                                    <div className="text-sm font-black text-yellow-500 italic mt-1 sm:hidden">€{pkg.price}</div>
                                                </div>
                                                <div className="hidden sm:block text-sm font-black text-yellow-500 italic">€{pkg.price}</div>
                                                <div className="sm:hidden text-xs font-black text-white italic">€{pkg.price}</div>
                                            </button>
                                        ))}
                                    </div>

                                    <footer className="pt-2 flex items-center justify-center gap-6 opacity-40">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-white" />
                                            <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">PayPal Checkout</span>
                                        </div>
                                        <Sparkles size={14} className="text-yellow-500" />
                                    </footer>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
