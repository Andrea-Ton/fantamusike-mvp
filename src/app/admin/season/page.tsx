'use client';

import React, { useState, useEffect } from 'react';
import { Play, Plus, StopCircle, Calendar, AlertTriangle } from 'lucide-react';
import { getSeasonsAction, createSeasonAction, startSeasonAction, endSeasonAction, Season } from '@/app/actions/season';

export default function SeasonPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [newSeasonName, setNewSeasonName] = useState('');
    const [newSeasonStart, setNewSeasonStart] = useState('');
    const [newSeasonEnd, setNewSeasonEnd] = useState('');

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        const data = await getSeasonsAction();
        setSeasons(data);
    };

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    const handleCreateSeason = async () => {
        if (!newSeasonName || !newSeasonStart || !newSeasonEnd) {
            addLog('❌ Error: Please fill all season fields');
            return;
        }
        setLoading(true);
        addLog(`Creating Season: ${newSeasonName}...`);
        try {
            const result = await createSeasonAction(newSeasonName, newSeasonStart, newSeasonEnd);
            if (result.success) {
                addLog(`✅ Success: ${result.message}`);
                setNewSeasonName('');
                setNewSeasonStart('');
                setNewSeasonEnd('');
                fetchSeasons();
            } else {
                addLog(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            addLog('❌ Unexpected error creating season');
        } finally {
            setLoading(false);
        }
    };

    const handleStartSeason = async (id: string) => {
        setLoading(true);
        addLog(`Starting Season ID: ${id}...`);
        try {
            const result = await startSeasonAction(id);
            if (result.success) {
                addLog(`✅ Success: ${result.message}`);
                fetchSeasons();
            } else {
                addLog(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            addLog('❌ Unexpected error starting season');
        } finally {
            setLoading(false);
        }
    };

    const handleEndSeason = async (id: string) => {
        setLoading(true);
        addLog(`Ending Season ID: ${id}...`);
        try {
            const result = await endSeasonAction(id);
            if (result.success) {
                addLog(`✅ Success: ${result.message}`);
                fetchSeasons();
            } else {
                addLog(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            addLog('❌ Unexpected error ending season');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Season Management</h1>
                    <p className="text-gray-400 mt-1">Create, start, and end game seasons.</p>
                </div>
            </div>

            {/* Create Season Form */}
            <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                        <Calendar size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-white">Create New Season</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <input
                        type="text"
                        placeholder="Season Name (e.g. Season 1)"
                        value={newSeasonName}
                        onChange={(e) => setNewSeasonName(e.target.value)}
                        className="bg-[#0f0f16] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                        type="date"
                        value={newSeasonStart}
                        onChange={(e) => setNewSeasonStart(e.target.value)}
                        className="bg-[#0f0f16] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                        type="date"
                        value={newSeasonEnd}
                        onChange={(e) => setNewSeasonEnd(e.target.value)}
                        className="bg-[#0f0f16] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                        onClick={handleCreateSeason}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Plus size={16} /> Create
                    </button>
                </div>
            </div>

            {/* Seasons List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-white">All Seasons</h3>
                <div className="space-y-3">
                    {seasons.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No seasons found.</p>
                    ) : (
                        seasons.map((season) => (
                            <div key={season.id} className={`flex items-center justify-between p-4 rounded-xl border ${season.is_active ? 'bg-purple-500/10 border-purple-500/40' : 'bg-[#1a1a24] border-white/5'}`}>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-white">{season.name}</h4>
                                        {season.is_active && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded-full border border-green-500/30">Active</span>
                                        )}
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${season.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                            season.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                'bg-white/10 text-white border-white/20'
                                            }`}>
                                            {season.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!season.is_active && season.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStartSeason(season.id)}
                                            disabled={loading}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <Play size={12} /> Start
                                        </button>
                                    )}
                                    {season.is_active && (
                                        <button
                                            onClick={() => handleEndSeason(season.id)}
                                            disabled={loading}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <StopCircle size={12} /> End Season
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Console / Logs */}
            <div className="bg-black/50 border border-white/5 rounded-2xl p-6 font-mono text-sm h-48 overflow-y-auto custom-scrollbar">
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
    );
}
