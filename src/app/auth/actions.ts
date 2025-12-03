'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Provider, createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function login(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
    const referralCode = formData.get('referralCode') as string;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: username,
                referral_code_used: referralCode || null,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.user && !data.session) {
        return { success: true, emailVerificationRequired: true };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}

export async function signInWithProvider(provider: Provider) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) {
        console.error('OAuth Error:', error);
        return { error: error.message };
    }

    if (data.url) {
        redirect(data.url);
    }
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/');
}

export async function forgotPassword(formData: FormData) {
    // Use a separate client with Implicit Flow to avoid PKCE issues on iOS PWA
    // This ensures the link works even if opened in a different browser (Safari)
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'implicit',
            }
        }
    );

    const email = formData.get('email') as string;
    // Redirect directly to the update password page, skipping the server-side callback
    // The client-side page will handle the hash fragment
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}
