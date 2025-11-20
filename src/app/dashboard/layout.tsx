import React from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import BottomNav from '@/components/dashboard/bottom-nav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0b0b10] font-sans text-white">
            {/* Sidebar for Desktop */}
            <Sidebar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 mb-20 md:mb-0 transition-all duration-300">
                {children}
            </div>

            {/* Bottom Nav for Mobile */}
            <BottomNav />
        </div>
    );
}
