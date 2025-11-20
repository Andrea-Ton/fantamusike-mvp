'use client';

import React, { useState } from 'react';
import { Search, Plus, LogOut } from 'lucide-react';
import Image from 'next/image';

// --- Mock Data for Search ---
const MOCK_SEARCH_RESULTS = [
    { id: '1', name: 'Niky Savage', image: 'https://i.scdn.co/image/ab6761610000e5eb269df46c9397453d37b44a1e', popularity: 62, category: 'Mid Tier', genre: 'Hip-Hop/Rap' },
    { id: '2', name: 'Suspect CB', image: 'https://i.scdn.co/image/ab6761610000e5eb739569357a2e2240108738e5', popularity: 22, category: 'New Gen', genre: 'Drill' },
    { id: '3', name: 'Sfera Ebbasta', image: 'https://i.scdn.co/image/ab6761610000e5eb82d5d954eb4222c411465699', popularity: 89, category: 'Big', genre: 'Trap' },
    { id: '4', name: 'Artie 5ive', image: 'https://i.scdn.co/image/ab6761610000e5ebd1c62678c5547c41459c4927', popularity: 72, category: 'Mid Tier', genre: 'Rap' },
    { id: '5', name: 'Nerissima Serpe', image: 'https://i.scdn.co/image/ab6761610000e5eb4c6e9a63a932e14617073921', popularity: 45, category: 'Mid Tier', genre: 'Rap' },
];

export default function TalentScoutPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredArtists = MOCK_SEARCH_RESULTS.filter(artist => {
        const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'All' ||
            (activeFilter === 'New Gen' && artist.category === 'New Gen') ||
            (activeFilter === 'Mid Tier' && artist.category === 'Mid Tier') ||
            (activeFilter === 'Big' && artist.category === 'Big');
        return matchesSearch && matchesFilter;
    });

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

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Talent Scout</h1>
                    <p className="text-gray-400">Cerca le prossime star. Ricorda: hai un budget di popolarità da rispettare.</p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-4 z-40 bg-[#0b0b10]/80 backdrop-blur-xl p-2 -mx-2 rounded-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Cerca artista (es. Shiva, thasup...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-[#1a1a24] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/5 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                        {['All', 'New Gen', 'Mid Tier', 'Big'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeFilter === filter
                                        ? 'bg-white text-black shadow-lg shadow-white/10'
                                        : 'bg-[#1a1a24] text-gray-400 border border-white/5 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {filter === 'New Gen' ? 'New Gen < 30' : filter === 'Mid Tier' ? 'Mid Tier 30-75' : filter === 'Big' ? 'Big > 75' : 'Tutti'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Grid */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Risultati Ricerca ({filteredArtists.length})</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredArtists.map((artist) => (
                            <div key={artist.id} className="bg-[#1a1a24] p-4 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-4">
                                        <img src={artist.image} className="w-16 h-16 rounded-xl object-cover" alt={artist.name} />
                                        <div>
                                            <h4 className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors">{artist.name}</h4>
                                            <span className="text-xs text-gray-400">{artist.genre}</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                                        <Plus size={20} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/5 rounded-lg p-2 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-400 uppercase">Popolarità</span>
                                        <span className="text-lg font-bold text-white">{artist.popularity}</span>
                                    </div>
                                    <div className={`rounded-lg p-2 flex flex-col items-center border ${artist.category === 'New Gen' ? 'bg-green-500/10 border-green-500/20' :
                                            artist.category === 'Mid Tier' ? 'bg-orange-500/10 border-orange-500/20' :
                                                'bg-purple-500/10 border-purple-500/20'
                                        }`}>
                                        <span className={`text-[10px] uppercase ${artist.category === 'New Gen' ? 'text-green-400' :
                                                artist.category === 'Mid Tier' ? 'text-orange-400' :
                                                    'text-purple-400'
                                            }`}>Categoria</span>
                                        <span className={`text-sm font-bold mt-1 ${artist.category === 'New Gen' ? 'text-green-400' :
                                                artist.category === 'Mid Tier' ? 'text-orange-400' :
                                                    'text-purple-400'
                                            }`}>{artist.category}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
