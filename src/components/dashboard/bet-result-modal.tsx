'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { X, Trophy, Frown, CheckCircle, Loader2, Skull, Minus, TrendingUp } from 'lucide-react';
import { markBetSeenAction } from '@/app/actions/promo';
import confetti from 'canvas-confetti';
import SpringCounter from '@/components/spring-counter';

interface BetResultModalProps {
    promoId: string;
    betSnapshot: any;
    onClose: () => void;
}

export default function BetResultModal({ promoId, betSnapshot, onClose }: BetResultModalProps) {
    const { rival, wager, status, scores, won_points, won_coins, my_artist_name } = betSnapshot;
    const isWin = status === 'won';
    const isDraw = status === 'draw';
    const isLost = status === 'lost';
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isWin) {
            // Initial confetti on load
            const timer = setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#a855f7', '#fbbf24', '#ffffff'],
                    zIndex: 999 // Ensure it is above the modal
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isWin]);

    const handleClose = async () => {
        setIsClosing(true);
        if (isWin) {
            // Bonus confetti on final confirmation
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.8 },
                colors: ['#a855f7', '#fbbf24', '#ffffff'],
                zIndex: 999 // Ensure it is above the modal
            });
        }
        await markBetSeenAction(promoId);
        onClose();
    };

    // UI Configuration based on status - Redesigned for Premium Luxe
    const config = (() => {
        switch (status) {
            case 'won':
                return {
                    title: 'VITTORIA',
                    subtitle: 'SCOMMESSA VINTA',
                    desc: 'Ottimo intuito! Hai indovinato il trend dei tuoi artisti con precisione chirurgica.',
                    color: 'from-purple-600 to-blue-700',
                    glow: 'bg-purple-500/30',
                    accent: 'text-purple-400',
                    icon: <Trophy size={48} className="text-white drop-shadow-lg" />
                };
            case 'draw':
                return {
                    title: 'PAREGGIO',
                    subtitle: 'EQUILIBRIO PERFETTO',
                    desc: 'Incredibile! Entrambi gli artisti hanno performato allo stesso modo. Ti abbiamo restituito i 2 MusiCoins della scommessa!',
                    color: 'from-amber-400 to-orange-600',
                    glow: 'bg-amber-500/30',
                    accent: 'text-amber-400',
                    icon: <div className="text-white font-black text-4xl italic tracking-tighter">=</div>
                };
            case 'lost':
            default:
                return {
                    title: 'SCONFITTA',
                    subtitle: 'SCOMMESSA PERSA',
                    desc: 'Questa volta il rivale ha avuto la meglio. Analizza i dati e ritenta domani!',
                    color: 'from-red-900 via-zinc-900 to-black',
                    glow: 'bg-red-500/20',
                    accent: 'text-red-500',
                    icon: <div className="relative isolate">
                        <Skull size={48} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                    </div>
                };
        }
    })();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500 h-[100dvh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl ring-1 ring-white/5 max-h-[90dvh] flex flex-col"
            >
                {/* Background Theme Bloom */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 ${config.glow} rounded-full blur-[120px] -z-10 animate-pulse`}></div>

                <button
                    onClick={handleClose}
                    disabled={isClosing}
                    className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all z-20 disabled:opacity-50 border border-white/10"
                >
                    <X size={18} />
                </button>

                <div className="flex-1 overflow-y-auto scrollbar-hide p-6 sm:p-10 pt-12 sm:pt-14">
                    <div className="flex flex-col items-center text-center">
                        {/* Heroic Modal Header Icon */}
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-6 sm:mb-8 flex items-center justify-center group shrink-0">
                            <div className={`absolute inset-0 bg-gradient-to-br ${config.color} rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000`}></div>
                            <motion.div
                                initial={{ scale: 0, rotate: -15 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                                className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-2xl border-4 border-white/20 ring-4 ring-white/5 ring-offset-4 ring-offset-transparent`}
                            >
                                {config.icon}
                            </motion.div>
                        </div>

                        <div className="mb-6 sm:mb-8">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isWin ? 'bg-purple-500' : isDraw ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{config.subtitle}</p>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                                {config.title}
                            </h2>
                            <p className="text-gray-500 max-w-[300px] text-[10px] sm:text-[11px] font-black uppercase tracking-wider leading-relaxed mx-auto">
                                {config.desc}
                            </p>
                        </div>

                        {/* Rewards Grid (Glassy) */}
                        {(isWin || (isDraw && won_coins > 0)) && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
                                {(won_points > 0 || won_points === undefined) && (
                                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-inner overflow-hidden group/reward relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover/reward:opacity-100 transition-opacity duration-500"></div>
                                        <div className="relative z-10 text-4xl sm:text-5xl font-black text-white italic tracking-tighter tabular-nums mb-1">
                                            +<SpringCounter from={0} to={won_points ?? 10} />
                                        </div>
                                        <div className="relative z-10 text-[9px] font-black text-purple-400 tracking-[0.4em] uppercase opacity-70">
                                            Punti Fantamusiké
                                        </div>
                                    </div>
                                )}
                                {won_coins > 0 && (
                                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-inner overflow-hidden group/reward-gold relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover/reward-gold:opacity-100 transition-opacity duration-500"></div>
                                        <div className="relative z-10 text-4xl sm:text-5xl font-black text-yellow-500 italic tracking-tighter tabular-nums mb-1">
                                            +<SpringCounter from={0} to={won_coins} />
                                        </div>
                                        <div className="relative z-10 text-[9px] font-black text-yellow-600 tracking-[0.4em] uppercase opacity-70">
                                            MusiCoins Guadagnati
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* High-Impact Comparison Grid */}
                        <div className="w-full bg-white/[0.02] rounded-[2rem] p-5 sm:p-6 mb-8 sm:mb-10 relative border border-white/5 backdrop-blur-3xl shadow-inner group/stats">
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                            <div className="flex items-center justify-between relative z-10 px-2 sm:px-4">
                                <div className={`flex flex-col items-center flex-1 min-w-0 transition-all duration-500 relative ${wager === 'my_artist' ? 'scale-[1.15] z-10' : 'opacity-40 grayscale-[0.5]'}`}>
                                    {wager === 'my_artist' && (
                                        <motion.div
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="absolute -top-7 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(168,85,247,0.4)] border border-white/20 whitespace-nowrap"
                                        >
                                            <TrendingUp size={10} className="text-white" />
                                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">Tua Scelta</span>
                                        </motion.div>
                                    )}
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 w-full truncate text-center ${wager === 'my_artist' ? 'text-purple-400' : 'text-gray-600'}`}>MIO: {my_artist_name || 'TU'}</p>
                                    <div className={`text-4xl sm:text-5xl font-black italic tracking-tighter tabular-nums transition-colors duration-500 ${wager === 'my_artist' ? 'text-white' : 'text-gray-500'} ${isDraw ? 'text-amber-500' : ''}`}>
                                        {scores?.my > 0 ? '+' : ''}{scores?.my || 0}
                                    </div>
                                </div>

                                <div className={`mx-6 sm:mx-8 flex items-center justify-center relative transition-all duration-500 ${wager === 'draw' ? 'scale-[1.15] z-10' : ''}`}>
                                    {wager === 'draw' && (
                                        <motion.div
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="absolute -top-7 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(245,158,11,0.4)] border border-white/20 whitespace-nowrap"
                                        >
                                            <TrendingUp size={10} className="text-white" />
                                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">Tua Scelta</span>
                                        </motion.div>
                                    )}
                                    <div className="w-px h-12 sm:h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.05)]"></div>
                                    <div className={`absolute font-black italic text-[10px] sm:text-xl tracking-widest select-none transition-colors ${wager === 'draw' ? 'text-amber-500' : 'text-white/10'}`}>=</div>
                                </div>

                                <div className={`flex flex-col items-center flex-1 min-w-0 transition-all duration-500 relative ${wager === 'rival' ? 'scale-[1.15] z-10' : 'opacity-40 grayscale-[0.5]'}`}>
                                    {wager === 'rival' && (
                                        <motion.div
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="absolute -top-7 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(168,85,247,0.4)] border border-white/20 whitespace-nowrap"
                                        >
                                            <TrendingUp size={10} className="text-white" />
                                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">Tua Scelta</span>
                                        </motion.div>
                                    )}
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 w-full truncate text-center ${wager === 'rival' ? 'text-purple-400' : 'text-gray-600'}`}>RIVALE: {rival?.name || 'RIVALE'}</p>
                                    <div className={`text-4xl sm:text-5xl font-black italic tracking-tighter tabular-nums transition-colors duration-500 ${wager === 'rival' ? 'text-white' : 'text-gray-500'} ${isDraw ? 'text-amber-500' : ''}`}>
                                        {scores?.rival > 0 ? '+' : ''}{scores?.rival || 0}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            disabled={isClosing}
                            className="group relative px-8 py-4 sm:py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] transform hover:-translate-y-1 active:scale-95 transition-all w-full flex items-center justify-center gap-3 overflow-hidden shrink-0"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${isWin ? 'from-purple-600 to-blue-600' : isDraw ? 'from-amber-500 to-orange-600' : 'from-zinc-800 to-black'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                            <span className="relative z-10 group-hover:text-white transition-colors">
                                {isClosing ? 'Archiviazione...' : (isLost ? 'Dimentica il Fallimento' : 'Avanti tutta')}
                            </span>
                            {isClosing ? (
                                <Loader2 size={18} className="animate-spin relative z-10 group-hover:text-white" />
                            ) : (
                                <TrendingUp size={18} className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
