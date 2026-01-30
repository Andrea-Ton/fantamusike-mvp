'use client';

import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
    targetHour?: number; // UTC hour
    showScoringStatus?: boolean;
    label?: string;
    variant?: 'small' | 'large';
}

export default function CountdownTimer({
    targetHour = 0,
    showScoringStatus = false,
    label,
    variant = 'small'
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isScoringInProgress, setIsScoringInProgress] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const nowUtc = new Date(now.toUTCString());

            const target = new Date(nowUtc);
            target.setUTCHours(targetHour, 0, 0, 0);

            if (nowUtc >= target) {
                target.setUTCDate(target.getUTCDate() + 1);
            }

            const diff = target.getTime() - nowUtc.getTime();

            // Special case for scoring (03:00 to 03:15 UTC)
            if (showScoringStatus && targetHour === 3) {
                const minutesSinceTwo = (nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes()) - (3 * 60);
                if (minutesSinceTwo >= 0 && minutesSinceTwo < 15) {
                    setIsScoringInProgress(true);
                    return;
                } else {
                    setIsScoringInProgress(false);
                }
            }

            if (diff <= 0) {
                return '00:00:00';
            }

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTimeLeft() || '00:00:00');

        const timer = setInterval(() => {
            const result = calculateTimeLeft();
            if (result) setTimeLeft(result);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetHour, showScoringStatus]);

    if (isScoringInProgress) {
        return (
            <div className="flex items-center gap-2 text-yellow-400 font-small animate-pulse text-xs">
                <Timer className="w-4 h-4" />
                <span>Calcolo punteggio in corso...</span>
            </div>
        );
    }

    if (variant === 'large') {
        return (
            <div className="flex flex-col gap-1 justify-center">
                {label && <span className="text-purple-200 text-xs font-medium">{label}</span>}
                <div className="flex items-center justify-center gap-1 text-white font-mono text-sm">
                    <Timer className="w-5 h-5 text-purple-400" />
                    <span>{timeLeft}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-gray-400 text-[10px] font-mono shadow-inner backdrop-blur-sm">
            <Timer size={10} className="text-purple-400/70" />
            <span className="tracking-tight">{timeLeft}</span>
        </div>
    );
}
