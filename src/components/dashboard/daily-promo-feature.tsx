'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DailyPromoModal from './daily-promo-modal';
import { Slot } from './artist-card';
import { DailyPromoState } from '@/app/actions/promo';
import { NotificationPing } from '@/components/ui/notification-ping';

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
                className="group relative outline-none block mt-[6px] w-full md:w-auto md:min-w-[240px] rounded-2xl"
            >
                {/* 3D Base layer */}
                <div className={`absolute inset-0 rounded-2xl transition-colors ${allActionsDone
                    ? 'bg-emerald-950'
                    : isLocked
                        ? 'bg-blue-900'
                        : 'bg-orange-800'
                    }`}></div>

                {/* Front Clickable Layer */}
                <div className={`relative flex items-center justify-between w-full h-full px-6 py-4 rounded-2xl font-black uppercase tracking-tighter italic transition-transform -translate-y-[6px] active:translate-y-0 border ${allActionsDone
                    ? 'bg-emerald-500/10 backdrop-blur-md text-emerald-400 border-emerald-500/20'
                    : isLocked
                        ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white border-blue-400/50'
                        : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white border-orange-300/50 group-hover:from-orange-400 group-hover:to-orange-400'
                    }`}>
                    {!allActionsDone && (
                        <NotificationPing className="absolute -top-1 -right-1" />
                    )}

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
                        <div className="hidden ml-4 p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/20 relative z-10">
                            <Sparkles size={12} className="text-emerald-400" />
                        </div>
                    )}
                </div>
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
