'use client';

import React, { useState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import { Loader2, Save, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

interface ProfileFormProps {
    initialUsername: string;
    email: string;
}

export default function ProfileForm({ initialUsername, email }: ProfileFormProps) {
    const [username, setUsername] = useState(initialUsername);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('username', username);

        const result = await updateProfileAction(formData);

        if (result.success) {
            setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
        } else {
            setMessage({ type: 'error', text: result.message || 'Errore durante l\'aggiornamento.' });
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Il tuo username"
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSaving || username === initialUsername}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSaving || username === initialUsername
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        }`}
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Salva Modifiche
                </button>
            </form>

            <div className="border-t border-white/5 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Sicurezza</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a24]/50 border border-white/5 rounded-xl text-gray-500 cursor-not-allowed">
                        <Mail size={18} />
                        <span>{email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata direttamente.</p>
                </div>

                <Link
                    href="/forgot-password"
                    className="flex items-center justify-between p-4 bg-[#1a1a24] border border-white/10 rounded-xl hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Lock size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-white">Cambia Password</p>
                            <p className="text-xs text-gray-400">Invia una mail per resettare la password</p>
                        </div>
                    </div>
                    <div className="text-gray-500 group-hover:text-white transition-colors">→</div>
                </Link>
            </div>
        </div>
    );
}
