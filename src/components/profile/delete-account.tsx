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
            <div className="mt-12 pt-8 border-t border-white/10 group">
                <div className="flex items-center justify-between p-6 rounded-2xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300">
                    <div>
                        <h3 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
                            <Skull size={18} />
                            Danger Zone
                        </h3>
                        <p className="text-sm text-red-500/70">Eliminazione definitiva dell'account e dei dati.</p>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-900/40 transition-all duration-300 flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Elimina
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 pt-8 border-t border-white/10 animate-fade-in">
            <div className="bg-gradient-to-br from-red-950/40 to-black border border-red-500/30 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm shadow-xl shadow-red-900/10">
                {/* Background Decor */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-start gap-6 mb-8 relative z-10">
                    <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 shadow-inner">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">Sei assolutamente sicuro?</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Questa azione è <span className="text-red-400 font-bold">irreversibile</span>. Tutti i tuoi dati, i team creati, i punteggi storici e le impostazioni verranno eliminati permanentemente dai nostri server.
                        </p>
                    </div>
                </div>

                <div className="space-y-6 relative z-10 bg-black/20 p-6 rounded-2xl border border-white/5">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">
                            Digita <span className="font-mono text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">DELETE</span> per confermare
                        </label>
                        <input
                            type="text"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            placeholder="DELETE"
                            className="w-full bg-[#0b0b10] border border-red-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-mono"
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setConfirmation('');
                            }}
                            className="w-full sm:flex-1 p-3.5 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/5"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmation !== 'DELETE' || isDeleting}
                            className={`w-full sm:flex-1 p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${confirmation === 'DELETE'
                                ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/30 hover:scale-[1.02]'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                }`}
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            Conferma Eliminazione
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
