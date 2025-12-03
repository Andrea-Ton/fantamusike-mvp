'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    if (username) updates.username = username;
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) {
        console.error('Profile update error:', error);
        return { success: false, message: 'Failed to update profile' };
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

    // Use Admin Client to delete user from Auth (bypasses RLS/Auth restrictions)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
        console.error('Delete account error:', error);
        return { success: false, message: 'Failed to delete account' };
    }

    return { success: true, message: 'Account deleted' };
}
