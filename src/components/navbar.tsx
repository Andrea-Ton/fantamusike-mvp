'use client';
'use client';

import React from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

import { User } from '@supabase/supabase-js';

export default function Navbar({ user }: { user?: User | null }) {
    return (
        <nav className="fixed top-0 w-full z-[100] px-6 py-6 flex justify-between items-center bg-[#0b0b10]/40 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 group cursor-pointer">
                <div className="relative w-10 h-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Image
                        src="/logo.png"
                        alt="FantaMusiké Logo"
                        fill
                        className="object-contain relative z-10"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">FantaMusiké</span>
                    <span className="text-[8px] font-black text-purple-500 uppercase tracking-[0.4em] mt-1 opacity-70">Season Zero</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <Link href="/dashboard">
                        <button className="group relative px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 shadow-2xl backdrop-blur-md overflow-hidden">
                            <span className="relative z-10">Dashboard</span>
                        </button>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <button className="group relative px-4 py-2.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-purple-500/40 overflow-hidden">
                                <span className="relative z-10">Accedi</span>
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
