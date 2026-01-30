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
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Il Tuo Username</label>
                    <div className="relative flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500">
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
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] focus:ring-8 focus:ring-purple-500/5 transition-all duration-500 backdrop-blur-3xl font-bold tracking-tight"
                                placeholder="@username"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving || username === initialUsername}
                            className={`px-8 py-4 sm:py-0 rounded-2xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-2 transition-all duration-500 transform whitespace-nowrap ${isSaving || username === initialUsername
                                ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-2xl shadow-purple-900/40 hover:-translate-y-1 hover:scale-[1.02]'
                                }`}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Salva Modifiche</span>
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-fade-in-up border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                        {message.text}
                    </div>
                )}
            </form>

            <div className="border-t border-white/5 pt-10 space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Sicurezza</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Accesso Account</p>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Email Registrata</label>
                    <div className="flex items-center gap-3 px-6 py-5 bg-white/[0.01] border border-white/5 rounded-2xl text-gray-500 cursor-not-allowed select-none group/email transition-colors hover:bg-white/[0.02]">
                        <Mail size={18} className="text-gray-600 group-hover/email:text-gray-400 transition-colors" />
                        <span className="font-mono text-sm tracking-tighter">{email}</span>
                    </div>
                </div>

                <Link
                    href="/forgot-password"
                    className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-500 group shadow-2xl hover:shadow-purple-900/20"
                >
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform duration-500 border border-purple-500/20 shadow-inner">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white italic uppercase tracking-tighter text-lg leading-none">Cambia Password</h4>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1 group-hover:text-gray-400 transition-colors">Ricevi un link di sicurezza</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-500">
                        <Save size={16} className="rotate-[-90deg]" />
                    </div>
                </Link>
            </div>

            <div className="border-t border-white/5 pt-10 space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Comunicazioni</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Preferenze Privacy</p>
                    </div>
                </div>

                <PrivacySettings initialOptIn={initialMarketingOptIn} />
            </div>
        </div>
    );
}
