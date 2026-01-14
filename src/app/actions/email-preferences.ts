'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createHmac } from 'crypto';

// Use a secret for signing tokens. 
// Fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY if dedicated secret unavailable (Not recommended for prod).
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'unsafe-fallback-secret';

function generateUnsubscribeToken(userId: string): string {
    const hmac = createHmac('sha256', SECRET_KEY);
    hmac.update(userId);
    return hmac.digest('hex');
}

export async function verifyUnsubscribeToken(userId: string, token: string): Promise<boolean> {
    const expectedToken = generateUnsubscribeToken(userId);
    // Timing safe compare is better, but simple string compare is okay for MVP non-critical op
    // crypto.timingSafeEqual requires Buffers
    return token === expectedToken;
}

// Generate token helper for the email sender
export async function getUnsubscribeLink(userId: string) {
    const token = generateUnsubscribeToken(userId);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/newsletter/unsubscribe?id=${userId}&token=${token}`;
}

export async function updateEmailPreferences(optIn: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ marketing_opt_in: optIn })
        .eq('id', user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
}

export async function unsubscribeUser(userId: string, token?: string) {
    // 1. Verify Token if provided (Public Unsubscribe)
    if (token) {
        const isValid = await verifyUnsubscribeToken(userId, token);
        if (!isValid) {
            return { error: 'Invalid or expired unsubscribe link.' };
        }

        // 2. Use Service Role to bypass RLS (since user is likely anon)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return { error: 'Server configuration error.' };
        }

        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { error } = await adminSupabase
            .from('profiles')
            .update({ marketing_opt_in: false })
            .eq('id', userId);

        if (error) {
            console.error("Unsubscribe error:", error);
            return { error: "Could not unsubscribe. Please contact support." };
        }

        return { success: true };
    }

    // 3. Fallback: Try authenticated user (Legacy/Profile usage)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Ensure user is unsubscribing themselves if no token provided
    if (user && user.id === userId) {
        const { error } = await supabase
            .from('profiles')
            .update({ marketing_opt_in: false })
            .eq('id', userId);

        if (error) return { error: error.message };
        return { success: true };
    }

    return { error: "Unauthorized. Please use the link from your email." };
}
