'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Music2, Share2, CheckCircle, Loader2 } from 'lucide-react';
import { claimPromoAction, PromoActionType, ArtistPromoStatus } from '@/app/actions/promo';
import { PROMO_POINTS, ArtistCategory } from '@/config/promo';
import { Slot } from './artist-card';

// Helper to determine artist category based on popularity (same logic as backend)
// Ideally this comes from props, but for now we reproduce logic or pass category down.
// Since Slot doesn't explicitly have 'Big'|'Mid'|'New Gen' as a type we trust (it has 'type' prop but it's for label),
// let's rely on the slot.type which roughly maps, or re-calculate.
// Actually `slot.type` is 'Big' | 'Mid' | 'New Gen'. Perfect.

interface PromoModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot;
    spotifyUrl?: string;
    releaseUrl?: string;
    promoStatus: ArtistPromoStatus;
}

export default function PromoModal({ isOpen, onClose, slot, spotifyUrl, releaseUrl, promoStatus }: PromoModalProps) {
    const [loadingAction, setLoadingAction] = useState<PromoActionType | null>(null);
    const [localStatus, setLocalStatus] = useState<ArtistPromoStatus>(promoStatus);

    if (!isOpen || !slot.artist) return null;

    // Determine Artist Category for points display
    // slot.type should be 'Big' | 'Mid' | 'New Gen'
    const category = slot.type as ArtistCategory;
    const pointsMatrix = PROMO_POINTS[category] || PROMO_POINTS['New Gen']; // safety fallback

    const handleAction = async (action: PromoActionType) => {
        if (loadingAction || localStatus[action]) return;

        setLoadingAction(action);

        // 1. Perform Client-Side Action
        if (action === 'profile_click' && spotifyUrl) {
            window.open(spotifyUrl, '_blank');
        } else if (action === 'release_click' && releaseUrl) {
            window.open(releaseUrl, '_blank');
        } else if (action === 'share') {
            const shareData = {
                title: `Check out ${slot.artist?.name} !`,
                text: `I'm managing ${slot.artist?.name} in FantaMusiké. Listen now!`,
                url: spotifyUrl || 'https://musike.fm'
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.error('Share failed', err);
                }
            } else {
                navigator.clipboard.writeText(shareData.url);
                alert('Link copied to clipboard!'); // Simple fallback
            }
        }

        // 2. Server Action
        try {
            const result = await claimPromoAction(slot.artist!.id, action);
            if (result.success) {
                setLocalStatus(prev => ({ ...prev, [action]: true }));
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-3xl p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                    <X size={20} />
                </button>

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

                <div className="space-y-3">
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

                    {/* Action 3: Viral Share */}
                    <ActionRow
                        icon={Share2}
                        label="Viral Share"
                        subLabel="Spread the word"
                        points={pointsMatrix.share}
                        isDone={localStatus.share}
                        isLoading={loadingAction === 'share'}
                        onClick={() => handleAction('share')}
                    />
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

            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'
                }`}>
                +{points} pts
            </div>
        </button>
    );
}
