'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    const handleReviewCookies = () => {
        window.dispatchEvent(new CustomEvent('show-cookie-banner'));
    };

    return (
        <footer className="relative z-10 py-20 bg-black/60 border-t border-white/5 backdrop-blur-3xl overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
                        <span className="text-3xl font-black text-white italic uppercase tracking-tighter hover:text-purple-500 transition-colors duration-300">
                            FantaMusiké
                        </span>
                        <p className="text-gray-500 mt-4 text-sm font-medium leading-relaxed max-w-sm">
                            La prima piattaforma di Talent Scouting gamified in Italia
                            in cui puoi vincere mistery box e premi reali!
                        </p>
                    </div>

                    {/* Links Section */}
                    <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legale</span>
                            <div className="flex flex-col gap-3">
                                <Link href="/privacy-policy" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
                                <Link href="/cookie-policy" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Cookie Policy</Link>
                                <Link href="/terms" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Termini e Condizioni</Link>
                                <button
                                    onClick={handleReviewCookies}
                                    className="text-left text-[10px] font-black text-gray-600 hover:text-purple-400 uppercase tracking-widest transition-colors mt-2"
                                >
                                    Rivedi scelte Cookie
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supporto</span>
                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-gray-500">support@musike.fm</span>
                                <a href="#" className="hidden text-xs font-bold text-gray-500 hover:text-white transition-colors">Domande Frequenti</a>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Social</span>
                            <div className="flex flex-col gap-3">
                                <a href="#" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Instagram</a>
                                <a href="#" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">TikTok</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col items-center md:items-start gap-8">
                    {/* Italian Corporate Data - Complying with Italian Law */}
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-loose flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-center md:text-left">
                        <span>[RAGIONE_SOCIALE]</span>
                        <span className="hidden md:inline text-white/10">•</span>
                        <span>Sede Legale: [INDIRIZZO_SEDE_LEGALE]</span>
                        <span className="hidden md:inline text-white/10">•</span>
                        <span>P.IVA / C.F.: [PARTITA_IVA]</span>
                        <span className="hidden md:inline text-white/10">•</span>
                        <span>Iscr. Reg. Imprese: [REA_INFO]</span>
                        <span className="hidden md:inline text-white/10">•</span>
                        <span>Cap. Soc.: [CAPITALE_SOCIALE]</span>
                        <span className="hidden md:inline text-white/10">•</span>
                        <span>PEC: [EMAIL_PEC]</span>
                    </div>

                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                            © 2026 Musiké • Tutti i diritti riservati.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
