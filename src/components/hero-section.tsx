'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { SpotifyArtist } from '@/lib/spotify';

export default function HeroSection({
    seasonName = 'Settimana 1',
    user,
    featuredArtists = []
}: {
    seasonName?: string,
    user?: User | null,
    featuredArtists?: SpotifyArtist[]
}) {
    return (
        <section className="relative w-full min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#0a0a0f]">

            {/* --- BACKGROUND LAYERS --- */}

            {/* 1. Base Gradient for depth */}
            <div className="absolute inset-0 bg-[#0a0a0f] z-0" />

            {/* 2. Massive Bloom Effects (Glows) - Exaggerated for "Evident" Glows as requested */}
            <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-purple-600/35 rounded-full blur-[180px] -z-10 animate-pulse-glow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[1200px] h-[1200px] bg-blue-600/25 rounded-full blur-[200px] -z-10 delay-1000 animate-pulse-glow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-purple-900/10 rounded-full blur-[200px] -z-10 pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-pink-500/15 rounded-full blur-[150px] -z-10 animate-pulse" />


            {/* --- CONTENT --- */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mt-32 lg:mt-0">

                {/* Left Column: Typography & CTA */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:space-y-10 animate-fade-in-up pt-10 lg:pt-20 lg:mr-10">

                    {/* Headline - High impact glow */}
                    <div className="relative group w-full">
                        {/* Title Specific Glow */}
                        <div className="absolute -inset-10 bg-purple-500/30 blur-[120px] -z-10 opacity-70 pointer-events-none group-hover:opacity-100 transition-opacity duration-1000" />

                        <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.85] text-white uppercase drop-shadow-2xl">
                            <span className="block lg:whitespace-nowrap">Crea la</span>
                            <span className="block lg:whitespace-nowrap">Tua Squadra</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] sm:drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                                Ottieni le
                            </span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] sm:drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                                Mystery Box
                            </span>
                        </h1>
                    </div>

                    {/* Subheadline */}
                    <p className="text-base md:text-xl text-gray-400 max-w-lg font-medium leading-relaxed drop-shadow-lg px-4 lg:px-0">
                        Smetti di essere solo un fan.
                        <span className="text-gray-200 font-bold ml-1"> Diventa un Manager.</span>
                        <span className="block text-gray-400 mt-2 text-sm md:text-base">Scova i talenti emergenti prima dei tuoi amici e vinci le Mystery Box della musica.</span>
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto pt-4">
                        {user ? (
                            <Link href="/dashboard" className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden text-sm sm:text-base">
                                <span className="relative z-10 transition-colors group-hover:text-white italic">La mia Dashboard</span>
                                <ArrowRight className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </Link>
                        ) : (
                            <button
                                onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden cursor-pointer text-sm sm:text-base"
                            >
                                <span className="relative z-10 transition-colors group-hover:text-white italic">Inizia Ora</span>
                                <ArrowRight className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column: Visual Hero (Premium Frame) */}
                <div className="relative flex justify-center lg:justify-end animate-fade-in-left delay-200 mt-8 lg:mt-0 xl:pl-10 px-4 sm:px-0">

                    {/* The Massive Glow behind the Frame */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-purple-500/25 blur-[100px] lg:blur-[150px] rounded-full animate-pulse-glow" />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/15 blur-[80px] lg:blur-[120px] rounded-full animate-pulse delay-500" />

                    {/* PREMIUM IMAGE FRAME (CORNICE) */}
                    <div className="relative group w-full max-w-[340px] sm:max-w-lg lg:max-w-xl aspect-[4/3] sm:aspect-square mb-8 lg:mb-0">

                        {/* Outer Glow Ring */}
                        <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-tr from-purple-500/60 via-pink-400/40 to-blue-500/60 rounded-[2rem] sm:rounded-[3.5rem] blur-2xl opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-300"></div>

                        {/* Frame Border & Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500/70 via-white/30 to-blue-500/70 rounded-[2rem] sm:rounded-[3rem] blur-md opacity-80 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                        {/* Main Container */}
                        <div className="relative h-full w-full bg-[#0d0d14] rounded-[2rem] sm:rounded-[3rem] p-3 sm:p-7 overflow-hidden border border-white/20 flex items-center justify-center shadow-[0_0_80px_rgba(168,85,247,0.25)] sm:shadow-[0_0_120px_rgba(168,85,247,0.3)]">

                            {/* Content Wrapper */}
                            <div className="relative w-full h-full rounded-[1.5rem] sm:rounded-[2.2rem] overflow-hidden shadow-inner ring-1 ring-white/20 bg-black">
                                <Image
                                    src="/landing_boxes.png"
                                    alt="FantaMusike Preview"
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    priority
                                />

                                {/* Overlay for premium feel */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                            </div>

                            {/* Floating Branding / Info inside the frame */}
                            <div className="absolute bottom-6 sm:bottom-12 left-0 lg:left-12 z-20 w-full lg:w-auto flex justify-center lg:justify-start px-8 lg:px-0">
                                <div className="flex flex-col gap-2">
                                    <span className="px-5 py-2 sm:px-4 sm:py-1.5 rounded-full sm:rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-white uppercase italic w-fit shadow-xl text-center">
                                        Explore the collection
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements near the frame */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/30 blur-3xl rounded-full animate-pulse capitalize hidden sm:block" />
                        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-500/25 blur-3xl rounded-full animate-float delay-500 hidden sm:block" />
                    </div>

                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-bounce cursor-pointer" onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">Scorri</span>
                <div className="w-[1px] h-10 bg-gradient-to-b from-white to-transparent" />
            </div>

        </section>
    );
}
