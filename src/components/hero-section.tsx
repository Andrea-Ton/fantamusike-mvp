'use client';

import React from 'react';
import { ArrowRight, Music, Plus, TrendingUp, Star, PlayCircle } from 'lucide-react';
import { SpotifyArtist } from '@/lib/spotify';
import Image from 'next/image';
import Link from 'next/link';

import { User } from '@supabase/supabase-js';

export default function HeroSection({ seasonName = 'Season Zero', featuredArtists = [], user }: { seasonName?: string, featuredArtists?: SpotifyArtist[], user?: User | null }) {
    return (
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-9 lg:pt-52 lg:pb-32 flex flex-col lg:flex-row items-center gap-16">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> {seasonName} Live
                </div>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-white">
                    Il Fantacalcio <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                        della Musica
                    </span>
                </h1>
                <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Non basta ascoltare. Devi scoprire. Crea la tua Label, scova i talenti emergenti prima dei tuoi amici e scala la classifica italiana.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    {user ? (
                        <Link href="/dashboard" className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all shadow-xl shadow-white/10 hover:shadow-white/20 flex items-center justify-center gap-3 cursor-pointer">
                            <span className="text-lg">La mia Dashboard</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <Link href="/signup" className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all shadow-xl shadow-white/10 hover:shadow-white/20 flex items-center justify-center gap-3 cursor-pointer">
                            <span className="text-lg">Inizia la Carriera</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                    <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer">
                        <PlayCircle size={20} />
                        <span>Come funziona</span>
                    </button>
                </div>
            </div>

            {/* Visual Mockup / Glass Cards */}
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none flex justify-center lg:justify-end animate-fade-in-left">
                {/* Main Glass Card */}
                <div className="relative z-20 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-6 shadow-2xl shadow-purple-500/10 transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 w-full max-w-md">
                    {/* Header of card */}
                    <div className="flex justify-between items-center mb-6 opacity-50">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="text-xs font-mono text-white">fantamusike.app</div>
                    </div>

                    {/* Content simulation */}
                    <div className="space-y-4">
                        {featuredArtists.length > 0 ? (
                            <>
                                <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Star size={12} className="fill-yellow-500" /> Featured Artists
                                </div>
                                {featuredArtists.slice(0, 3).map((artist) => (
                                    <div key={artist.id} className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-yellow-500/20 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-800">
                                            {artist.images[0] && (
                                                <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-bold text-sm">{artist.name}</div>
                                            <div className="text-gray-500 text-xs">Pop {artist.popularity}</div>
                                        </div>
                                        <div className="text-yellow-500 text-xs font-bold flex items-center gap-1">
                                            x2 Pts
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {/* Row 1 */}
                                <div className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                        <Music size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-sm">Lazza</div>
                                        <div className="text-gray-500 text-xs">Headliner • Pop 88</div>
                                    </div>
                                    <div className="text-green-400 text-xs font-bold flex items-center gap-1">
                                        <TrendingUp size={14} /> +124
                                    </div>
                                </div>
                                {/* Row 2 */}
                                <div className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center">
                                        <Music size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-sm">Anna</div>
                                        <div className="text-gray-500 text-xs">Mid Tier • Pop 68</div>
                                    </div>
                                    <div className="text-green-400 text-xs font-bold flex items-center gap-1">
                                        <TrendingUp size={14} /> +89
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Row 3 (Placeholder) */}
                        <div className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/5 opacity-70">
                            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                                <Plus size={20} className="text-gray-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-gray-400 font-bold text-sm">Crea la tua Label</div>
                                <div className="text-gray-600 text-xs">Scegli i tuoi 5 artisti...</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements behind */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-[40px] transform rotate-[3deg] z-10 blur-sm pointer-events-none" />
            </div>
        </main>
    );
}
