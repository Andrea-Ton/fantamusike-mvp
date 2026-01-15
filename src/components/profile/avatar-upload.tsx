'use client';

import React, { useState } from 'react';
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
            <div className="flex flex-col items-center gap-4">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 relative bg-[#1a1a24]">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl font-bold text-white/20">{username.charAt(0).toUpperCase()}</span>
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
                    <div className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full border-4 border-[#0b0b10] shadow-lg">
                        <Camera size={16} className="text-white" />
                    </div>
                </div>
                <p className="text-sm text-gray-400">Clicca per cambiare foto</p>
            </div>

            {/* Selection Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1a1a24] border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Scegli il tuo Avatar</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="text-gray-400" size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {AVAILABLE_AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleSelectAvatar(avatar.path)}
                                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${avatarUrl === avatar.path
                                            ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                            : 'border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <Image
                                        src={avatar.path}
                                        alt={avatar.label}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-110"
                                    />
                                    {avatarUrl === avatar.path && (
                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                            <div className="bg-purple-500 rounded-full p-1">
                                                <Check size={16} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
