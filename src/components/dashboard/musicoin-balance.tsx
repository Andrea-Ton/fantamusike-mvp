'use client';

import React, { useState } from 'react';
import { Coins, Zap, CreditCard, Sparkles, Share2, Copy, Check, Plus, X, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import confetti from 'canvas-confetti';
import { createPayPalOrderAction, capturePayPalOrderAction } from '@/app/actions/payment';
import { markRechargeAsSeenAction } from '@/app/actions/profile';
import { sendGTMEvent } from '@next/third-parties/google';
import { REFERRAL_LIMIT, REFERRAL_BONUS } from '@/config/game';
import { NotificationPing } from '@/components/ui/notification-ping';

interface MusiCoinBalanceProps {
    musiCoins: number;
    referralCode?: string;
    referralCount?: number;
    pingRecharge?: boolean;
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb"; // Fallback to sandbox

export default function MusiCoinBalance({ musiCoins, referralCode, referralCount = 0, pingRecharge = false }: MusiCoinBalanceProps) {
    const [showModal, setShowModal] = useState(false);
    const [localPingRecharge, setLocalPingRecharge] = useState(pingRecharge);
    const [showInternalPing, setShowInternalPing] = useState(false);

    React.useEffect(() => {
        setLocalPingRecharge(pingRecharge);
    }, [pingRecharge]);

    const handleOpenModal = () => {
        setShowModal(true);
        if (localPingRecharge) {
            setLocalPingRecharge(false);
            setShowInternalPing(true);
            markRechargeAsSeenAction();
        }
        sendGTMEvent({ event: 'musicoin_recharge_click', category: 'engagement' });
    };
    const [copied, setCopied] = useState(false);

    // Payment State
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const packages = [
        { id: '100', coins: 100, price: '0.99', label: 'Starter' },
        { id: '220', coins: 220, price: '1.99', label: 'Popular', popular: true },
        { id: '600', coins: 600, price: '4.99', label: 'Pro' },
        { id: '1350', coins: 1350, price: '9.99', label: 'Legend' },
    ];

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            setCopied(true);
            sendGTMEvent({ event: 'referral_code_copy', category: 'engagement', source: 'balance_card' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSuccess = async (details: any) => {
        // Trigger Confetti
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#EAB308', '#FFFFFF', '#A855F7']
        });

        setProcessing(false);
        setPaymentSuccess(true);
        // Refresh page or update local state would be ideal here if using router.refresh()
        // But for now we just show success state.
    };

    const handleError = (err: any) => {
        setProcessing(false);
        setErrorMsg("Pagamento non riuscito. Riprova.");
        console.error(err);
    };

    const resetModal = () => {
        setShowModal(false);
        setTimeout(() => {
            setShowInternalPing(false);
            setSelectedPackage(null);
            setPaymentSuccess(false);
            setErrorMsg(null);
        }, 300);
    };

    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR" }}>
            <div className="flex items-center gap-3 md:gap-4 h-full">
                {/* Balance Display */}
                <div className="musicoin-balance-target px-5 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-4 shadow-inner group transition-all hover:bg-white/10 h-16 min-w-[140px] md:min-w-[170px]">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                        <Coins size={22} />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black leading-none mb-1">IL TUO SALDO</span>
                        <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-2xl font-black text-yellow-400 tracking-tighter italic leading-none">{musiCoins + (paymentSuccess && selectedPackage ? selectedPackage.coins : 0)}</span>
                            <span className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest italic leading-none pt-0.5">MC</span>
                        </div>
                    </div>
                </div>

                {/* Recharge Trigger Button */}
                <div className="h-16 relative">
                    {localPingRecharge && (
                        <NotificationPing className="absolute -top-1 -right-1" />
                    )}
                    <button
                        onClick={handleOpenModal}
                        className="group relative h-full outline-none block mt-[6px] shadow-[0_5px_20px_rgba(234,179,8,0.2)] hover:shadow-[0_8px_25px_rgba(234,179,8,0.4)] transition-all rounded-2xl"
                        title="Ricarica MusiCoins"
                    >
                        {/* 3D Base layer */}
                        <div className="absolute inset-0 bg-yellow-700/80 rounded-2xl"></div>

                        {/* Front Clickable Layer */}
                        <div className="relative flex items-center gap-2 h-full px-5 bg-yellow-500 text-black font-black uppercase tracking-tighter italic rounded-2xl transition-transform -translate-y-[6px] active:translate-y-0 group-hover:bg-yellow-400">
                            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-[11px] tracking-widest leading-none mt-0.5">Ricarica</span>
                        </div>
                    </button>
                </div>

                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={resetModal}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />

                            {/* Modal Container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-lg max-h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={resetModal}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-20"
                                >
                                    <X size={20} />
                                </button>

                                <div className="p-6 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar h-full">

                                    {/* STATE 1: SELECTION */}
                                    {!selectedPackage && !paymentSuccess && (
                                        <>
                                            <header className="mb-6 md:mb-8 pr-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Coins size={18} className="text-yellow-500" />
                                                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">MusiCoin</span>
                                                </div>
                                                <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Ottieni MusiCoin</h2>
                                            </header>

                                            <div className="space-y-6 md:space-y-8">
                                                {/* FREE OPTION: INVITE */}
                                                <section>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Metodo Gratuito</h4>
                                                    </div>
                                                    <div
                                                        onClick={handleCopy}
                                                        className="relative p-4 sm:p-5 rounded-3xl bg-purple-500/5 border border-purple-500/20 flex flex-col gap-4 hover:bg-purple-500/10 transition-all cursor-pointer group/invite"
                                                    >
                                                        {showInternalPing && (
                                                            <NotificationPing className="-top-1 -right-1" />
                                                        )}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                                                    <Share2 size={20} />
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-black text-white uppercase tracking-tight leading-none mb-1 text-sm sm:text-base">Invita un Amico</h5>
                                                                    <p className="text-[10px] text-gray-500 font-medium">
                                                                        {referralCount >= REFERRAL_LIMIT
                                                                            ? "Limite raggiunto: hai già invitato 10 amici!"
                                                                            : `Entrambi riceverete ${REFERRAL_BONUS} MC`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="text-[10px] sm:text-xs font-black text-purple-400 bg-purple-400/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                                                                    {referralCount >= REFERRAL_LIMIT ? "0 MC" : `+${REFERRAL_BONUS} MC`}
                                                                </div>
                                                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                                                    {referralCount}/{REFERRAL_LIMIT} Amici
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-2 sm:p-3 border border-white/5">
                                                            <code className="flex-1 text-center font-black italic text-purple-400 tracking-tighter text-base sm:text-lg uppercase truncate">
                                                                {referralCode || '...'}
                                                            </code>
                                                            <div className="p-2 bg-white/5 rounded-xl group-hover/invite:bg-purple-500 group-hover/invite:text-white transition-all shrink-0">
                                                                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400 group-hover/invite:text-white" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>

                                                {/* SEPARATOR */}
                                                <div className="relative flex items-center justify-center">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-white/5"></div>
                                                    </div>
                                                    <span className="relative px-4 bg-[#0a0a0f] text-[8px] font-black text-gray-600 uppercase tracking-[0.4em]">Acquista Pacchetti</span>
                                                </div>

                                                {/* PAID OPTIONS */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {packages.map((pkg) => (
                                                        <button
                                                            key={pkg.id}
                                                            onClick={() => {
                                                                setSelectedPackage(pkg);
                                                                sendGTMEvent({
                                                                    event: 'package_select',
                                                                    category: 'engagement',
                                                                    package_id: pkg.id,
                                                                    coins: pkg.coins,
                                                                    price: pkg.price
                                                                });
                                                            }}
                                                            className={`p-4 rounded-3xl border flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:gap-2 transition-all group/pkg relative overflow-hidden ${pkg.popular
                                                                ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50 sm:h-32'
                                                                : 'bg-white/5 border-white/10 hover:border-white/20 sm:h-32'
                                                                }`}
                                                        >
                                                            {pkg.popular && (
                                                                <div className="absolute top-0 right-0 p-1.5 bg-yellow-500 text-[8px] font-black text-black uppercase tracking-widest italic rounded-bl-xl sm:rounded-bl-xl rounded-tr-none">
                                                                    Popular
                                                                </div>
                                                            )}
                                                            <div className={`p-2 rounded-xl shrink-0 ${pkg.popular ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white opacity-40'}`}>
                                                                <Zap size={16} fill={pkg.popular ? 'currentColor' : 'none'} />
                                                            </div>
                                                            <div className="text-left sm:text-center flex-1 sm:flex-initial">
                                                                <div className="text-base sm:text-lg font-black text-white italic tracking-tighter leading-none">{pkg.coins} <span className="text-[10px] opacity-50 uppercase tracking-widest">MC</span></div>
                                                                <div className="text-sm font-black text-yellow-500 italic mt-1 sm:hidden">€{pkg.price}</div>
                                                            </div>
                                                            <div className="hidden sm:block text-sm font-black text-yellow-500 italic">€{pkg.price}</div>
                                                            <div className="sm:hidden text-xs font-black text-white italic">€{pkg.price}</div>
                                                        </button>
                                                    ))}
                                                </div>

                                                <footer className="pt-2 flex items-center justify-center gap-6 opacity-40">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard size={14} className="text-white" />
                                                        <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">PayPal Checkout</span>
                                                    </div>
                                                    <Sparkles size={14} className="text-yellow-500" />
                                                </footer>
                                            </div>
                                        </>
                                    )}

                                    {/* STATE 2: PAYMENT CONFIRMATION */}
                                    {selectedPackage && !paymentSuccess && (
                                        <div className="flex flex-col h-full justify-between animate-fade-in">
                                            <div>
                                                <button
                                                    onClick={() => setSelectedPackage(null)}
                                                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-xs font-bold uppercase tracking-widest transition-colors"
                                                >
                                                    <ArrowLeft size={16} /> Indietro
                                                </button>

                                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Conferma Acquisto</h3>
                                                <p className="text-gray-500 text-sm mb-8">Stai acquistando un pacchetto di MusiCoins.</p>

                                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all"></div>
                                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Prodotto</span>
                                                        <span className="text-white font-black italic tracking-tight">{selectedPackage.label} Pack</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Quantità</span>
                                                        <div className="flex items-center gap-2">
                                                            <Coins size={16} className="text-yellow-500" />
                                                            <span className="text-yellow-500 font-black italic tracking-tight text-xl">{selectedPackage.coins} MC</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-px bg-white/10 my-4"></div>
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <span className="text-white text-xs font-bold uppercase tracking-widest">Totale</span>
                                                        <span className="text-white font-black italic tracking-tight text-2xl">€{selectedPackage.price}</span>
                                                    </div>
                                                </div>

                                                {errorMsg && (
                                                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-bold mb-4 text-center">
                                                        {errorMsg}
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div className="opacity-90 relative z-0">
                                                        <PayPalButtons
                                                            style={{ layout: "vertical", shape: "rect", label: "paypal", height: 45 }}
                                                            forceReRender={[selectedPackage.id]}
                                                            createOrder={async (data, actions) => {
                                                                setProcessing(true);
                                                                try {
                                                                    const orderData = await createPayPalOrderAction(selectedPackage.id);
                                                                    return orderData.orderID;
                                                                } catch (err) {
                                                                    handleError(err);
                                                                    throw err;
                                                                }
                                                            }}
                                                            onApprove={async (data, actions) => {
                                                                try {
                                                                    const result = await capturePayPalOrderAction(data.orderID);
                                                                    if (result.success) {
                                                                        handleSuccess(result);
                                                                    } else {
                                                                        handleError(result.error);
                                                                    }
                                                                } catch (err) {
                                                                    handleError(err);
                                                                }
                                                            }}
                                                            onError={(err) => handleError(err)}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 text-center px-4">
                                                        Cliccando sui metodi di pagamento accetti i Termini e Condizioni di FantaMusiké. Transazione sicura gestita da PayPal.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STATE 3: SUCCESS */}
                                    {paymentSuccess && (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-scale-in">
                                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 relative">
                                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                                                <Check size={48} strokeWidth={3} />
                                            </div>
                                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Pagamento Riuscito!</h3>
                                            <p className="text-gray-400 font-medium mb-8 max-w-xs mx-auto">
                                                Hai ricevuto <span className="text-yellow-500 font-bold">{selectedPackage?.coins} MusiCoins</span>. Sono stati aggiunti al tuo saldo.
                                            </p>

                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full mb-8">
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">NUOVO SALDO</div>
                                                <div className="text-4xl font-black text-yellow-500 italic tracking-tighter">
                                                    {musiCoins + (selectedPackage?.coins || 0)} <span className="text-sm not-italic opacity-50">MC</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => window.location.reload()} // Reload to refresh server state fully
                                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
                                            >
                                                Torna alla Dashboard
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </PayPalScriptProvider>
    );
}
