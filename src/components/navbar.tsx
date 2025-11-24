'use client';
'use client';

import React from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#0b0b10]/50 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                    <Image
                        src="/logo.png"
                        alt="FantaMusiké Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">FantaMusiké</span>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/login">
                    <button className="px-5 py-2 rounded-full bg-white/10 border border-white/5 text-sm font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md">
                        Accedi
                    </button>
                </Link>
            </div>
        </nav>
    );
}
