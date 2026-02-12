'use client';

import { useEffect } from 'react';
import { sendGTMEvent } from '@next/third-parties/google';

export default function ProfileViewTracker() {
    useEffect(() => {
        sendGTMEvent({ event: 'profile_page_view', category: 'engagement' });
    }, []);

    return null;
}
