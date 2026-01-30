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
            <div className="w-full h-24 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-between px-6 relative overflow-hidden group hover:bg-white/5 transition-all cursor-pointer backdrop-blur-sm shadow-inner">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">{slot.label}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{slot.requirement}</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-black transition-all border border-white/10 group-hover:border-purple-400">
                    <Plus size={18} />
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full h-24 rounded-[1.5rem] bg-white/[0.03] flex items-center justify-between px-4 relative overflow-hidden border backdrop-blur-md transition-all group ${slot.artist.isCaptain ? 'border-yellow-500/30' : 'border-white/10'}`}>

            {/* Background Accent Gradient */}
            <div className={`absolute right-0 top-0 w-48 h-full bg-gradient-to-l opacity-20 ${slot.artist.isCaptain ? 'from-yellow-500/20' :
                slot.type === 'Big' ? 'from-purple-500/20' :
                    slot.type === 'Mid' ? 'from-blue-500/20' : 'from-green-500/20'
                } to-transparent pointer-events-none group-hover:opacity-30 transition-opacity`} />

            <div className="flex items-center gap-4 z-10 flex-1">
                <div className="relative">
                    <img src={slot.artist.image} alt={slot.artist.name} className="w-16 h-16 rounded-2xl object-cover shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500" />
                    {slot.artist.isCaptain && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.4)] border border-yellow-400">
                            <Crown size={12} className="fill-black" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black text-white italic uppercase tracking-tighter truncate max-w-[140px] md:max-w-[200px] pr-2">
                            {slot.artist.name}
                        </span>
                        {slot.artist.multiplier && slot.artist.multiplier > 1 && (
                            <div className={`text-[10px] flex-shrink-0 font-black px-2 py-0.5 rounded-lg border uppercase tracking-tighter shimmer-effect ${slot.artist.multiplier === 2 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                }`}>
                                x{slot.artist.multiplier}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Fanta Trend */}
                        <div className="flex items-center gap-1.5">
                            <span className={`text-base font-black italic ${slot.artist.fantaTrend! > 0 ? 'text-green-400' : slot.artist.fantaTrend! < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                {slot.artist.fantaTrend! > 0 ? '+' : ''}{Math.round(slot.artist.fantaTrend || 0)}
                            </span>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fanta</span>
                        </div>

                        <div className="w-px h-3 bg-white/5"></div>

                        {/* Promo Trend */}
                        <div className="flex items-center gap-1.5">
                            <span className={`text-base font-black italic ${slot.artist.promoTrend! > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                {slot.artist.promoTrend! > 0 ? '+' : ''}{Math.round(slot.artist.promoTrend || 0)}
                            </span>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Promo</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="z-10 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:bg-white/10 transition-colors">
                {slot.label}
            </div>
        </div>
    );
}
