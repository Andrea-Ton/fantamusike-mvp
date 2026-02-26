'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Gift, CheckCircle, Loader2, Star, Zap, Flame, Award, Info, X } from 'lucide-react';
import { RewardMission, claimRewardAction } from '@/app/actions/rewards';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { createPortal } from 'react-dom';
import { sendGTMEvent } from '@next/third-parties/google';
import { NotificationPing } from '@/components/ui/notification-ping';

interface MissionItemProps {
    mission: RewardMission;
    claiming: string | null;
    onClaim: (mission: RewardMission, e: React.MouseEvent) => void;
}

function MissionItem({ mission, claiming, onClaim }: MissionItemProps) {
    const progress = Math.min((mission.current / mission.goal) * 100, 100);
    const isClaimable = mission.canClaim && !mission.isClaimed;

    return (
        <div
            className={`p-4 rounded-[1.5rem] border transition-all duration-300 flex items-center gap-4 relative overflow-hidden min-h-[110px] ${mission.isClaimed
                ? 'bg-black/20 border-white/5 opacity-60 grayscale'
                : isClaimable
                    ? 'bg-yellow-500/[0.05] border-yellow-500/20 shadow-[0_5px_15px_rgba(234,179,8,0.03)]'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                }`}
        >
            {/* Mission Icon */}
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${mission.isClaimed
                    ? 'bg-gray-500/5 text-gray-500 border-gray-500/10'
                    : isClaimable
                        ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                        : 'bg-white/5 text-gray-500 border-white/5'
                    }`}
            >
                {mission.slug.includes('streak') && <Flame size={20} />}
                {mission.slug.includes('sweep') && <Zap size={20} />}
                {mission.slug.includes('weekly') && <Award size={20} />}
                {mission.slug.includes('milestone') && <Star size={20} />}
            </div>

            <div className="flex-1 min-w-0 py-1">
                <div className="mb-1">
                    <h4 className={`text-[12px] font-black uppercase italic tracking-tighter leading-tight mb-0.5 ${mission.isClaimed ? 'text-gray-500' : 'text-white'}`}>
                        {mission.title}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-medium leading-tight uppercase tracking-wider line-clamp-3">
                        {mission.description}
                    </p>
                </div>

                {/* Progress Visualization */}
                <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full ${mission.isClaimed
                                ? 'bg-gray-700'
                                : isClaimable
                                    ? 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]'
                                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                }`}
                        />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg bg-black/20 border border-white/5 min-w-[45px] justify-center">
                        <span className={`text-[10px] font-black italic ${mission.isClaimed ? 'text-gray-600' : isClaimable ? 'text-yellow-400' : 'text-white/80'}`}>
                            {mission.current}
                        </span>
                        <span className="text-[8px] text-gray-600 font-bold">/</span>
                        <span className="text-[8px] text-gray-500 font-bold">{mission.goal}</span>
                    </div>
                </div>
            </div>

            {/* Action Button Compact */}
            <div className="shrink-0 min-w-[90px]">
                {mission.isClaimed ? (
                    <div className="flex flex-col items-center justify-center text-green-500/30">
                        <CheckCircle size={16} />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Ritirato</span>
                    </div>
                ) : (
                    <button
                        onClick={(e) => onClaim(mission, e)}
                        disabled={!mission.canClaim || !!claiming}
                        className={`w-full py-2 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 border ${isClaimable
                            ? 'bg-white text-black border-white hover:scale-105 active:scale-95 shadow-lg'
                            : 'bg-white/5 text-gray-500/50 cursor-not-allowed border-white/5'
                            }`}
                    >
                        <span className="text-[11px] font-black tracking-tighter leading-none">
                            +{mission.reward} MC
                        </span>
                        {isClaimable && (
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-70 leading-none mt-0.5">
                                {claiming === mission.slug ? (
                                    <Loader2 size={10} className="animate-spin" />
                                ) : (
                                    'RISCATTA'
                                )}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

interface MusiRewardsProps {
    initialMissions: RewardMission[];
}

export default function MusiRewards({ initialMissions }: MusiRewardsProps) {
    const [missions, setMissions] = useState(initialMissions);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [flyingCoins, setFlyingCoins] = useState<{ id: number; x: number; y: number; targetX: number; targetY: number; delay: number; randomX: number; randomY: number }[]>([]);

    const claimableCount = missions.filter(m => m.canClaim && !m.isClaimed).length;

    // Sync state with props when server-side data revalidates
    useEffect(() => {
        setMissions(initialMissions);
    }, [initialMissions]);

    const handleClaim = async (mission: RewardMission, e: React.MouseEvent) => {
        if (claiming || !mission.canClaim || mission.isClaimed) return;

        // Trigger flying coins
        const rect = e.currentTarget.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        // Target position (MusiCoin balance) - Find the visible one
        const targetElements = document.querySelectorAll('.musicoin-balance-target');
        const targetEl = Array.from(targetElements).find(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== 'none';
        }) as HTMLElement || targetElements[0]; // Fallback to first one

        const targetRect = targetEl?.getBoundingClientRect();
        const targetX = targetRect ? targetRect.left + targetRect.width / 2 : typeof window !== 'undefined' ? window.innerWidth / 2 : startX;
        const targetY = targetRect ? targetRect.top + targetRect.height / 2 : -50;

        // Number of coins = reward amount (max 30)
        const count = Math.min(mission.reward, 30);

        const newCoins = Array.from({ length: count }).map((_, i) => ({
            id: Date.now() + i,
            x: startX,
            y: startY,
            targetX,
            targetY,
            delay: i * 0.05, // Faster staggered delay for more coins
            randomX: (Math.random() - 0.5) * 120, // Slightly reduced spread
            randomY: (Math.random() - 0.5) * 40
        }));

        setFlyingCoins(prev => [...prev, ...newCoins]);

        // Cleanup coins after animation
        setTimeout(() => {
            setFlyingCoins(prev => prev.filter(c => !newCoins.find(nc => nc.id === c.id)));
        }, 3500);

        setClaiming(mission.slug);
        try {
            const res = await claimRewardAction(mission.slug);
            if (res.success) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 5000);

                // Update local state
                setMissions(prev => prev.map(m =>
                    m.slug === mission.slug ? { ...m, isClaimed: true, canClaim: false } : m
                ));

                sendGTMEvent({
                    event: 'reward_claim_success',
                    category: 'conversion',
                    mission_slug: mission.slug,
                    reward_amount: mission.reward
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setClaiming(null);
        }
    };

    const missionsList = (
        <div className="grid grid-cols-1 gap-2 relative z-10 w-full">
            {missions.map((mission) => (
                <MissionItem
                    key={mission.slug}
                    mission={mission}
                    claiming={claiming}
                    onClaim={handleClaim}
                />
            ))}
            {missions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center w-full">
                    <Trophy size={32} className="text-white/5 mb-4" />
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Nessuna missione disponibile</p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop View (Grid Block) */}
            <section id="tour-musirewards-desktop" className="hidden lg:block bg-white/5 rounded-[2.5rem] border border-white/5 p-6 relative overflow-hidden group">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/[0.02] blur-[80px] -mr-24 -mt-24 transition-colors group-hover:bg-yellow-500/[0.04]"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                            <Gift size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">MusiRewards</h2>
                        </div>
                    </div>
                </div>

                {missionsList}
            </section>

            {/* Mobile View (Floating Button) */}
            <button
                id="tour-musirewards-mobile"
                onClick={() => setIsModalOpen(true)}
                className={`lg:hidden fixed bottom-[min(110px,env(safe-area-inset-bottom)+100px)] right-6 z-40 transition-all duration-500 flex items-center justify-center w-14 h-14 rounded-full group hover:scale-105 active:scale-95 
                ${claimableCount > 0
                        ? 'bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.25)]'
                        : 'bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] hover:border-white/30 hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)]'}`}
            >
                {/* Subtle Inner Glow */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500/10 to-transparent transition-opacity duration-500 ${claimableCount > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

                <Gift
                    size={24}
                    className={`relative z-10 transition-all duration-300 ${claimableCount > 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-400 group-hover:text-yellow-400'}`}
                />

                {claimableCount > 0 && (
                    <NotificationPing className="-top-1 -right-1" />
                )}
            </button>

            {/* Mobile Bottom Sheet Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] lg:hidden flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl -z-10"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-[#050507] w-full max-w-lg rounded-t-[2.5rem] border-t border-x border-white/10 px-6 sm:px-8 pb-8 pt-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto flex flex-col relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sticky Header */}
                            <div className="sticky top-0 bg-[#050507] z-30 pt-1 pb-4">
                                <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-6" />
                                <div className="flex justify-between items-center bg-[#050507]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Premi giornalieri</p>
                                        </div>
                                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">MusiRewards</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                                    >
                                        <X className="text-white" size={20} />
                                    </button>
                                </div>
                            </div>

                            {missionsList}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Flying Coins Portal */}
            {typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                    {flyingCoins.map(coin => (
                        <motion.div
                            key={coin.id}
                            initial={{
                                x: coin.x,
                                y: coin.y,
                                scale: 0,
                                opacity: 1
                            }}
                            animate={{
                                x: [
                                    coin.x,
                                    coin.x + coin.randomX,
                                    coin.targetX
                                ],
                                y: [
                                    coin.y,
                                    coin.y + coin.randomY - 50,
                                    coin.targetY
                                ],
                                scale: [0, 1.5, 1.2, 0],
                                opacity: [1, 1, 1, 0],
                                rotate: [0, 180, 360, 720]
                            }}
                            transition={{
                                duration: 1.8,
                                delay: coin.delay,
                                times: [0, 0.1, 0.95, 1],
                                ease: [0.23, 1, 0.32, 1] // Custom quintic ease-out
                            }}
                            className="absolute w-4 h-4 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-full border-2 border-yellow-700/50 shadow-[0_0_15px_rgba(234,179,8,0.7)] flex items-center justify-center overflow-hidden"
                        >
                            {/* Shimmer Effect on Coin */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 skew-y-12 animate-pulse" />
                            <span className="text-[8px] font-black text-yellow-950 relative z-10 select-none">M</span>
                        </motion.div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}
