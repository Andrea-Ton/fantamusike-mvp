'use server';

import { createClient } from '@/utils/supabase/server';

export async function getCurrentWeekAction() {
    const supabase = await createClient();
    const { data: latestSnap } = await supabase
        .from('weekly_snapshots')
        .select('week_number')
        .order('week_number', { ascending: false })
        .limit(1)
        .limit(1)
        .maybeSingle();

    return Number(latestSnap?.week_number || 1);
}
export async function getNextResetDateAction() {
    const now = new Date();
    const nextMonday = new Date();

    // Set to next Monday
    nextMonday.setUTCDate(now.getUTCDate() + (7 - (now.getUTCDay() || 7) + 1) % 7 || 7);
    nextMonday.setUTCHours(4, 0, 0, 0);

    // If it's already Monday past 04:00, move to the following Monday
    if (nextMonday.getTime() <= now.getTime()) {
        nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
    }

    return nextMonday.toISOString();
}
