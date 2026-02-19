'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Megaphone } from 'lucide-react';

interface NotificationBarProps {
    message: string;
    isActive: boolean;
}

export default function NotificationBar({ message, isActive }: NotificationBarProps) {
    if (!isActive || !message) return null;

    return (
        <div className="sticky top-0 md:relative w-full bg-[#facc15] text-black h-10 flex items-center overflow-hidden z-[110] border-b border-black/10 shadow-[0_2px_10px_rgba(250,204,21,0.2)]">
            <div className="flex-shrink-0 h-full bg-[#eab308] px-4 flex items-center gap-2 border-r border-black/5 z-20">
                <Megaphone size={14} className="animate-bounce" />
                <span className="font-black uppercase text-[10px] tracking-tighter whitespace-nowrap hidden sm:inline">
                    Info Sistema:
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative flex items-center h-full">
                <motion.div
                    animate={{ x: ["0%", "-100%"] }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'antialiased',
                        willChange: 'transform'
                    }}
                    className="whitespace-nowrap font-bold text-[11px] sm:text-xs italic uppercase tracking-tight pl-[100%] absolute flex items-center h-full transform-gpu"
                >
                    {message}&nbsp;
                </motion.div>
            </div>

            <div className="flex-shrink-0 h-full bg-[#eab308]/50 px-3 flex items-center z-20">
                <AlertTriangle size={12} className="text-black/60" />
            </div>
        </div>
    );
}
