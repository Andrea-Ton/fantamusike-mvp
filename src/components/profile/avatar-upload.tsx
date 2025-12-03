'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Loader2, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { updateProfileAction } from '@/app/actions/profile';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    username: string;
}

export default function AvatarUpload({ currentAvatarUrl, username }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setIsUploading(true);

        try {
            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile via Server Action
            const formData = new FormData();
            formData.append('avatarUrl', publicUrl);
            const result = await updateProfileAction(formData);

            if (result.success) {
                setAvatarUrl(publicUrl);
            } else {
                console.error(result.message);
            }

        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar!');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                            <Loader2 className="animate-spin text-purple-500" size={32} />
                        </div>
                    )}
                </div>
                <div className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full border-4 border-[#0b0b10] shadow-lg">
                    <Camera size={16} className="text-white" />
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <p className="text-sm text-gray-400">Clicca per cambiare foto</p>
        </div>
    );
}
