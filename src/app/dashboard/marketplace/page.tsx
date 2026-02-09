'use server';

import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { getMysteryBoxesAction } from '@/app/actions/mystery-box';
import MarketplaceClient from '@/components/dashboard/marketplace-client';
import { redirect } from 'next/navigation';
import { Coins } from 'lucide-react';

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
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Premium Store</span>
                    </div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Marketplace</h1>
                    <p className="text-gray-500 mt-3 font-medium text-lg">Usa i tuoi MusiCoins per sbloccare premi esclusivi e MysteryBox.</p>
                </div>

                {/* Dashboard Style Balance - Desktop Only */}
                <div className="hidden md:flex items-center gap-4 px-8 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner h-16 transition-all hover:bg-white/10 group">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-400">
                        <Coins size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black leading-none mb-1">IL TUO SALDO</span>
                        <span className="text-2xl font-black text-yellow-400 tracking-tighter leading-none italic">{profile?.musi_coins || 0} <span className="text-xs not-italic text-yellow-400/50">MUSICOINS</span></span>
                    </div>
                </div>
            </header>

            <MarketplaceClient
                initialBoxes={boxes || []}
                userMusiCoins={profile?.musi_coins || 0}
                userOrderCounts={userOrderCounts}
            />
        </main>
    );
}
