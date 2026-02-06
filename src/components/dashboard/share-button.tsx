"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Share2, Download, Loader2, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShareCard from './share-card';
import { SpotifyArtist } from '@/lib/spotify';

interface ShareButtonProps {
    username: string;
    totalScore: number;
    rank: number;
    captain: SpotifyArtist | null;
    roster: (SpotifyArtist | null)[];
    seasonName: string;
    percentile?: string;
}

export default function ShareButton({
    username,
    totalScore,
    rank,
    captain,
    roster,
    seasonName,
    percentile
}: ShareButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const captureRef = useRef<HTMLDivElement>(null);

    const generateImage = async (): Promise<string | null> => {
        setIsGenerating(true);
        setError(null);
        try {
            console.log("Starting server-side generation...");

            const params = new URLSearchParams();
            params.append('username', username);
            params.append('totalScore', totalScore.toString());
            params.append('rank', rank.toString());
            params.append('seasonName', seasonName);
            if (percentile) params.append('percentile', percentile);

            if (captain) {
                params.append('captainName', captain.name);
                // Use the largest image for the main captain display
                if (captain.images?.[0]?.url) {
                    params.append('captainImage', captain.images[0].url);
                }
            }

            // Filter out the captain from the roster for the grid
            const gridArtists = roster.filter(artist => artist && artist.id !== captain?.id).slice(0, 4);

            gridArtists.forEach((artist, index) => {
                if (artist) {
                    params.append(`rosterName${index}`, artist.name);
                    // For the roster grid (small images), use a smaller variant (usually 300x300 at index 1)
                    // to speed up fetching and rendering significantly.
                    const rosterImg = artist.images?.[1]?.url || artist.images?.[0]?.url;
                    if (rosterImg) {
                        params.append(`rosterImage${index}`, rosterImg);
                    }
                }
            });

            const apiUrl = `/api/og?${params.toString()}`;
            console.log("Fetching image from:", apiUrl);

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const blob = await response.blob();
            if (!blob || blob.size === 0) {
                throw new Error("Received empty image from server");
            }

            const url = URL.createObjectURL(blob);
            setDataUrl(url);
            return url;

        } catch (err: any) {
            console.error('Generation Error:', err);
            setError(err.message || 'Errore di generazione');
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    // Pre-generate image when modal opens
    useEffect(() => {
        if (showModal && !dataUrl && !isGenerating && !error) {
            generateImage();
        }
    }, [showModal, dataUrl, isGenerating, error]);

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (dataUrl) URL.revokeObjectURL(dataUrl);
        };
    }, [dataUrl]);

    const handleDownload = async () => {
        // If image is still generating, wait or do nothing (button should be disabled)
        if (!dataUrl) return;

        const link = document.createElement('a');
        link.download = `fantamusike-${username}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (!dataUrl) return;

        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `fantamusike-${username}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Il mio FantaMusiké Wrapped',
                    text: `Guarda la mia Label su FantaMusiké! Ho fatto ${totalScore} punti e sono #${rank} in classifica! 🚀 #FantaMusike`,
                });
            } else {
                handleDownload();
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            handleDownload();
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    setError(null);
                    setShowModal(true);
                }}
                className="px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl text-white text-sm font-black uppercase tracking-tighter italic hover:bg-white/10 hover:border-purple-500/50 transition-all shadow-inner flex items-center gap-3 overflow-hidden group h-full"
            >
                <div className="relative">
                    <Share2 size={18} className="text-purple-400 group-hover:rotate-12 transition-transform" />
                </div>
                <span>Condividi&nbsp;Label</span>
            </button>

            {/* Preview Modal */}
            <AnimatePresence mode="wait">
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[95vh] z-10"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Share Card</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Condividi la tua Label per ottenere MusiCoins!</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white z-20"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content - LIVE PREVIEW */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center bg-[#050507]">
                                <div className="relative aspect-[9/16] w-full max-w-[280px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                    {/* Live React Component Scaled */}
                                    <div
                                        className="absolute top-0 left-0 origin-top-left"
                                        style={{
                                            width: '1080px',
                                            height: '1920px',
                                            transform: `scale(${280 / 1080})`,
                                            pointerEvents: 'none',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <ShareCard
                                            username={username}
                                            totalScore={totalScore}
                                            rank={rank}
                                            captain={captain}
                                            roster={roster}
                                            seasonName={seasonName}
                                            percentile={percentile}
                                        />
                                    </div>

                                    {/* Generation Overlay */}
                                    <AnimatePresence>
                                        {isGenerating && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                                            >
                                                <div className="relative">
                                                    <Loader2 size={32} className="text-purple-500 animate-spin" />
                                                    <div className="absolute inset-0 blur-lg bg-purple-500/20 animate-pulse"></div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white animate-pulse">Generazione immagine in corso...</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Error Overlay */}
                                    {error && !isGenerating && (
                                        <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center gap-3 p-6 text-center">
                                            <AlertCircle size={32} className="text-red-500" />
                                            <span className="text-xs font-bold text-red-500/80 uppercase italic">{error}</span>
                                            <button
                                                onClick={() => {
                                                    setError(null);
                                                    setDataUrl(null);
                                                }}
                                                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all"
                                            >
                                                Chiudi Errore
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/5 bg-white/[0.03] flex gap-3">
                                <button
                                    onClick={handleDownload}
                                    disabled={isGenerating}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-tighter italic hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={16} />
                                    <span>Scarica</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={isGenerating}
                                    className="flex-[1.5] py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-tighter italic hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                >
                                    <Share2 size={16} />
                                    <span>Condividi</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
