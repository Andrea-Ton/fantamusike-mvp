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
                    <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.85] text-white uppercase">
                        <span className="text-white whitespace-nowrap">CREA</span><br />
                        <span className="text-white whitespace-nowrap">LA TUA SQUADRA   </span><br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 drop-shadow-sm">
                            OTTIENI
                        </span><br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 drop-shadow-sm">
                            LE MYSTERY BOX
                        </span>
                    </h1>
                </div>

                <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                    Smetti di essere solo un fan. Diventa un Manager. Scova i talenti emergenti prima dei tuoi amici e vinci le Mystery Box della musica.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-6">
                    {user ? (
                        <Link href="/dashboard" className="group relative px-10 py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span className="relative z-10 group-hover:text-white transition-colors">La mia Dashboard</span>
                            <ArrowRight className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <button
                            onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group relative px-10 py-5 bg-white text-black font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span className="relative z-10 group-hover:text-white transition-colors text-lg">Inizia Ora</span>
                            <ArrowRight className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-transform" size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Visual Workspace - Mystery Box */}
            <div className="flex-1 relative w-full max-w-xl lg:max-w-none flex justify-center lg:justify-end animate-fade-in-left">
                {/* Decorative Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/20 blur-[120px] -z-10 rounded-full animate-pulse-glow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/10 blur-[80px] -z-10 rounded-full animate-pulse delay-700"></div>

                {/* Mystery Box Container */}
                <div className="relative w-full max-w-lg aspect-square animate-float">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="relative w-full h-full" style={{ mixBlendMode: 'screen' }}>
                        <Image
                            src="/mystery_box.png"
                            alt="MusiBox Mystery Box"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Floating Particles/Glows around the box */}
                <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-purple-400 rounded-full blur-md animate-ping"></div>
                <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-400 rounded-full blur-sm animate-pulse delay-1000"></div>
            </div>
        </main>
    );
}
