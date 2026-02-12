'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, X, Loader2, Coins, TrendingUp, Share2 } from 'lucide-react';
import { markWeeklyRecapSeenAction, WeeklyRecap } from '@/app/actions/leaderboard';
import SpringCounter from '@/components/spring-counter';
import ShareButton from './share-button';

interface WeeklyRecapModalProps {
    recap: WeeklyRecap;
    username: string;
    onClose: () => void;
}

export function WeeklyRecapModal({ recap, username, onClose }: WeeklyRecapModalProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMarkingSeen, setIsMarkingSeen] = useState(false);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                confetti({
                    particleCount: 200,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#a855f7', '#fbbf24', '#ffffff', '#3b82f6'],
                    zIndex: 150
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleContinue = async () => {
        setIsMarkingSeen(true);
        const result = await markWeeklyRecapSeenAction(recap.id);
        if (result.success) {
            setIsVisible(false);
            setTimeout(onClose, 300);
        } else {
            setIsMarkingSeen(false);
        }
    };

    // Prepare team and roster for ShareButton
    const team = recap.team;
    const captain = [team?.slot_1, team?.slot_2, team?.slot_3, team?.slot_4, team?.slot_5].find(a => a?.id === team?.captain_id) || null;
    const roster = [team?.slot_1 || null, team?.slot_2 || null, team?.slot_3 || null, team?.slot_4 || null, team?.slot_5 || null];

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.3)] backdrop-blur-3xl ring-1 ring-white/5"
                    >
                        {/* Background Decorative Bloom */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -z-10"></div>

                        <button
                            onClick={handleContinue}
                            disabled={isMarkingSeen}
                            className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all z-20 border border-white/10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-10 flex flex-col items-center text-center">
                            {/* Ranking Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                                className="relative mb-8"
                            >
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.4)] border-4 border-white/30 relative z-10">
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-black text-white italic drop-shadow-md">#{recap.rank}</span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Ranking</span>
                                    </div>
                                </div>
                                {/* Halo effect */}
                                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse -z-10"></div>
                            </motion.div>

                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                                Settimana Conclusa
                            </h2>
                            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-8">
                                Risultati Finali
                            </p>

                            <div className="flex flex-col gap-4 w-full mb-8">
                                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-sm group hover:border-purple-500/30 transition-all flex items-center justify-center">
                                    <div className="flex items-center gap-4">
                                        <Trophy className="text-purple-400" size={28} />
                                        <div className="text-left">
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Punteggio Totale</div>
                                            <div className="text-4xl font-black text-white italic tabular-nums leading-none">
                                                <SpringCounter from={0} to={recap.score} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                {recap.team && (
                                    <ShareButton
                                        username={username}
                                        totalScore={recap.score}
                                        rank={recap.rank}
                                        captain={captain}
                                        roster={roster}
                                        weekNumber={recap.week_number}
                                        percentile={recap.percentile}
                                        variant="primary"
                                    />
                                )}

                                <button
                                    onClick={handleContinue}
                                    disabled={isMarkingSeen}
                                    className="group relative w-full h-16 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.1)] transform hover:-translate-y-1 active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-3"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="relative z-10">
                                        {isMarkingSeen ? 'Salvataggio...' : 'Avanti tutta!'}
                                    </span>
                                    {isMarkingSeen ? (
                                        <Loader2 size={20} className="animate-spin relative z-10" />
                                    ) : (
                                        <TrendingUp size={20} className="relative z-10 group-hover:translate-x-1 transition-all" />
                                    )}
                                </button>
                            </div>

                            <p className="mt-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                Condividi i tuoi risultati e scala la classifica!
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
