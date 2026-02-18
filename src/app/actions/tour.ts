'use client';

import { createClient } from '@/utils/supabase/client';

export async function completeTutorialAction() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('profiles')
        .update({ has_completed_tutorial: true })
        .eq('id', user.id);

    if (error) return { error: error.message };
    return { success: true };
}
