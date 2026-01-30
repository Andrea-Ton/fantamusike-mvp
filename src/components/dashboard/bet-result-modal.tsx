'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { X, Trophy, Frown, CheckCircle, Loader2, Skull, Minus, TrendingUp } from 'lucide-react';
import { markBetSeenAction } from '@/app/actions/promo';
import confetti from 'canvas-confetti';

function SpringCounter({ from, to }: { from: number; to: number }) {
    const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(to);
    }, [spring, to]);

    return <motion.span>{display}</motion.span>;
}

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
                    desc: 'Incredibile! Entrambi gli artisti hanno performato allo stesso modo in questa sessione.',
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl ring-1 ring-white/5"
            >
                {/* Background Theme Bloom */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 ${config.glow} rounded-full blur-[120px] -z-10 animate-pulse`}></div>

                <button
                    onClick={handleClose}
                    disabled={isClosing}
                    className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all z-20 disabled:opacity-50 border border-white/10"
                >
                    <X size={20} />
                </button>

                <div className="p-10 flex flex-col items-center text-center">
                    {/* Heroic Modal Header Icon */}
                    <div className="relative w-40 h-40 mb-8 flex items-center justify-center group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${config.color} rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000`}></div>
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                            className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-2xl border-4 border-white/20 ring-4 ring-white/5 ring-offset-4 ring-offset-transparent`}
                        >
                            {config.icon}
                        </motion.div>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isWin ? 'bg-purple-500' : isDraw ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{config.subtitle}</p>
                        </div>
                        <h2 className={`text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4`}>
                            {config.title}
                        </h2>
                        <p className="text-gray-500 max-w-[300px] text-[11px] font-black uppercase tracking-wider leading-relaxed mx-auto">
                            {config.desc}
                        </p>
                    </div>

                    {/* Rewards Grid (Glassy) */}
                    {isWin && (
                        <div className="grid grid-cols-1 gap-4 mb-8 w-full">
                            {(won_points > 0 || won_points === undefined) && (
                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-inner overflow-hidden group/reward relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover/reward:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative z-10 text-5xl font-black text-white italic tracking-tighter tabular-nums mb-1">
                                        +<SpringCounter from={0} to={won_points ?? 10} />
                                    </div>
                                    <div className="relative z-10 text-[9px] font-black text-purple-400 tracking-[0.4em] uppercase opacity-70">
                                        Punti Fantamusiké
                                    </div>
                                </div>
                            )}
                            {won_coins > 0 && (
                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-inner overflow-hidden group/reward-gold relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover/reward-gold:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative z-10 text-5xl font-black text-yellow-500 italic tracking-tighter tabular-nums mb-1">
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
                    <div className="w-full bg-white/[0.02] rounded-[2rem] p-6 mb-10 relative border border-white/5 backdrop-blur-3xl shadow-inner group/stats">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex flex-col items-center flex-1 min-w-0 pr-4">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 w-full truncate">MIO: {my_artist_name || 'TU'}</p>
                                <div className={`text-4xl font-black italic tracking-tighter tabular-nums transition-colors duration-500 ${wager === 'my_artist' ? 'text-white' : 'text-gray-500'} ${isDraw ? 'text-amber-500' : ''}`}>
                                    {scores?.my > 0 ? '+' : ''}{scores?.my || 0}
                                </div>
                            </div>

                            <div className="w-px h-16 bg-white/10 mx-2 shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>

                            <div className="flex flex-col items-center flex-1 min-w-0 pl-4">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 w-full truncate">RIVALE: {rival?.name || 'RIVALE'}</p>
                                <div className={`text-4xl font-black italic tracking-tighter tabular-nums transition-colors duration-500 ${wager === 'rival' ? 'text-white' : 'text-gray-500'} ${isDraw ? 'text-amber-500' : ''}`}>
                                    {scores?.rival > 0 ? '+' : ''}{scores?.rival || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={isClosing}
                        className="group relative px-8 py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] transform hover:-translate-y-1 active:scale-95 transition-all w-full flex items-center justify-center gap-3 overflow-hidden"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${isWin ? 'from-purple-600 to-blue-600' : isDraw ? 'from-amber-500 to-orange-600' : 'from-zinc-800 to-black'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                        <span className="relative z-10 group-hover:text-white transition-colors">
                            {isClosing ? 'Archiviazione...' : (isLost ? 'Dimentica il Fallimento' : 'Avanti tutta')}
                        </span>
                        {isClosing ? (
                            <Loader2 size={20} className="animate-spin relative z-10 group-hover:text-white" />
                        ) : (
                            <TrendingUp size={20} className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
