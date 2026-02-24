import React from 'react';

interface NotificationPingProps {
    className?: string;
}

export function NotificationPing({ className = "" }: NotificationPingProps) {
    return (
        <span className={`absolute flex h-3.5 w-3.5 z-10 ${className}`}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80 duration-1000"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-red-600 border-[1.5px] border-[#0a0a0f] shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
        </span>
    );
}
