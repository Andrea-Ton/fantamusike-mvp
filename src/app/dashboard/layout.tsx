import React from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import BottomNav from '@/components/dashboard/bottom-nav';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

import { getCurrentSeasonAction } from '@/app/actions/season';
import { getSystemNotificationAction } from '@/app/actions/system';
import NotificationBar from '@/components/dashboard/notification-bar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    // Prioritize DB profile, fallback to metadata, fallback to nothing
    const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url;
    const displayName = profile?.username ?? user?.user_metadata?.name ?? 'Manager';
    const isAdmin = profile?.is_admin || false;

    // Fetch Current Season
    const currentSeason = await getCurrentSeasonAction();
    const seasonName = currentSeason?.name || 'Season Zero';

    // Fetch System Notification
    const { data: notification } = await getSystemNotificationAction();

    return (
        <div className="flex min-h-screen bg-[#0b0b10] font-sans text-white">
            {/* Sidebar for Desktop */}
            <Sidebar avatarUrl={avatarUrl} displayName={displayName} seasonName={seasonName} isAdmin={isAdmin} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 mb-20 md:mb-0 transition-all duration-300">
                <NotificationBar
                    message={notification?.content || ''}
                    isActive={notification?.is_active || false}
                />
                {children}
            </div>

            {/* Bottom Nav for Mobile */}
            <BottomNav isAdmin={isAdmin} />
        </div>
    );
}
