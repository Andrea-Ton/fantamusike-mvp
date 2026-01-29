'use client';

import React from 'react';
import { Crown, Plus, CheckCircle, Gift } from 'lucide-react';
import { Slot } from './artist-card';
import CountdownTimer from './countdown-timer';

interface ArtistPromoCardProps {
    slot: Slot;
    // We keep these props for compatibility but use them for simplified view
    promoStatus?: any;
    spotifyUrl?: string;
    releaseUrl?: string;
    revivalUrl?: string;
}

export default function ArtistPromoCard({ slot }: ArtistPromoCardProps) {

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
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                        {/* Fanta Trend (Game) */}
                        <span className="text-[10px] md:text-xs flex items-center gap-1 text-purple-200">
                            <span className={slot.artist.fantaTrend! > 0 ? 'text-green-400 font-bold' : slot.artist.fantaTrend! < 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                                {slot.artist.fantaTrend! > 0 ? '+' : ''}{Math.round(slot.artist.fantaTrend || 0)}
                            </span>
                            <span className="opacity-60 text-[9px] uppercase tracking-wider">Fanta</span>
                        </span>

                        {/* Promo Trend (Actions) */}
                        <span className="text-[10px] md:text-xs flex items-center gap-1 text-yellow-200 relative">
                            <span className={slot.artist.promoTrend! > 0 ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                                {slot.artist.promoTrend! > 0 ? '+' : ''}{Math.round(slot.artist.promoTrend || 0)}
                            </span>
                            <span className="opacity-60 text-[9px] uppercase tracking-wider">Promo</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Background Gradient */}
            <div className={`absolute right-0 top-0 w-32 h-full bg-gradient-to-l ${slot.artist.isCaptain ? 'from-yellow-500/10' : slot.type === 'New Gen' ? 'from-green-500/10' : slot.type === 'Big' ? 'from-purple-500/10' : 'from-blue-500/10'
                } to-transparent pointer-events-none`} />
        </div>
    );
}
