'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Loader2, ChevronRight, Lock, HelpCircle, Target, TrendingUp, CheckCircle, Rocket, Library, Radio, Music2 } from 'lucide-react';
import { selectDailyArtistAction, PromoActionType, DailyPromoState, ClaimPromoResult } from '@/app/actions/promo';
import { ArtistCategory, QUIZ_CONFIG } from '@/config/promo';
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

    const handlePlaceBet = async (prediction: 'my_artist' | 'rival') => {
        if (!selectedSlot?.artist) return;
        setLoadingAction('place-bet');
        try {
            const { placeBetAction } = await import('@/app/actions/promo');
            const res = await placeBetAction(selectedSlot.artist.id, prediction);
            if (res.success) {
                setPromoStatus(prev => ({ ...prev, bet: true }));
                setBetPlaced(true);
                setBetPrediction(prediction);
                // No confetti for bet since result is deferred, unless we add visual feedback for "Bet Placed"
            }
        } catch (e) { console.error(e); }
        finally { setLoadingAction(null); }
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

    const closeResultPoup = () => {
        setPromoResult(null);
        if (pendingRedirectUrl) {
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
            <div className={`w-full max-w-lg bg-[#1a1a24] border border-white/10 rounded-3xl p-6 relative shadow-2xl flex flex-col transition-all max-h-[90vh] overflow-y-auto ${viewState === 'actions' ? 'md:aspect-auto md:min-h-[550px]' : 'min-h-[400px]'}`}>

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
                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 transition-all text-left group"
                                >
                                    <div className="relative">
                                        <img src={slot.artist.image} className="w-12 h-12 rounded-lg object-cover" alt={slot.artist.name} />
                                        {loadingAction === slot.artist.id && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                                <Loader2 size={16} className="text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors">{slot.artist.name}</div>
                                        <div className="text-xs text-gray-400">{slot.type} Artist</div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:text-purple-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {viewState === 'actions' && selectedSlot?.artist && (
                    <div className="flex-1 flex flex-col pt-2 animate-in slide-in-from-right-10 duration-200">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <img src={selectedSlot.artist.image} className="w-12 h-12 rounded-xl" alt={selectedSlot.artist.name} />
                            <div>
                                <h2 className="text-lg font-bold text-white leading-tight">{selectedSlot.artist.name}</h2>
                                <div className="flex items-center gap-2 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                                    <Lock size={10} /> Scelta Bloccata
                                </div>
                            </div>
                        </div>

                        {/* Tab Selector (Pills) */}
                        <div className="flex gap-1 p-1 bg-black/40 rounded-xl mb-6 relative shrink-0">
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

                        {/* Action Container */}
                        <div className="flex-1 bg-white/5 rounded-3xl border border-white/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
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
                                                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                                                        <CheckCircle size={40} />
                                                    </div>
                                                    <h4 className="text-xl font-bold text-white">Quiz Completato!</h4>
                                                    <p className="text-gray-400 mt-2">Torna domani per un nuovo quiz.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {!quizQuestion ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center pb-8 border-white/5">
                                                            <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
                                                            <p className="text-gray-400 animate-pulse">Generazione domanda in corso...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full flex-1 flex flex-col text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <p className="text-lg text-white font-medium mb-6 text-center leading-relaxed">{quizQuestion.question}</p>

                                                            <div className="grid grid-cols-1 gap-3 mb-6">
                                                                {quizQuestion.options.map((opt: string, idx: number) => {
                                                                    const isSelected = selectedOption === idx;
                                                                    const isCorrect = quizResult?.correctAnswerIndex === idx;
                                                                    const showResult = quizSubmitted;

                                                                    let statusClass = 'border-white/10 text-gray-300 hover:bg-white/10';
                                                                    if (isSelected) statusClass = 'bg-purple-500/20 border-purple-500 text-white shadow-purple-500/10';

                                                                    if (showResult) {
                                                                        if (isCorrect) statusClass = 'bg-green-500/20 border-green-500 text-white shadow-green-500/10';
                                                                        else if (isSelected) statusClass = 'bg-red-500/20 border-red-500 text-white shadow-red-500/10';
                                                                        else statusClass = 'opacity-50 border-transparent';
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => setSelectedOption(idx)}
                                                                            disabled={quizSubmitted}
                                                                            className={`p-4 rounded-xl border text-sm font-medium transition-all relative flex items-center justify-between group ${statusClass} ${isSelected && !showResult ? 'shadow-lg' : ''}`}
                                                                        >
                                                                            <span>{opt}</span>
                                                                            {showResult && (
                                                                                <div className="flex items-center gap-2">
                                                                                    {isCorrect && (
                                                                                        <span className="text-xs font-bold bg-green-500 text-black px-2 py-0.5 rounded-full animate-in zoom-in">
                                                                                            +{QUIZ_CONFIG.POINTS_CORRECT} pts
                                                                                        </span>
                                                                                    )}
                                                                                    {isSelected && !isCorrect && (
                                                                                        <span className="text-xs font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full animate-in zoom-in">
                                                                                            +{QUIZ_CONFIG.POINTS_INCORRECT} pts
                                                                                        </span>
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
                                                                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto shadow-xl"
                                                                >
                                                                    {loadingAction === 'answer-quiz' ? <Loader2 className="animate-spin mx-auto" /> : 'Conferma Risposta'}
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
                                                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                                                        <CheckCircle size={40} />
                                                    </div>
                                                    <h4 className="text-xl font-bold text-white">Scommessa Piazzata!</h4>
                                                    <p className="text-gray-400 mt-2 text-sm">
                                                        Hai puntato su <span className="text-white font-bold">{betPrediction === 'my_artist' ? selectedSlot.artist.name : rivalData?.name}</span>.
                                                    </p>
                                                    <p className="text-gray-500 text-xs mt-4">Torna domani per vedere se hai vinto!</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {!rivalData ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center pb-8 border-white/5">
                                                            <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
                                                            <p className="text-gray-400 animate-pulse">Ricerca rivale in corso...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <p className="text-lg text-white font-medium mb-6 text-center leading-relaxed">Chi farà più punti oggi?</p>

                                                            <div className="flex items-center justify-between gap-4 mb-8">
                                                                {/* Left: My Artist */}
                                                                <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer hover:bg-white/5 ${betPrediction === 'my_artist' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}
                                                                    onClick={() => handlePlaceBet('my_artist')}>
                                                                    <img src={selectedSlot.artist.image} className="w-16 h-16 rounded-full mb-2 object-cover" alt="My Artist" />
                                                                    <span className="font-bold text-sm text-white text-center line-clamp-1">{selectedSlot.artist.name}</span>
                                                                    <span className="text-xs text-gray-500">Il tuo Artista</span>
                                                                </div>

                                                                <div className="text-2xl font-black text-orange-500 italic">VS</div>

                                                                {/* Right: Rival */}
                                                                <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer hover:bg-white/5 ${betPrediction === 'rival' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}
                                                                    onClick={() => handlePlaceBet('rival')}>
                                                                    <img src={rivalData.image} className="w-16 h-16 rounded-full mb-2 object-cover" alt="Rival" />
                                                                    <span className="font-bold text-sm text-white text-center line-clamp-1">{rivalData.name}</span>
                                                                    <span className="text-xs text-gray-500">Sfidante</span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-auto text-center text-xs text-gray-500">
                                                                <p>Scegli il vincitore cliccando sul box corrispondente.</p>
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
                                                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                                                        <CheckCircle size={40} />
                                                    </div>
                                                    <h4 className="text-xl font-bold text-white">Boost Completato!</h4>
                                                    <p className="text-gray-400 mt-2 text-sm italic">
                                                        Hai supportato {selectedSlot.artist.name} con un'azione speciale.
                                                    </p>
                                                    <p className="text-gray-500 text-[10px] mt-6 uppercase tracking-widest">Torna domani per un nuovo boost!</p>
                                                </div>
                                            ) : (promoResult || initialState.boostSnapshot?.reward) ? (
                                                <div className="flex-1 flex flex-col items-center justify-center py-4 animate-in zoom-in duration-300">
                                                    {/* Reward Content Inspired by PromoModal */}
                                                    {(promoResult?.musiCoinsAwarded || initialState.boostSnapshot?.reward?.type === 'coins') ? (
                                                        <>
                                                            <div className="relative w-32 h-32 mb-6">
                                                                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                                                <div className="relative w-full h-full animate-spin-3d">
                                                                    <div className="w-full h-full rounded-full border-4 border-yellow-300 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                                                                        <span className="text-5xl font-bold text-yellow-100 drop-shadow-md">$</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 mb-2 text-center drop-shadow-sm">
                                                                MusiCoins Found!
                                                            </h3>
                                                            <p className="text-gray-400 mb-8 text-center text-sm">
                                                                Hai trovato <span className="text-yellow-400 font-bold text-lg">
                                                                    <SpringCounter from={0} to={promoResult?.musiCoinsAwarded || initialState.boostSnapshot?.reward?.amount || 0} /> MusiCoins
                                                                </span>!
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                                                                <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] border-4 border-white/10 animate-bounce transition-all duration-1000">
                                                                    <Trophy size={40} className="text-white drop-shadow-lg" />
                                                                </div>
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-white mb-2 text-center">
                                                                Points Collected!
                                                            </h3>
                                                            <p className="text-gray-400 mb-8 text-center text-sm">
                                                                Hai guadagnato <span className="text-purple-400 font-bold text-xl">
                                                                    <SpringCounter from={0} to={promoResult?.pointsAwarded || initialState.boostSnapshot?.reward?.amount || 0} /> Punti Fantamusiké!
                                                                </span>
                                                            </p>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={handleFinalizeBoost}
                                                        className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform w-full flex items-center justify-center gap-2 shrink-0"
                                                        disabled={loadingAction === 'finalize-boost'}
                                                    >
                                                        {loadingAction === 'finalize-boost' ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <span>Continua su</span>
                                                                <img src="/Spotify_Full_Logo_Black.png" alt="Spotify" className="h-4 object-contain" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    {!boostOptions ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center pb-8 border-white/5">
                                                            <Loader2 size={40} className="text-cyan-500 animate-spin mb-4" />
                                                            <p className="text-gray-400 animate-pulse">Caricamento opzioni...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <p className="text-lg text-white font-medium mb-6 text-center leading-relaxed">
                                                                Scegli quale azione completare:
                                                            </p>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
                                                                            className={`relative p-5 rounded-2xl border transition-all text-left flex flex-col group border-white/10 hover:border-cyan-500/50 hover:bg-white/5 shadow-lg active:scale-95`}
                                                                        >
                                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors`}>
                                                                                <IconComp size={24} />
                                                                            </div>
                                                                            <span className={`font-bold text-sm mb-1 text-white`}>{opt.label}</span>
                                                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">{opt.subLabel}</span>

                                                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <ChevronRight size={16} className="text-cyan-500" />
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="mt-auto text-center text-[10px] text-gray-500 uppercase tracking-widest">
                                                                Scelta Libera • Premio Garantito
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
            className={`flex-1 py-3 px-2 rounded-lg flex flex-col items-center gap-1 transition-all relative ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
        >
            {done ? (
                <CheckCircle size={18} className="text-green-500 animate-in zoom-in duration-300" />
            ) : (
                <Icon size={18} className={active ? 'scale-110' : ''} />
            )}
            <span className="text-[10px] font-bold uppercase">{label}</span>
            {active && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-500" />
            )}
        </button>
    );
}
