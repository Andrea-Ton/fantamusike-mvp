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
    const referralCode = formData.get('referralCode') as string;

    // Derive username from email prefix
    // Example: john.doe@gmail.com -> john.doe
    let username = email.split('@')[0].toLowerCase();

    // Sanitize: replace any character not in [a-z0-9_.] with '_'
    username = username.replace(/[^a-z0-9_.]/g, '_');

    // Ensure length between 3 and 20
    if (username.length < 3) {
        username = username.padEnd(3, '_');
    } else if (username.length > 20) {
        username = username.substring(0, 20);
    }

    // Validate username against banned terms (re-using existing logic)
    const validation = validateUsername(username);
    if (!validation.valid) {
        // If the derived username is invalid (e.g. banned term), we can't easily fix it 
        // without user input, but according to requirements we just need to derive it.
        // We'll return the error if it's truly problematic (like banned terms).
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
