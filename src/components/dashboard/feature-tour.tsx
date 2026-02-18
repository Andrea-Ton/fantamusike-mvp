'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';
import SpotlightOverlay from './spotlight-overlay';
import { completeTutorialAction } from '@/app/actions/tour';

interface Step {
    targetId: string | null;
    title: string;
    description: string;
}

const STEPS: Step[] = [
    {
        targetId: 'tour-total-score',
        title: 'Punteggio Totale',
        description: 'Questo è il punteggio della tua squadra, viene aggiornato ogni notte.'
    },
    {
        targetId: 'tour-promo-button',
        title: 'Promuovi Artista',
        description: 'Completa ogni giorno le missioni promo per un artista a tua scelta per ottenere i punti promo.'
    },
    {
        targetId: 'tour-share-button',
        title: 'Condividi Label',
        description: 'Condividi i tuoi traguardi sui social per ricevere MusiCoin extra.'
    },
    {
        targetId: 'tour-musirewards',
        title: 'MusiRewards',
        description: 'Accedi ogni giorno e fai attività nel FantaMusiké per ottenere MusiCoin.'
    },
    {
        targetId: 'tour-talent-scout', // Logic in component will choose mobile/desktop
        title: 'Talent Scout',
        description: 'Nella sezione Talent Scout puoi cambiare la tua squadra di artisti.'
    }
];

export default function FeatureTour({ onComplete }: { onComplete?: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isReady, setIsReady] = useState(false);

    const step = STEPS[currentStep];

    // 1. Wait for first element to be ready in DOM
    useEffect(() => {
        if (!isVisible || isReady) return;

        const checkElement = () => {
            const firstStep = STEPS[0];
            if (firstStep.targetId && document.getElementById(firstStep.targetId)) {
                setIsReady(true);
                return true;
            }
            return false;
        };

        if (checkElement()) return;

        const interval = setInterval(() => {
            if (checkElement()) clearInterval(interval);
        }, 100);

        return () => clearInterval(interval);
    }, [isVisible, isReady]);

    // 2. Manage Scroll Lock
    useEffect(() => {
        if (isVisible && isReady) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; // Extra safety for mobile
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isVisible, isReady]);

    // 3. Scroll to target element
    useEffect(() => {
        if (!isVisible || !isReady) return;

        let effectiveTargetId = step.targetId;
        if (effectiveTargetId === 'tour-talent-scout') {
            effectiveTargetId = window.innerWidth < 768 ? 'tour-talent-scout-mobile' : 'tour-talent-scout-desktop';
        }

        if (effectiveTargetId) {
            const element = document.getElementById(effectiveTargetId);
            if (element) {
                // Scroll to element but keep some space for the bottom bar
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - (window.innerHeight / 3);

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentStep, isVisible, step.targetId]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFinish = async () => {
        setIsVisible(false);
        await completeTutorialAction();
        if (onComplete) onComplete();
    };

    const handleSkip = async () => {
        setIsVisible(false);
        await completeTutorialAction();
        if (onComplete) onComplete();
    };

    if (!isVisible || !isReady) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <SpotlightOverlay targetId={step.targetId} />

            <div className="fixed inset-x-0 bottom-0 z-[110] p-4 flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        // mb-20 to stay above common bottom nav height on mobile
                        className="w-full max-w-[500px] bg-[#0a0a0f]/90 border border-white/10 rounded-[2.5rem] p-6 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] pointer-events-auto backdrop-blur-2xl mb-20 md:mb-6"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Tutorial • {currentStep + 1}/{STEPS.length}</span>
                            </div>
                            <button
                                onClick={handleSkip}
                                className="text-[10px] font-black text-white/70 hover:text-white uppercase tracking-widest transition-all flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
                            >
                                Salta <X size={12} className="text-purple-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-1.5 mb-6">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                                {step.title}
                            </h3>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                {step.description}
                            </p>
                        </div>

                        {/* Footer / Navigation */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 0}
                                    className={`p-3 rounded-2xl border transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="hidden sm:flex items-center gap-1 ml-2">
                                    {STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-4 bg-purple-500' : 'w-1 bg-white/10'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-tighter italic hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] min-w-[140px]"
                            >
                                {currentStep === STEPS.length - 1 ? (
                                    <>
                                        <span>Fine</span>
                                        <Check size={18} />
                                    </>
                                ) : (
                                    <>
                                        <span>Avanti</span>
                                        <ChevronRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div >
    );
}
