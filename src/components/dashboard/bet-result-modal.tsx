'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { X, Trophy, Frown, CheckCircle, Loader2, Skull, Minus } from 'lucide-react';
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

    // UI Configuration based on status
    const config = (() => {
        switch (status) {
            case 'won':
                return {
                    title: 'Scommessa Vinta!',
                    desc: 'Ottimo intuito! Hai indovinato il trend dei tuoi artisti.',
                    color: 'from-purple-500 to-blue-600',
                    glow: 'bg-purple-500',
                    icon: <Trophy size={40} className="text-white drop-shadow-lg" />
                };
            case 'draw':
                return {
                    title: 'Pareggio!',
                    desc: 'Incredibile! Entrambi gli artisti hanno performato allo stesso modo.',
                    color: 'from-amber-400 to-orange-500',
                    glow: 'bg-amber-500',
                    icon: <div className="text-white font-black text-3xl">=</div>
                };
            case 'lost':
            default:
                return {
                    title: 'Scommessa Persa',
                    desc: 'Questa volta il rivale ha avuto la meglio. Ritenta domani!',
                    color: 'from-zinc-800 to-black',
                    glow: 'bg-red-500',
                    icon: <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-red-500/40 animate-pulse"></div>
                        <Skull size={44} className="text-gray-400 relative z-10" />
                    </div>
                };
        }
    })();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <button
                    onClick={handleClose}
                    disabled={isClosing}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-20 disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Pulsating Header UI */}
                    <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                        <div className={`absolute inset-0 ${config.glow} rounded-full blur-2xl opacity-20 animate-pulse`}></div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                            className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-xl border-2 border-white/20`}
                        >
                            {config.icon}
                        </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">
                        {config.title}
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-[280px] text-sm leading-relaxed">
                        {config.desc}
                    </p>

                    {/* Rewards Section (Dynamic) */}
                    {isWin && (
                        <div className="flex flex-col gap-6 mb-10 w-full">
                            {(won_points > 0 || won_points === undefined) && (
                                <div className="relative">
                                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tabular-nums">
                                        +<SpringCounter from={0} to={won_points ?? 10} />
                                    </div>
                                    <div className="text-[10px] font-bold text-purple-400 mt-1 tracking-[0.2em] uppercase">
                                        Punti Fantamusiké
                                    </div>
                                </div>
                            )}
                            {won_coins > 0 && (
                                <div className="relative">
                                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 tabular-nums">
                                        +<SpringCounter from={0} to={won_coins} />
                                    </div>
                                    <div className="text-[10px] font-bold text-yellow-500 mt-1 tracking-[0.2em] uppercase">
                                        MusiCoins Guadagnati
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Score Comparison (Sleeker) */}
                    <div className="w-full bg-white/5 rounded-2xl p-4 mb-8 flex items-center justify-between relative border border-white/5">
                        <div className="flex flex-col items-center flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider w-full truncate px-2" title={my_artist_name || 'Tu'}>
                                {my_artist_name || 'Tu'}
                            </span>
                            <span className={`text-xl font-black tabular-nums ${wager === 'my_artist' ? 'text-white' : 'text-gray-500'} ${isDraw ? 'text-amber-400' : ''}`}>
                                {scores?.my > 0 ? '+' : ''}{scores?.my || 0}
                            </span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10 self-center" />
                        <div className="flex flex-col items-center flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider w-full truncate px-2" title={rival?.name || 'Rivale'}>
                                {rival?.name || 'Rivale'}
                            </span>
                            <span className={`text-xl font-black tabular-nums ${wager === 'rival' ? 'text-white' : 'text-gray-500'} ${isDraw ? 'text-amber-400' : ''}`}>
                                {scores?.rival > 0 ? '+' : ''}{scores?.rival || 0}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={isClosing}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-900/40 transform hover:scale-105 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                    >
                        {isClosing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Salvataggio...</span>
                            </>
                        ) : (
                            <span>Continua</span>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
