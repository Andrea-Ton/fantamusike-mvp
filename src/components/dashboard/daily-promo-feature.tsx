'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DailyPromoModal from './daily-promo-modal';
import { Slot } from './artist-card';
import { DailyPromoState } from '@/app/actions/promo';

interface DailyPromoFeatureProps {
    teamSlots: Slot[];
    initialState: DailyPromoState;
    spotifyUrls: Record<string, string | undefined>;
    releaseUrls: Record<string, string | undefined>;
    revivalUrls: Record<string, string | undefined>;
}

export default function DailyPromoFeature({
    teamSlots,
    initialState,
    spotifyUrls,
    releaseUrls,
    revivalUrls
}: DailyPromoFeatureProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Derived state for button appearance
    const isLocked = initialState.locked;
    const allActionsDone = initialState.status.quiz && initialState.status.bet && initialState.status.boost;

    return (
        <>
            <button
                id="tour-promo-button"
                onClick={() => setIsModalOpen(true)}
                className={`group relative flex items-center justify-between w-full md:w-auto md:min-w-[240px] px-6 py-4 rounded-2xl font-black uppercase tracking-tighter italic transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 overflow-hidden ${allActionsDone
                    ? 'bg-white/5 border border-green-500/50 text-green-400'
                    : isLocked
                        ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-purple-500/20'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/20 shadow-orange-500/30'
                    }`}
            >
                <div className="flex items-center gap-3 relative z-10">
                    <Sparkles size={18} className={`${allActionsDone ? '' : 'animate-pulse'}`} />
                    <span className="text-sm md:text-base whitespace-nowrap">
                        {allActionsDone ? 'Promo Completata' : isLocked ? 'Continua Promo' : 'Promuovi Artista'}
                    </span>
                </div>

                {!allActionsDone && (
                    //TODO: Hidden for now
                    <div className="hidden ml-4 flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-inner relative z-10">
                        <span className="text-[10px] font-black opacity-80"></span>
                    </div>
                )}

                {allActionsDone && (
                    //TODO: Hidden for now
                    <div className="hidden ml-4 p-1.5 bg-green-500/20 rounded-lg border border-green-500/20 relative z-10">
                        <Sparkles size={12} className="text-green-400" />
                    </div>
                )}

                {/* Animated Gradient Shine */}
                {!allActionsDone && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                )}
            </button>

            <DailyPromoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamSlots={teamSlots}
                initialState={initialState}
                spotifyUrls={spotifyUrls}
                releaseUrls={releaseUrls}
                revivalUrls={revivalUrls}
            />
        </>
    );
}
