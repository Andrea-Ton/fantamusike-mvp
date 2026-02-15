
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const choice = localStorage.getItem('cookie-choice');
        if (!choice) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else if (choice === 'accepted') {
            // Apply existing consent on mount
            updateGTMConsent(true);
        }

        // Listen for manual trigger
        const handleShow = () => setIsVisible(true);
        window.addEventListener('show-cookie-banner', handleShow);
        return () => window.removeEventListener('show-cookie-banner', handleShow);
    }, []);

    const updateGTMConsent = (accepted: boolean) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'ad_storage': accepted ? 'granted' : 'denied',
                'ad_user_data': accepted ? 'granted' : 'denied',
                'ad_personalization': accepted ? 'granted' : 'denied',
                'analytics_storage': accepted ? 'granted' : 'denied'
            });
        }
    };

    const handleAccept = () => {
        localStorage.setItem('cookie-choice', 'accepted');
        updateGTMConsent(true);
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-choice', 'declined');
        updateGTMConsent(false);
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:max-w-md z-[200]"
                >
                    <div className="bg-[#0f0f13]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-colors duration-500" />

                        <div className="relative z-10">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-inner">
                                    <Cookie className="text-purple-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">Biscotti? 🍪</h3>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-1">
                                        Utilizziamo i cookie per migliorare la tua esperienza di scouting.
                                        Puoi accettarli tutti o scegliere quali mantenere.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="text-gray-600 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-xl"
                                >
                                    Accetta Tutto
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Solo Necessari
                                </button>
                            </div>

                            <div className="mt-4 text-center">
                                <Link href="/cookie-policy" className="text-[10px] font-black text-gray-600 hover:text-purple-400 uppercase tracking-widest transition-colors underline underline-offset-4 decoration-white/5">
                                    Leggi la Cookie Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
