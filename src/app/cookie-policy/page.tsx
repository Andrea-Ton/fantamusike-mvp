'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function CookiePolicyPage() {
    const handleReviewCookies = () => {
        window.dispatchEvent(new CustomEvent('show-cookie-banner'));
    };

    return (
        <div className="min-h-screen bg-[#0b0b10] text-white font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32 animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-px bg-blue-500"></div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Trasparenza</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-12">
                    Cookie <span className="text-blue-500 text-6xl italic not-italic">Policy</span>
                </h1>

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">Cosa sono i Cookie?</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            I cookie sono piccoli file di testo che i siti visitati dall'utente inviano al suo terminale, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla successiva visita del medesimo utente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">Tipologie di Cookie che usiamo</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-colors">
                                <h3 className="text-lg font-black text-white italic uppercase mb-2">Cookie Tecnici</h3>
                                <p className="text-xs text-gray-500 font-medium">Strettamente necessari per salvare la tua sessione di gioco, gestire il login e ricordarci le tue preferenze sulla classifica. Senza questi, FantaMusiké non può funzionare.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-purple-500/30 transition-colors">
                                <h3 className="text-lg font-black text-white italic uppercase mb-2">Cookie Analitici</h3>
                                <p className="text-xs text-gray-500 font-medium">Li usiamo (es. in forma anonimizzata) per capire quali artisti sono più cercati e migliorare l'algoritmo di gioco.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">Come gestire i Cookie</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Puoi gestire le tue preferenze sui cookie direttamente attraverso le impostazioni del tuo browser. Se disabiliti i cookie tecnici, potresti non essere in grado di accedere alla Dashboard o salvare il tuo team.
                        </p>
                    </section>

                    <section className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8">
                        <h2 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                            Dettagli sui Cookie Analitici (Google Analytics 4)
                        </h2>
                        <div className="space-y-4 text-sm text-gray-400 font-medium">
                            <p>
                                Questo sito utilizza Google Analytics 4, un servizio di analisi web fornito da Google Ireland Limited. Utilizziamo questo strumento per raccogliere dati statistici aggregati sull'uso del sito (es. numero di visitatori, pagine più visitate).
                            </p>
                            <ul className="space-y-2 list-none p-0">
                                <li><strong>Anonimizzazione:</strong> In GA4 l'anonimizzazione dell'indirizzo IP è attiva per impostazione predefinita.</li>
                                <li><strong>Dati raccolti:</strong> Identificatori online, identificatori del dispositivo, interazioni sul sito.</li>
                                <li><strong>Luogo del trattamento:</strong> I dati sono trattati in Unione Europea e potrebbero essere trasferiti negli Stati Uniti sulla base delle Clausole Contrattuali Standard.</li>
                                <li><strong>Durata:</strong> I cookie analitici (_ga) rimangono attivi per 2 anni (salvo cancellazione manuale).</li>
                            </ul>
                            <div className="pt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition-colors">Link alla Privacy Policy di Google</a>
                                <span className="text-white/10">•</span>
                                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition-colors">Componente aggiuntivo per la disattivazione</a>
                            </div>
                        </div>
                    </section>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mt-16 text-center">
                        <button
                            onClick={handleReviewCookies}
                            className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest underline decoration-purple-500/20 underline-offset-8"
                        >
                            Rivedi le tue scelte sui Cookie
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
