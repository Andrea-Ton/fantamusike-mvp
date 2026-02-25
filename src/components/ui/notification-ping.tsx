import React from 'react';

interface NotificationPingProps {
    className?: string;
}

export function NotificationPing({ className = "" }: NotificationPingProps) {
    return (
        <span className={`absolute flex h-4 w-4 z-10 ${className}`}>
            <span className="relative flex items-center justify-center rounded-full h-full w-full bg-red-600 border border-[#0a0a0f] shadow-[0_0_8px_rgba(220,38,38,0.5)] overflow-hidden">
                {/* Centered Symbol - Forced Not Italic */}
                <span className="text-[12px] font-black text-white leading-none z-10 select-none pb-[1px] not-italic">!</span>

                {/* Holographic Metal Reflex - Smoother traversal */}
                <div className="absolute inset-0 w-[200%] -left-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
            </span>
        </span>
    );
}
