'use client';

import React, { useState } from 'react';
import { DailyRecapModalWrapper } from './daily-recap-modal-wrapper';
import { BetResultModalWrapper } from './bet-result-modal-wrapper';

interface DashboardModalsProps {
    unseenLogs: any[] | null;
    pendingBet: any | null;
}

export default function DashboardModals({ unseenLogs, pendingBet }: DashboardModalsProps) {
    const hasLogs = unseenLogs && unseenLogs.length > 0;
    const hasBet = !!pendingBet;

    // State to track if we've finished the recap and should show the bet
    const [recapFinished, setRecapFinished] = useState(false);

    // Logic:
    // 1. If there are logs and we haven't finished the recap, show the recap modal.
    // 2. Once the recap modal is closed (onClose called), set recapFinished to true.
    // 3. If there's a pending bet AND (either recap is finished OR there were no logs to begin with), show the bet modal.

    if (hasLogs && !recapFinished) {
        return (
            <DailyRecapModalWrapper
                logs={unseenLogs}
                onClose={() => setRecapFinished(true)}
            />
        );
    }

    if (hasBet && (recapFinished || !hasLogs)) {
        return (
            <BetResultModalWrapper result={pendingBet} />
        );
    }

    return null;
}
