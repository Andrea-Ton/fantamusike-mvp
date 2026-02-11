'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Users, Loader2, Star } from 'lucide-react';
import { searchArtistsAction } from '@/app/actions/spotify';
import { getCuratedRosterAction, addToCuratedRosterAction, removeFromCuratedRosterAction } from '@/app/actions/curated';
import { getFeaturedArtistsAction, toggleFeaturedArtistAction } from '@/app/actions/artist';
import { SpotifyArtist } from '@/lib/spotify';
import { ScoutSuggestion } from '@/app/actions/scout';
import Image from 'next/image';

export default function CuratedRosterPage() {
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Roster State
    const [roster, setRoster] = useState<ScoutSuggestion[]>([]);
    const [isLoadingRoster, setIsLoadingRoster] = useState(true);
    const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchRoster();
    }, []);

    const fetchRoster = async () => {
        setIsLoadingRoster(true);
        const [data, featured] = await Promise.all([
            getCuratedRosterAction(),
            getFeaturedArtistsAction()
        ]);
        setRoster(data);
        setFeaturedIds(new Set(featured.map(a => a.id)));
        setIsLoadingRoster(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.length < 2) return;

        setIsSearching(true);
        const result = await searchArtistsAction(searchTerm);
        if (result.success && result.data) {
            setSearchResults(result.data);
        }
        setIsSearching(false);
    };

    const handleAdd = async (artist: SpotifyArtist) => {
        const result = await addToCuratedRosterAction(artist);
        if (result.success) {
            fetchRoster();
            // Optional: Show toast
        } else {
            alert(result.message);
        }
    };

    const handleRemove = async (id: string) => {
        //if (!window.confirm('Are you sure you want to remove this artist?')) return;

        // Optimistic update
        setRoster(prev => prev.filter(a => a.spotify_id !== id));

        const result = await removeFromCuratedRosterAction(id);
        if (result.success) {
            fetchRoster();
        } else {
            alert(result.message);
            // Revert on failure
            fetchRoster();
        }
    };

    const handleToggleFeatured = async (artistId: string, currentStatus: boolean) => {
        // Optimistic update
        const newSet = new Set(featuredIds);
        if (currentStatus) {
            newSet.delete(artistId);
        } else {
            newSet.add(artistId);
        }
        setFeaturedIds(newSet);

        const result = await toggleFeaturedArtistAction(artistId, !currentStatus);
        if (!result.success) {
            alert(result.message);
            fetchRoster(); // Revert
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Curated Roster</h1>
                <p className="text-gray-400 mt-1">Manage the list of suggested artists for the Scout Report.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Search & Add */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                        <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                            <Search size={20} className="text-purple-400" />
                            Search Artists
                        </h3>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="Search Spotify..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                            />
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 className="animate-spin" /> : 'Search'}
                            </button>
                        </form>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {searchResults.map((artist) => {
                                const isInRoster = roster.some(r => r.spotify_id === artist.id);
                                return (
                                    <div key={artist.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800">
                                                {artist.images[0] && (
                                                    <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{artist.name}</div>
                                                <div className="text-xs text-gray-400">Pop: {artist.popularity}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(artist)}
                                            disabled={isInRoster}
                                            className={`p-2 rounded-lg transition-colors ${isInRoster
                                                ? 'bg-green-500/20 text-green-400 cursor-default'
                                                : 'bg-white/10 text-white hover:bg-purple-600'
                                                }`}
                                        >
                                            {isInRoster ? <Users size={16} /> : <Plus size={16} />}
                                        </button>
                                    </div>
                                );
                            })}
                            {searchResults.length === 0 && !isSearching && searchTerm && (
                                <p className="text-gray-500 text-center text-sm py-4">No results found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Current Roster */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <Users size={20} className="text-blue-400" />
                                Current Roster
                            </h3>
                            <div className="flex gap-2">
                                <span className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                    {roster.filter(a => featuredIds.has(a.spotify_id)).length} Featured
                                </span>
                                <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                    {roster.filter(a => !featuredIds.has(a.spotify_id)).length} Suggested
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {isLoadingRoster ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-purple-500" />
                                </div>
                            ) : roster.length === 0 ? (
                                <p className="text-gray-500 text-center text-sm py-8">Roster is empty.</p>
                            ) : (
                                <div className="space-y-8">
                                    {/* Featured Section */}
                                    {roster.some(a => featuredIds.has(a.spotify_id)) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Featured Artists</span>
                                            </div>
                                            {roster
                                                .filter(a => featuredIds.has(a.spotify_id))
                                                .map((artist) => (
                                                    <ArtistRow
                                                        key={artist.spotify_id}
                                                        artist={artist}
                                                        isFeatured={true}
                                                        onToggleFeatured={() => handleToggleFeatured(artist.spotify_id, true)}
                                                        onRemove={() => handleRemove(artist.spotify_id)}
                                                    />
                                                ))}
                                        </div>
                                    )}

                                    {/* Suggested Section */}
                                    {roster.some(a => !featuredIds.has(a.spotify_id)) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <Users size={14} className="text-blue-400" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Suggested Roster</span>
                                            </div>
                                            {roster
                                                .filter(a => !featuredIds.has(a.spotify_id))
                                                .map((artist) => (
                                                    <ArtistRow
                                                        key={artist.spotify_id}
                                                        artist={artist}
                                                        isFeatured={false}
                                                        onToggleFeatured={() => handleToggleFeatured(artist.spotify_id, false)}
                                                        onRemove={() => handleRemove(artist.spotify_id)}
                                                    />
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArtistRow({ artist, isFeatured, onToggleFeatured, onRemove }: {
    artist: ScoutSuggestion;
    isFeatured: boolean;
    onToggleFeatured: () => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800">
                    {artist.image_url && (
                        <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                    )}
                </div>
                <div>
                    <div className="font-bold text-white text-sm">{artist.name}</div>
                    <div className="flex gap-2 items-center text-xs text-gray-400">
                        {artist.genre && artist.genre !== 'Unknown' && (
                            <span>{artist.genre}</span>
                        )}
                        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">Pop {artist.popularity}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onToggleFeatured}
                    className={`p-2 rounded-lg transition-all ${isFeatured
                        ? 'text-yellow-500 hover:bg-yellow-500/10'
                        : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-500/10'
                        }`}
                    title={isFeatured ? "Remove from Featured" : "Add to Featured"}
                >
                    <Star size={16} className={isFeatured ? "fill-yellow-500" : ""} />
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                    title="Remove from Roster"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
