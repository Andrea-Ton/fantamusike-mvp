'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Activity, Users, LayoutDashboard, LogOut, Mail, Trophy } from 'lucide-react';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Gestione Premi', href: '/admin/leaderboard', icon: <Trophy size={20} /> },
        { name: 'Gestione Artisti', href: '/admin/roster', icon: <Users size={20} /> },
        { name: 'Email Marketing', href: '/admin/email', icon: <Mail size={20} /> },
        //{ name: 'Season Management', href: '/admin/season', icon: <Calendar size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1a1a24] border-r border-white/5 flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">FantaMusiké</span>
                </div>

                <div className="p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Admin Console</div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 font-bold'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-white/5">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <LayoutDashboard size={20} />
                        <span>Back to App</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-8xl mx-auto mr-20 ml-20">
                    {children}
                </div>
            </main>
        </div>
    );
}
