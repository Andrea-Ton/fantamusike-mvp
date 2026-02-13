'use server';

import { createClient } from '@/utils/supabase/server';

const PAYPAL_API_BASE = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// This function generates an access token for PayPal API
async function generateAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('MISSING_API_CREDENTIALS');
    }

    const auth = Buffer.from(clientId + ":" + clientSecret).toString("base64");

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });

    const data = await response.json();
    return data.access_token;
}

// Create Order (Called by Frontend)
export async function createPayPalOrderAction(packageId: string) {
    const packages = {
        '100': { price: '0.99', coins: 100, label: 'Starter' },
        '220': { price: '1.99', coins: 220, label: 'Popular' },
        '600': { price: '4.99', coins: 600, label: 'Pro' },
        '1350': { price: '9.99', coins: 1350, label: 'Legend' },
    };

    const pkg = packages[packageId as keyof typeof packages];
    if (!pkg) {
        throw new Error('Invalid Package');
    }

    try {
        const accessToken = await generateAccessToken();
        const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;

        const payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "EUR",
                        value: pkg.price,
                    },
                    description: `${pkg.coins} MusiCoins - ${pkg.label} Package`,
                    custom_id: packageId // Store package ID in metadata
                },
            ],
        };

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("PayPal Create Order Failed:", response.status, errorText);
            throw new Error(`PayPal API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return { orderID: data.id };
    } catch (error) {
        console.error("Failed to create PayPal order:", error);
        throw new Error("Could not create order");
    }
}

// Capture Order (Called by Frontend onApprove)
export async function capturePayPalOrderAction(orderID: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const accessToken = await generateAccessToken();
        const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (data.status !== "COMPLETED") {
            throw new Error(`Order not captured. Status: ${data.status}`);
        }

        // Verify transaction data
        const { data: existingTx } = await supabase
            .from('musicoin_transactions')
            .select('id')
            .eq('paypal_order_id', orderID)
            .single();

        if (existingTx) {
            return { success: true, message: 'Already processed' };
        }

        const capturedAmount = data.purchase_units[0].payments.captures[0].amount.value;

        let coinsToAdd = 0;
        let packageLabel = "Unknown";

        // Logic to Map Amount -> Coins (Secure)
        switch (capturedAmount) {
            case '0.99': coinsToAdd = 100; packageLabel = 'Starter'; break;
            case '1.99': coinsToAdd = 220; packageLabel = 'Popular'; break;
            case '4.99': coinsToAdd = 600; packageLabel = 'Pro'; break;
            case '9.99': coinsToAdd = 1350; packageLabel = 'Legend'; break;
            default: throw new Error("Invalid Amount Captured");
        }

        // 1. Log Transaction
        const { error: txError } = await supabase.from('musicoin_transactions').insert({
            user_id: user.id,
            paypal_order_id: orderID,
            amount_eur: parseFloat(capturedAmount),
            coins_amount: coinsToAdd,
            package_label: packageLabel,
            status: 'COMPLETED'
        });

        if (txError) {
            console.error("Tx Log Error", txError);
            throw new Error("Database transaction log failed");
        }

        // 2. Credit User
        const { data: profile } = await supabase.from('profiles').select('musi_coins').eq('id', user.id).single();
        const currentBalance = profile?.musi_coins || 0;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ musi_coins: currentBalance + coinsToAdd })
            .eq('id', user.id);

        if (updateError) {
            console.error("Balance Update Error", updateError);
            throw new Error("Failed to update user balance");
        }

        return { success: true, coinsAdded: coinsToAdd, newBalance: currentBalance + coinsToAdd };

    } catch (error) {
        console.error("Capture Logic Error:", error);
        return { success: false, error: "Transaction verification passed but processing failed." };
    }
}
