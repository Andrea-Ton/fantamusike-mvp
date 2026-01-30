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
    | { type: 'html', content: string, recipientMode?: 'opted-in' | 'manual', manualEmails?: string[] }
    | { type: 'template', templateName: string, templateData?: any, recipientMode?: 'opted-in' | 'manual', manualEmails?: string[] };

/**
 * Renders a template to HTML for previewing.
 * Only accessible by admins.
 */
export async function previewEmailAction(templateName: string, templateData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) return { error: 'Unauthorized' };

    const { render } = await import('@react-email/render');

    if (templateName === 'newsletter') {
        try {
            const html = await render(React.createElement(FantaMusikeBetaEmail, templateData));
            return { success: true, html };
        } catch (err) {
            console.error('Failed to render preview:', err);
            return { error: 'Failed to render preview' };
        }
    }

    return { error: 'Template not found' };
}

export async function sendAdminMarketingEmail(subject: string, payload: EmailPayload | string) {
    // Payload handling
    const isLegacy = typeof payload === 'string';
    const content = isLegacy ? payload : (payload.type === 'html' ? payload.content : '');
    const templateName = !isLegacy && payload.type === 'template' ? payload.templateName : null;
    const templateData = !isLegacy && payload.type === 'template' ? payload.templateData : {};
    const recipientMode = !isLegacy ? payload.recipientMode || 'opted-in' : 'opted-in';
    const manualEmails = !isLegacy ? payload.manualEmails || [] : [];

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

    let targetEmails: { email: string, id?: string }[] = [];

    if (recipientMode === 'manual' && manualEmails.length > 0) {
        // Manual mode: use provided emails directly. 
        // We don't have user IDs for these necessarily, so we might skip unsubscribe tokens 
        // or handle them differently. For manual lists, we just send.
        targetEmails = manualEmails.map(email => ({ email: email.trim() }));
    } else {
        // Opted-in mode: fetch from database
        const { data: recipients, error } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('marketing_opt_in', true);

        if (error) return { error: 'Database error: ' + error.message };
        if (!recipients || recipients.length === 0) return { error: 'No opted-in users found.' };

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return { error: 'Server configuration error: Service role key missing.' };
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

        const { data: { users }, error: authError } = await adminSupabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (authError) return { error: 'Auth error: ' + authError.message };

        const optedInIds = new Set(recipients.map((r: { id: string }) => r.id));
        targetEmails = users
            .filter((u: any) => optedInIds.has(u.id) && u.email)
            .map((u: any) => ({ email: u.email!, id: u.id }));
    }

    if (targetEmails.length === 0) return { error: 'No valid email addresses found.' };

    // Helper to render template if needed
    // Use @react-email/render to support Suspense (required for Tailwind etc)
    const { render } = await import('@react-email/render');

    let baseHtml = '';

    // 1. Render Base HTML (Once)
    if (templateName === 'newsletter') {
        try {
            baseHtml = await render(React.createElement(FantaMusikeBetaEmail, templateData));
        } catch (err) {
            console.error('Failed to render template newsletter:', err);
            return { error: 'Failed to render template.' };
        }
    } else {
        baseHtml = content;
    }

    // 2. Prepare Batch Payload
    const emailBatch = [];

    for (const target of targetEmails) {
        let finalHtml = baseHtml;

        // Append Unsubscribe Link only if we have a user ID (database users)
        if (target.id) {
            const unsubscribeLink = await getUnsubscribeLink(target.id);
            const footerHtml = `
                <div style="padding: 48px 20px; text-align: center;">
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin-bottom: 24px;" />
                    <p style="font-size: 12px; color: #666; margin: 0;">
                        Non vuoi più ricevere queste email? <a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">Disiscriviti qui</a>.
                    </p>
                </div>
            `;

            if (finalHtml.includes('</body>')) {
                finalHtml = finalHtml.replace('</body>', `${footerHtml}</body>`);
            } else {
                finalHtml += footerHtml;
            }
        }

        emailBatch.push({
            from: 'FantaMusiké <no-reply@notifications.musike.fm>',
            to: target.email,
            subject: subject,
            html: finalHtml,
        });
    }

    // 3. Send Batch (Single HTTP Request)
    try {
        console.log(`Attempting to batch send ${emailBatch.length} emails...`);
        const { data, error } = await resend.batch.send(emailBatch);

        if (error) {
            console.error('Resend Batch API Error:', error);
            return { error: 'Batch send failed: ' + error.message };
        }

        console.log('Batch send success:', data);

        // Count successful IDs
        const sentCount = data?.data?.length || 0;

        return {
            success: true,
            message: `Batch processed. Sent ${sentCount} emails.`,
            count: sentCount
        };

    } catch (e) {
        console.error('Unexpected error during batch send:', e);
        return { error: 'Unexpected error during sending.' };
    }
}
