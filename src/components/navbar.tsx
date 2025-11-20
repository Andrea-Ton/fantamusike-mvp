'use client';

import React from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
    const handleLogin = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'spotify',
            options: {
                redirectTo: 'http://localhost:3000/auth/callback',
            },
        });
    };

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
            <button
                onClick={handleLogin}
                className="px-5 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
            >
                Login
            </button>
        </nav>
    );
}
