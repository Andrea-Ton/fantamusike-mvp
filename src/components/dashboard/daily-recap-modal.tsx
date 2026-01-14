import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, TrendingUp, X, Loader2 } from 'lucide-react';
import { markScoreLogsSeenAction } from '@/app/actions/dashboard';

function SpringCounter({ from, to }: { from: number; to: number }) {
    const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(to);
    }, [spring, to]);

    return <motion.span>{display}</motion.span>;
}

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
            // Trigger confetti after a delay to match spring animation timing
            const timer = setTimeout(() => {
                setHasFinishedAnimation(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#a855f7', '#fbbf24', '#ffffff']
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
            setTimeout(onClose, 300); // Wait for exit animation
        } else {
            setIsMarkingSeen(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
                    >
                        <button
                            onClick={handleContinue}
                            disabled={isMarkingSeen}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-20 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center">
                            {/* Pulsating Points UI - Coherent with PromoModal Result Screen */}
                            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                                    className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] border-4 border-white/10"
                                >
                                    <Trophy size={40} className="text-white drop-shadow-lg" />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">
                                Recap Punti Fantamusiké!
                            </h2>
                            <p className="text-gray-400 mb-8 max-w-[280px] text-sm leading-relaxed">
                                I tuoi artisti hanno guadagnato punti mentre non c'eri!
                            </p>

                            <div className="relative mb-10">
                                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tabular-nums">
                                    +<SpringCounter from={0} to={totalPoints} />
                                </div>
                                <div className="text-xs font-bold text-purple-400 mt-2 tracking-[0.2em] uppercase">
                                    Punti Fantamusiké
                                </div>
                            </div>

                            <button
                                onClick={handleContinue}
                                disabled={isMarkingSeen}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-900/40 transform hover:scale-105 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                            >
                                {isMarkingSeen ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Caricamento...</span>
                                    </>
                                ) : (
                                    <span>Continua</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
