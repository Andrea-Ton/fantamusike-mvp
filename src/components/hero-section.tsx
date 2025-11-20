import React from 'react';
import { ArrowRight, Music, Plus, TrendingUp, Zap, ChevronRight } from 'lucide-react';

export default function HeroSection({ onLogin }: { onLogin?: () => void }) {
    return (
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 lg:pt-28 pb-28 flex flex-col lg:flex-row items-center gap-16">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Season Zero Live
                </div>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-white">
                    Il Fantacalcio <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                        della Musica
                    </span>
                </h1>
                <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Non basta ascoltare. Devi scoprire. Crea la tua etichetta, scova i talenti emergenti prima dei tuoi amici e scala la classifica italiana.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <button
                        onClick={onLogin}
                        className="group relative px-8 py-4 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full transition-all shadow-[0_0_40px_-10px_rgba(29,185,84,0.5)] hover:shadow-[0_0_60px_-10px_rgba(29,185,84,0.6)] flex items-center justify-center gap-3 cursor-pointer"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                        Entra con Spotify
                    </button>
                    <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all backdrop-blur-md flex items-center gap-2 cursor-pointer">
                        Come funziona
                        <ArrowRight size={18} className="opacity-60" />
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
                        {/* Row 3 */}
                        <div className="flex gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/5 opacity-70">
                            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                                <Plus size={20} className="text-gray-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-gray-400 font-bold text-sm">Slot New Gen</div>
                                <div className="text-gray-600 text-xs">Seleziona un artista...</div>
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
