'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Trophy, LogOut, Shield, ShoppingBag } from 'lucide-react';
import { sendGTMEvent } from '@next/third-parties/google';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/draft', label: 'Talent Scout', icon: Search },
    { href: '/dashboard/marketplace', label: 'MusiMarket', icon: ShoppingBag },
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
        <div className="hidden md:flex flex-col w-64 h-screen bg-[#050507]/80 backdrop-blur-3xl border-r border-white/5 fixed left-0 top-0 z-50">
            <Link href="/" className="p-8 flex items-center gap-3 group transition-all duration-300 hover:opacity-80">
                <div className="relative w-10 h-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-105">
                    <Image
                        src="/logo.png"
                        alt="FantaMusiké Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none group-hover:text-purple-400 transition-colors">FantaMusiké</h1>
                    <p className="hidden text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{season}</p>
                </div>
            </Link>

            <div className="flex-1 px-4 py-8 space-y-1.5 flex flex-col">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-4 mb-3">Menu</p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            id={item.label === 'Talent Scout' ? 'tour-talent-scout-desktop' : undefined}
                            href={item.href}
                            onClick={() => sendGTMEvent({
                                event: 'navigation_click',
                                category: 'engagement',
                                label: item.label,
                                destination: item.href,
                                source: 'sidebar'
                            })}
                            className={`group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${isActive
                                ? 'bg-white/5 text-white border border-white/10 shadow-inner'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-purple-500 rounded-r-full" />
                            )}
                            <item.icon size={18} className={`${isActive ? 'text-purple-400' : 'group-hover:text-gray-300'} transition-colors`} />
                            <span className="font-black uppercase tracking-widest text-[11px]">{item.label}</span>
                        </Link>
                    );
                })}

                {isAdmin && (
                    <>
                        <div className="mt-8 mb-4 border-t border-white/5 mx-4" />
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-4 mb-3">Amministrazione</p>
                        <Link
                            href="/admin"
                            onClick={() => sendGTMEvent({
                                event: 'navigation_click',
                                category: 'engagement',
                                label: 'Admin Panel',
                                destination: '/admin',
                                source: 'sidebar_admin'
                            })}
                            className={`group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${pathname.startsWith('/admin')
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                                }`}
                        >
                            {pathname.startsWith('/admin') && (
                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-red-500 rounded-r-full" />
                            )}
                            <Shield size={18} className={`${pathname.startsWith('/admin') ? 'text-red-500' : 'group-hover:text-gray-300'} transition-colors`} />
                            <span className="font-black uppercase tracking-widest text-[11px]">Pannello Admin</span>
                        </Link>
                    </>
                )}
            </div>

            <div className="p-6 mt-auto">
                <Link href="/dashboard/profile" className="bg-white/5 rounded-[1.5rem] p-4 border border-white/10 flex items-center gap-3 mb-2 hover:bg-white/10 transition-all group cursor-pointer shadow-inner backdrop-blur-md">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-0.5 relative group-hover:scale-105 transition-transform shadow-lg">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="rounded-full object-cover border-2 border-[#050507]"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[#050507] flex items-center justify-center">
                                <span className="text-[10px] font-black text-white italic uppercase">{display.charAt(0)}</span>
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050507]"></div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-black text-white tracking-wider truncate group-hover:text-purple-400 transition-colors">{display}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleSignOut();
                        }}
                        className="text-gray-600 hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-xl"
                    >
                        <LogOut size={16} />
                    </button>
                </Link>
            </div>
        </div>
    );
}
