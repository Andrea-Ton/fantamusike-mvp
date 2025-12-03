'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
            <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-lg font-bold text-red-500 mb-2">Zona Pericolosa</h3>
                <p className="text-sm text-gray-400 mb-4">L'eliminazione dell'account è irreversibile. Tutti i tuoi dati, team e punteggi verranno persi per sempre.</p>
                <button
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                >
                    <Trash2 size={16} />
                    Elimina Account
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 pt-8 border-t border-white/5 animate-fade-in">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Sei assolutamente sicuro?</h3>
                        <p className="text-sm text-gray-400">
                            Questa azione non può essere annullata. Scrivi <span className="font-bold text-white">DELETE</span> qui sotto per confermare.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="Scrivi DELETE"
                        className="w-full bg-[#0b0b10] border border-red-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setConfirmation('');
                            }}
                            className="flex-1 p-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmation !== 'DELETE' || isDeleting}
                            className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${confirmation === 'DELETE'
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            Conferma Eliminazione
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
