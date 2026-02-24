"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    weekNumber: number;
    seasonName?: string;
    percentile?: string;
    variant?: 'default' | 'iconOnly' | 'primary';
}

export default function ShareButton({
    username,
    totalScore,
    rank,
    captain,
    roster,
    weekNumber,
    seasonName = 'Season 1',
    percentile,
    variant = 'default'
}: ShareButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getBase64 = async (url: string): Promise<string> => {
        try {
            // This should hit the browser cache since images are already displayed
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error('Base64 conversion failed:', e);
            return url; // Fallback to URL
        }
    };

    const captureRef = useRef<HTMLDivElement>(null);

    const generateImage = async (): Promise<string | null> => {
        if (isGenerating) return null;

        setIsGenerating(true);
        setError(null);
        try {
            // Prepare all data including base64 images to avoid server-side fetching
            const data: any = {
                username,
                totalScore: totalScore.toString(),
                rank: rank.toString(),
                seasonName,
                percentile,
                roster: []
            };

            if (captain) {
                data.captainName = captain.name;
                if (captain.images?.[0]?.url) {
                    data.captainImage = await getBase64(captain.images[0].url);
                }
            }

            const gridArtists = roster.filter(artist => artist && artist.id !== captain?.id).slice(0, 4);
            for (const artist of gridArtists) {
                if (artist) {
                    const img = artist.images?.[1]?.url || artist.images?.[0]?.url;
                    data.roster.push({
                        name: artist.name,
                        image: img ? await getBase64(img) : null
                    });
                }
            }

            const response = await fetch('/api/og', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

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

    // Pre-generate image as soon as the dashboard loads (on mount)
    useEffect(() => {
        if (!dataUrl && !isGenerating && !error) {
            // Small delay to ensure browser has finished initial rendering/caching
            const timer = setTimeout(() => {
                generateImage();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [username, totalScore, rank, captain, roster, weekNumber, seasonName, percentile]);

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

    const renderTrigger = () => {
        if (variant === 'iconOnly') {
            return (
                <button
                    id="tour-share-button"
                    onClick={() => {
                        setError(null);
                        setShowModal(true);
                    }}
                    className="relative group outline-none mt-[6px] block"
                    title="Condividi Label"
                >
                    <div className="absolute inset-0 bg-purple-900 rounded-xl"></div>
                    <div className="relative p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 border border-purple-400/50 rounded-xl flex items-center justify-center group-hover:from-purple-500 group-hover:to-purple-500 -translate-y-[6px] active:translate-y-0 transition-transform overflow-hidden">
                        <Share2 size={18} className="text-white group-hover:scale-110 transition-all relative z-10" />
                    </div>
                </button>
            );
        }

        if (variant === 'primary') {
            return (
                <button
                    id="tour-share-button"
                    onClick={() => {
                        setError(null);
                        setShowModal(true);
                    }}
                    className="group relative w-full h-16 bg-purple-600 text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-[0_10px_40px_rgba(168,85,247,0.2)] transform hover:-translate-y-1 active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-3 border border-purple-400/30"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Sparkles size={20} className="relative z-10 group-hover:animate-spin-slow" />
                    <span className="relative z-10">Share Card</span>
                </button>
            );
        }

        return (
            <button
                id="tour-share-button"
                onClick={() => {
                    setError(null);
                    setShowModal(true);
                }}
                className="group/share relative outline-none mt-[6px] w-full h-full block"
            >
                <div className="absolute inset-0 bg-purple-900 rounded-2xl"></div>
                <div className="relative px-6 py-3 bg-gradient-to-br from-purple-500 to-purple-600 border border-purple-400/50 rounded-2xl text-white text-sm font-black uppercase tracking-tighter italic group-hover/share:from-purple-500 group-hover/share:to-purple-500 transition-transform flex items-center justify-center gap-3 -translate-y-[6px] active:translate-y-0 w-full h-full">
                    <Share2 size={18} className="text-white group-hover/share:rotate-12 transition-transform" />
                    <span>Condividi&nbsp;Label</span>
                </div>
            </button>
        );
    };

    return (
        <>
            {renderTrigger()}

            {/* Preview Modal - Portaled to Body */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence mode="wait">
                    {showModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ottieni ogni settimana <span className="text-amber-400">40 Musicoin</span> extra condividendo la tua label sui social e taggando <span className="text-amber-400">FantaMusiké</span></p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all flex items-center justify-center"
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
                                                weekNumber={weekNumber}
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
                                                        generateImage();
                                                    }}
                                                    className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all"
                                                >
                                                    Riprova
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-white/5 bg-white/[0.03] flex gap-3 mt-auto">
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
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
