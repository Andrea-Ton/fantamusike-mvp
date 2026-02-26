import React from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import BottomNav from '@/components/dashboard/bottom-nav';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { getCurrentSeasonAction } from '@/app/actions/season';
import { getSystemNotificationAction } from '@/app/actions/system';
import NotificationBar from '@/components/dashboard/notification-bar';
import { getGamingWeekStart } from '@/app/actions/rewards';

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

    // Level 1: Fetch everything in parallel
    const today = new Date().toISOString().split('T')[0];
    const [
        profileRes,
        currentSeason,
        notificationRes,
        todayPromoRes,
        claimedRes,
        weekPromosRes,
        referralCountRes,
        activeBoxesRes,
        userOrdersRes,
        totalUsersRes
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        getCurrentSeasonAction(),
        getSystemNotificationAction(),
        supabase.from('daily_promos').select('quiz_done, bet_done, boost_done').eq('user_id', user.id).eq('date', today).maybeSingle(),
        supabase.from('claimed_rewards').select('reward_slug').eq('user_id', user.id),
        supabase.from('daily_promos').select('quiz_done, bet_done, boost_done').eq('user_id', user.id).limit(7),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', user.id),
        supabase.from('mystery_boxes').select('id, price_musicoins, available_copies, max_copies_per_user, target_user_goal').eq('is_active', true),
        supabase.from('mystery_box_orders').select('box_id').eq('user_id', user.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    const profile = profileRes.data;
    const notification = notificationRes.data;
    const todayPromo = todayPromoRes.data;
    const weekPromos = weekPromosRes.data;
    const referralCount = referralCountRes.count || 0;
    const activeBoxes = activeBoxesRes.data;
    const userOrders = userOrdersRes.data;
    const totalUsers = totalUsersRes.count || 0;

    // Prioritize DB profile, fallback to metadata, fallback to nothing
    const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url;
    const displayName = profile?.username ?? user?.user_metadata?.name ?? 'Manager';
    const isAdmin = profile?.is_admin || false;

    // Fetch Current Season
    const seasonName = currentSeason?.name || 'Season Zero';

    // 1. Promo Checking
    const pendingPromos = !todayPromo || !(todayPromo.quiz_done && todayPromo.bet_done && todayPromo.boost_done);

    // 2. Rewards Checking
    const claimedSlugs = new Set(claimedRes.data?.map(c => c.reward_slug) || []);
    const weekStart = getGamingWeekStart();
    const weeklySlug = `weekly-commitment-${weekStart.getTime()}`;

    const daysDone = weekPromos?.filter(p => p.quiz_done && p.bet_done && p.boost_done).length || 0;
    const pendingRewards = (daysDone >= 5 && !claimedSlugs.has(weeklySlug)) ||
        (todayPromo?.quiz_done && todayPromo?.bet_done && todayPromo?.boost_done && !claimedSlugs.has(`clean-sweep-${today}`));
    // Note: This is an approximation for the layout ping. MusiRewards component handles full logic.

    // 3. Recharge Checking (Session-based via last_recharge_seen_at)
    const REFERRAL_LIMIT = 10;
    const lastSeen = profile?.last_recharge_seen_at ? new Date(profile.last_recharge_seen_at) : new Date(0);
    const now = new Date();
    const isMoreThan24Hours = (now.getTime() - lastSeen.getTime()) > (24 * 60 * 60 * 1000);

    const pingRecharge = (referralCount || 0) < REFERRAL_LIMIT && (!profile?.last_recharge_seen_at || isMoreThan24Hours);

    // 4. Talent Scout Ping (If < 3 days to reset. Leaderboard resets Monday. Fri/Sat/Sun = day 5/6/0)
    const currentUtcDay = new Date().getUTCDay();
    const pingTalentScout = currentUtcDay === 5 || currentUtcDay === 6 || currentUtcDay === 0;

    // 5. MusiMarket Ping (Advanced checkout - Only ping if AT LEAST ONE box is truly purchasable)
    let pingMusiMarket = false;

    if (activeBoxes && activeBoxes.length > 0) {
        const orderCounts: Record<string, number> = {};
        if (userOrders) {
            userOrders.forEach(o => {
                orderCounts[o.box_id] = (orderCounts[o.box_id] || 0) + 1;
            });
        }

        const userCoins = profile?.musi_coins || 0;

        pingMusiMarket = activeBoxes.some(box => {
            if (userCoins < box.price_musicoins) return false;
            if (box.available_copies !== null && box.available_copies <= 0) return false;
            if (box.max_copies_per_user !== null && (orderCounts[box.id] || 0) >= box.max_copies_per_user) return false;
            if (box.target_user_goal !== null && totalUsers < box.target_user_goal) return false;
            return true;
        });
    }

    const pingDashboard = pendingPromos || pendingRewards || pingRecharge;
    const pingProfile = !profile?.tutorial_ping_seen;

    return (
        <div className="flex min-h-screen bg-[#0b0b10] font-sans text-white">
            {/* Sidebar for Desktop */}
            <Sidebar
                avatarUrl={avatarUrl}
                displayName={displayName}
                seasonName={seasonName}
                isAdmin={isAdmin}
                pingTalentScout={pingTalentScout}
                pingMusiMarket={pingMusiMarket}
                pingDashboard={pingDashboard}
                pingProfile={pingProfile}
            />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 pb-20 md:pb-0 transition-all duration-300">
                <NotificationBar
                    message={notification?.content || ''}
                    isActive={notification?.is_active || false}
                />
                {children}
            </div>

            {/* Bottom Nav for Mobile */}
            <BottomNav
                isAdmin={isAdmin}
                pingTalentScout={pingTalentScout}
                pingMusiMarket={pingMusiMarket}
                pingDashboard={pingDashboard}
                pingProfile={pingProfile}
            />
        </div>
    );
}
