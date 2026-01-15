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
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>

                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/10 relative bg-[#1a1a24] shadow-2xl">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                                <span className="text-5xl font-bold text-white/40">{username.charAt(0).toUpperCase()}</span>
                            </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="text-white" size={32} />
                        </div>

                        {/* Loading State */}
                        {isSaving && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                                <Loader2 className="animate-spin text-purple-500" size={32} />
                            </div>
                        )}
                    </div>

                    <button className="absolute bottom-2 right-2 bg-purple-600 p-2.5 rounded-full border-4 border-[#0b0b10] shadow-lg hover:bg-purple-500 transition-colors group-hover:scale-110 duration-300">
                        <Camera size={18} className="text-white" />
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-gray-400 text-xs font-medium">Clicca per cambiare foto</p>
                </div>
            </div>

            {/* Selection Modal */}
            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-[#1a1a24]/90 border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in-up ring-1 ring-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Scegli il tuo Avatar</h3>
                                <p className="text-gray-400 text-sm mt-1">Seleziona uno dei nostri avatar esclusivi</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {AVAILABLE_AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleSelectAvatar(avatar.path)}
                                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 group ${avatarUrl === avatar.path
                                        ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-105'
                                        : 'border-white/5 hover:border-white/20 hover:scale-105 hover:shadow-xl'
                                        }`}
                                >
                                    <Image
                                        src={avatar.path}
                                        alt={avatar.label}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                                    />
                                    {avatarUrl === avatar.path && (
                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                            <div className="bg-purple-500 rounded-full p-2 shadow-lg">
                                                <Check size={20} className="text-white" />
                                            </div>
                                        </div>
                                    )}
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
