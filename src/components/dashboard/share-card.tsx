
import React from 'react';
import Image from 'next/image';
import { SpotifyArtist } from '@/lib/spotify';

interface ShareCardProps {
    username: string;
    totalScore: number;
    rank: number;
    captain: SpotifyArtist | null;
    roster: (SpotifyArtist | null)[];
    seasonName: string;
    percentile?: string;
}

export default function ShareCard({
    username,
    totalScore,
    rank,
    captain,
    roster,
    seasonName,
    percentile
}: ShareCardProps) {
    // The roster contains all 5 artists, we need to filter out the captain and nulls for the grid
    // Actually, it's easier if we pass them explicitly or filter here.
    const gridArtists = roster.filter(a => a && a.id !== captain?.id).slice(0, 4);

    return (
        <div
            className="w-[1080px] h-[1920px] bg-[#050507] text-white p-20 flex flex-col items-center relative overflow-hidden font-sans"
            style={{
                backgroundImage: 'radial-gradient(circle at 50% 30%, #1a1a2e 0%, #050507 70%)',
            }}
        >
            {/* Background elements for cyberpunk feel */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute -top-[500px] -left-[500px] w-[1000px] h-[1000px] bg-purple-600/30 blur-[150px] rounded-full"></div>
                <div className="absolute -bottom-[500px] -right-[500px] w-[1000px] h-[1000px] bg-blue-600/30 blur-[150px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
            </div>

            {/* Header - Horizontal Layout to save space */}
            <div className="flex items-center justify-center gap-4 mb-12 z-10 w-full">
                <div className="relative w-20 h-20">
                    <img
                        src="/logo.png"
                        alt="FantaMusiké Logo"
                        className="object-contain w-full h-full filter drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        crossOrigin="anonymous"
                    />
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">FantaMusiké</h1>
            </div>

            {/* Captain Section */}
            <div className="flex flex-col items-center mb-16 z-10 w-full">
                <div className="flex items-center gap-3 mb-6 uppercase tracking-[0.2em] font-black text-gray-500 text-xl">
                    <div className="w-12 h-0.5 bg-purple-500"></div>
                    Capitano
                    <div className="w-12 h-0.5 bg-purple-500"></div>
                </div>
                <div className="relative w-[450px] h-[450px] group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-110"></div>
                    <div className="relative w-full h-full rounded-[4rem] overflow-hidden border-4 border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.3)]">
                        {captain?.images[0]?.url ? (
                            <img
                                src={captain.images[0].url}
                                alt={captain.name}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <span className="text-white/20 text-4xl">?</span>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent"></div>
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <h2 className="text-6xl font-black italic tracking-tighter uppercase">{captain?.name || 'TBA'}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roster Grid */}
            <div className="grid grid-cols-2 gap-10 w-full px-10 mb-20 z-10">
                {Array.from({ length: 4 }).map((_, i) => {
                    const artist = gridArtists[i];
                    return (
                        <div key={i} className="flex flex-col items-center gap-4">
                            <div className="relative w-62 h-62 rounded-[2.5rem] overflow-hidden border-2 border-white/10 bg-white/5 shadow-xl">
                                {artist?.images[0]?.url ? (
                                    <img
                                        src={artist.images[0].url}
                                        alt={artist.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                        <div className="w-12 h-12 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            <span className="text-3xl font-black italic uppercase tracking-tighter text-gray-300">
                                {artist?.name || '---'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Performance Metric - Percentile */}
            {percentile && (
                <div className="w-full flex justify-center mb-6 z-10">
                    <div className="px-8 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-3xl flex items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.3)] group hover:border-purple-500/40 transition-all">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                            <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <span className="text-4xl font-black italic uppercase tracking-tight text-white/90">
                            Meglio del <span className="text-yellow-400">{percentile}</span> dei managers
                        </span>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="mt-auto w-full z-10 mb-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-[4rem] p-16 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] -mr-32 -mt-32"></div>
                    <div className="grid grid-cols-3 gap-10 items-center">
                        <div className="text-left">
                            <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-4">Manager</p>
                            <h3 className="text-4xl font-black italic tracking-tighter uppercase truncate text-white">{username}</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-4">Punti Totali</p>
                            <h3 className="text-7xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">{totalScore}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-4">Posizione</p>
                            <h3 className="text-7xl font-black italic tracking-tighter uppercase text-purple-400">#{rank}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brand Watermark */}
            <div className="mt-4 flex items-center gap-4 opacity-30 grayscale">
                <span className="text-xl font-bold tracking-widest uppercase italic">www.fanta.musike.fm</span>
            </div>
        </div>
    );
}
