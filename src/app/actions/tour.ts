'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeTutorialAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('profiles')
        .update({ has_completed_tutorial: true })
        .eq('id', user.id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function resetTutorialAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('profiles')
        .update({ has_completed_tutorial: false })
        .eq('id', user.id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function markTutorialPingAsSeenAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('profiles')
        .update({ tutorial_ping_seen: true })
        .eq('id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/', 'layout');
    return { success: true };
}
