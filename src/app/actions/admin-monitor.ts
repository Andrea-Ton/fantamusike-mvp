'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function getMonitorDataAction(days: number = 7) {
    const supabase = await createClient();

    // 1. Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    try {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - days);
        const pastDateStr = pastDate.toISOString();
        const pastDateDateStr = pastDate.toISOString().split('T')[0];

        // Total Users (Lifetime)
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // New Users in Timeframe
        const { count: newUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', pastDateStr);

        // Active Users in Timeframe
        const { count: activeUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('last_login_at', pastDateStr);

        // Promo Completion (At least ONE action in timeframe)
        const { data: activePromos } = await supabase
            .from('daily_promos')
            .select('user_id')
            .gte('date', pastDateStr.split('T')[0])
            .or('quiz_done.eq.true,bet_done.eq.true,boost_done.eq.true');

        const activePromoUsers = new Set(activePromos?.map(p => p.user_id) || []).size;

        // Pending Onboarding
        const { count: pendingOnboardingCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('has_completed_onboarding', false);

        let promoCompletionRate = 0;
        if (activeUsers && activeUsers > 0) {
            promoCompletionRate = Math.round((activePromoUsers / activeUsers) * 100);
        }

        // Invited Friends in Timeframe
        const { count: invitedFriends } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', pastDateStr)
            .not('referred_by', 'is', null);

        // Team Activity Rate (Users who locked a team in the timeframe / Total Users)
        const { data: recentTeams } = await supabase
            .from('teams')
            .select('user_id')
            .gte('locked_at', pastDateStr);

        const activeTeamUsers = new Set(recentTeams?.map(t => t.user_id) || []).size;
        let multipleTeamsRate = 0;
        if (totalUsers && totalUsers > 0) {
            multipleTeamsRate = Math.round((activeTeamUsers / totalUsers) * 100);
        }

        // Mystery Box Orders in Timeframe
        const { data: orders } = await supabase
            .from('mystery_box_orders')
            .select('id, created_at, mystery_boxes(price_musicoins)')
            .gte('created_at', pastDateStr);

        let freeBoxOrders = 0;
        let paidBoxOrders = 0;
        let musicoinVolume = 0;

        if (orders) {
            orders.forEach((order: any) => {
                const price = order.mystery_boxes?.price_musicoins || 0;
                if (price === 0) {
                    freeBoxOrders++;
                } else {
                    paidBoxOrders++;
                    musicoinVolume += price;
                }
            });
        }

        // Musicoin Transactions in Timeframe
        const { data: transactions } = await supabase
            .from('musicoin_transactions')
            .select('amount_eur, status, created_at')
            .gte('created_at', pastDateStr);

        let totalTransactions = 0;
        let totalRevenueEur = 0;
        const distributionMap: Record<string, number> = {};

        if (transactions) {
            transactions.forEach(tx => {
                totalTransactions++;
                if (tx.status === 'COMPLETED') {
                    totalRevenueEur += tx.amount_eur || 0;
                    const amount = tx.amount_eur?.toFixed(2) || '0.00';
                    distributionMap[amount] = (distributionMap[amount] || 0) + 1;
                }
            });
        }

        const transactionDistribution = Object.entries(distributionMap)
            .map(([amount, count]) => ({ amount: parseFloat(amount), count }))
            .sort((a, b) => a.amount - b.amount);

        // Recent Transactions (Limited to 5, still in timeframe)
        const { data: recentTransactions } = await supabase
            .from('musicoin_transactions')
            .select('*, profiles(username)')
            .gte('created_at', pastDateStr)
            .order('created_at', { ascending: false })
            .limit(5);

        return {
            success: true,
            data: {
                totalUsers: totalUsers || 0,
                newUsers: newUsers || 0,
                activeUsers: activeUsers || 0,
                promoCompletionRate,
                freeBoxOrders,
                paidBoxOrders,
                totalTransactions,
                totalRevenueEur: Math.round(totalRevenueEur * 100) / 100,
                musicoinVolume,
                transactionDistribution,
                invitedFriends: invitedFriends || 0,
                multipleTeamsRate,
                pendingOnboardingCount: pendingOnboardingCount || 0
            }
        };

    } catch (error) {
        console.error('Monitor Data Fetch Error:', error);
        return { success: false, message: 'Failed to fetch monitoring data' };
    }
}

export async function getPendingOnboardingEmailsAction() {
    const supabase = await createClient();

    // 1. Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    try {
        const adminClient = createAdminClient();

        // Get user IDs from profiles with pending onboarding
        const { data: pendingProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('has_completed_onboarding', false);

        if (!pendingProfiles || pendingProfiles.length === 0) {
            return { success: true, emails: [] };
        }

        const userIds = pendingProfiles.map(p => p.id);

        // Get emails from auth.users (requires service role)
        const { data: { users }, error } = await adminClient.auth.admin.listUsers();

        if (error) throw error;

        const emails = users
            .filter(u => userIds.includes(u.id))
            .map(u => u.email)
            .filter(Boolean);

        return { success: true, emails };

    } catch (error) {
        console.error('Email Fetch Error:', error);
        return { success: false, message: 'Failed to fetch emails' };
    }
}
