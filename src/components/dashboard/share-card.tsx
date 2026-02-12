import React from 'react';
import { SpotifyArtist } from '@/lib/spotify';

interface ShareCardProps {
    username: string;
    totalScore: number;
    rank: number;
    captain: SpotifyArtist | null;
    roster: (SpotifyArtist | null)[];
    weekNumber: number;
    percentile?: string;
}

export default function ShareCard({
    username,
    totalScore,
    rank,
    captain,
    roster,
    weekNumber,
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
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-center">
                {/* Purple Orb */}
                <div
                    className="absolute -top-[500px] -left-[500px] w-[1000px] h-[1000px] rounded-full opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)' }}
                ></div>
                {/* Blue Orb */}
                <div
                    className="absolute -bottom-[500px] -right-[500px] w-[1000px] h-[1000px] rounded-full opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%)' }}
                ></div>

                {/* Pink Logo Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] opacity-10">
                    <img
                        src="/logo_pink.png"
                        alt=""
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Header - Horizontal Layout */}
            <div className="flex items-center justify-center gap-4 mb-8  z-10 w-full">
                <div className="relative w-20 h-20">
                    <img
                        src="/logo.png"
                        alt="FantaMusiké Logo"
                        className="object-contain w-full h-full"
                        crossOrigin="anonymous"
                    />
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">fantamusiké</h1>
            </div>

            {/* Captain Section */}
            <div className="flex flex-col items-center mb-16 z-10 w-full">
                <div className="flex items-center gap-3 mb-6 uppercase tracking-[0.2em] font-black text-gray-500 text-xl">
                    <div className="w-12 h-0.5 bg-purple-500"></div>
                    Capitano
                    <div className="w-12 h-0.5 bg-purple-500"></div>
                </div>
                <div className="relative w-[450px] h-[450px]">
                    <div className="relative w-full h-full rounded-[4rem] overflow-hidden border-4 border-purple-500/30 bg-[#0a0a0a]">
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
                        <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                            <h2
                                className="font-black italic tracking-tighter uppercase text-white leading-tight"
                                style={{
                                    fontSize: (captain?.name || 'TBA').length > 10
                                        ? `${Math.max(2.5, 3.75 * (10 / (captain?.name || 'TBA').length))}rem`
                                        : '3.75rem' // 6xl approx
                                }}
                            >
                                {captain?.name || 'TBA'}
                            </h2>
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
                            <div className="relative w-62 h-62 rounded-[2.5rem] overflow-hidden border-2 border-white/10 bg-white/5">
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
                            <span className="text-3xl font-black italic uppercase tracking-tighter text-gray-300 truncate w-full text-center">
                                {artist?.name || '---'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Manager Name Hero Section */}
            <div className="w-[920px] bg-purple-500/15 border border-purple-500/30 py-10 px-20 rounded-[2.5rem] mb-10 z-20 overflow-hidden flex flex-col items-center justify-center text-center">
                <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-2">Manager</p>
                <h3
                    className="font-black italic tracking-tighter uppercase text-white leading-tight"
                    style={{
                        fontSize: username.length > 18
                            ? `${Math.max(2, 3 * (18 / username.length))}rem`
                            : '3rem' // approx 5xl
                    }}
                >
                    {username}
                </h3>
            </div>

            {/* Footer Stats Grid - OPTIMIZED: Removed backdrop-blur */}
            <div className="mt-auto w-full z-10 mb-8">
                <div className="bg-white/[0.05] border border-white/15 rounded-[4rem] p-8 relative overflow-hidden">
                    <div
                        className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)' }}
                    ></div>
                    <div className="grid grid-cols-3 gap-10 items-center">
                        <div className="text-center">
                            <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-4">Punti</p>
                            <h3
                                className="font-black italic tracking-tighter uppercase text-white leading-none"
                                style={{
                                    fontSize: totalScore.toString().length > 4
                                        ? `${Math.max(4, 7 * (4 / totalScore.toString().length))}rem`
                                        : '4.5rem' // 7xl approx
                                }}
                            >
                                {totalScore}
                            </h3>
                        </div>
                        <div className="text-center">
                            <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-4">Posizione</p>
                            <h3
                                className="font-black italic tracking-tighter uppercase text-purple-400 leading-none"
                                style={{
                                    fontSize: `#${rank}`.length > 4
                                        ? `${Math.max(4, 7 * (4 / `#${rank}`.length))}rem`
                                        : '4.5rem'
                                }}
                            >
                                #{rank}
                            </h3>
                        </div>
                        {percentile && (
                            <div className="text-center">
                                <p className="text-xl text-gray-500 font-black uppercase tracking-widest mb-4">Ranking</p>
                                <h3
                                    className="font-black italic tracking-tighter uppercase text-yellow-400 leading-none"
                                    style={{
                                        fontSize: `Top ${percentile}`.length > 7
                                            ? `${Math.max(3, 6 * (7 / `Top ${percentile}`.length))}rem`
                                            : '3.75rem' // 6xl approx
                                    }}
                                >
                                    Top {percentile}
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
