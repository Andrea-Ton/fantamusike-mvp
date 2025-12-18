'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Music2, Share2, CheckCircle, Loader2, ChevronRight, Trophy, Rocket } from 'lucide-react';
import { claimPromoAction, PromoActionType, ArtistPromoStatus } from '@/app/actions/promo';
import { PROMO_POINTS, ArtistCategory } from '@/config/promo';
import { Slot } from './artist-card';
import confetti from 'canvas-confetti';
import { motion, useSpring, useTransform } from 'framer-motion';

function SpringCounter({ from, to }: { from: number; to: number }) {
    const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(to);
    }, [spring, to]);

    return <motion.span>{display}</motion.span>;
}

interface PromoModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot;
    spotifyUrl?: string;
    releaseUrl?: string;
    revivalUrl?: string;
    promoStatus: ArtistPromoStatus;
}

export default function PromoModal({ isOpen, onClose, slot, spotifyUrl, releaseUrl, revivalUrl, promoStatus }: PromoModalProps) {
    const [loadingAction, setLoadingAction] = useState<PromoActionType | null>(null);
    const [localStatus, setLocalStatus] = useState<ArtistPromoStatus>(promoStatus);
    const [promoResult, setPromoResult] = useState<{ amount: number; label: string; type: 'musicoins' | 'points' } | null>(null);
    const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);

    // Reset promo result when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPromoResult(null);
            setPendingRedirectUrl(null);
        }
    }, [isOpen]);

    if (!isOpen || !slot.artist) return null;

    // Determine Artist Category for points display
    const category = slot.type as ArtistCategory;
    const pointsMatrix = PROMO_POINTS[category] || PROMO_POINTS['New Gen']; // safety fallback

    const triggerConfetti = () => {
        const duration = 500;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#a855f7', '#fbbf24', '#ffffff'] // Purple, Gold, White
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#a855f7', '#fbbf24', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const handleAction = async (action: PromoActionType) => {
        if (loadingAction || localStatus[action]) return;

        setLoadingAction(action);

        // Determine URL for redirection
        let targetUrl: string | null = null;
        if (action === 'profile_click' && spotifyUrl) {
            targetUrl = spotifyUrl;
        } else if (action === 'release_click' && releaseUrl) {
            targetUrl = releaseUrl;
        } else if (action === 'share' && revivalUrl) {
            targetUrl = revivalUrl;
        }

        // Server Action
        try {
            const result = await claimPromoAction(slot.artist!.id, action);
            if (result.success) {
                setLocalStatus(prev => ({ ...prev, [action]: true }));

                // Success - Show Result Screen for BOTH cases (Safari Fix & UX)
                if (result.musiCoinsAwarded && result.musiCoinsAwarded > 0) {
                    setPromoResult({
                        amount: result.musiCoinsAwarded,
                        label: result.dropLabel || 'Lucky Drop',
                        type: 'musicoins'
                    });
                    triggerConfetti();
                } else {
                    setPromoResult({
                        amount: result.pointsAwarded || 0,
                        label: 'Punti Guadagnati',
                        type: 'points'
                    });
                }

                // Store URL to open after claim
                if (targetUrl) {
                    setPendingRedirectUrl(targetUrl);
                }
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingAction(null);
        }
    };

    const smartRedirect = (url: string) => {
        // Detect if running in standalone mode (PWA)
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

        if (isStandalone && url.includes('spotify.com')) {
            // Convert to URI scheme to trigger app directly without "ghost tab"
            // open.spotify.com/artist/ID -> spotify:artist:ID
            // open.spotify.com/track/ID -> spotify:track:ID
            // open.spotify.com/album/ID -> spotify:album:ID

            try {
                const parts = url.split('spotify.com/')[1]?.split('?')[0]?.split('/');
                if (parts && parts.length >= 2) {
                    const type = parts[0];
                    const id = parts[1];
                    const spotifyUri = `spotify:${type}:${id}`;

                    // Direct location change in PWA mode triggers the app switch
                    // without opening a new browser tab bridge
                    window.location.href = spotifyUri;
                    return;
                }
            } catch (e) {
                console.error('Failed to parse Spotify URI', e);
            }
        }

        // Fallback for non-PWA or if parsing fails/unsupported
        window.open(url, '_blank');
    };

    const handleClaim = () => {
        const isMusiCoin = promoResult?.type === 'musicoins';
        setPromoResult(null);

        if (isMusiCoin) {
            // Maybe a small short confetti burst on claim too?
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#fbbf24', '#ffffff']
            });
        }

        // Open Pending URL using smart redirect
        if (pendingRedirectUrl) {
            smartRedirect(pendingRedirectUrl);
            setPendingRedirectUrl(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <style jsx global>{`
                @keyframes spin3d {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                .animate-spin-3d {
                    animation: spin3d 2s linear infinite;
                    transform-style: preserve-3d;
                }
            `}</style>

            <div className="w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-3xl p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden min-h-[400px]">
                {!promoResult && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-20"
                    >
                        <X size={20} />
                    </button>
                )}

                <h3 className="text-lg font-bold text-center text-white mb-6">Promuovi Artista</h3>

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src={slot.artist.image}
                        alt={slot.artist.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                    />
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{slot.artist.name}</h2>
                        <span className="text-sm text-purple-400 font-medium">{slot.type} Artist</span>
                    </div>
                </div>

                {/* Content Area: Swaps between Action List and Result View */}
                <div className="relative">
                    {promoResult ? (
                        <div className="flex flex-col items-center justify-center py-4 animate-in zoom-in duration-300">
                            {promoResult.type === 'musicoins' ? (
                                <>
                                    {/* Spinning Coin */}
                                    <div className="relative w-32 h-32 mb-6">
                                        <div className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                        <div className="relative w-full h-full animate-spin-3d">
                                            <div className="w-full h-full rounded-full border-4 border-yellow-300 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                                                <span className="text-5xl font-bold text-yellow-100 drop-shadow-md">$</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 mb-2 text-center drop-shadow-sm">
                                        {promoResult.label}!
                                    </h3>
                                    <p className="text-gray-400 mb-8 text-center text-sm">Hai trovato <span className="text-yellow-400 font-bold text-lg"><SpringCounter from={0} to={promoResult.amount} /> MusiCoins</span>!</p>

                                    <button
                                        onClick={handleClaim}
                                        className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transform hover:scale-105 active:scale-95 transition-all w-full"
                                    >
                                        Raccogli MusiCoins
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Pulsating Points UI */}
                                    <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] border-4 border-white/10 animate-bounce transition-all duration-1000">
                                            <Trophy size={40} className="text-white drop-shadow-lg" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2 text-center">
                                        {promoResult.label}
                                    </h3>
                                    <p className="text-gray-400 mb-8 text-center text-sm">Hai guadagnato <span className="text-purple-400 font-bold text-xl"><SpringCounter from={0} to={promoResult.amount} /> Punti Fantamusiké!</span></p>

                                    <button
                                        onClick={handleClaim}
                                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 transform hover:scale-105 active:scale-95 transition-all w-full"
                                    >
                                        Raccogli Punti
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            {/* Action 1: Check Metrics (Profile) */}
                            <ActionRow
                                icon={ExternalLink}
                                label="Check Metrics"
                                subLabel="Visit Spotify Profile"
                                points={pointsMatrix.profile_click}
                                isDone={localStatus.profile_click}
                                isLoading={loadingAction === 'profile_click'}
                                onClick={() => handleAction('profile_click')}
                                disabled={!spotifyUrl}
                            />

                            {/* Action 2: Push Release */}
                            <ActionRow
                                icon={Music2}
                                label="Push Latest Release"
                                subLabel="Stream New Drop"
                                points={pointsMatrix.release_click}
                                isDone={localStatus.release_click}
                                isLoading={loadingAction === 'release_click'}
                                onClick={() => handleAction('release_click')}
                                disabled={!releaseUrl} // Disable if no release found
                            />

                            {/* Action 3: Boost Revival */}
                            <ActionRow
                                icon={Rocket}
                                label="Boost Revival"
                                subLabel="Promuovi un Classico"
                                points={pointsMatrix.share}
                                isDone={localStatus.share}
                                isLoading={loadingAction === 'share'}
                                onClick={() => handleAction('share')}
                                disabled={!revivalUrl}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ActionRowProps {
    icon: React.ElementType;
    label: string;
    subLabel: string;
    points: number;
    isDone: boolean;
    isLoading: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function ActionRow({ icon: Icon, label, subLabel, points, isDone, isLoading, onClick, disabled }: ActionRowProps) {
    return (
        <button
            onClick={onClick}
            disabled={isDone || isLoading || disabled}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isDone
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : disabled
                    ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-white hover:border-white/10'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDone ? 'bg-green-500/20' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : isDone ? <CheckCircle size={20} /> : <Icon size={20} />}
                </div>
                <div className="text-left">
                    <div className="font-bold text-sm">{label}</div>
                    <div className={`text-xs ${isDone ? 'text-green-500/70' : 'text-gray-400'}`}>{subLabel}</div>
                </div>
            </div>

            <div className={`transition-all ${isDone ? 'text-green-400' : 'text-gray-500'}`}>
                {!isDone ?
                    <ChevronRight size={20} />
                    : null}
            </div>
        </button>
    );
}
