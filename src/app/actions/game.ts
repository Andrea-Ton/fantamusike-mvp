'use server';

import { createClient } from '@/utils/supabase/server';

export async function getCurrentWeekAction() {
    const supabase = await createClient();
    const { data: latestSnap } = await supabase
        .from('weekly_snapshots')
        .select('week_number')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

    return latestSnap?.week_number || 1;
}
