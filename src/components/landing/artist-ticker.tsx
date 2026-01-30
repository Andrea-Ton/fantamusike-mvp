'use client';

import React from 'react';
import Image from 'next/image';
import { TrendingUp, Star } from 'lucide-react';
import { SpotifyArtist } from '@/lib/spotify';

interface ArtistTickerProps {
    artists: SpotifyArtist[];
}

export default function ArtistTicker({ artists }: ArtistTickerProps) {
    // Duplicate artists to ensure smooth infinite scroll
    const scrollingArtists = [...artists, ...artists, ...artists];

    if (artists.length === 0) return null;

    return (
        <div className="relative py-12 bg-black/40 backdrop-blur-3xl border-y border-white/5 overflow-hidden group">
            {/* Gradient Overlay for Fade Effect */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#0b0b10] to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#0b0b10] to-transparent z-10"></div>

            <div className="flex animate-scroll hover:[animation-play-state:paused] whitespace-nowrap gap-12 items-center">
                {scrollingArtists.map((artist, idx) => (
                    <div key={idx} className="flex items-center gap-6 group/item">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-2xl group-hover/item:scale-110 transition-transform">
                            {artist.images[0] && (
                                <Image
                                    src={artist.images[0].url}
                                    alt={artist.name}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white italic uppercase tracking-tighter">{artist.name}</span>
                                <TrendingUp size={14} className="text-green-400" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={10} className="fill-yellow-500 text-yellow-500" />
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Growth: +{12 + (idx % 5) * 3}%</span>
                            </div>
                        </div>
                        {/* Divider */}
                        <div className="h-4 w-px bg-white/10 ml-6"></div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
            `}</style>
        </div>
    );
}
