'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Provider, createClient as createSupabaseClient } from '@supabase/supabase-js';


import { validateUsername } from '@/utils/validation';

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

    // Validate username
    const validation = validateUsername(username);
    if (!validation.valid) {
        return { error: validation.error };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: username,
                referral_code_used: referralCode || null,
                marketing_opt_in: formData.get('marketingOptIn') === 'on',
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

export async function sendPasswordResetOtp(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false,
        },
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function verifyOtp(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const token = formData.get('code') as string;

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    });

    if (error) {
        console.error('Verify OTP Error:', error);
        // Try 'signup' type as fallback if 'email' fails, just in case it's a signup verification
        if (error.message.includes('Token has expired or is invalid')) {
            const { error: signupError } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'signup',
            });
            if (!signupError) {
                revalidatePath('/', 'layout');
                redirect('/dashboard');
                return;
            }
            console.error('Verify Signup OTP Error:', signupError);
        }
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
}

export async function verifyPasswordResetOtp(email: string, token: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
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
