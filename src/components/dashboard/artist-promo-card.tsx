'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Crown, ExternalLink, CheckCircle, Plus, Rocket } from 'lucide-react';
import { ArtistPromoStatus } from '@/app/actions/promo';
import { Slot } from './artist-card'; // Reuse types
import CountdownTimer from './countdown-timer';
import PromoModal from './promo-modal';

interface ArtistPromoCardProps {
    slot: Slot;
    promoStatus: ArtistPromoStatus;
    spotifyUrl?: string;
    releaseUrl?: string;
}

export default function ArtistPromoCard({ slot, promoStatus, spotifyUrl, releaseUrl }: ArtistPromoCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check if ALL daily actions are done
    const allDone = promoStatus.profile_click && promoStatus.release_click && promoStatus.share;

    // Calculate progress
    const completedCount = [promoStatus.profile_click, promoStatus.release_click, promoStatus.share].filter(Boolean).length;
    const totalActions = 3;

    if (!slot.artist) {
        return (
            <div className="w-full h-20 md:h-24 rounded-2xl border border-dashed border-white/20 bg-white/5 flex items-center justify-between px-4 md:px-6 relative overflow-hidden group hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-bold text-purple-300 uppercase tracking-wider">{slot.label}</span>
                    <span className="text-xs md:text-sm text-gray-400 mt-1">{slot.requirement}</span>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <Plus size={16} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`w-full h-20 md:h-24 rounded-2xl bg-[#1a1a24] flex items-center justify-between px-3 md:px-4 relative overflow-hidden border ${slot.artist.isCaptain ? 'border-yellow-500/50' : 'border-white/5'
                } transition-all`}>

                <div className="flex items-center gap-3 md:gap-4 z-10 flex-1">
                    <div className="relative">
                        <img src={slot.artist.image} alt={slot.artist.name} className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover shadow-lg" />
                        {slot.artist.isCaptain && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg">
                                <Crown size={12} className="fill-black" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-[200px]">{slot.artist.name}</span>
                            {slot.artist.isCaptain && (
                                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase tracking-wider border border-yellow-500/20 hidden md:block">
                                    CAPTAIN
                                </span>
                            )}
                            {slot.artist.multiplier && slot.artist.multiplier > 1 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${slot.artist.multiplier === 2 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' : 'bg-purple-500/20 text-purple-400 border-purple-500/20'}`}>
                                    x{slot.artist.multiplier}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] md:text-xs flex items-center gap-0.5 ${slot.artist.trend > 0 ? 'text-green-400' : slot.artist.trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {slot.artist.trend > 0 ? <TrendingUp size={12} /> : slot.artist.trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                                {slot.artist.trend > 0 ? '+' : ''}{Math.round(slot.artist.trend)} pts
                            </span>
                            <span className="text-[10px] md:text-xs flex items-center gap-0.5 text-gray-400">
                                <span className="hidden md:inline">Promozioni giornaliere:</span>
                                <span className="md:hidden">Promo:</span>
                                <span className={completedCount === totalActions ? 'text-green-400 font-bold' : 'text-white'}>
                                    {completedCount}/{totalActions}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="z-10 flex-shrink-0 ml-2">
                    {allDone ? (
                        <div className="flex flex-col items-center justify-center min-w-[80px]">
                            <div className="flex items-center gap-1 text-green-400 mb-1">
                                <CheckCircle size={14} />
                                <span className="text-[10px] font-bold uppercase">Done</span>
                            </div>
                            <CountdownTimer />
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group relative flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-500/30 active:scale-95 transition-all min-w-[80px]"
                        >
                            <Rocket size={18} className="mb-1 group-hover:-translate-y-1 group-hover:scale-110 transition-transform hidden" />
                            <span className="text-[10px] font-bold uppercase whitespace-nowrap">
                                Promuovi
                            </span>
                        </button>
                    )}
                </div>

                {/* CTA Bouncing Pill */}
                {!allDone && (
                    <div className="absolute md:top-4 top-2 right-2 z-20">
                        <div className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-yellow-500/20 animate-bounce">
                            + Points
                        </div>
                    </div>
                )}

                {/* Background Gradient */}
                <div className={`absolute right-0 top-0 w-32 h-full bg-gradient-to-l ${slot.artist.isCaptain ? 'from-yellow-500/10' : slot.type === 'New Gen' ? 'from-green-500/10' : slot.type === 'Big' ? 'from-purple-500/10' : 'from-blue-500/10'
                    } to-transparent pointer-events-none`} />
            </div>

            <PromoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                slot={slot}
                spotifyUrl={spotifyUrl}
                releaseUrl={releaseUrl}
                promoStatus={promoStatus}
            />
        </>
    );
}
