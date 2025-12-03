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
        <div className="md:hidden fixed bottom-0 w-full bg-[#0f0f15]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 pb-safe">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 ${isActive ? 'text-purple-400' : 'text-gray-500'
                            }`}
                    >
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                    </Link>
                );
            })}
            {isAdmin && (
                <Link
                    href="/admin"
                    className={`flex flex-col items-center gap-1 ${pathname === '/admin' ? 'text-red-400' : 'text-gray-500'
                        }`}
                >
                    <Shield size={24} strokeWidth={pathname === '/admin' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Admin</span>
                </Link>
            )}
        </div>
    );
}
