'use client';

import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setUTCDate(now.getUTCDate() + 1);
            tomorrow.setUTCHours(0, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();

            if (diff <= 0) {
                return '00:00:00';
            }

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-white/5 text-gray-400 text-xs font-mono">
            <Timer size={12} />
            <span>{timeLeft}</span>
        </div>
    );
}
