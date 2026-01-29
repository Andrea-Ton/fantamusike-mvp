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
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-lg ${allActionsDone
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-green-400'
                    : isLocked
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 hover:shadow-purple-500/30'
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:scale-105 hover:shadow-yellow-500/30'
                    }`}
            >
                <Sparkles size={18} className={allActionsDone ? '' : 'animate-pulse'} />
                <span>
                    {allActionsDone ? 'Promo Completata' : isLocked ? 'Continua Promo' : 'Promuovi Artista'}
                </span>
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
