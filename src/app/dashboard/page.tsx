'use client';

import React from 'react';
import { Trophy, TrendingUp, Info, LogOut } from 'lucide-react';
import ArtistCard, { Slot } from '@/components/dashboard/artist-card';
import Image from 'next/image';

// --- Mock Data ---
const MOCK_TEAM: Slot[] = [
    { id: 1, type: 'Big', label: 'Headliner', requirement: 'Popolarità > 75', artist: { id: '1', name: 'Lazza', image: 'https://i.scdn.co/image/ab6761610000e5eb82d5d954eb4222c411465699', popularity: 88, category: 'Big', trend: +12 } },
    { id: 2, type: 'Mid', label: 'Rising Star 1', requirement: 'Popolarità 30-75', artist: { id: '2', name: 'Anna', image: 'https://i.scdn.co/image/ab6761610000e5eb4c6e9a63a932e14617073921', popularity: 68, category: 'Mid', trend: +45 } },
    { id: 3, type: 'Mid', label: 'Rising Star 2', requirement: 'Popolarità 30-75', artist: null },
    { id: 4, type: 'New Gen', label: 'Scout Pick 1', requirement: 'Popolarità < 30', artist: { id: '4', name: 'Kid Yugi', image: 'https://i.scdn.co/image/ab6761610000e5ebd1c62678c5547c41459c4927', popularity: 28, category: 'New Gen', trend: +120 } },
    { id: 5, type: 'New Gen', label: 'Scout Pick 2', requirement: 'Popolarità < 30', artist: null },
];

export default function DashboardPage() {
    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden pt-12 px-6 flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="FantaMusiké Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">FantaMusiké</h1>
                        <p className="text-xs text-gray-400">Season Zero</p>
                    </div>
                </div>
                <button><LogOut className="text-gray-400" size={22} /></button>
            </div>

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <header className="hidden md:flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-gray-400">Benvenuto, Manager. Ecco come sta andando la tua etichetta.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-4 py-2 bg-[#1a1a24] rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition">Notifiche</button>
                        <button className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-500/20">Invita Amico</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Stats & Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Score Card */}
                        <div className="w-full rounded-3xl bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium mb-2">Punteggio Totale</p>
                                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">850</h2>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                                        <Trophy size={16} className="text-yellow-300" />
                                        <span className="text-sm font-bold">#42 Global</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Trend Settimanale</span>
                                        <div className="flex items-center gap-1 text-lg font-bold">
                                            <TrendingUp size={18} className="text-green-300" />
                                            +124 pts
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-white/20"></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Prossimo Update</span>
                                        <span className="text-lg font-bold">Venerdì 00:00</span>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative */}
                            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                            <div className="absolute bottom-0 right-0 opacity-20">
                                <svg width="150" height="120" viewBox="0 0 100 80" fill="none">
                                    <path d="M0 80 L40 40 L70 60 L100 10" stroke="white" strokeWidth="4" fill="none" />
                                </svg>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 flex gap-4 items-start">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Info className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h4 className="text-blue-400 font-bold mb-1">Strategia Settimanale</h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Gli artisti <span className="text-white font-bold">"New Gen"</span> stanno performando il 20% meglio questa settimana grazie ai nuovi release. Considera di scambiare il tuo slot Scout Pick 2.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Roster */}
                    <div className="lg:col-span-7">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">La Tua Etichetta</h3>
                            <button
                                className="px-4 py-2 rounded-full bg-[#1a1a24] border border-white/10 text-sm text-purple-400 font-medium hover:bg-purple-500 hover:text-white transition-all"
                            >
                                Gestisci Roster
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {MOCK_TEAM.map((slot) => (
                                <ArtistCard key={slot.id} slot={slot} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
