'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function getMysteryBoxesAction() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('mystery_boxes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching mystery boxes:', error);
        return { success: false, message: 'Errore durante il recupero delle MysteryBox' };
    }

    return { success: true, data };
}

export async function adminGetAllMysteryBoxesAction() {
    const supabase = await createClient();

    // Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Non autorizzato' };

    const { data, error } = await supabase
        .from('mystery_boxes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all mystery boxes:', error);
        return { success: false, message: 'Errore durante il recupero delle MysteryBox' };
    }

    return { success: true, data };
}

export async function buyMysteryBoxAction(boxId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Devi essere loggato per acquistare' };

    // 1. Fetch Box and User Profile
    const [boxRes, profileRes] = await Promise.all([
        supabase.from('mystery_boxes').select('*').eq('id', boxId).single(),
        supabase.from('profiles').select('musi_coins').eq('id', user.id).single()
    ]);

    if (boxRes.error || !boxRes.data) return { success: false, message: 'MysteryBox non trovata' };
    if (profileRes.error || !profileRes.data) return { success: false, message: 'Profilo non trovato' };

    const box = boxRes.data;
    const profile = profileRes.data;

    // 1b. Check User Purchase Limit
    if (box.max_copies_per_user !== null) {
        const { count, error: countErr } = await supabase
            .from('mystery_box_orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('box_id', boxId);

        if (countErr) {
            console.error('Error checking purchase limit:', countErr);
        } else if (count !== null && count >= box.max_copies_per_user) {
            return { success: false, message: `Hai già raggiunto il limite massimo di ${box.max_copies_per_user} copie per questa MysteryBox.` };
        }
    }

    // 1c. Check Community Goal
    if (box.target_user_goal !== null) {
        const { count: totalUsers, error: userCountErr } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (userCountErr) {
            console.error('Error fetching total user count:', userCountErr);
        } else if (totalUsers !== null && totalUsers < box.target_user_goal) {
            return {
                success: false,
                message: `Questa MysteryBox è ancora bloccata! Obiettivo Community: ${box.target_user_goal} utenti (Attuali: ${totalUsers}).`
            };
        }
    }

    // 2. Checks
    if (!box.is_active) return { success: false, message: 'Questa MysteryBox non è più disponibile' };
    if (box.available_copies !== null && box.available_copies <= 0) {
        return { success: false, message: 'MysteryBox esaurita' };
    }
    if (profile.musi_coins < box.price_musicoins) {
        return { success: false, message: 'MusiCoins insufficienti' };
    }

    // 3. Logic to pick prizes
    const prizes = box.prizes as any[];
    let wonPrizes: any[] = [];

    if (prizes.length > 0) {
        // A. Certain prizes
        const certainPrizes = prizes.filter(p => p.is_certain);
        wonPrizes = [...certainPrizes];

        // B. Pick ONE probabilistic prize from the rest
        const probabilisticPrizes = prizes.filter(p => !p.is_certain);
        if (probabilisticPrizes.length > 0) {
            const totalProb = probabilisticPrizes.reduce((acc, p) => acc + (p.probability || 0), 0);

            if (totalProb > 0) {
                const random = Math.random() * 100; // Scala fissa 100% per probabilità assolute
                let cumulative = 0;
                let pickedProbabilistic = null;

                for (const p of probabilisticPrizes) {
                    cumulative += (p.probability || 0);
                    if (random <= cumulative) {
                        pickedProbabilistic = p;
                        break;
                    }
                }

                if (pickedProbabilistic) {
                    wonPrizes.push(pickedProbabilistic);
                }
            }
        }
    }

    if (wonPrizes.length === 0) {
        return {
            success: true,
            message: 'Questa volta non hai trovato nulla... ma non hai speso MusiCoins!',
            data: { wonPrizes: [], totalWonCoins: 0, hasNonCoinPrize: false, isNoWin: true }
        };
    }

    // 4. Update Tables
    const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Aggregate MusiCoins from ALL won prizes
    const totalWonCoins = wonPrizes.reduce((acc, p) => acc + (p.type === 'musicoins' ? (p.musicoins_value || 0) : 0), 0);
    const hasNonCoinPrize = wonPrizes.some(p => p.type !== 'musicoins');

    // Final balance calculation
    const newBalance = profile.musi_coins - box.price_musicoins + totalWonCoins;

    // Start Updates
    // A. Update coins
    const { error: coinErr } = await supabaseAdmin
        .from('profiles')
        .update({ musi_coins: newBalance })
        .eq('id', user.id);

    if (coinErr) return { success: false, message: 'Errore durante la transazione' };

    // B. Reduce stock if limited
    if (box.total_copies !== null) {
        await supabaseAdmin
            .from('mystery_boxes')
            .update({ available_copies: (box.available_copies || 0) - 1 })
            .eq('id', box.id);
    }

    // C. Create Order
    // Order is completed ONLY if all prizes are coins.
    const orderStatus = (!hasNonCoinPrize) ? 'completed' : 'pending';

    const { error: orderErr } = await supabaseAdmin
        .from('mystery_box_orders')
        .insert({
            user_id: user.id,
            box_id: box.id,
            status: orderStatus,
            prize_won: wonPrizes // Store the array of prizes won
        });

    if (orderErr) {
        console.error('Order creation error:', orderErr);
        return { success: false, message: 'Errore durante la creazione dell\'ordine' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/marketplace');

    return {
        success: true,
        message: totalWonCoins > 0 && !hasNonCoinPrize
            ? `Hai ottenuto ${totalWonCoins} MusiCoins!`
            : 'Apertura completata!',
        data: { wonPrizes, totalWonCoins, hasNonCoinPrize, userEmail: user.email }
    };
}

export async function adminCreateMysteryBoxAction(data: any) {
    const supabase = await createClient();

    // Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Non autorizzato' };

    const { error } = await supabase
        .from('mystery_boxes')
        .insert({
            ...data,
            available_copies: data.total_copies,
            target_user_goal: data.target_user_goal || null
        });

    if (error) {
        console.error('Error creating mystery box:', error);
        return { success: false, message: 'Errore durante la creazione' };
    }

    revalidatePath('/admin/marketplace');
    return { success: true, message: 'MysteryBox creata con successo' };
}

export async function adminUpdateMysteryBoxAction(id: string, data: any) {
    const supabase = await createClient();

    // Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Non autorizzato' };

    const { error } = await supabase
        .from('mystery_boxes')
        .update(data)
        .eq('id', id);

    if (error) {
        console.error('Error updating mystery box:', error);
        return { success: false, message: 'Errore durante l\'aggiornamento' };
    }

    revalidatePath('/admin/marketplace');
    revalidatePath('/dashboard/marketplace');
    return { success: true, message: 'MysteryBox aggiornata con successo' };
}

export async function adminDeleteMysteryBoxAction(id: string) {
    const supabase = await createClient();

    // Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorizzato' };
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, message: 'Non autorizzato' };

    const { error } = await supabase
        .from('mystery_boxes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting mystery box:', error);
        return { success: false, message: 'Errore durante l\'eliminazione' };
    }

    revalidatePath('/admin/marketplace');
    return { success: true, message: 'MysteryBox eliminata' };
}
