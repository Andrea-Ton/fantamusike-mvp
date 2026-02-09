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
}

export default function DashboardModals({ unseenLogs, pendingBet, unseenWeeklyRecap }: DashboardModalsProps) {
    const hasWeekly = !!unseenWeeklyRecap;
    const hasLogs = unseenLogs && unseenLogs.length > 0;
    const hasBet = !!pendingBet;

    // State to track progression
    const [weeklyFinished, setWeeklyFinished] = useState(false);
    const [recapFinished, setRecapFinished] = useState(false);

    // Order:
    // 1. Weekly Recap
    if (hasWeekly && !weeklyFinished) {
        return (
            <WeeklyRecapModal
                recap={unseenWeeklyRecap!}
                onClose={() => setWeeklyFinished(true)}
            />
        );
    }

    // 2. Daily Recap (only after weekly or if none)
    if (hasLogs && !recapFinished && (weeklyFinished || !hasWeekly)) {
        return (
            <DailyRecapModalWrapper
                logs={unseenLogs}
                onClose={() => setRecapFinished(true)}
            />
        );
    }

    // 3. Bet Results (only after others)
    if (hasBet && (recapFinished || (!hasLogs && (weeklyFinished || !hasWeekly)))) {
        return (
            <BetResultModalWrapper result={pendingBet} />
        );
    }

    return null;
}
