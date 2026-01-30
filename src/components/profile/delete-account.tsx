'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, Skull } from 'lucide-react';
import { deleteAccountAction } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function DeleteAccount() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmation, setConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleDelete = async () => {
        if (confirmation !== 'DELETE') return;

        setIsDeleting(true);

        // 1. Call Server Action to delete from Auth (and cascade DB)
        const result = await deleteAccountAction();

        if (result.success) {
            // 2. Sign out client-side to clear session
            await supabase.auth.signOut();
            router.push('/');
        } else {
            alert(result.message || 'Errore durante l\'eliminazione dell\'account');
            setIsDeleting(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="group/danger">
                <div className="flex items-center justify-between p-8 rounded-[2rem] border border-red-500/10 bg-red-500/[0.02] hover:bg-red-500/[0.05] hover:border-red-500/30 transition-all duration-500 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 group-hover/danger:scale-110 transition-transform duration-500 shadow-inner">
                            <Skull size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Chiudi Account</h3>
                            <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mt-1">Eliminazione account definitiva</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="px-5 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-500 transform hover:-translate-y-1"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="bg-gradient-to-br from-red-950/40 via-[#0a0a0e] to-black border border-red-500/30 rounded-[3rem] p-10 relative overflow-hidden backdrop-blur-3xl shadow-[0_0_80px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10">
                {/* Background Decor */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 relative z-10">
                    <div className="p-6 bg-red-500/10 rounded-3xl text-red-500 border border-red-500/20 shadow-inner scale-110">
                        <AlertTriangle size={48} />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3 leading-none">Azione Irreversibile</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] leading-relaxed max-w-xl">
                            Tutti i dati, i team creati, i punteggi storici e le impostazioni verranno <span className="text-red-500 underline decoration-red-500/30 underline-offset-4">eliminati permanentemente</span> dal Metaverso.
                        </p>
                    </div>
                </div>

                <div className="space-y-8 relative z-10 bg-white/[0.01] p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-inner group/form">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">
                            Conferma digitando <span className="font-mono text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">DELETE</span>
                        </label>
                        <input
                            type="text"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            placeholder="DELETE"
                            className="w-full bg-black/40 border border-red-500/30 rounded-2xl px-6 py-4 text-white placeholder-gray-700 focus:outline-none focus:border-red-500 focus:ring-8 focus:ring-red-500/5 transition-all duration-500 font-mono text-center text-xl tracking-widest uppercase"
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-4">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setConfirmation('');
                            }}
                            className="w-full sm:flex-1 py-5 rounded-2xl font-black italic uppercase tracking-tighter text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-500 border border-white/5"
                        >
                            Ripensaci
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmation !== 'DELETE' || isDeleting}
                            className={`w-full sm:flex-1 py-5 px-2 rounded-2xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-3 transition-all duration-500 transform ${confirmation === 'DELETE'
                                ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:-translate-y-1 hover:scale-[1.02]'
                                : 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5'
                                }`}
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            Elimina Definitivamente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
