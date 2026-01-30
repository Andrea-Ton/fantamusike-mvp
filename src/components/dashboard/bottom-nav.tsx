'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Trophy, Shield, User } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/draft', label: 'Talent Scout', icon: Search },
    { href: '/dashboard/leaderboard', label: 'Classifica', icon: Trophy },
    { href: '/dashboard/profile', label: 'Profilo', icon: User },
];

export default function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-6 left-6 right-6 bg-[#0a0a0e]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-4 py-3 flex justify-around items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1.5 transition-all relative ${isActive ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-white/10 shadow-inner' : ''}`}>
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-purple-400' : ''} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter italic ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                            {item.label.split(' ')[0]}
                        </span>
                        {isActive && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        )}
                    </Link>
                );
            })}
            {isAdmin && (
                <Link
                    href="/admin"
                    className={`flex flex-col items-center gap-1.5 transition-all relative ${pathname.startsWith('/admin') ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    <div className={`p-2 rounded-xl transition-all ${pathname.startsWith('/admin') ? 'bg-red-500/10 shadow-inner' : ''}`}>
                        <Shield size={20} strokeWidth={pathname.startsWith('/admin') ? 2.5 : 2} className={pathname.startsWith('/admin') ? 'text-red-500' : ''} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter italic ${pathname.startsWith('/admin') ? 'opacity-100' : 'opacity-60'}`}>
                        Admin
                    </span>
                    {pathname.startsWith('/admin') && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    )}
                </Link>
            )}
        </div>
    );
}
