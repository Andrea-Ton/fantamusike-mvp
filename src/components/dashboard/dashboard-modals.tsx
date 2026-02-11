'use client';

import React, { useState } from 'react';
import { DailyRecapModalWrapper } from './daily-recap-modal-wrapper';
import { BetResultModalWrapper } from './bet-result-modal-wrapper';
import { WeeklyRecapModal } from './weekly-recap-modal';
import { WeeklyRecap } from '@/app/actions/leaderboard';

interface DashboardModalsProps {
    unseenLogs: any[] | null;
    pendingBet: any | null;
    unseenWeeklyRecap: WeeklyRecap | null;
    username: string;
}

export default function DashboardModals({ unseenLogs, pendingBet, unseenWeeklyRecap, username }: DashboardModalsProps) {
    const hasWeekly = !!unseenWeeklyRecap;
    const hasLogs = unseenLogs && unseenLogs.length > 0;
    const hasBet = !!pendingBet;

    // State to track progression
    const [recapFinished, setRecapFinished] = useState(false);
    const [betFinished, setBetFinished] = useState(false);

    // Sequence Order:
    // 1. Daily Recap (Points)
    if (hasLogs && !recapFinished) {
        return (
            <DailyRecapModalWrapper
                logs={unseenLogs}
                onClose={() => setRecapFinished(true)}
            />
        );
    }

    // 2. Bet Results (only after daily recap or if none)
    if (hasBet && !betFinished && (recapFinished || !hasLogs)) {
        return (
            <BetResultModalWrapper
                result={pendingBet}
                onClose={() => setBetFinished(true)}
            />
        );
    }

    // 3. Weekly Recap (Last in sequence)
    if (hasWeekly && (betFinished || !hasBet) && (recapFinished || !hasLogs)) {
        return (
            <WeeklyRecapModal
                recap={unseenWeeklyRecap!}
                username={username}
                onClose={() => { }} // Last one, no more steps
            />
        );
    }

    return null;
}
