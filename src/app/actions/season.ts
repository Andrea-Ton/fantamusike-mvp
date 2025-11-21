'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type Season = {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    status: 'upcoming' | 'active' | 'calculating' | 'completed';
};

export async function getSeasonsAction() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching seasons:', error);
        return [];
    }

    return data as Season[];
}

export async function getCurrentSeasonAction() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

    if (error) {
        return null;
    }

    return data as Season;
}

export async function createSeasonAction(name: string, startDate: string, endDate: string) {
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    const { error } = await supabase.from('seasons').insert({
        name,
        start_date: startDate,
        end_date: endDate,
        status: 'upcoming',
        is_active: false
    });

    if (error) {
        console.error('Error creating season:', error);
        return { success: false, message: 'Failed to create season' };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Season created successfully' };
}

export async function startSeasonAction(seasonId: string) {
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    // Deactivate all other seasons
    await supabase.from('seasons').update({ is_active: false }).neq('id', seasonId);

    // Activate this season
    const { error } = await supabase
        .from('seasons')
        .update({ is_active: true, status: 'active' })
        .eq('id', seasonId);

    if (error) {
        console.error('Error starting season:', error);
        return { success: false, message: 'Failed to start season' };
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, message: 'Season started successfully' };
}

export async function endSeasonAction(seasonId: string) {
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    // 1. Fetch current leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
        .from('profiles')
        .select('id, total_score')
        .order('total_score', { ascending: false });

    if (leaderboardError || !leaderboard) {
        return { success: false, message: 'Failed to fetch leaderboard' };
    }

    // 2. Snapshot to season_rankings
    const rankings = leaderboard.map((entry, index) => ({
        season_id: seasonId,
        user_id: entry.id,
        rank: index + 1,
        total_score: entry.total_score
    }));

    if (rankings.length > 0) {
        const { error: snapshotError } = await supabase.from('season_rankings').insert(rankings);
        if (snapshotError) {
            console.error('Error saving rankings:', snapshotError);
            return { success: false, message: 'Failed to save rankings' };
        }
    }

    // 3. Update season status
    const { error: updateError } = await supabase
        .from('seasons')
        .update({ is_active: false, status: 'completed' })
        .eq('id', seasonId);

    if (updateError) {
        return { success: false, message: 'Failed to update season status' };
    }

    // 4. Reset profiles total_score
    const { error: resetError } = await supabase
        .from('profiles')
        .update({ total_score: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all valid users

    if (resetError) {
        console.error('Error resetting scores:', resetError);
        return { success: false, message: 'Season ended but failed to reset scores' };
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, message: 'Season ended and scores reset successfully' };
}
