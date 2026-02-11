'use server';

import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { getMysteryBoxesAction } from '@/app/actions/mystery-box';
import MarketplaceClient from '@/components/dashboard/marketplace-client';
import { redirect } from 'next/navigation';
import MusiCoinBalance from '@/components/dashboard/musicoin-balance';

export default async function MarketplacePage() {
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

    const { data: boxes } = await getMysteryBoxesAction();

    // Fetch user order counts for each box
    const userOrderCounts: Record<string, number> = {};
    if (boxes) {
        const { data: orders } = await supabase
            .from('mystery_box_orders')
            .select('box_id')
            .eq('user_id', user.id);

        if (orders) {
            orders.forEach(order => {
                userOrderCounts[order.box_id] = (userOrderCounts[order.box_id] || 0) + 1;
            });
        }
    }

    return (
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
            <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-px bg-yellow-500"></span>
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">ottieni le mysterybox</span>
                    </div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">MusiMarket</h1>
                    <p className="text-gray-500 mt-3 font-medium text-lg">Usa i tuoi MusiCoins per sbloccare le esclusive MysteryBox della Musica.</p>
                </div>

                <MusiCoinBalance musiCoins={profile?.musi_coins || 0} referralCode={profile?.referral_code} />
            </header>

            <MarketplaceClient
                initialBoxes={boxes || []}
                userMusiCoins={profile?.musi_coins || 0}
                userOrderCounts={userOrderCounts}
            />
        </main>
    );
}
