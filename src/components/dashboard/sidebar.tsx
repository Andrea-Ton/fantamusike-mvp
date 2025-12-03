'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Trophy, LogOut, Shield } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/draft', label: 'Talent Scout', icon: Search },
    { href: '/dashboard/leaderboard', label: 'Classifica', icon: Trophy },
];

interface SidebarProps {
    avatarUrl?: string;
    displayName?: string;
    seasonName?: string;
    isAdmin?: boolean;
}

export default function Sidebar({ avatarUrl, displayName, seasonName, isAdmin }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const display = displayName || 'Manager';
    const season = seasonName || 'Season Zero';

    return (
        <div className="hidden md:flex flex-col w-64 h-screen bg-[#0f0f15] border-r border-white/5 fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                        src="/logo.png"
                        alt="FantaMusiké Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div>
                    <span className="block text-xl font-bold text-white tracking-tight leading-none">FantaMusiké</span>
                    <span className="text-xs text-gray-500 font-medium">{season}</span>
                </div>
            </div>

            <div className="flex-1 px-4 py-6 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2">Menu</p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}

                {isAdmin && (
                    <>
                        <div className="my-4 border-t border-white/5 mx-4" />
                        <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-2">Admin</p>
                        <Link
                            href="/admin"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${pathname === '/admin'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Shield size={20} />
                            <span className="font-medium text-sm">Pannello Admin</span>
                        </Link>
                    </>
                )}
            </div>

            <div className="p-4 mt-auto">
                <Link href="/dashboard/profile" className="bg-[#1a1a24] rounded-2xl p-4 border border-white/5 flex items-center gap-3 mb-2 hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-0.5 relative group-hover:scale-105 transition-transform">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="rounded-full object-cover border-2 border-[#0f0f15]"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[#0f0f15] flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{display.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">{display}</p>
                        <p className="text-xs text-gray-500 truncate">Manager Lv. 1</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault(); // Prevent navigation when clicking logout
                            handleSignOut();
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <LogOut size={18} />
                    </button>
                </Link>
            </div>
        </div>
    );
}
