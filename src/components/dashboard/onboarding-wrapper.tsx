'use client';

import React from 'react';
import OnboardingModal from './onboarding-modal';
import { SpotifyArtist } from '@/lib/spotify';

interface OnboardingWrapperProps {
    hasCompletedOnboarding: boolean;
    featuredArtists: SpotifyArtist[];
    curatedRoster: SpotifyArtist[];
    username: string;
}

export default function OnboardingWrapper({
    hasCompletedOnboarding,
    featuredArtists,
    curatedRoster,
    username
}: OnboardingWrapperProps) {
    if (hasCompletedOnboarding) return null;

    return (
        <OnboardingModal
            featuredArtists={featuredArtists}
            curatedRoster={curatedRoster}
            username={username}
        />
    );
}
