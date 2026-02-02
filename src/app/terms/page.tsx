
import React from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0b0b10] text-white font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32 animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-px bg-yellow-500"></div>
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em]">Accordo</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-12">
                    Termini & <span className="text-yellow-500 text-6xl italic not-italic">Condizioni</span>
                </h1>

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">1. Oggetto del Servizio e Requisiti</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            FantaMusiké è un gioco di simulazione e scouting musicale (attualmente in versione Beta). Gli utenti assumono il ruolo di Manager, gestendo team di artisti e competendo in base a dati reali. <strong>L'iscrizione è consentita esclusivamente agli utenti che abbiano compiuto almeno 14 anni.</strong> Creando un account, dichiari di avere l'età minima richiesta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">2. Stato di Beta</h2>
                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-3xl space-y-4">
                            <p className="text-gray-400 leading-relaxed font-medium">
                                <strong>Attenzione:</strong> La piattaforma è attualmente in fase di sviluppo (Beta). Il servizio è fornito "nello stato in cui si trova" (as is) e senza alcuna garanzia di continuità. L'utente accetta che:
                            </p>
                            <ul className="list-disc list-inside text-xs text-gray-500 space-y-2 font-medium">
                                <li>Potrebbero verificarsi bug, crash o interruzioni del servizio.</li>
                                <li>I dati di gioco, i punteggi, le classifiche e i MusiCoins potrebbero subire reset totali o parziali durante gli aggiornamenti, senza diritto ad alcun rimborso o indennizzo.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">3. Valuta Virtuale (MusiCoins) e Fair Play</h2>
                        <div className="space-y-4">
                            <p className="text-gray-400 leading-relaxed font-medium">
                                I "MusiCoins" sono punti virtuali funzionali esclusivamente alle meccaniche di gioco.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-500 space-y-2 font-medium">
                                <li><strong>Nessun Valore Economico:</strong> Non hanno valore monetario, non sono criptovalute, non possono essere convertiti in Euro/Dollari né venduti a terzi.</li>
                                <li><strong>Divieto di Abusi:</strong> È vietato utilizzare bot, script automatici o sfruttare bug del sistema per alterare i punteggi. FantaMusiké si riserva il diritto di sospendere o cancellare senza preavviso gli account che violano questa norma.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">4. Proprietà Intellettuale e Contenuti di Terze Parti</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Il codice sorgente, il marchio "FantaMusiké" e il design della piattaforma sono di proprietà esclusiva di <strong>Musiké SRL</strong>. I dati relativi agli artisti (nomi, immagini, statistiche) sono forniti da terze parti (es. Spotify, Apple Music) tramite API pubbliche. Tali contenuti rimangono di proprietà dei rispettivi titolari (Etichette, Artisti, Piattaforme) e vengono utilizzati su FantaMusiké a scopo descrittivo, informativo e di intrattenimento. <strong>FantaMusiké dichiara di non accedere in alcun modo ai dati privati, alle playlist o agli ascolti personali degli utenti sulle piattaforme di streaming collegate.</strong>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">5. Limitazione di Responsabilità</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            FantaMusiké si impegna a mantenere il servizio attivo e sicuro, ma non può garantirne il funzionamento ininterrotto. Nei limiti massimi consentiti dalla legge vigente, <strong>Musiké SRL</strong> non sarà responsabile per danni diretti o indiretti derivanti dall'uso del servizio, inclusa la perdita di dati di gioco o malfunzionamenti dovuti a cause di forza maggiore o problemi delle piattaforme terze. L'utente è l'unico responsabile della custodia delle proprie credenziali di accesso.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">6. Modifiche ai Termini</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Essendo un prodotto in fase di sviluppo, questi termini potrebbero cambiare. Ti informeremo di modifiche sostanziali tramite email o avviso sulla piattaforma. Continuando a usare il gioco dopo le modifiche, accetti i nuovi termini.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white border-b border-white/10 pb-4 mb-6">7. Legge Applicabile</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Questi termini sono regolati dalla legge italiana. Per qualsiasi controversia con un utente consumatore, la competenza territoriale è del giudice del luogo di residenza o domicilio del consumatore, se ubicato in Italia.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
