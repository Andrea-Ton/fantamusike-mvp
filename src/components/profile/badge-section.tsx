'use client';

import React, { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface Badge {
    id: string;
    name: string;
    description: string;
    image_url: string;
}

interface UserBadge {
    badge_id: string;
    awarded_at: string;
    badge: Badge;
}

export default function BadgeSection({ userId }: { userId: string }) {
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchBadges() {
            try {
                const { data, error } = await supabase
                    .from('user_badges')
                    .select('*, badge:badges(*)')
                    .eq('user_id', userId);

                if (error) throw error;
                setUserBadges(data || []);
            } catch (error) {
                console.error('Error fetching badges:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBadges();
    }, [userId]);

    return (
        <div className="bg-[#1a1a24]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award size={14} className="text-purple-400" />
                Badges
            </h3>

            {isLoading ? (
                <div className="animate-pulse flex gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-full"></div>
                    <div className="w-12 h-12 bg-white/5 rounded-full"></div>
                </div>
            ) : userBadges.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {userBadges.map((ub) => (
                        <div key={ub.badge_id} className="group relative">
                            <div className="w-25 h-25 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-help overflow-hidden relative">
                                <Image
                                    src={ub.badge.image_url}
                                    alt={ub.badge.name}
                                    fill
                                    className="object-cover drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]"
                                />
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-[#0f0f15] border border-white/10 rounded-xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                <p className="text-white font-bold text-sm text-center">{ub.badge.name}</p>
                                <p className="text-gray-400 text-xs text-center mt-1">{ub.badge.description}</p>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder for future locked badges (optional visual cue) TODO: Hidden*/}
                    <div className="w-25 h-25 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-30">
                        <Lock size={18} className="text-gray-500" />
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5 border-dashed">
                    <p className="text-xs text-gray-500">Nessun badge sbloccato</p>
                </div>
            )}

            {/* TODO: Hidden */}
            <div className="hidden mt-4 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 text-center">
                <p className="text-xs text-purple-300">Gioca e vinci per sbloccare nuovi trofei!</p>
            </div>
        </div>
    );
}
