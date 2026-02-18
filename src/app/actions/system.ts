'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSystemNotificationAction() {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from('system_notifications')
            .select('*')
            .maybeSingle();

        if (error) {
            console.error('Error fetching system notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Unexpected error fetching system notification:', error);
        return { success: false, error: 'Unexpected error' };
    }
}

export async function updateSystemNotificationAction(content: string, is_active: boolean) {
    const supabase = await createClient();

    // 1. Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Unauthorized' };

    try {
        // Get the ID of the first (and only) notification record
        const { data: current } = await supabase
            .from('system_notifications')
            .select('id')
            .maybeSingle();

        if (!current) {
            // Should not happen if seeded, but let's handle it
            const { error: insertError } = await supabase
                .from('system_notifications')
                .insert({ content, is_active });

            if (insertError) throw insertError;
        } else {
            const { error: updateError } = await supabase
                .from('system_notifications')
                .update({
                    content,
                    is_active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', current.id);

            if (updateError) throw updateError;
        }

        revalidatePath('/dashboard');
        revalidatePath('/admin/leaderboard');

        return { success: true, message: 'Comunicazione aggiornata correttamente.' };
    } catch (error: any) {
        console.error('Update System Notification Error:', error);
        return { success: false, message: error.message || 'Errore durante l\'aggiornamento.' };
    }
}
