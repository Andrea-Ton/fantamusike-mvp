import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { getMysteryBoxesAction } from '@/app/actions/mystery-box';
import MarketplaceClient from '@/components/dashboard/marketplace-client';
import { redirect } from 'next/navigation';
import MusiCoinBalance from '@/components/dashboard/musicoin-balance';
import Image from 'next/image';
import LogoutButton from '@/components/logout-button';

export default async function MarketplacePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Level 1: Fetch metadata in parallel
    const [
        profileRes,
        boxesRes,
        ordersRes,
        totalUsersRes,
        referralCountRes
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getMysteryBoxesAction(),
        supabase.from('mystery_box_orders').select('box_id').eq('user_id', user.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', user.id)
    ]);

    const profile = profileRes.data;
    const { data: boxes } = boxesRes;
    const { data: orders } = ordersRes;
    const totalUsers = totalUsersRes.count;
    const referralCount = referralCountRes.count;

    // Fetch user order counts for each box
    const userOrderCounts: Record<string, number> = {};
    if (orders) {
        orders.forEach(order => {
            userOrderCounts[order.box_id] = (userOrderCounts[order.box_id] || 0) + 1;
        });
    }

    // 24h Recharge Ping Logic
    const REFERRAL_LIMIT = 10;
    const lastSeen = profile?.last_recharge_seen_at ? new Date(profile.last_recharge_seen_at) : new Date(0);
    const now = new Date();
    const isMoreThan24Hours = (now.getTime() - lastSeen.getTime()) > (24 * 60 * 60 * 1000);
    const pingRecharge = (referralCount || 0) < REFERRAL_LIMIT && (!profile?.last_recharge_seen_at || isMoreThan24Hours);

    return (
        <>
            {/* Mobile Header - Shifted down if notification bar is active using CSS variable */}
            <div
                className="md:hidden pt-4 px-6 flex justify-between items-center mb-4 bg-[#0a0a0e]/80 backdrop-blur-xl border-b border-white/5 pb-4 sticky z-30 transition-all duration-300"
                style={{ top: 'var(--notification-height, 0px)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="FantaMusiké Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">FantaMusiké</h1>
                    </div>
                </div>
                <LogoutButton />
            </div>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-px bg-yellow-500"></span>
                            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">ottieni le mysterybox</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">MusiMarket</h1>
                        <p className="text-gray-500 mt-3 font-medium text-sm">Usa i tuoi MusiCoins per sbloccare le esclusive MysteryBox della Musica.</p>
                    </div>

                    <MusiCoinBalance
                        musiCoins={profile?.musi_coins || 0}
                        referralCode={profile?.referral_code}
                        referralCount={referralCount || 0}
                        pingRecharge={pingRecharge}
                    />
                </header>

                <MarketplaceClient
                    initialBoxes={boxes || []}
                    userMusiCoins={profile?.musi_coins || 0}
                    userOrderCounts={userOrderCounts}
                    totalUsers={totalUsers || 0}
                />
            </main>
        </>
    );
}
