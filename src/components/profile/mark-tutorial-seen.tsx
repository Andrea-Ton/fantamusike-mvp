'use client';

import { useEffect, useRef } from 'react';
import { markTutorialPingAsSeenAction } from '@/app/actions/tour';
import { useRouter } from 'next/navigation';

interface MarkTutorialSeenProps {
    isActive: boolean;
}

export default function MarkTutorialSeen({ isActive }: MarkTutorialSeenProps) {
    const isStrictCheckPassed = useRef(false);

    useEffect(() => {
        // Strict Mode in Dev runs mount -> unmount (cleanup) -> mount.
        // We set a small delay to ensure we only mark as seen if the user
        // stayed on the page longer than the "Dev remount" phase.
        const timer = setTimeout(() => {
            isStrictCheckPassed.current = true;
        }, 1000);

        return () => {
            clearTimeout(timer);
            if (isActive && isStrictCheckPassed.current) {
                console.log('User is leaving profile page. Marking tutorial ping as seen...');
                markTutorialPingAsSeenAction().catch(err => {
                    console.error('Failed to mark tutorial ping as seen on leave:', err);
                });
            }
        };
    }, [isActive]);

    return null;
}
