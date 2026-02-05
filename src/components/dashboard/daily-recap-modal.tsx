import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, TrendingUp, X, Loader2 } from 'lucide-react';
import { markScoreLogsSeenAction } from '@/app/actions/dashboard';
import SpringCounter from '@/components/spring-counter';

interface ScoreLog {
    id: string;
    points_gained: number;
    date: string;
}

interface DailyRecapModalProps {
    logs: ScoreLog[];
    onClose: () => void;
}

export function DailyRecapModal({ logs, onClose }: DailyRecapModalProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMarkingSeen, setIsMarkingSeen] = useState(false);
    const [hasFinishedAnimation, setHasFinishedAnimation] = useState(false);

    const totalPoints = logs.reduce((sum, log) => sum + log.points_gained, 0);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setHasFinishedAnimation(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#a855f7', '#fbbf24', '#ffffff'],
                    zIndex: 150
                });
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleContinue = async () => {
        setIsMarkingSeen(true);
        const logIds = logs.map(l => l.id);
        const result = await markScoreLogsSeenAction(logIds);

        if (result.success) {
            setIsVisible(false);
            setTimeout(onClose, 300);
        } else {
            setIsMarkingSeen(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl ring-1 ring-white/5"
                    >
                        {/* Background Decorative Bloom */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>

                        <button
                            onClick={handleContinue}
                            disabled={isMarkingSeen}
                            className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all z-20 disabled:opacity-50 border border-white/10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-10 flex flex-col items-center text-center">
                            {/* Heroic Pedestal UI */}
                            <div className="relative w-40 h-40 mb-8 flex items-center justify-center group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-purple-500/30 rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-1000 animate-pulse"></div>

                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                                    className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.5)] border-4 border-white/20 ring-4 ring-purple-500/20 ring-offset-8 ring-offset-transparent"
                                >
                                    <Trophy size={48} className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-bounce-subtle" />

                                    {/* Small floating specs */}
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-lg blur-[2px] opacity-60 animate-ping"></div>
                                </motion.div>
                            </div>

                            <div className="mb-2">
                                <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                                    Recap Punti
                                </h2>
                            </div>

                            <p className="text-gray-500 mb-10 max-w-[280px] text-[11px] font-black uppercase tracking-wider leading-relaxed">
                                I tuoi artisti hanno generato valore mentre eri offline.
                            </p>

                            <div className="relative mb-12 bg-white/[0.03] border border-white/5 rounded-3xl p-6 w-full backdrop-blur-sm shadow-inner overflow-hidden group/points">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/points:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative z-10">
                                    <div className="text-7xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-2xl">
                                        +<SpringCounter from={0} to={totalPoints} />
                                    </div>
                                    <div className="text-[10px] font-black text-purple-400 mt-2 tracking-[0.4em] uppercase opacity-70">
                                        Punti Fantamusiké
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleContinue}
                                disabled={isMarkingSeen}
                                className="group relative px-8 py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] transform hover:-translate-y-1 active:scale-95 transition-all w-full flex items-center justify-center gap-3 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <span className="relative z-10 group-hover:text-white transition-colors">
                                    {isMarkingSeen ? 'Aggiornamento...' : 'Continua la Scalata'}
                                </span>
                                {isMarkingSeen ? (
                                    <Loader2 size={20} className="animate-spin relative z-10 group-hover:text-white" />
                                ) : (
                                    <TrendingUp size={20} className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
