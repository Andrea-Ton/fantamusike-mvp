'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Loader2, ChevronRight, Lock, HelpCircle, Target, TrendingUp, CheckCircle, Rocket, Library, Radio, Music2 } from 'lucide-react';
import { selectDailyArtistAction, PromoActionType, DailyPromoState, ClaimPromoResult } from '@/app/actions/promo';
import { ArtistCategory, QUIZ_CONFIG, BET_CONFIG } from '@/config/promo';
import { Slot } from './artist-card';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

function SpringCounter({ from, to }: { from: number; to: number }) {
    const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));
    useEffect(() => { spring.set(to); }, [spring, to]);
    return <motion.span>{display}</motion.span>;
}

// --- Main Modal ---

interface DailyPromoModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamSlots: Slot[];
    initialState: DailyPromoState;
    spotifyUrls: Record<string, string | undefined>;
    releaseUrls: Record<string, string | undefined>;
    revivalUrls: Record<string, string | undefined>;
}

export default function DailyPromoModal({
    isOpen,
    onClose,
    teamSlots,
    initialState,
    spotifyUrls,
    releaseUrls,
    revivalUrls
}: DailyPromoModalProps) {
    const [viewState, setViewState] = useState<'selection' | 'actions'>('selection');
    const [activeTab, setActiveTab] = useState<PromoActionType>('quiz');
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [promoStatus, setPromoStatus] = useState(initialState.status);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [promoResult, setPromoResult] = useState<ClaimPromoResult | null>(null);
    const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);

    // Quiz State
    const [quizQuestion, setQuizQuestion] = useState<any>(initialState.quizSnapshot || null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResult, setQuizResult] = useState<ClaimPromoResult | null>(null);

    // Bet State
    const [rivalData, setRivalData] = useState<any>(initialState.betSnapshot?.rival || null);
    const [betPlaced, setBetPlaced] = useState(initialState.status.bet || false);
    const [betPrediction, setBetPrediction] = useState<'my_artist' | 'rival' | null>(initialState.betSnapshot?.wager || null);

    // Boost State
    const [boostOptions, setBoostOptions] = useState<any[] | null>(initialState.boostSnapshot?.options || null);
    const [selectedBoostId, setSelectedBoostId] = useState<string | null>(initialState.boostSnapshot?.selected_id || null);

    const initializedRef = React.useRef(false);

    // Sync with initial state on open
    useEffect(() => {
        if (isOpen) {
            if (initializedRef.current) return; // Prevent re-syncing on prop updates while open

            if (initialState.locked && initialState.selectedArtistId) {
                const slot = teamSlots.find(s => s.artist?.id === initialState.selectedArtistId);
                if (slot) {
                    setSelectedSlot(slot);
                    setPromoStatus(initialState.status);
                    setViewState('actions');
                    setQuizQuestion(initialState.quizSnapshot); // Load snapshot if available

                    // Load Bet Snapshot
                    if (initialState.betSnapshot) {
                        setRivalData(initialState.betSnapshot.rival);
                        setBetPrediction(initialState.betSnapshot.wager);
                        setBetPlaced(initialState.status.bet);
                    }

                    // Load Boost Snapshot
                    if (initialState.boostSnapshot) {
                        setBoostOptions(initialState.boostSnapshot.options);
                        setSelectedBoostId(initialState.boostSnapshot.selected_id || null);

                        // PERSISTENCE FIX: Recover redirect URL from snapshot if already selected
                        const boostSnap = initialState.boostSnapshot;
                        if (boostSnap && boostSnap.selected_id) {
                            const opt = boostSnap.options.find((o: any) => o.id === boostSnap.selected_id);
                            if (opt?.url) setPendingRedirectUrl(opt.url);
                        }
                    }

                    // Find first not-done tab
                    if (initialState.status.quiz) {
                        if (initialState.status.bet) setActiveTab('boost');
                        else setActiveTab('bet');
                    } else setActiveTab('quiz');
                    initializedRef.current = true;
                    return;
                }
            }
            // Fresh state
            setViewState('selection');
            setSelectedSlot(null);
            setPromoStatus({ quiz: false, bet: false, boost: false });
            setQuizQuestion(null);
            setSelectedOption(null);
            setQuizSubmitted(false);
            setQuizResult(null);
            setRivalData(null);
            setBetPrediction(null);
            setBetPlaced(false);
            setBoostOptions(null);
            setSelectedBoostId(null);
            setPromoResult(null); // Clear result (important for tab switching fix)
            initializedRef.current = true;
        } else {
            initializedRef.current = false; // Reset on close
        }
    }, [isOpen, initialState, teamSlots]);

    // Auto-start quiz when tab is active
    useEffect(() => {
        if (viewState === 'actions' && activeTab === 'quiz' && !quizQuestion && !promoStatus.quiz && !loadingAction && selectedSlot?.artist) {
            handleStartQuiz();
        }
        if (viewState === 'actions' && activeTab === 'bet' && !rivalData && !promoStatus.bet && !loadingAction && selectedSlot?.artist) {
            handleStartBet();
        }
        if (viewState === 'actions' && activeTab === 'boost' && !boostOptions && !promoStatus.boost && !loadingAction && selectedSlot?.artist) {
            handleStartBoost();
        }
    }, [viewState, activeTab, quizQuestion, promoStatus.quiz, selectedSlot, rivalData, boostOptions, promoStatus.bet, promoStatus.boost, loadingAction]);

    if (!isOpen) return null;

    // --- Helpers ---

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#fbbf24', '#ffffff']
        });
    };

    const handleSelectArtist = async (slot: Slot) => {
        if (loadingAction || !slot.artist) return;
        setLoadingAction(slot.artist.id);

        try {
            const result = await selectDailyArtistAction(slot.artist.id);
            if (result.success) {
                setSelectedSlot(slot);
                setViewState('actions');
                setActiveTab('quiz');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleStartQuiz = async () => {
        if (!selectedSlot?.artist) return;
        setLoadingAction('start-quiz');
        try {
            const { startQuizAction } = await import('@/app/actions/promo');
            const res = await startQuizAction(selectedSlot.artist.id);
            if (res.success && res.quiz) {
                setQuizQuestion(res.quiz);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAction(null); }
    };

    const handleAnswerQuiz = async () => {
        if (selectedOption === null || !selectedSlot?.artist) return;
        setLoadingAction('answer-quiz');
        try {
            const { answerQuizAction } = await import('@/app/actions/promo');
            const res = await answerQuizAction(selectedSlot.artist.id, selectedOption);
            if (res.success) {
                setPromoStatus(prev => ({ ...prev, quiz: true }));
                setQuizResult(res);
                setQuizSubmitted(true);
                // Trigger confetti for correct answer or lucky drop
                if (res.musiCoinsAwarded || (res.pointsAwarded && res.pointsAwarded > 1)) triggerConfetti();
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAction(null); }
    };

    const handleStartBet = async () => {
        if (!selectedSlot?.artist) return;
        setLoadingAction('start-bet');
        try {
            const { startBetAction } = await import('@/app/actions/promo');
            const res = await startBetAction(selectedSlot.artist.id);
            if (res.success && res.rival) {
                setRivalData(res.rival);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAction(null); }
    };

    const handleFinalizeBoost = async () => {
        if (!selectedSlot?.artist || loadingAction) return;
        setLoadingAction('finalize-boost');
        try {
            const { finalizeBoostAction } = await import('@/app/actions/promo');
            const res = await finalizeBoostAction(selectedSlot.artist.id);
            if (res.success) {
                setPromoStatus(prev => ({ ...prev, boost: true }));
                closeResultPoup(); // This handles redirect/close
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(null);
        }
    };

    const handlePlaceBet = (prediction: 'my_artist' | 'rival') => {
        setBetPrediction(prediction);
    };

    const handleConfirmBet = async () => {
        if (!betPrediction || !selectedSlot?.artist || loadingAction) return;

        setLoadingAction('place-bet');
        try {
            const { placeBetAction } = await import('@/app/actions/promo');
            const res = await placeBetAction(selectedSlot.artist.id, betPrediction);
            if (res.success) {
                setPromoStatus(prev => ({ ...prev, bet: true }));
                setBetPlaced(true);
                triggerConfetti(); // Visual feedback for successful bet placement
            } else if (res.message === 'MusiCoins insufficient') {
                alert("Non hai abbastanza MusiCoins per piazzare questa scommessa!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleStartBoost = async () => {
        if (!selectedSlot?.artist) return;
        setLoadingAction('start-boost');
        try {
            const { startBoostAction } = await import('@/app/actions/promo');
            const res = await startBoostAction(selectedSlot.artist.id);
            if (res.success && res.options) {
                setBoostOptions(res.options);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAction(null); }
    };

    const handleClaim = async (specificOptionId?: string) => {
        if (!selectedSlot?.artist || loadingAction || promoStatus.boost) return;

        setLoadingAction('boost');
        const artistId = selectedSlot.artist.id;

        try {
            const boostId = specificOptionId || selectedBoostId;
            if (!boostId) return;

            const { claimBoostAction } = await import('@/app/actions/promo');
            const result = await claimBoostAction(artistId, boostId);

            if (result.success) {
                setPromoResult(result);
                if (result.musiCoinsAwarded || result.pointsAwarded) {
                    triggerConfetti();
                }
                // Redirection URL from Boost result
                if (result.url) setPendingRedirectUrl(result.url);
            }
        } catch (e) {
            console.error("Boost Claim Error:", e);
        } finally {
            setLoadingAction(null);
        }
    };

    const smartRedirect = (url: string) => {
        if (!url) return;
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

        // Try to convert to deep link for standalone mode (PWA)
        if (isStandalone && url.includes('spotify.com')) {
            try {
                // url: https://open.spotify.com/artist/XXXXXXXXXXXXXXXX
                const cleanPath = url.split('spotify.com/')[1]?.split('?')[0];
                const parts = cleanPath?.split('/').filter(Boolean);
                if (parts && parts.length >= 2) {
                    const deepLink = `spotify:${parts[0]}:${parts[1]}`;
                    window.location.href = deepLink;
                    // Provide a small fallback window just in case deep link fails to trigger
                    setTimeout(() => {
                        window.open(url, '_blank');
                    }, 500);
                    return;
                }
            } catch (e) {
                console.error("Deep link error:", e);
            }
        }
        window.open(url, '_blank');
    };

    const closeResultPoup = (manuallyClosed: boolean = false) => {
        setPromoResult(null);
        if (pendingRedirectUrl && manuallyClosed) {
            smartRedirect(pendingRedirectUrl);
            setPendingRedirectUrl(null);
        }
    };

    // --- Render ---

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <style jsx global>{`
                @keyframes spin3d {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                .animate-spin-3d {
                    animation: spin3d 2s linear infinite;
                    transform-style: preserve-3d;
                }
            `}</style>
            <div className={`w-full max-w-lg bg-[#0f0f13] border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col transition-all max-h-[95vh] overflow-y-auto ${viewState === 'actions' ? 'md:aspect-auto md:min-h-[600px]' : 'min-h-[400px]'}`}>

                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white z-20">
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-center text-white mb-2">Promozione Quotidiana</h3>

                {viewState === 'selection' && (
                    <div className="flex-1 flex flex-col pt-4">
                        <p className="text-gray-400 text-center text-sm mb-6">Seleziona l'artista da promuovere oggi.<br /><span className="text-yellow-500 font-bold">Attenzione:</span> La scelta è definitiva per oggi!</p>
                        <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[60vh] pb-4">
                            {teamSlots.map(slot => slot.artist && (
                                <button
                                    key={slot.artist.id}
                                    onClick={() => handleSelectArtist(slot)}
                                    disabled={!!loadingAction}
                                    className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors"></div>
                                    <div className="relative">
                                        <img src={slot.artist.image} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt={slot.artist.name} />
                                        {loadingAction === slot.artist.id && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                                <Loader2 size={18} className="text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors">{slot.artist.name}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{slot.type} Artist</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-black transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {viewState === 'actions' && selectedSlot?.artist && (
                    <div className="flex-1 flex flex-col pt-2 animate-in slide-in-from-right-10 duration-200">
                        {/* Header - Compact on mobile */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md shadow-inner">
                            <div className="relative">
                                <img src={selectedSlot.artist.image} className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border border-white/10" alt={selectedSlot.artist.name} />
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 sm:p-1 border-2 border-[#0f0f13]">
                                    <Lock size={6} className="text-black sm:hidden" />
                                    <Lock size={8} className="text-black hidden sm:block" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight uppercase italic truncate">{selectedSlot.artist.name}</h2>
                                <div className="flex items-center gap-2 text-[8px] sm:text-[10px] text-gray-400 mt-0.5 sm:mt-1 uppercase tracking-widest font-bold">
                                    Promozione Giornaliera
                                </div>
                            </div>
                        </div>

                        {/* Tab Selector (Pills) - Smaller on mobile */}
                        <div className="flex gap-1 p-0.5 sm:p-1 bg-black/40 rounded-xl mb-4 sm:mb-6 relative shrink-0">
                            <TabButton
                                active={activeTab === 'quiz'}
                                done={promoStatus.quiz}
                                onClick={() => { setActiveTab('quiz'); setPromoResult(null); }}
                                icon={HelpCircle}
                                label="MusiQuiz"
                            />
                            <TabButton
                                active={activeTab === 'bet'}
                                done={promoStatus.bet}
                                onClick={() => { setActiveTab('bet'); setPromoResult(null); }}
                                icon={Target}
                                label="MusiBet"
                            />
                            <TabButton
                                active={activeTab === 'boost'}
                                done={promoStatus.boost}
                                onClick={() => { setActiveTab('boost'); setPromoResult(null); }}
                                icon={TrendingUp}
                                label="MusiBoost"
                            />
                        </div>

                        {/* Action Container - Compact padding on mobile */}
                        <div className="flex-1 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 p-4 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center w-full h-full"
                                >
                                    {/* --- QUIZ UI --- */}
                                    {activeTab === 'quiz' && (
                                        <div className="w-full flex-1 flex flex-col">
                                            <div className="flex items-center justify-center gap-2 text-purple-400 mb-4">
                                                <HelpCircle size={24} /> <span className="font-bold tracking-widest text-sm">MUSIQUIZ</span>
                                            </div>

                                            {promoStatus.quiz && !quizSubmitted ? (
                                                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 py-4">
                                                    <div className="relative mb-4 sm:mb-6">
                                                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/10 border-4 border-green-500/30 flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                                            <CheckCircle size={40} className="sm:hidden animate-in zoom-in duration-500 delay-150" />
                                                            <CheckCircle size={48} className="hidden sm:block animate-in zoom-in duration-500 delay-150" />
                                                        </div>
                                                    </div>
                                                    <h4 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Quiz Completato!</h4>
                                                    <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-sm font-medium uppercase tracking-widest">Ottimo lavoro!</p>
                                                    <div className="mt-4 sm:mt-8 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        Torna domani per una nuova sfida
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {!quizQuestion ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center pb-4 border-white/5">
                                                            <Loader2 size={32} className="text-purple-500 animate-spin mb-4" />
                                                            <p className="text-gray-400 text-sm animate-pulse">Generazione domanda...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full flex-1 flex flex-col text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <p className="text-base sm:text-lg text-white font-medium mb-4 sm:mb-6 text-center leading-relaxed">{quizQuestion.question}</p>

                                                            <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-y-auto max-h-[30vh]">
                                                                {quizQuestion.options.map((opt: string, idx: number) => {
                                                                    const isSelected = selectedOption === idx;
                                                                    const isCorrect = quizResult?.correctAnswerIndex === idx;
                                                                    const showResult = quizSubmitted;

                                                                    let statusClass = 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:border-white/20';
                                                                    if (isSelected) statusClass = 'bg-purple-500/10 border-purple-500 text-white shadow-purple-500/10';

                                                                    if (showResult) {
                                                                        if (isCorrect) statusClass = 'bg-green-500/10 border-green-500 text-white shadow-green-500/10';
                                                                        else if (isSelected) statusClass = 'bg-red-500/10 border-red-500 text-white shadow-red-500/10';
                                                                        else statusClass = 'opacity-30 border-white/5 text-gray-600 grayscale';
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => setSelectedOption(idx)}
                                                                            disabled={quizSubmitted}
                                                                            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-black transition-all relative flex items-center justify-between group backdrop-blur-sm ${statusClass} ${isSelected && !showResult ? 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''}`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors ${isSelected ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                                                                    {String.fromCharCode(65 + idx)}
                                                                                </div>
                                                                                <span className="uppercase tracking-tight truncate max-w-[200px]">{opt}</span>
                                                                            </div>
                                                                            {showResult && (
                                                                                <div className="flex items-center gap-2">
                                                                                    {isCorrect && (
                                                                                        <div className="flex items-center gap-1 bg-green-500 text-black px-2 py-0.5 sm:py-1 rounded-lg animate-in zoom-in font-black text-[9px] sm:text-[10px] shadow-lg shadow-green-500/20 uppercase">
                                                                                            <CheckCircle size={8} /> +{QUIZ_CONFIG.POINTS_CORRECT} PTS
                                                                                        </div>
                                                                                    )}
                                                                                    {isSelected && !isCorrect && (
                                                                                        <div className="flex items-center gap-1 bg-red-500/20 text-red-500 px-2 py-0.5 sm:py-1 rounded-lg animate-in zoom-in font-black text-[9px] sm:text-[10px] uppercase border border-red-500/30">
                                                                                            +{QUIZ_CONFIG.POINTS_INCORRECT} PTS
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {!quizSubmitted && !promoStatus.quiz && (
                                                                <button
                                                                    onClick={handleAnswerQuiz}
                                                                    disabled={selectedOption === null || loadingAction === 'answer-quiz'}
                                                                    className="w-full group py-3 sm:py-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl sm:rounded-2xl font-bold text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-between px-4 sm:px-6 mt-auto shrink-0"
                                                                >
                                                                    {loadingAction === 'answer-quiz' ? (
                                                                        <div className="w-full flex justify-center"><Loader2 className="animate-spin" size={24} /></div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex flex-col items-start gap-0 text-left">
                                                                                <span className="text-xs sm:text-base font-black uppercase tracking-tight">Rispondi</span>
                                                                                <span className="text-[8px] sm:text-[10px] opacity-70 font-medium">Conferma scelta</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 bg-black/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
                                                                                <span className="text-[10px] sm:text-xs font-bold">+{QUIZ_CONFIG.POINTS_CORRECT}</span>
                                                                                <span className="text-[8px] sm:text-[10px] font-black opacity-80 uppercase">PTS</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* --- MUSIBET UI --- */}
                                    {activeTab === 'bet' && (
                                        <div className="w-full flex-1 flex flex-col">
                                            <div className="flex items-center justify-center gap-2 text-orange-400 mb-4">
                                                <Target size={24} /> <span className="font-bold tracking-widest text-sm">MUSIBET</span>
                                            </div>

                                            {promoStatus.bet && betPrediction ? (
                                                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 py-4">
                                                    <div className="relative mb-4 sm:mb-6">
                                                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/10 border-4 border-green-500/30 flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                                            <CheckCircle size={40} className="sm:hidden animate-in zoom-in duration-500 delay-150" />
                                                            <CheckCircle size={48} className="hidden sm:block animate-in zoom-in duration-500 delay-150" />
                                                        </div>
                                                    </div>
                                                    <h4 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Scommessa Piazzata!</h4>
                                                    <p className="text-gray-400 mt-1 sm:mt-2 text-center text-[10px] sm:text-sm font-medium uppercase tracking-widest max-w-[200px]">
                                                        Hai puntato su <span className="text-white">{betPrediction === 'my_artist' ? selectedSlot.artist.name : rivalData?.name}</span>
                                                    </p>
                                                    <div className="mt-4 sm:mt-8 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        Risultati disponibili domani
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {!rivalData ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center pb-8 border-white/5">
                                                            <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                                                            <p className="text-gray-400 text-sm animate-pulse">Ricerca rivale...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <p className="text-base sm:text-lg text-white font-medium mb-4 sm:mb-6 text-center leading-relaxed">Chi farà più punti oggi?</p>

                                                            <div className="flex flex-col gap-3 mb-4 sm:mb-8 w-full">
                                                                {/* Left: My Artist */}
                                                                <div className={`w-full flex flex-row items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer hover:bg-white/5 gap-4 ${betPrediction === 'my_artist' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}
                                                                    onClick={() => handlePlaceBet('my_artist')}>
                                                                    <img src={selectedSlot.artist.image} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 shadow-lg" alt="My Artist" />
                                                                    <div className="flex flex-col items-start min-w-0">
                                                                        <span className="font-black text-xs sm:text-base text-white line-clamp-1 uppercase tracking-tight">{selectedSlot.artist.name}</span>
                                                                        <span className="text-[8px] sm:text-xs text-orange-500 font-black uppercase tracking-widest">TU</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4 w-full">
                                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                                                    <div className="text-sm sm:text-2xl font-black text-orange-500 italic shrink-0 tracking-tighter">VS</div>
                                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                                                </div>

                                                                {/* Right: Rival */}
                                                                <div className={`w-full flex flex-row items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer hover:bg-white/5 gap-4 ${betPrediction === 'rival' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}
                                                                    onClick={() => handlePlaceBet('rival')}>
                                                                    <img src={rivalData.image} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 shadow-lg" alt="Rival" />
                                                                    <div className="flex flex-col items-start min-w-0">
                                                                        <span className="font-black text-xs sm:text-base text-white line-clamp-1 uppercase tracking-tight">{rivalData.name}</span>
                                                                        <span className="text-[8px] sm:text-xs text-gray-500 font-black uppercase tracking-widest">RIVALE</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-auto flex flex-col items-center gap-4 shrink-0">
                                                                {!betPrediction ? (
                                                                    <div className="text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                                        <p>Scegli il vincitore</p>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={handleConfirmBet}
                                                                        disabled={!!loadingAction}
                                                                        className="w-full group py-3 sm:py-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl sm:rounded-2xl font-bold text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-between px-4 sm:px-6"
                                                                    >
                                                                        {loadingAction === 'place-bet' ? (
                                                                            <div className="w-full flex justify-center"><Loader2 className="animate-spin" size={24} /></div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="flex flex-col items-start gap-0">
                                                                                    <span className="text-xs sm:text-base font-black uppercase tracking-tight">Scommetti</span>
                                                                                </div>
                                                                                <div className="flex ml-3 items-center gap-1 bg-black/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
                                                                                    <span className="text-[10px] sm:text-xs font-bold">-{BET_CONFIG.ENTRY_FEE}</span>
                                                                                    <span className="text-[8px] sm:text-[10px] font-black opacity-80 uppercase">COINS</span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* --- MUSIBOOST UI --- */}
                                    {activeTab === 'boost' && (
                                        <div className="w-full flex-1 flex flex-col">
                                            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-4">
                                                <TrendingUp size={24} /> <span className="font-bold tracking-widest text-sm">MUSIBOOST</span>
                                            </div>

                                            {promoStatus.boost ? (
                                                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 py-4">
                                                    <div className="relative mb-4 sm:mb-6">
                                                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/10 border-4 border-green-500/30 flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                                            <CheckCircle size={40} className="sm:hidden animate-in zoom-in duration-500 delay-150" />
                                                            <CheckCircle size={48} className="hidden sm:block animate-in zoom-in duration-500 delay-150" />
                                                        </div>
                                                    </div>
                                                    <h4 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Boost Completato!</h4>
                                                    <p className="text-gray-400 mt-1 sm:mt-2 text-center text-xs sm:text-sm font-medium uppercase tracking-widest max-w-[200px]">
                                                        Hai supportato <span className="text-white">{selectedSlot.artist.name}</span>
                                                    </p>
                                                    <div className="mt-4 sm:mt-8 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        Torna domani per un nuovo boost
                                                    </div>
                                                </div>
                                            ) : (promoResult || initialState.boostSnapshot?.reward) ? (
                                                <div className="flex-1 flex flex-col items-center justify-center py-4 animate-in zoom-in duration-300">
                                                    {/* Reward Content Inspired by PromoModal */}
                                                    {(promoResult?.musiCoinsAwarded || initialState.boostSnapshot?.reward?.type === 'coins') ? (
                                                        <>
                                                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4 sm:mb-6">
                                                                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                                                <div className="relative w-full h-full animate-spin-3d">
                                                                    <div className="w-full h-full rounded-full border-4 border-yellow-300 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                                                                        <img
                                                                            src="/musike_logo_pict.png"
                                                                            alt="MusiCoin"
                                                                            className="w-1/2 h-1/2 object-contain drop-shadow-md brightness-[0.8] contrast-[1.2]"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 mb-1 sm:mb-2 text-center drop-shadow-sm uppercase italic">
                                                                MusiCoins Found!
                                                            </h3>
                                                            <p className="text-gray-400 mb-6 sm:mb-8 text-center text-xs sm:text-sm uppercase font-bold tracking-widest">
                                                                Hai trovato <span className="text-yellow-400 font-black text-base sm:text-lg">
                                                                    +<SpringCounter from={0} to={promoResult?.musiCoinsAwarded || initialState.boostSnapshot?.reward?.amount || 0} /> MusiCoins
                                                                </span>
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4 sm:mb-6 flex items-center justify-center">
                                                                <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] border-4 border-white/10 animate-bounce transition-all duration-1000">
                                                                    <Trophy size={32} className="sm:hidden text-white drop-shadow-lg" />
                                                                    <Trophy size={40} className="hidden sm:block text-white drop-shadow-lg" />
                                                                </div>
                                                            </div>
                                                            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2 text-center uppercase italic tracking-tighter">
                                                                Punti Raccolti!
                                                            </h3>
                                                            <p className="text-gray-400 mb-6 sm:mb-8 text-center text-[10px] sm:text-sm uppercase font-bold tracking-widest">
                                                                Hai guadagnato <span className="text-purple-400 font-black text-base sm:text-xl">
                                                                    +<SpringCounter from={0} to={promoResult?.pointsAwarded || initialState.boostSnapshot?.reward?.amount || 0} /> PTS
                                                                </span>
                                                            </p>
                                                        </>
                                                    )}

                                                    <a
                                                        href={pendingRedirectUrl || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => {
                                                            if (!pendingRedirectUrl) e.preventDefault();
                                                            handleFinalizeBoost();
                                                        }}
                                                        className="px-6 sm:px-8 py-3 bg-white text-black font-black uppercase italic tracking-tighter rounded-xl sm:rounded-2xl hover:scale-105 transition-transform w-full flex items-center justify-center gap-2 shrink-0 shadow-lg"
                                                    >
                                                        {loadingAction === 'finalize-boost' ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <span>Vai su</span>
                                                                <img src="/Spotify_Full_Logo_Black.png" alt="Spotify" className="h-3.5 sm:h-4 object-contain" />
                                                            </>
                                                        )}
                                                    </a>
                                                </div>
                                            ) : (
                                                <>
                                                    {!boostOptions ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center pb-8 border-white/5">
                                                            <Loader2 size={32} className="text-cyan-500 animate-spin mb-4" />
                                                            <p className="text-gray-400 text-sm animate-pulse">Caricamento opzioni...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <p className="text-base sm:text-lg text-white font-medium mb-4 sm:mb-6 text-center leading-relaxed">
                                                                Scegli l'azione:
                                                            </p>

                                                            <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-4 sm:mb-8 w-full overflow-y-auto max-h-[40vh]">
                                                                {boostOptions.map((opt: any) => {
                                                                    // Map icon string to component
                                                                    const IconComp = {
                                                                        'Rocket': Rocket,
                                                                        'Music2': Music2,
                                                                        'TrendingUp': TrendingUp,
                                                                        'Trophy': Trophy,
                                                                        'Library': Library,
                                                                        'Radio': Radio
                                                                    }[opt.icon as string] || TrendingUp;

                                                                    return (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => { setSelectedBoostId(opt.id); handleClaim(opt.id); }}
                                                                            disabled={!!loadingAction}
                                                                            className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left flex flex-row items-center gap-3 sm:gap-4 group border-white/10 hover:border-cyan-500/50 bg-white/5 hover:bg-cyan-500/5 shadow-inner overflow-hidden shadow-black/20`}
                                                                        >
                                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/10 transition-colors"></div>
                                                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform border border-cyan-500/20 shrink-0`}>
                                                                                <IconComp size={20} className="sm:hidden" />
                                                                                <IconComp size={24} className="hidden sm:block" />
                                                                            </div>
                                                                            <div className="flex flex-col items-start min-w-0">
                                                                                <span className={`font-black text-xs sm:text-sm text-white uppercase tracking-tight line-clamp-1`}>{opt.label}</span>
                                                                                <span className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none truncate">{opt.subLabel}</span>
                                                                            </div>

                                                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                                <ChevronRight size={14} className="text-cyan-500" />
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="mt-auto text-center text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                                Premio Garantito
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                )}



            </div>
        </div>
    );
}

function TabButton({ active, done, onClick, icon: Icon, label }: { active: boolean; done: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 rounded-lg sm:rounded-xl flex flex-col items-center gap-1 sm:gap-1.5 transition-all relative ${active ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-gray-500 hover:text-gray-300'
                }`}
        >
            {done ? (
                <div className="bg-green-500 rounded-full p-0.5">
                    <CheckCircle size={12} className="sm:hidden text-black" />
                    <CheckCircle size={14} className="hidden sm:block text-black" />
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <Icon size={16} className={`sm:hidden ${active ? 'scale-110 text-white' : ''} transition-transform`} />
                    <Icon size={18} className={`hidden sm:block ${active ? 'scale-110 text-white' : ''} transition-transform`} />
                </div>
            )}
            <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest truncate w-full text-center ${active ? 'opacity-100' : 'opacity-60'}`}>
                {label}
            </span>
            {active && (
                <motion.div layoutId="tab-underline" className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            )}
        </button>
    );
}
