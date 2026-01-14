'use client';

import React, { useState } from 'react';
import { sendAdminMarketingEmail } from '@/app/actions/admin-email';
import { Loader2, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminEmailPage() {
    const [mode, setMode] = useState<'html' | 'template'>('html');
    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('newsletter');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSend = async () => {
        if (!subject || (mode === 'html' && !htmlContent)) {
            setMessage('Compila tutti i campi.');
            setStatus('error');
            return;
        }

        setStatus('sending');
        setMessage('');

        // Prepare payload based on mode
        const payload = mode === 'html'
            ? { type: 'html' as const, content: htmlContent }
            : { type: 'template' as const, templateName: selectedTemplate };

        const result = await sendAdminMarketingEmail(subject, payload);

        if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Email inviate con successo.');
            if (mode === 'html') {
                setSubject('');
                setHtmlContent('');
            }
        } else {
            setStatus('error');
            setMessage(result.error || 'Errore durante l\'invio.');
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Email System</h1>
                <p className="text-gray-400">Invia comunicazioni marketing agli utenti iscritti.</p>
            </header>

            <div className="bg-[#1a1a24] border border-white/5 rounded-3xl p-8 shadow-2xl">

                {/* Mode Selector */}
                <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
                    <button
                        onClick={() => setMode('html')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'html' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Raw HTML
                    </button>
                    <button
                        onClick={() => setMode('template')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'template' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        System Templates (React)
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Oggetto Email</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Es: Novità della settimana su FantaMusiké!"
                        className="w-full h-12 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                {mode === 'html' ? (
                    <div className="mb-6 animate-fade-in">
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Contenuto HTML</label>
                        <p className="text-xs text-gray-500 mb-2">Incolla qui il codice HTML della tua email (es. da React Email o template).</p>
                        <textarea
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            placeholder="<h1>Ciao Manager!</h1><p>Ecco le novità...</p>"
                            className="w-full h-96 bg-[#0b0b10] border border-white/10 rounded-xl p-4 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-y"
                        />
                    </div>
                ) : (
                    <div className="mb-6 animate-fade-in">
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Seleziona Template</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full h-12 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                        >
                            <option value="newsletter">Newsletter Mail</option>
                        </select>
                        <p className="mt-2 text-sm text-gray-400">
                            Verrà usato il componente React <code>Newsletter Mail</code>.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
                    <div className="flex-1">
                        {status === 'success' && (
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle size={20} />
                                <span>{message}</span>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertTriangle size={20} />
                                <span>{message}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={status === 'sending' || !subject || (mode === 'html' && !htmlContent)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'sending' ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        Invia Marketing Email
                    </button>
                </div>

                <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <p className="text-sm text-blue-400">
                        <span className="font-bold">Nota:</span> Le email verranno inviate solo agli utenti che hanno dato il consenso (flag <code>marketing_opt_in</code>).
                        Un link di disiscrizione verrà aggiunto automaticamente in fondo a ogni email.
                    </p>
                </div>
            </div>
        </div>
    );
}
