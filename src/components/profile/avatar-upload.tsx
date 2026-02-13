'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Camera, Loader2, X, Check } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';
import { AVAILABLE_AVATARS } from '@/config/avatars';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    username: string;
}

export default function AvatarUpload({ currentAvatarUrl, username }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.position = '';
        };
    }, [isOpen]);

    const handleSelectAvatar = async (path: string) => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('avatarUrl', path);

            // Optimistic update
            setAvatarUrl(path);
            setIsOpen(false);

            const result = await updateProfileAction(formData);

            if (!result.success) {
                console.error(result.message);
                // Revert on failure (could improve UX with toast)
                setAvatarUrl(currentAvatarUrl || null);
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center gap-6">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => setIsOpen(true)}
                >
                    {/* Glowing Ring Effect */}
                    <div className="absolute -inset-2 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition duration-700 animate-pulse"></div>

                    <div className="w-44 h-44 rounded-full border-4 border-white/10 relative bg-[#0a0a0e] shadow-[0_0_50px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_80px_rgba(168,85,247,0.3)] transition-all duration-700 ring-4 ring-white/5 ring-offset-4 ring-offset-black/50 overflow-hidden isolate">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-125"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-black">
                                <span className="text-6xl font-black text-white/20 italic tracking-tighter uppercase">{username.charAt(0)}</span>
                            </div>
                        )}

                        {/* Overlay - Removed backdrop-blur to prevent square artifacts on circular clipping */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center gap-2">
                            <Camera className="text-white animate-bounce-subtle" size={32} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambia</span>
                        </div>

                        {/* Loading State */}
                        {isSaving && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 transition-colors">
                                <Loader2 className="animate-spin text-purple-500" size={32} />
                            </div>
                        )}
                    </div>

                    <button className="absolute bottom-2 right-2 bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-2xl border-2 border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group-hover:shadow-purple-500/20">
                        <Camera size={18} className="text-white" />
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] group-hover:text-gray-300 transition-colors">Clicca per cambiare immagine</p>
                </div>
            </div>

            {/* Selection Modal */}
            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] relative animate-fade-in-up ring-1 ring-white/5">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                            <div>
                                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Scegli il tuo Avatar</h1>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {AVAILABLE_AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleSelectAvatar(avatar.path)}
                                    className={`relative aspect-square rounded-[2rem] overflow-hidden border-2 transition-all duration-500 group ${avatarUrl === avatar.path
                                        ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)] scale-105 ring-4 ring-purple-500/10'
                                        : 'border-white/5 hover:border-white/20 hover:scale-105 hover:shadow-2xl'
                                        }`}
                                >
                                    <Image
                                        src={avatar.path}
                                        alt={avatar.label}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-125 cursor-pointer"
                                    />
                                    {avatarUrl === avatar.path && (
                                        <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="bg-purple-600 rounded-full p-3 shadow-2xl animate-fade-in">
                                                <Check size={24} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
