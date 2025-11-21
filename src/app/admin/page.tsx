'use client';

import React, { useState } from 'react';
import { Play, Save, AlertTriangle, CheckCircle, Activity, Database } from 'lucide-react';
import { createWeeklySnapshotAction, calculateScoresAction } from '@/app/actions/admin';

export default function AdminPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [weekNumber, setWeekNumber] = useState(1);

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    const handleSnapshot = async () => {
        setLoading(true);
        addLog(`Starting Snapshot for Week ${weekNumber}...`);
        try {
            const result = await createWeeklySnapshotAction(weekNumber);
            if (result.success) {
                addLog(`✅ Success: ${result.message}`);
            } else {
                addLog(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            addLog('❌ Unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleScoring = async () => {
        setLoading(true);
        addLog(`Starting Scoring for Week ${weekNumber}...`);
        try {
            const result = await calculateScoresAction(weekNumber);
            if (result.success) {
                addLog(`✅ Success: ${result.message}`);
            } else {
                addLog(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            addLog('❌ Unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Admin Control Center
                        </h1>
                        <p className="text-gray-400 mt-1">Manage Game Loop & Scoring</p>
                    </div>
                    <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={14} />
                        ADMIN AREA
                    </div>
                </div>

                {/* Controls Card */}
                <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">

                        {/* Week Selector */}
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Target Week</label>
                            <input
                                type="number"
                                value={weekNumber}
                                onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                                className="bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white w-full focus:outline-none focus:border-purple-500 transition-colors"
                                min="1"
                            />
                        </div>

                        {/* Action 1: Snapshot */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Database size={20} />
                                </div>
                                <h3 className="font-bold text-lg">1. Weekly Snapshot</h3>
                            </div>
                            <p className="text-sm text-gray-400 h-12">
                                Freezes current artist stats (Popularity & Followers) as the baseline for the week. Run this on Monday 00:00.
                            </p>
                            <button
                                onClick={handleSnapshot}
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                <Save size={18} className="group-hover:scale-110 transition-transform" />
                                {loading ? 'Processing...' : 'Freeze Snapshot'}
                            </button>
                        </div>

                        {/* Action 2: Scoring */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                    <Activity size={20} />
                                </div>
                                <h3 className="font-bold text-lg">2. Calculate Scores</h3>
                            </div>
                            <p className="text-sm text-gray-400 h-12">
                                Compares current live data against the snapshot. Calculates points and updates user profiles. Run this on Sunday 23:59.
                            </p>
                            <button
                                onClick={handleScoring}
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                <Play size={18} className="group-hover:scale-110 transition-transform" />
                                {loading ? 'Processing...' : 'Run Scoring'}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Console / Logs */}
                <div className="bg-black/50 border border-white/5 rounded-2xl p-6 font-mono text-sm h-64 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 text-gray-500 mb-4 sticky top-0 bg-black/50 backdrop-blur-sm pb-2 border-b border-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        System Logs
                    </div>
                    <div className="space-y-2">
                        {logs.length === 0 && (
                            <span className="text-gray-600 italic">Waiting for commands...</span>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="text-gray-300 border-l-2 border-purple-500/30 pl-3 py-1">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
