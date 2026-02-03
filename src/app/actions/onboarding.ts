'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeOnboardingAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

    if (error) {
        console.error('Onboarding completion error:', error);
        return { success: false, message: 'Failed to update onboarding status' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
