'use client';

import React, { useState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import { Loader2, Save, Lock, Mail, User, Bell } from 'lucide-react';
import Link from 'next/link';
import PrivacySettings from './privacy-settings';

interface ProfileFormProps {
    initialUsername: string;
    email: string;
    initialMarketingOptIn: boolean;
}

export default function ProfileForm({ initialUsername, email, initialMarketingOptIn }: ProfileFormProps) {
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
            setMessage({ type: 'success', text: 'Profilo aggiornato!' });
        } else {
            setMessage({ type: 'error', text: result.message || 'Errore durante l\'aggiornamento.' });
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-8 animate-fade-in-left delay-100">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Username</label>
                    <div className="relative flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                minLength={3}
                                maxLength={20}
                                pattern="[a-zA-Z0-9_.]+"
                                title="Solo lettere, numeri, punti e underscore. Lunghezza 3-20 caratteri."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                                placeholder="Il tuo username"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving || username === initialUsername}
                            className={`px-6 py-3.5 sm:py-0 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 transform whitespace-nowrap ${isSaving || username === initialUsername
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5'
                                }`}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Salva</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Il nome visibile agli altri utenti e nelle classifiche.</p>
                </div>

                {message && (
                    <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in-up ${message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}
            </form>

            <div className="border-t border-white/10 pt-8 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock size={20} className="text-purple-400" />
                    Sicurezza & Accesso
                </h3>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Email Registrata</label>
                    <div className="flex items-center gap-3 px-4 py-4 bg-black/20 border border-white/5 rounded-xl text-gray-400 cursor-not-allowed user-select-none">
                        <Mail size={18} />
                        <span className="font-mono text-sm">{email}</span>
                    </div>
                </div>

                <Link
                    href="/forgot-password"
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                            <Lock size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-white group-hover:text-purple-300 transition-colors">Cambia Password</p>
                            <p className="text-xs text-gray-400 mt-0.5">Ricevi un link per impostare una nuova password</p>
                        </div>
                    </div>
                    <div className="text-gray-600 group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-300">→</div>
                </Link>
            </div>

            <div className="border-t border-white/10 pt-8 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell size={20} className="text-purple-400" />
                    Preferenze & Privacy
                </h3>

                <PrivacySettings initialOptIn={initialMarketingOptIn} />
            </div>
        </div>
    );
}
