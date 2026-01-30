'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { validateUsername } from '@/utils/validation';

export async function updateProfileAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    const username = formData.get('username') as string;
    const avatarUrl = formData.get('avatarUrl') as string;

    const updates: { username?: string; avatar_url?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
    };

    if (username) {
        const validation = validateUsername(username);
        if (!validation.valid) {
            return { success: false, message: validation.error };
        }
        updates.username = username;
    }
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) {
        console.error('Profile update error:', error);
        return { success: false, message: 'Failed to update profile' };
    }

    // Sync with Auth Metadata (so Sidebar/Learderboard reflect changes immediately)
    if (updates.username || updates.avatar_url) {
        const metadataUpdates: { name?: string; avatar_url?: string } = {};
        if (updates.username) metadataUpdates.name = updates.username;
        if (updates.avatar_url) metadataUpdates.avatar_url = updates.avatar_url;

        await supabase.auth.updateUser({
            data: metadataUpdates
        });
    }

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard'); // Update sidebar/header
    return { success: true, message: 'Profile updated successfully' };
}

export async function deleteAccountAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    // Use Admin Client to delete user data (bypasses RLS)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const userId = user.id;

        // 1. Unlink referrals (users referred by this user)
        await supabaseAdmin
            .from('profiles')
            .update({ referred_by: null })
            .eq('referred_by', userId);

        // 2. Delete Daily Promos
        await supabaseAdmin
            .from('daily_promos')
            .delete()
            .eq('user_id', userId);

        // 3. Delete Teams
        await supabaseAdmin
            .from('teams')
            .delete()
            .eq('user_id', userId);

        // 4. Delete Season Rankings
        await supabaseAdmin
            .from('season_rankings')
            .delete()
            .eq('user_id', userId);

        // 5. Delete Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            throw new Error('Failed to delete profile data');
        }

        // 6. Delete User from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Delete account error:', authError);
            throw new Error('Failed to delete records from Auth');
        }

        return { success: true, message: 'Account deleted' };

    } catch (error: any) {
        console.error('Full delete flow error:', error);
        return { success: false, message: error.message || 'Failed to delete account completely' };
    }
}
