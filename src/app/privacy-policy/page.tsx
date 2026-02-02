
import React from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#0b0b10] text-white font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32 animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-px bg-purple-500"></div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Legale</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-12">
                    Privacy <span className="text-purple-500 text-6xl italic not-italic">Policy</span>
                </h1>

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">1. Titolare del Trattamento</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Il Titolare del trattamento è <strong>Musiké SRL</strong>, con sede legale in Viale Luigi Majno, 28, 20129, Milano (MI), P.IVA/C.F. 14157980963.
                            Per qualsiasi domanda relativa ai tuoi dati o per esercitare i tuoi diritti, puoi scriverci a: <a href="mailto:support@musike.fm" className="text-purple-400 hover:text-purple-300 transition-colors">support@musike.fm</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">2. Quali dati raccogliamo</h2>
                        <p className="text-gray-400 leading-relaxed font-medium mb-6">
                            FantaMusiké raccoglie solo i dati necessari per il funzionamento del gioco e, previo tuo consenso, per comunicazioni promozionali:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Dati forniti volontariamente</h3>
                                <p className="text-xs text-gray-500 font-medium">Username, E-mail, password (cifrata).</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Dati di gioco</h3>
                                <p className="text-xs text-gray-500 font-medium">Squadre create, MusiCoins, punteggi e posizione in classifica.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Dati di navigazione</h3>
                                <p className="text-xs text-gray-500 font-medium">Indirizzo IP, tipo di browser, orari di accesso.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Dati statistici</h3>
                                <p className="text-xs text-gray-500 font-medium">Navigazione anonimizzata raccolta tramite strumenti di analitica.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">3. Perché trattiamo i tuoi dati</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="text-purple-500 font-black text-xl italic">A</div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">Funzionamento del Gioco</h3>
                                    <p className="text-gray-400 text-sm mt-1">Gestione iscrizione, account, MusiCoins e classifiche.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-purple-500 font-black text-xl italic">B</div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">Sicurezza e Antifrode</h3>
                                    <p className="text-gray-400 text-sm mt-1">Prevenzione abusi, bot o accessi non autorizzati.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-purple-500 font-black text-xl italic">C</div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">Marketing e Newsletter (Opzionale)</h3>
                                    <p className="text-gray-400 text-sm mt-1">Invio aggiornamenti promozionali solo con consenso esplicito.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-purple-500 font-black text-xl italic">D</div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">Obblighi di Legge</h3>
                                    <p className="text-gray-400 text-sm mt-1">Adempimento a norme amministrative, fiscali o richieste Autorità.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-purple-500 font-black text-xl italic">E</div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wide text-sm">Statistica</h3>
                                    <p className="text-gray-400 text-sm mt-1">Analisi aggregate sull'uso del sito.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">4. Con chi condividiamo i dati</h2>
                        <p className="text-gray-400 leading-relaxed font-medium mb-4">I tuoi dati non saranno mai venduti a terzi. Possono essere comunicati a:</p>
                        <ul className="list-disc list-inside text-gray-500 space-y-2 text-sm font-medium">
                            <li>Provider di servizi hosting e cloud.</li>
                            <li>Provider di servizi di analisi.</li>
                            <li>Consulenti fiscali/legali se previsto dalla legge.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">5. Trasferimento all'estero</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            I dati sono conservati prevalentemente in Unione Europea. Strumenti come GA4 potrebbero comportare trasferimenti USA, garantiti da Clausole Contrattuali Standard (SCC).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">6. Conservazione dei dati</h2>
                        <ul className="list-none p-0 space-y-4">
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-sm text-gray-400 font-medium"><strong>Account attivo:</strong> Per tutta la durata della tua iscrizione.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-sm text-gray-400 font-medium"><strong>Newsletter:</strong> Fino alla disiscrizione (max 24 mesi senza interazioni).</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-sm text-gray-400 font-medium"><strong>Account cancellato:</strong> Rimozione immediata dei dati identificativi.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">7. I tuoi Diritti (GDPR)</h2>
                        <p className="text-gray-400 leading-relaxed font-medium mb-4">
                            In conformità al GDPR, hai diritto di accesso, rettifica, cancellazione, revoca del consenso al marketing, portabilità e reclamo al Garante.
                        </p>
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 text-center">
                            <p className="text-xs text-gray-400 font-medium mb-4">Per esercitare i tuoi diritti scrivici a:</p>
                            <span className="text-purple-400 font-black uppercase tracking-widest">support@musike.fm</span>
                        </div>
                    </section>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mt-16">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                            Ultimo Aggiornamento: 2 Febbraio 2026
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
