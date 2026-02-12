'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Trophy, Shield, User, ShoppingBag } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/draft', label: 'Talent Scout', icon: Search },
    { href: '/dashboard/marketplace', label: 'MusiMarket', icon: ShoppingBag },
    { href: '/dashboard/leaderboard', label: 'Classifica', icon: Trophy },
    { href: '/dashboard/profile', label: 'Profilo', icon: User },
];

export default function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleNavigation = (href: string) => {
        router.push(href);
    };

    return (
        <>
            {/* Background Buffer for Mobile Chrome UI shifts */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0b0b10] z-40 pointer-events-none" />

            <div className="md:hidden fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-5 right-5 bg-[#0a0a0e]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-4 py-2.5 flex justify-around items-center z-50 animate-fade-in-up-subtle shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            onClick={() => handleNavigation(item.href)}
                            className={`flex flex-col items-center gap-1.5 transition-all relative outline-none ${isActive ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-white/10 shadow-inner' : ''}`}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-purple-400' : ''} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter italic ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label.split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
                {isAdmin && (
                    <button
                        onClick={() => handleNavigation('/admin')}
                        className={`flex flex-col items-center gap-1.5 transition-all relative outline-none ${pathname.startsWith('/admin') ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'
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
                    </button>
                )}
            </div>
        </>
    );
}
