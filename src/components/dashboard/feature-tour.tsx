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
        description: 'Questo è il punteggio della tua squadra, viene aggiornato ogni notte. Si resetta ogni inizio settimana.'
    },
    {
        targetId: 'tour-promo-button',
        title: 'Promuovi Artista',
        description: 'Completa ogni giorno le missioni promo per ottenere i punti Promo e scalare le classifiche!'
    },
    {
        targetId: 'tour-share-button',
        title: 'Condividi Label',
        description: 'Condividi i tuoi traguardi sui social per ricevere MusiCoin extra e tagga quell’amico che ha fatto sicuramente peggio di te!'
    },
    {
        targetId: 'tour-musirewards-mobile,tour-musirewards-desktop',
        title: 'MusiRewards',
        description: 'Accedi ogni giorno e fai attività nel FantaMusiké per ottenere MusiCoin.'
    },
    {
        targetId: 'nav-draft-mobile,nav-draft-desktop', // Support both mobile and desktop navs
        title: 'Talentscout',
        description: 'Qui puoi cambiare la tua squadra, ricordati che la nuova squadra avrà effetto dalla prossima settimana di FantaMusiké.'
    }
];

export default function FeatureTour({ onComplete }: { onComplete?: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [cardPosition, setCardPosition] = useState<'top' | 'bottom'>('bottom');
    const [isMobile, setIsMobile] = useState(false);

    const step = STEPS[currentStep];

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        if (isVisible) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; // Extra safety for mobile
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }

        return () => {
            window.removeEventListener('resize', checkMobile);
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible || !step.targetId) return;

        // Calculate card position immediately for smooth transitions
        const ids = step.targetId.split(',');
        let targetElement: HTMLElement | null = null;
        for (const id of ids) {
            const el = document.getElementById(id.trim());
            if (el && el.getBoundingClientRect().width > 0) {
                targetElement = el;
                break;
            }
        }

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const vh = window.innerHeight;

            if (isMobile) {
                setCardPosition(currentStep <= 2 ? 'bottom' : 'top');
            } else {
                setCardPosition(rect.top > vh * 0.5 ? 'top' : 'bottom');
            }
        }

        // Handle scrolling with a small delay for layout stability
        const timer = setTimeout(() => {
            if (!targetElement) return;

            // Check if element is fixed (like mobile rewards)
            const style = window.getComputedStyle(targetElement);
            if (style.position === 'fixed') return;

            const rect = targetElement.getBoundingClientRect();
            const vh = window.innerHeight;
            const elementPosition = rect.top + window.pageYOffset;

            let offsetPercentage = isMobile ? 0.15 : 0.33;
            if (isMobile && currentStep === 0) {
                offsetPercentage = 0.05;
            }

            const offsetPosition = elementPosition - (vh * offsetPercentage);

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [currentStep, isVisible, step.targetId, isMobile]);

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

    if (!isVisible) return null;

    return (
        <>
            <SpotlightOverlay targetId={step.targetId} />

            <div className={`fixed inset-x-0 ${cardPosition === 'top' ? 'top-0 pt-24 md:pt-10' : 'bottom-0 pb-20 md:pb-6'} z-[110] p-4 flex justify-center pointer-events-none transition-all duration-500`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: cardPosition === 'top' ? -100 : 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: cardPosition === 'top' ? -100 : 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-full max-w-[500px] bg-[#0a0a0f]/95 border border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto backdrop-blur-2xl"
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
                                        <span>Ho Capito!</span>
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
        </>
    );
}
