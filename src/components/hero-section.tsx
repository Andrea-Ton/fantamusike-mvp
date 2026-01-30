'use client';

import React from 'react';
import { ArrowRight, Music, Plus, TrendingUp, Star, PlayCircle } from 'lucide-react';
import { SpotifyArtist } from '@/lib/spotify';
import Image from 'next/image';
import Link from 'next/link';

import { User } from '@supabase/supabase-js';

export default function HeroSection({ seasonName = 'Season Zero', featuredArtists = [], user }: { seasonName?: string, featuredArtists?: SpotifyArtist[], user?: User | null }) {
    return (
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-20 lg:pt-64 lg:pb-40 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Background Bloom Layers */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] -z-10 delay-1000 animate-pulse"></div>

            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{seasonName} LIVE NOW</span>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.85] text-white uppercase">
                        <span className="text-white whitespace-nowrap">IL FANTACALCIO</span><br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 drop-shadow-sm">
                            MUSICALE
                        </span>
                    </h1>
                </div>

                <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                    Crea la tua label, promuovi i tuoi artisti e domina la scena musicale.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-6">
                    {user ? (
                        <Link href="/dashboard" className="group relative px-10 py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span className="relative z-10 group-hover:text-white transition-colors">La mia Dashboard</span>
                            <ArrowRight className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <Link href="/signup" className="group relative px-10 py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span className="relative z-10 group-hover:text-white transition-colors text-lg">Inizia la Carriera</span>
                            <ArrowRight className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-transform" size={24} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Visual Workspace - Redesigned Visuals */}
            <div className="flex-1 relative w-full max-w-xl lg:max-w-none flex justify-center lg:justify-end animate-fade-in-left">
                {/* Decorative Background Glow for cards */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-500/20 blur-[100px] -z-10 rounded-full"></div>

                {/* Floating Widget Column */}
                <div className="space-y-6 relative transform lg:rotate-[-4deg] hover:rotate-0 transition-transform duration-700 w-full max-w-md">

                    {/* Main "Live Data" Card */}
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl ring-1 ring-white/5 relative overflow-hidden group/card">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000"></div>

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Artisti in evidenza</span>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {featuredArtists.length > 0 ? (
                                featuredArtists.slice(0, 3).map((artist, idx) => (
                                    <div key={idx} className="flex gap-5 items-center p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group/item">
                                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-2xl">
                                            {artist.images[0] && (
                                                <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover transition-transform duration-700 group-hover/item:scale-125" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-black italic uppercase tracking-tighter text-sm mb-1">{artist.name}</div>
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Growth: +{12 + idx * 4}%</div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-purple-400 text-xs font-black italic uppercase tracking-tighter">+{342 - idx * 50} PTS</div>
                                            <div className="w-12 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full w-3/4 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Fallback static preview
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-5 items-center p-4 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-white/10 rounded w-24"></div>
                                            <div className="h-2 bg-white/5 rounded w-16"></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Decorative Layering */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-[4rem] transform rotate-[4deg] -z-20 blur-2xl animate-pulse" />
            </div>
        </main>
    );
}
