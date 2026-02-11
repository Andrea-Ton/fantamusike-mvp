'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    ListChecks,
    Zap,
    BarChart3,
    Clock,
    Trophy,
    Terminal,
    Activity,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    Play
} from 'lucide-react';
import {
    triggerWeeklyLeaderboardAction,
    triggerDailyScoringAction,
    triggerWeeklySnapshotAction
} from '@/app/actions/leaderboard';

export default function AdminLeaderboardPage() {
    const [processing, setProcessing] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

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
        addLog(`🚀 [SYSTEM] Initiating ${labels[type]} protocol...`, 'info');

        try {
            let res;
            if (type === 'scoring') res = await triggerDailyScoringAction();
            else if (type === 'ranking') res = await triggerWeeklyLeaderboardAction();
            else res = await triggerWeeklySnapshotAction();

            if (res.success) {
                addLog(`✅ [SUCCESS] ${res.message}`, 'success');
            } else {
                addLog(`❌ [ERROR] ${res.message || 'Unknown protocol failure'}`, 'error');
            }
        } catch (err) {
            addLog(`❌ [FATAL] Communication error with processing core`, 'error');
        } finally {
            setProcessing(null);
        }
    };

    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs((prev: string[]) => [
            `[${new Date().toLocaleTimeString()}] ${msg}`,
            ...prev
        ].slice(0, 15));
    };

    const automationTasks = [
        {
            id: 'scoring',
            title: 'Daily Scoring',
            desc: 'Calcola i punti basati su stream e hype Spotify.',
            schedule: 'Ogni giorno alle 03:00 UTC',
            icon: <BarChart3 className="text-blue-400" />,
            color: 'from-blue-500/20 to-indigo-500/20',
            border: 'border-blue-500/30',
            accent: 'bg-blue-500',
            glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]'
        },
        {
            id: 'ranking',
            title: 'Weekly Ranking',
            desc: 'Genera il recap settimanale e archivia i risultati.',
            schedule: 'Lunedì alle 04:00 UTC',
            icon: <Trophy className="text-purple-400" />,
            color: 'from-purple-500/20 to-pink-500/20',
            border: 'border-purple-500/30',
            accent: 'bg-purple-500',
            glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]'
        },
        {
            id: 'snapshot',
            title: 'Week Reset',
            desc: 'Prepara la nuova settimana e svuota le lineup.',
            schedule: 'Lunedì alle 05:00 UTC',
            icon: <Clock className="text-cyan-400" />,
            color: 'from-cyan-500/20 to-teal-500/20',
            border: 'border-cyan-500/30',
            accent: 'bg-cyan-500',
            glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]'
        }
    ];

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
                            Gestione <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Classifica</span>
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
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Operations Dashboard */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center gap-2">
                            <Zap className="text-yellow-500" size={20} />
                            <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Protocolli di Automazione</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {automationTasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`relative group p-6 rounded-[2rem] bg-gradient-to-br ${task.color} border ${task.border} backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] ${task.glow}`}
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                                        {React.cloneElement(task.icon as any, { size: 80 })}
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl ${task.accent}/20 flex items-center justify-center border border-white/10`}>
                                                    {task.icon}
                                                </div>
                                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{task.title}</h3>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-[200px]">
                                                {task.desc}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Schedule</span>
                                                <span className="text-[10px] font-black text-white uppercase">{task.schedule}</span>
                                            </div>
                                            <button
                                                onClick={() => handleTrigger(task.id as any)}
                                                disabled={!!processing}
                                                className="relative px-6 py-2.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-30 group/btn overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-black opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                                                <span className="relative z-10 flex items-center gap-2">
                                                    {processing === task.id ? (
                                                        <RefreshCw size={12} className="animate-spin" />
                                                    ) : (
                                                        <Play size={12} className="fill-current" />
                                                    )}
                                                    {processing === task.id ? 'Running...' : 'Execute'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Manual Alert/Status Card */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center space-y-4 group">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Warning</p>
                                    <p className="text-xs font-medium text-gray-400 leading-tight italic">
                                        L'esecuzione manuale bypassa i controlli schedulati. Procedere con cautela.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terminal Logs */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Terminal className="text-purple-400" size={20} />
                            <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Command Log</h2>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-[1px] bg-gradient-to-b from-purple-500/20 to-blue-500/20 rounded-[2rem] blur-[1px]"></div>
                            <div className="relative bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 h-[500px] flex flex-col font-mono">
                                <div className="flex items-center gap-1.5 mb-6">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                    <span className="text-[9px] text-gray-600 font-bold ml-2 uppercase tracking-widest">system_monitor.sh</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    <AnimatePresence>
                                        {logs.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-gray-700 italic text-[10px]"
                                            >
                                                Waiting for system commands...
                                            </motion.div>
                                        ) : (
                                            logs.map((log, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`text-[10px] leading-relaxed break-all ${log.includes('SUCCESS') ? 'text-green-400' :
                                                        log.includes('ERROR') ? 'text-red-400' :
                                                            'text-purple-300'
                                                        }`}
                                                >
                                                    <span className="opacity-50 inline-block mr-2">$</span>
                                                    {log}
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] text-green-500/50">
                                        <span className="animate-pulse">●</span>
                                        <span className="font-black tracking-widest uppercase">Connection: Secure</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
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
