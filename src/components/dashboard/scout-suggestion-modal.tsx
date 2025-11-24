'use client';

import React from 'react';
import { X, RefreshCw, UserPlus, Music } from 'lucide-react';
import { ScoutSuggestion } from '@/app/actions/scout';
import Image from 'next/image';

interface ScoutSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: ScoutSuggestion[];
    onSign: (artist: ScoutSuggestion) => void;
    onReroll: () => void;
    isLoading: boolean;
    maxPopularity?: number;
}

export default function ScoutSuggestionModal({
    isOpen,
    onClose,
    suggestions,
    onSign,
    onReroll,
    isLoading,
    maxPopularity
}: ScoutSuggestionModalProps) {
    const [error, setError] = React.useState<string | null>(null);

    // Reset error when modal opens or suggestions change
    React.useEffect(() => {
        if (isOpen) setError(null);
    }, [isOpen, suggestions]);

    const handleSign = (artist: ScoutSuggestion) => {
        if (maxPopularity !== undefined && artist.popularity >= maxPopularity) {
            setError(`Questo artista ha una popolarità troppo alta (${artist.popularity}) per uno slot New Gen (Max ${maxPopularity}).`);
            return;
        }
        setError(null);
        onSign(artist);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a24] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-purple-500/20 animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                            <Music size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Scout Report</h2>
                            <p className="text-xs text-purple-300 uppercase tracking-wider">Talenti Consigliati</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-400 mb-6 text-sm">
                        I nostri talent scout hanno selezionato questi artisti emergenti per la tua Label.
                        Scegli con saggezza, potrebbero essere le prossime star!
                    </p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-shake">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoading ? (
                            // Loading Skeletons
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 animate-pulse flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full bg-white/10" />
                                    <div className="h-4 w-24 bg-white/10 rounded" />
                                    <div className="h-3 w-16 bg-white/10 rounded" />
                                    <div className="h-8 w-full bg-white/10 rounded mt-2" />
                                </div>
                            ))
                        ) : suggestions.length > 0 ? (
                            suggestions.map((artist) => (
                                <div key={artist.spotify_id} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 flex flex-col items-center gap-4 transition-all group">
                                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-purple-500 transition-colors shadow-lg">
                                        {artist.image_url ? (
                                            <Image src={artist.image_url} alt={artist.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <Music size={32} className="text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-white text-lg leading-tight mb-2">{artist.name}</h3>
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                            {artist.genre && artist.genre !== 'Unknown' && (
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                                                    {artist.genre}
                                                </span>
                                            )}
                                            <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${maxPopularity && artist.popularity >= maxPopularity
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                                }`}>
                                                Pop {artist.popularity}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSign(artist)}
                                        className={`w-full py-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${maxPopularity && artist.popularity >= maxPopularity
                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed hover:bg-white/10 shadow-none'
                                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                                            }`}
                                    >
                                        <UserPlus size={16} />
                                        Ingaggia
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-10 text-gray-500">
                                Nessun suggerimento disponibile al momento.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-white/5 flex justify-center">
                    <button
                        onClick={onReroll}
                        disabled={isLoading}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Cerca altri talenti
                    </button>
                </div>
            </div>
        </div>
    );
}
