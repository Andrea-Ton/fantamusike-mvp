import React from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import BottomNav from '@/components/dashboard/bottom-nav';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

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
        .single();

    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const displayName = profile?.username || user?.user_metadata?.name || 'Manager';

    return (
        <div className="flex min-h-screen bg-[#0b0b10] font-sans text-white">
            {/* Sidebar for Desktop */}
            <Sidebar avatarUrl={avatarUrl} displayName={displayName} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 mb-20 md:mb-0 transition-all duration-300">
                {children}
            </div>

            {/* Bottom Nav for Mobile */}
            <BottomNav />
        </div>
    );
}
