'use client';

import { useState } from 'react';
import { DailyRecapModal } from './daily-recap-modal';

interface ScoreLog {
    id: string;
    points_gained: number;
    date: string;
}

interface DailyRecapModalWrapperProps {
    logs: ScoreLog[];
}

export function DailyRecapModalWrapper({ logs }: DailyRecapModalWrapperProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return null;

    return (
        <DailyRecapModal
            logs={logs}
            onClose={() => {
                setIsOpen(false);
            }}
        />
    );
}
