'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Coins, Play, Save, Loader2, ListChecks } from 'lucide-react';
import { getLeaderboardConfigAction, updateLeaderboardConfigAction, triggerWeeklyLeaderboardAction, LeaderboardConfig } from '@/app/actions/leaderboard';

export default function AdminLeaderboardPage() {
    const [config, setConfig] = useState<LeaderboardConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
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

    const handleProcessManual = async () => {
        if (!confirm('Sei sicuro? Questa azione resetterà i punteggi settimanali di tutti gli utenti e assegnerà i premi.')) return;

        setProcessing(true);
        addLog('🚀 Triggering manual weekly processing...');

        try {
            const res = await triggerWeeklyLeaderboardAction();
            if (res.success) {
                addLog(`✅ Success: ${res.message}`);
            } else {
                addLog(`❌ Error: ${res.message || 'Unknown error'}`);
            }
        } catch (err) {
            addLog('❌ Failed to call action');
        } finally {
            setProcessing(false);
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
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Gestione Classifica</h1>
                    <p className="text-gray-400 text-sm">Configura i premi settimanali e gestisci il reset globale.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleProcessManual}
                        disabled={processing}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {processing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                        Processa Classifica Ora
                    </button>
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
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Daily Scoring:</span>
                                    <span className="text-white font-mono">03:00 AM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Weekly Ranking:</span>
                                    <span className="text-white font-mono font-bold text-blue-400">04:00 AM (Mon)</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Weekly Snapshot:</span>
                                    <span className="text-white font-mono text-purple-400">04:15 AM (Mon)</span>
                                </li>
                            </ul>
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
