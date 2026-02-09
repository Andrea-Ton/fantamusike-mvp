'use client';

import React, { useState } from 'react';
import BetResultModal from '@/components/dashboard/bet-result-modal';

export function BetResultModalWrapper({ result, onClose }: { result: any, onClose?: () => void }) {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen || !result) return null;

    return (
        <BetResultModal
            promoId={result.id}
            betSnapshot={result.betSnapshot}
            onClose={() => {
                setIsOpen(false);
                onClose?.();
            }}
        />
    );
}
