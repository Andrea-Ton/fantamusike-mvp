'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Coins, Play, Save, Loader2, ListChecks, Zap, BarChart3, Clock } from 'lucide-react';
import {
    getLeaderboardConfigAction,
    updateLeaderboardConfigAction,
    triggerWeeklyLeaderboardAction,
    triggerDailyScoringAction,
    triggerWeeklySnapshotAction,
    LeaderboardConfig
} from '@/app/actions/leaderboard';

export default function AdminLeaderboardPage() {
    const [config, setConfig] = useState<LeaderboardConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const data = await getLeaderboardConfigAction();
        setConfig(data);
        setLoading(false);
    };

    const handleUpdateReward = async (tier: string, reward: number) => {
        setSaving(tier);
        const res = await updateLeaderboardConfigAction(tier, reward);
        if (res.success) {
            addLog(`✅ Updated ${tier} to ${reward} MusiCoins`);
        } else {
            addLog(`❌ Failed to update ${tier}`);
        }
        setSaving(null);
    };

    const handleTrigger = async (type: 'scoring' | 'ranking' | 'snapshot') => {
        const labels = {
            scoring: 'Daily Scoring',
            ranking: 'Weekly Ranking/Rewards',
            snapshot: 'Weekly Snapshot (New Week)'
        };

        const confirmation = type === 'scoring'
            ? 'Sei sicuro? Questa azione ricalcolerà i punteggi di oggi per tutti gli artisti e gli utenti.'
            : 'Sei sicuro? Questa azione è irreversibile e impatterà la classifica globale.';

        if (!confirm(confirmation)) return;

        setProcessing(type);
        addLog(`🚀 Manually triggering ${labels[type]}...`);

        try {
            let res;
            if (type === 'scoring') res = await triggerDailyScoringAction();
            else if (type === 'ranking') res = await triggerWeeklyLeaderboardAction();
            else res = await triggerWeeklySnapshotAction();

            if (res.success) {
                addLog(`✅ Success: ${res.message}`);
            } else {
                addLog(`❌ Error: ${res.message || 'Unknown error'}`);
            }
        } catch (err) {
            addLog(`❌ Failed to call ${type} action`);
        } finally {
            setProcessing(null);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Gestione Classifica</h1>
                    <p className="text-gray-400 text-sm">Configura i premi settimanali e gestisci le automazioni manuali.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Reward Configuration */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="text-yellow-500" size={20} />
                        <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Premi MusiCoin</h2>
                    </div>

                    <div className="space-y-3">
                        {config.map((item) => (
                            <div key={item.tier} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white">{item.label}</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{item.tier}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        defaultValue={item.reward_musicoins}
                                        onBlur={(e) => handleUpdateReward(item.tier, parseInt(e.target.value))}
                                        className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-right font-black text-yellow-500 focus:outline-none focus:border-purple-500"
                                    />
                                    {saving === item.tier ? (
                                        <Loader2 size={16} className="animate-spin text-gray-500" />
                                    ) : (
                                        <Coins size={16} className="text-gray-600 group-hover:text-yellow-500 transition-colors" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Automation & Status Logs */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <ListChecks className="text-blue-500" size={20} />
                        <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Automazione & Status</h2>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Schedules (UTC)</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <BarChart3 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tight">1. Scoring</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Scheduled: 03:00 AM</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTrigger('scoring')}
                                        disabled={!!processing}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                                    >
                                        {processing === 'scoring' ? <Loader2 size={12} className="animate-spin" /> : 'Run Now'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Trophy size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tight">2. Assegnazione Punti</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Scheduled: 04:00 AM (Mon)</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTrigger('ranking')}
                                        disabled={!!processing}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-purple-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                                    >
                                        {processing === 'ranking' ? <Loader2 size={12} className="animate-spin" /> : 'Run Now'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tight">3. Start Nuova settimana</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Scheduled: 05:00 AM (Mon)</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTrigger('snapshot')}
                                        disabled={!!processing}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-cyan-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                                    >
                                        {processing === 'snapshot' ? <Loader2 size={12} className="animate-spin" /> : 'Run Now'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Logs Recenti</p>
                            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 font-mono text-[10px] space-y-1 h-[200px] overflow-y-auto">
                                {logs.length === 0 ? (
                                    <span className="text-gray-700 italic">No activity logs...</span>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="text-gray-400">
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
