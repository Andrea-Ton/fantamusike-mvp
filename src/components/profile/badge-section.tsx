'use client';

import React, { useEffect, useState } from 'react';
import { Award, Lock, Check } from 'lucide-react';
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
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl relative group">
            {/* Decorative Background */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                        <Award size={20} className="text-purple-500" />
                        Badges
                    </h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">La mia Collezione</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex items-center justify-center min-w-[32px]">
                    <span className="text-[10px] font-black text-purple-400">{userBadges.length}</span>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-6 animate-pulse">
                    {[1, 2].map((i) => (
                        <div key={i} className="aspect-square bg-white/5 rounded-[2rem]"></div>
                    ))}
                </div>
            ) : userBadges.length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                    {userBadges.map((ub) => (
                        <div key={ub.badge_id} className="group/badge relative">
                            <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center transition-all duration-500 group-hover/badge:scale-110 group-hover/badge:border-purple-500 group-hover/badge:shadow-[0_0_50px_rgba(168,85,247,0.3)] cursor-help overflow-hidden relative isolate">
                                <Image
                                    src={ub.badge.image_url}
                                    alt={ub.badge.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover/badge:scale-125 scale-115 p-1"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500"></div>
                            </div>

                            {/* Tooltip - Increased z-index and removed overflow-hidden on parent */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-56 bg-[#0a0a0e] border border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 group-hover/badge:opacity-100 transition-all duration-300 pointer-events-none z-[100] transform translate-y-4 group-hover/badge:translate-y-0 backdrop-blur-3xl ring-1 ring-white/10">
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0a0e] border-r border-b border-white/10 rotate-45"></div>
                                <h4 className="text-white font-black italic uppercase tracking-tighter text-lg mb-2">{ub.badge.name}</h4>
                                <p className="text-gray-400 text-[10px] leading-relaxed uppercase tracking-[0.2em] font-black">{ub.badge.description}</p>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-purple-500 uppercase tracking-[0.3em]">Status: Sbloccato</span>
                                    <Check size={12} className="text-purple-500" />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="aspect-square rounded-[2rem] bg-white/[0.02] border border-white/5 border-dashed flex items-center justify-center opacity-30 hover:opacity-50 transition-opacity duration-500">
                        <Lock size={20} className="text-gray-600" />
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white/[0.02] rounded-[2.5rem] border border-white/5 border-dashed group-hover:border-purple-500/20 transition-colors">
                    <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Lock size={24} className="text-gray-600" />
                    </div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Nessun badge sbloccato</p>
                </div>
            )}
        </div>
    );
}
