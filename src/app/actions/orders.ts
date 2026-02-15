'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserOrdersAction() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };

    const { data, error } = await supabase
        .from('mystery_box_orders')
        .select(`
            *,
            mystery_boxes (
                title,
                image_url,
                type
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user orders:', error);
        return { success: false, message: 'Errore durante il recupero degli ordini' };
    }

    return { success: true, data };
}

export async function adminGetAllOrdersAction() {
    const supabase = await createClient();

    // Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Non autorizzato' };

    const { data: orders, error } = await supabase
        .from('mystery_box_orders')
        .select(`
            *,
            mystery_boxes (
                title,
                type
            ),
            profiles (
                username,
                id
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all orders:', error);
        return { success: false, message: 'Errore durante il recupero degli ordini' };
    }

    // Fetch emails from Auth (Service Role required)
    try {
        const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
        const adminSupabase = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: { users }, error: authError } = await adminSupabase.auth.admin.listUsers();
        if (!authError && users) {
            const emailMap = new Map(users.map(u => [u.id, u.email]));
            const ordersWithEmail = orders.map(order => ({
                ...order,
                email: emailMap.get(order.user_id) || 'N/A'
            }));
            return { success: true, data: ordersWithEmail };
        }
    } catch (e) {
        console.error('Error fetching auth emails:', e);
    }

    return { success: true, data: orders };
}

export async function adminUpdateOrderStatusAction(orderId: string, status: 'pending' | 'shipped' | 'completed') {
    const supabase = await createClient();

    // Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Non autorizzato' };

    const { error } = await supabase
        .from('mystery_box_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating order status:', error);
        return { success: false, message: 'Errore durante l\'aggiornamento dell\'ordine' };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/dashboard/profile'); // Assuming orders might be visible in profile
    return { success: true, message: 'Stato ordine aggiornato' };
}
