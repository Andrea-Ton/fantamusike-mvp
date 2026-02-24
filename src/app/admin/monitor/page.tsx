'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMonitorDataAction, getPendingOnboardingEmailsAction } from '@/app/actions/admin-monitor';
import { Users, Activity, Target, Package, PackageOpen, CreditCard, TrendingUp, AlertCircle, RefreshCw, UserPlus, Layers, ShieldCheck, Loader2 } from 'lucide-react';

interface MonitorData {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    promoCompletionRate: number;
    freeBoxOrders: number;
    paidBoxOrders: number;
    totalTransactions: number;
    totalRevenueEur: number;
    musicoinVolume: number;
    invitedFriends: number;
    multipleTeamsRate: number;
    pendingOnboardingCount: number;
    transactionDistribution: { amount: number; count: number }[];
}

export default function AdminMonitorDashboard() {
    const [data, setData] = useState<MonitorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState<number>(7);

    const fetchData = async () => {
        setLoading(true);
        const res = await getMonitorDataAction(days);
        if (res.success && res.data) {
            setData(res.data);
        } else {
            alert(res.message || 'Errore durante il caricamento dei dati di monitoraggio');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [days]);

    const StatCard = ({ title, value, icon, description, trend, color, border, glow }: { title: string, value: string | number, icon: React.ReactNode, description?: string, trend?: string, color: string, border: string, glow: string }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative group p-6 rounded-[2rem] bg-gradient-to-br ${color} border ${border} backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] ${glow}`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                {React.cloneElement(icon as React.ReactElement, { size: 80 } as any)}
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10`}>
                            {React.cloneElement(icon as React.ReactElement, { size: 20 } as any)}
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
                    </div>
                </div>

                <div className="flex items-end gap-3 mt-4">
                    <h3 className="text-4xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                        {value}
                    </h3>
                    {trend && (
                        <span className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1.5 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            {trend}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs mt-2 border-t border-white/5 pt-3">{description}</p>
                )}
            </div>
        </motion.div>
    );

    const copyEmails = async () => {
        const res = await getPendingOnboardingEmailsAction();
        if (res.success && res.emails) {
            const emailList = res.emails.join(', ');
            if (emailList) {
                navigator.clipboard.writeText(emailList);
                alert(`${res.emails.length} email copiate negli appunti!`);
            } else {
                alert('Nessuna email da copiare.');
            }
        } else {
            alert(res.message || 'Errore nel recupero delle email.');
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] p-4 sm:p-8 md:p-12 overflow-x-hidden selection:bg-purple-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10 animate-pulse-slow"></div>
            <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full -z-10"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12"
            >
                {/* Header "Mission Control" Aesthetic */}
                <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full blur-[2px]"></div>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
                            Monitoraggio <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Piattaforma</span>
                        </h1>
                        <div className="flex items-center gap-4 text-gray-500">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                <Activity size={12} className="text-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Core Status: Active</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                <ShieldCheck size={12} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Admin Authorization: Valid</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                            {[7, 14, 30].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDays(d)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${days === d ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {d} gg
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="relative px-6 py-2.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-30 group/btn overflow-hidden flex items-center justify-center gap-2 h-[36px]"
                        >
                            <div className="absolute inset-0 bg-black opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Aggiornamento...' : 'Aggiorna Dati'}
                            </span>
                        </button>
                    </div>
                </header>

                {loading && !data ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-purple-500 w-12 h-12" />
                    </div>
                ) : data ? (
                    <div className="space-y-12">
                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard
                                title="Utenti Totali"
                                value={data.totalUsers}
                                icon={<Users className="text-zinc-400" />}
                                description="Il numero totale di utenti registrati (Lifetime)."
                                color="from-zinc-500/20 to-gray-500/20"
                                border="border-zinc-500/30"
                                glow="shadow-[0_0_20px_rgba(113,113,122,0.1)]"
                            />
                            <StatCard
                                title={`Nuovi Utenti (${days} gg)`}
                                value={data.newUsers}
                                icon={<UserPlus className="text-emerald-400" />}
                                description={`Account creati negli ultimi ${days} giorni.`}
                                color="from-emerald-500/20 to-green-500/20"
                                border="border-emerald-500/30"
                                glow="shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            />
                            <StatCard
                                title={`Utenti Attivi (${days} gg)`}
                                value={data.activeUsers}
                                icon={<Activity className="text-blue-400" />}
                                description={`Utenti loggati negli ultimi ${days} giorni.`}
                                color="from-blue-500/20 to-indigo-500/20"
                                border="border-blue-500/30"
                                glow="shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                            />
                            <StatCard
                                title="Completamento Promo"
                                value={`${data.promoCompletionRate}%`}
                                icon={<Target className="text-purple-400" />}
                                description={`% di utenti attivi che ha fatto almeno un'azione promo in ${days} gg.`}
                                color="from-purple-500/20 to-pink-500/20"
                                border="border-purple-500/30"
                                glow="shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                            />
                            <StatCard
                                title="Attività Team"
                                value={`${data.multipleTeamsRate}%`}
                                icon={<Layers className="text-orange-400" />}
                                description={`% di utenti che hanno inserito/cambiato roster in ${days} gg.`}
                                color="from-orange-500/20 to-amber-500/20"
                                border="border-orange-500/30"
                                glow="shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                            />
                            <StatCard
                                title="Fatturato Lordo"
                                value={`€${data.totalRevenueEur.toFixed(2)}`}
                                icon={<TrendingUp className="text-green-400" />}
                                description={`Totale ricariche PayPal completate in ${days} gg.`}
                                color="from-green-500/20 to-emerald-500/20"
                                border="border-green-500/30"
                                glow="shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                            />
                            <StatCard
                                title="Volume MusiCoins"
                                value={data.musicoinVolume}
                                icon={<CreditCard className="text-yellow-400" />}
                                description={`MusiCoins spesi in Mystery Box in ${days} gg.`}
                                color="from-yellow-500/20 to-amber-500/20"
                                border="border-yellow-500/30"
                                glow="shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                            />
                            <StatCard
                                title="Amici Invitati"
                                value={data.invitedFriends}
                                icon={<Users className="text-cyan-400" />}
                                description={`Nuovi utenti via referral negli ultimi ${days} giorni.`}
                                color="from-cyan-500/20 to-teal-500/20"
                                border="border-cyan-500/30"
                                glow="shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                            />
                            <StatCard
                                title="Ordini Box (Free)"
                                value={data.freeBoxOrders}
                                icon={<PackageOpen className="text-zinc-500" />}
                                description={`Mystery Box gratuite ordinate in ${days} gg.`}
                                color="from-zinc-500/10 to-gray-500/10"
                                border="border-white/10"
                                glow=""
                            />
                            <StatCard
                                title="Ordini Box (Paid)"
                                value={data.paidBoxOrders}
                                icon={<Package className="text-red-400" />}
                                description={`Mystery Box a pagamento ordinate in ${days} gg.`}
                                color="from-red-500/20 to-rose-500/20"
                                border="border-red-500/30"
                                glow="shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                            />
                            <StatCard
                                title="Transazioni (#)"
                                value={data.totalTransactions}
                                icon={<CreditCard className="text-blue-300" />}
                                description={`Num. totale ricariche (completate o meno) in ${days} gg.`}
                                color="from-blue-500/10 to-indigo-500/10"
                                border="border-white/10"
                                glow=""
                            />
                            <StatCard
                                title="Onboarding Pending"
                                value={data.pendingOnboardingCount}
                                icon={<AlertCircle className="text-red-400" />}
                                description="Utenti che non hanno ancora completato l'onboarding."
                                color="from-red-500/10 to-orange-500/10"
                                border="border-red-500/20"
                                glow=""
                            />
                        </div>

                        {data.pendingOnboardingCount > 0 && (
                            <div className="flex justify-end">
                                <button
                                    onClick={copyEmails}
                                    className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2"
                                >
                                    <Users size={14} />
                                    Copia Email OnBoarding Pending ({data.pendingOnboardingCount})
                                </button>
                            </div>
                        )}

                        {/* Transaction Distribution Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative group p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden transition-all"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="text-purple-400" size={20} />
                                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Distribuzione Transazioni (Vendite per Prezzo)</h2>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                    Totale: {data.transactionDistribution.reduce((acc, curr) => acc + curr.count, 0)} vendite
                                </div>
                            </div>

                            <div className="relative h-64 w-full flex items-end gap-2 sm:gap-4 px-2">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-full border-t border-dashed border-white/10" />
                                    ))}
                                </div>

                                {data.transactionDistribution.length > 0 ? (
                                    data.transactionDistribution.map((item, idx) => {
                                        const maxCount = Math.max(...data.transactionDistribution.map(d => d.count), 1);
                                        const heightPercent = (item.count / maxCount) * 100;

                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group/bar relative">
                                                {/* Bar */}
                                                <div className="relative w-full flex flex-col justify-end h-48">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${heightPercent}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                                        className="w-full bg-gradient-to-t from-purple-600/50 to-blue-400 rounded-t-lg relative"
                                                    >
                                                        {/* Glow on Hover */}
                                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-lg" />

                                                        {/* Tooltip-like count on bar */}
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-purple-600 px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                                                            {item.count} ordini
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                {/* Labels */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-xs font-bold text-white tracking-tighter">€{item.amount.toFixed(2)}</span>
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.count} vol.</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest font-black opacity-30">
                                        Nessuna transazione nel periodo
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prezzi Monitorati (Volumi)</span>
                                </div>
                                <div className="text-[10px] font-medium text-gray-500 leading-relaxed max-w-lg">
                                    Il grafico mostra la distribuzione delle vendite completate raggruppate per punto prezzo.
                                    Utile per capire quali pacchetti di MusiCoins sono più popolari nel periodo selezionato.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : null}
            </motion.div>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
