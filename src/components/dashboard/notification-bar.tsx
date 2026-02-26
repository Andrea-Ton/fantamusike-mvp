'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Megaphone } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface NotificationBarProps {
    message: string;
    isActive: boolean;
}

export default function NotificationBar({ message: initialMessage, isActive: initialIsActive }: NotificationBarProps) {
    const [message, setMessage] = useState(initialMessage);
    const [isActive, setIsActive] = useState(initialIsActive);

    useEffect(() => {
        // Sync with props if they change (e.g. from server action revalidation)
        setMessage(initialMessage);
        setIsActive(initialIsActive);
    }, [initialMessage, initialIsActive]);

    useEffect(() => {
        // Update CSS variable on the document root for sticky mobile headers
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty(
                '--notification-height',
                isActive && message ? '40px' : '0px'
            );
        }

        // Setup Realtime Subscription
        const supabase = createClient();
        const channel = supabase
            .channel('system_notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // We just need to listen for updates
                    schema: 'public',
                    table: 'system_notifications',
                },
                (payload) => {
                    if (payload.new) {
                        setMessage(payload.new.content || '');
                        setIsActive(payload.new.is_active || false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isActive, message]); // Re-run if isActive or message changes to update CSS variable

    return (
        <AnimatePresence>
            {isActive && message && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 40, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="sticky top-0 md:relative w-full bg-[#facc15] text-black h-[40px] flex items-center overflow-hidden z-[110] border-b border-black/10 shadow-[0_2px_10px_rgba(250,204,21,0.2)] flex-shrink-0 origin-top"
                >
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
