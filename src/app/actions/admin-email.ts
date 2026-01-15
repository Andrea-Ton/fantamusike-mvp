'use server';

import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { getUnsubscribeLink } from './email-preferences';
// Static import for Newsletter Mail
import { FantaMusikeBetaEmail } from '../../../emails/newsletter';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

type EmailPayload =
    | { type: 'html', content: string }
    | { type: 'template', templateName: string };

export async function sendAdminMarketingEmail(subject: string, payload: EmailPayload | string) {
    // Payload handling
    const isLegacy = typeof payload === 'string';
    const content = isLegacy ? payload : (payload.type === 'html' ? payload.content : '');
    const templateName = !isLegacy && payload.type === 'template' ? payload.templateName : null;

    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return { error: 'Unauthorized' };
    }

    // Fetch opted-in users
    const { data: recipients, error } = await supabase
        .from('profiles')
        .select('id, username') // We need email. BUT profiles table *usually* doesn't store email for security, it's in auth.users.
        // Wait, 'profiles' usually references auth.users.
        // If 'profiles' doesn't have email, we need to join or use admin API.
        .eq('marketing_opt_in', true);

    if (error) return { error: 'Database error: ' + error.message };
    if (!recipients || recipients.length === 0) return { error: 'No opted-in users found.' };

    // Check if we have service role key available in env
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return { error: 'Server configuration error: Service role key missing.' };
    }

    // Create Admin Client for fetching emails
    // We import createClient from supabase-js directly for admin usage
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

    // Fetch all users from auth (Admin API)
    // Pagination might be needed for large userbases, but for MVP/Startup it's fine.
    const { data: { users }, error: authError } = await adminSupabase.auth.admin.listUsers({
        perPage: 1000 // reasonable limit for MVP
    });

    if (authError) return { error: 'Auth error: ' + authError.message };

    // Filter users who are in our recipients list
    // recipients is array of { id, username } where marketing_opt_in is true
    const optedInIds = new Set(recipients.map((r: { id: string }) => r.id));
    const targetEmails = users
        .filter((u: any) => optedInIds.has(u.id) && u.email)
        .map((u: any) => ({ email: u.email!, id: u.id }));

    if (targetEmails.length === 0) return { error: 'No valid email addresses found for opted-in users.' };

    let sentCount = 0;
    let failCount = 0;

    // Send emails (Iterative approach for individual unsubscribe links)
    // Note: Resend supports batching, but we need unique unsubscribe links per user.

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Helper to render template if needed
    // Use @react-email/render to support Suspense (required for Tailwind etc)
    const { render } = await import('@react-email/render');

    for (const target of targetEmails) {
        // Append Unsubscribe Link
        const unsubscribeLink = await getUnsubscribeLink(target.id);

        let finalHtml = '';

        if (templateName === 'newsletter') {
            try {
                // Render the Newsletter Template (formerly Pioneer)
                // We use 'render' which handles Suspense/Async components (like Tailwind)
                // It returns the full HTML document including doctype usually, or we can check.
                // Default render options: pretty: false, plainText: false
                finalHtml = await render(React.createElement(FantaMusikeBetaEmail));
            } catch (err) {
                console.error('Failed to render template newsletter:', err);
                return { error: 'Failed to render template.' };
            }
        } else {
            // Default to content provided (HTML mode)
            finalHtml = content;
        }

        // Simple footer injection for Unsubscribe
        // We ensure we append it before </body> if present, or just at end
        const footerHtml = `
            <div style="padding: 48px 20px; text-align: center;">
                <hr style="border: none; border-top: 1px solid #eaeaea; margin-bottom: 24px;" />
                <p style="font-size: 12px; color: #666; margin: 0;">
                    Non vuoi più ricevere queste email? <a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">Disiscriviti qui</a>.
                </p>
            </div>
        `;

        // If HTML has </body>, inject before it. Else append.
        if (finalHtml.includes('</body>')) {
            finalHtml = finalHtml.replace('</body>', `${footerHtml}</body>`);
        } else {
            finalHtml += footerHtml;
        }

        try {
            await resend.emails.send({
                from: 'FantaMusiké <no-reply@notifications.musike.fm>',
                to: target.email,
                subject: subject,
                html: finalHtml,
            });
            sentCount++;
        } catch (e) {
            console.error(`Failed to send to ${target.email}`, e);
            failCount++;
        }
    }

    return {
        success: true,
        message: `Sent ${sentCount} emails. Failed: ${failCount}.`,
        count: sentCount
    };
}
