'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { sendAdminMarketingEmail, previewEmailAction } from '@/app/actions/admin-email';
import { Loader2, Send, CheckCircle, AlertTriangle, Eye, Settings, Type, MousePointer2, ExternalLink } from 'lucide-react';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function AdminEmailPage() {
    const [mode, setMode] = useState<'html' | 'template'>('template');
    const [subject, setSubject] = useState('Novità dalla Season Zero di FantaMusiké! 🚀');

    // Recipient State
    const [recipientMode, setRecipientMode] = useState<'opted-in' | 'manual'>('opted-in');
    const [manualEmailsText, setManualEmailsText] = useState('');

    // HTML Mode State
    const [htmlContent, setHtmlContent] = useState('');

    // Template Mode State
    const [templateName, setTemplateName] = useState('newsletter');
    const [templateData, setTemplateData] = useState({
        previewText: "Sei uno dei primi 40 Manager. Il tuo parere conta.",
        headingText: "Season Zero",
        bodyText: "Ciao Manager,\n\nSe stai leggendo questa mail, fai parte dei **Pionieri** del FantaMusiké. Sei tra i primissimi ad aver messo le mani sull’app, a esplorarla, stressarla e dirci cosa funziona (e cosa no). In breve: ci stai aiutando a **costruirla**.\n\nFantaMusiké è ancora in **Beta**: stiamo testando, bilanciando e migliorando ogni meccanica. Il nostro obiettivo non è creare 'solo' un fantasy game, ma reinventare gradualmente il modo in cui i fan vivono la musica.\n\nLa Season 1 nascerà dalle scelte che facciamo oggi. Anche grazie a te.",
        ctaText: "Lascia il segno su FantaMusiké!",
        ctaUrl: "https://forms.gle/6BErAaxK3aCjPsUY8",
        footerText: "© 2026 Musiké. Tutti i diritti riservati.",
        showCta: true
    });

    // Preview State
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // General Status
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const debouncedTemplateData = useDebounce(templateData, 800);

    const updatePreview = useCallback(async () => {
        if (mode !== 'template') return;
        setIsPreviewLoading(true);
        const result = await previewEmailAction(templateName, templateData);
        if (result.success && result.html) {
            setPreviewHtml(result.html);
        }
        setIsPreviewLoading(false);
    }, [mode, templateName, templateData]);

    useEffect(() => {
        updatePreview();
    }, [debouncedTemplateData, mode]);

    const handleSend = async () => {
        if (!subject || (mode === 'html' && !htmlContent)) {
            setMessage('Compila tutti i campi.');
            setStatus('error');
            return;
        }

        const manualEmailsList = manualEmailsText
            .split('\n')
            .map(e => e.trim())
            .filter(e => e && e.includes('@'));

        if (recipientMode === 'manual' && manualEmailsList.length === 0) {
            setMessage('Fornisci almeno un indirizzo email valido.');
            setStatus('error');
            return;
        }

        setStatus('sending');
        setMessage('');

        const payload = mode === 'html'
            ? { type: 'html' as const, content: htmlContent, recipientMode, manualEmails: manualEmailsList }
            : { type: 'template' as const, templateName, templateData, recipientMode, manualEmails: manualEmailsList };

        const result = await sendAdminMarketingEmail(subject, payload);

        if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Email inviate con successo.');
        } else {
            setStatus('error');
            setMessage(result.error || 'Errore durante l\'invio.');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in overflow-hidden">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Email Campaign System</h1>
                    <p className="text-gray-400 text-sm">Crea, anteprima e invia comunicazioni marketing personalizzate.</p>
                </div>

                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button
                        onClick={() => setMode('template')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'template' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Settings size={16} />
                        Dynamic Template
                    </button>
                    <button
                        onClick={() => setMode('html')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'html' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Type size={16} />
                        Raw HTML
                    </button>
                </div>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden pb-4">
                {/* Editor Column */}
                <div className="w-full lg:w-1/2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">

                    {/* Recipient Targeting */}
                    <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4 px-1">Targeting Destinatari</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={() => setRecipientMode('opted-in')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${recipientMode === 'opted-in' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500 hover:text-gray-300'}`}
                            >
                                Utenti Iscritti (Opt-in)
                            </button>
                            <button
                                onClick={() => setRecipientMode('manual')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${recipientMode === 'manual' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-500 hover:text-gray-300'}`}
                            >
                                Lista Manuale Email
                            </button>
                        </div>

                        {recipientMode === 'manual' ? (
                            <div className="animate-fade-in">
                                <textarea
                                    value={manualEmailsText}
                                    onChange={(e) => setManualEmailsText(e.target.value)}
                                    placeholder="indirizzo@mail.com"
                                    className="w-full h-32 bg-[#0b0b10] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none font-mono"
                                />
                                <p className="text-[10px] text-gray-500 mt-2">Inserisci un indirizzo per riga.</p>
                            </div>
                        ) : (
                            <div className="bg-[#0b0b10] p-4 rounded-xl border border-white/5 animate-fade-in">
                                <p className="text-xs text-gray-400">Le email verranno inviate a tutti gli utenti che hanno attivo il flag <strong>marketing_opt_in</strong>.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 px-1">Oggetto Email</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full h-12 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                                />
                            </div>

                            {mode === 'html' ? (
                                <div>
                                    <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 px-1">Contenuto HTML</label>
                                    <textarea
                                        value={htmlContent}
                                        onChange={(e) => setHtmlContent(e.target.value)}
                                        className="w-full h-[300px] bg-[#0b0b10] border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-purple-500/50 resize-none"
                                        placeholder="Paste your HTML here..."
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Preview Text (Snippet)</label>
                                            <input
                                                type="text"
                                                value={templateData.previewText}
                                                onChange={(e) => setTemplateData({ ...templateData, previewText: e.target.value })}
                                                className="w-full h-10 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Sottotitolo Logo</label>
                                            <input
                                                type="text"
                                                value={templateData.headingText}
                                                onChange={(e) => setTemplateData({ ...templateData, headingText: e.target.value })}
                                                className="w-full h-10 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2 px-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Testo Principale (Corpo Email)</label>
                                            <span className="text-[9px] text-gray-600 font-mono">Usa **testo** per il grassetto</span>
                                        </div>
                                        <textarea
                                            value={templateData.bodyText}
                                            onChange={(e) => setTemplateData({ ...templateData, bodyText: e.target.value })}
                                            className="w-full h-48 bg-[#0b0b10] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div className="border-t border-white/5 pt-4">
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <MousePointer2 size={12} /> Call To Action
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-400 transition-colors uppercase">Attiva Bottone</span>
                                                <div className="relative inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={templateData.showCta}
                                                        onChange={(e) => setTemplateData({ ...templateData, showCta: e.target.checked })}
                                                    />
                                                    <div className="w-9 h-5 bg-white/5 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-600 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600/30 peer-checked:border-purple-600/50 peer-checked:after:bg-purple-400"></div>
                                                </div>
                                            </label>
                                        </div>

                                        {templateData.showCta && (
                                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">CTA Label</label>
                                                    <input
                                                        type="text"
                                                        value={templateData.ctaText}
                                                        onChange={(e) => setTemplateData({ ...templateData, ctaText: e.target.value })}
                                                        className="w-full h-10 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">CTA URL</label>
                                                    <input
                                                        type="text"
                                                        value={templateData.ctaUrl}
                                                        onChange={(e) => setTemplateData({ ...templateData, ctaUrl: e.target.value })}
                                                        className="w-full h-10 bg-[#0b0b10] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex-1 mr-4">
                                    {status === 'success' && (
                                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-fade-in">
                                            <CheckCircle size={16} />
                                            <span>{message}</span>
                                        </div>
                                    )}
                                    {status === 'error' && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium animate-fade-in">
                                            <AlertTriangle size={16} />
                                            <span>{message}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSend}
                                    disabled={status === 'sending' || !subject || (mode === 'html' && !htmlContent)}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group whitespace-nowrap"
                                >
                                    {status === 'sending' ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                    Lancio Campagna
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="hidden lg:flex lg:w-1/2 flex-col gap-4 overflow-hidden h-full">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Eye size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Live Preview (Desktop View)</span>
                        </div>
                        {isPreviewLoading && <Loader2 size={14} className="text-purple-500 animate-spin" />}
                    </div>

                    <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                        {mode === 'template' ? (
                            <iframe
                                srcDoc={previewHtml}
                                className="w-full h-full border-none"
                                title="Email Preview"
                            />
                        ) : (
                            <div className="w-full h-full p-8 overflow-auto text-black" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        )}

                        {isPreviewLoading && !previewHtml && (
                            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-purple-600" size={32} />
                                <span className="text-gray-500 font-medium">Rendering template...</span>
                            </div>
                        )}
                    </div>

                    <div className="h-24 bg-purple-600/5 border border-purple-500/10 rounded-2xl p-4">
                        <p className="text-xs text-purple-300 leading-relaxed font-medium">
                            <span className="font-bold text-purple-400 decoration-purple-400 underline">Nota: </span>
                            {recipientMode === 'manual'
                                ? "Stai usando una lista manuale. Assicurati che gli indirizzi siano corretti. Non verranno generate profilazioni utente."
                                : "Le email verranno inviate solo agli utenti con consenso attivo. Il sistema aggiungerà automaticamente il footer con il link di disiscrizione univoco."}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
