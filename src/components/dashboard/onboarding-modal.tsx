'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Trophy, Users, Zap, Search, Plus, X, ArrowRight, ArrowLeft,
    Crown, Sparkles, CheckCircle2, Rocket, Loader2, Star, Gift
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotifyArtist } from '@/lib/spotify';
import { ARTIST_TIERS } from '@/config/game';
import { searchArtistsAction } from '@/app/actions/spotify';
import { saveTeamAction, TeamSlots } from '@/app/actions/team';
import { completeOnboardingAction } from '@/app/actions/onboarding';
import { updateProfileAction, checkUsernameAvailabilityAction } from '@/app/actions/profile';
import { validateUsername } from '@/utils/validation';

interface OnboardingModalProps {
    featuredArtists: SpotifyArtist[];
    curatedRoster: SpotifyArtist[];
    username: string;
}

type OnboardingStep =
    | 'manager_name'
    | 'explain_fantamusike'
    | 'select_big'
    | 'select_mid'
    | 'select_newgen'
    | 'select_captain'
    | 'explain_promuovi'
    | 'explain_rewards'
    | 'biglietto_futuro'
    | 'summary';

// Helper to debounce internally since useDebounce might not be globally available
function useLocalDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function OnboardingModal({ featuredArtists, curatedRoster, username }: OnboardingModalProps) {
    const [step, setStep] = useState<OnboardingStep>('manager_name');
    const [team, setTeam] = useState<TeamSlots>({
        slot_1: null,
        slot_2: null,
        slot_3: null,
        slot_4: null,
        slot_5: null,
    });
    const [captainId, setCaptainId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Search related state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'suggested' | 'featured' | 'search'>('suggested');

    const [managerName, setManagerName] = useState(username);
    const debouncedManagerName = useLocalDebounce(managerName, 500);
    const [nameError, setNameError] = useState<string | null>(null);
    const [isValidatingName, setIsValidatingName] = useState(false);

    // Steps configuration
    const steps: OnboardingStep[] = ['manager_name', 'explain_fantamusike', 'select_big', 'select_mid', 'select_newgen', 'select_captain', 'explain_promuovi', 'explain_rewards', 'biglietto_futuro', 'summary'];
    const currentStepIndex = steps.indexOf(step);

    useEffect(() => {
        const checkName = async () => {
            if (debouncedManagerName.length < 3) return;
            // Also no need to check if it hasn't changed from original valid username
            if (debouncedManagerName === username) {
                setNameError(null);
                return;
            }

            setIsValidatingName(true);
            const val = validateUsername(debouncedManagerName);
            if (!val.valid) {
                setNameError(val.error || 'Nome non valido');
                setIsValidatingName(false);
                return;
            }

            const res = await checkUsernameAvailabilityAction(debouncedManagerName);
            if (!res.available) {
                setNameError(res.message || 'Nome non disponibile');
            } else {
                setNameError(null);
            }
            setIsValidatingName(false);
        };

        checkName();
    }, [debouncedManagerName, username]);


    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setStep(steps[currentStepIndex + 1]);
            // Reset search state when moving between artist selection steps
            setSearchTerm('');
            setSearchResults([]);
            setActiveTab('suggested');
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setStep(steps[currentStepIndex - 1]);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const res = await searchArtistsAction(val);
        if (res.success && res.data) {
            setSearchResults(res.data);
        }
        setIsSearching(false);
    };

    const handleToggleArtist = (artist: SpotifyArtist) => {
        const selectedSlot = Object.entries(team).find(([_, val]) => val?.id === artist.id);

        if (selectedSlot) {
            const [slotKey] = selectedSlot;
            setTeam(prev => ({ ...prev, [slotKey]: null }));
            if (captainId === artist.id) setCaptainId(null);
            return;
        }

        if (step === 'select_big') {
            setTeam(prev => ({ ...prev, slot_1: artist }));
        } else if (step === 'select_mid') {
            if (!team.slot_2) {
                setTeam(prev => ({ ...prev, slot_2: artist }));
            } else if (!team.slot_3) {
                setTeam(prev => ({ ...prev, slot_3: artist }));
            }
        } else if (step === 'select_newgen') {
            if (!team.slot_4) {
                setTeam(prev => ({ ...prev, slot_4: artist }));
            } else if (!team.slot_5) {
                setTeam(prev => ({ ...prev, slot_5: artist }));
            }
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            // 1. Update Profile Name if changed
            if (managerName !== username && !nameError) {
                const formData = new FormData();
                formData.append('username', managerName);
                const nameRes = await updateProfileAction(formData);
                if (!nameRes.success) {
                    setNameError(nameRes.message || 'Errore aggiornamento nome');
                    setStep('manager_name');
                    setIsSaving(false);
                    return;
                }
            }

            // 2. Save Team
            const teamRes = await saveTeamAction(team, captainId);
            if (!teamRes.success) {
                alert(teamRes.message || 'Errore nel salvataggio del team');
                setIsSaving(false);
                return;
            }

            // 3. Mark Onboarding as Complete
            const onboardRes = await completeOnboardingAction();
            if (!onboardRes.success) {
                alert(onboardRes.message || 'Errore completamento onboarding');
                setIsSaving(false);
                return;
            }

            window.location.reload();
        } catch (err) {
            console.error('Failed to complete onboarding:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const artistList = useMemo(() => {
        let baseList = activeTab === 'suggested'
            ? curatedRoster.filter(a => !featuredArtists.some(f => f.id === a.id))
            : activeTab === 'featured' ? featuredArtists : searchResults;

        // Filter by popularity based on current step
        if (step === 'select_big') {
            return baseList.filter(a => a.popularity >= ARTIST_TIERS.BIG.min);
        } else if (step === 'select_mid') {
            return baseList.filter(a => a.popularity >= ARTIST_TIERS.MID.min && a.popularity <= ARTIST_TIERS.MID.max);
        } else if (step === 'select_newgen') {
            return baseList.filter(a => a.popularity <= ARTIST_TIERS.NEW_GEN.max);
        }
        return baseList;
    }, [activeTab, step, curatedRoster, featuredArtists, searchResults]);

    const isStepComplete = useMemo(() => {
        if (step === 'manager_name') {
            return managerName.length >= 3 && !nameError && !isValidatingName;
        }
        if (step === 'explain_fantamusike') return true;
        if (step === 'select_big') return !!team.slot_1;
        if (step === 'select_mid') return !!team.slot_2 && !!team.slot_3;
        if (step === 'select_newgen') return !!team.slot_4 && !!team.slot_5;
        if (step === 'select_captain') return !!captainId;
        if (step === 'explain_promuovi') return true;
        if (step === 'explain_rewards') return true;
        if (step === 'biglietto_futuro') return true;
        if (step === 'summary') return true;
        return false;
    }, [step, team, captainId, managerName, nameError, isValidatingName]);

    const renderArtistCard = (artist: SpotifyArtist) => {
        const isSelected = Object.values(team).some(s => s?.id === artist.id);

        return (
            <div
                key={artist.id}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${isSelected
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
            >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    {artist.images[0]?.url ? (
                        <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <Users size={16} className="text-gray-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{artist.name}</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                        POP: {artist.popularity}
                    </p>
                </div>
                <button
                    onClick={() => handleToggleArtist(artist)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected
                        ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                        : 'bg-purple-500 text-white hover:scale-110'
                        }`}
                >
                    {isSelected ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050508]/95 backdrop-blur-3xl animate-fade-in overflow-y-auto">
            <div className="w-full max-w-lg bg-[#0a0a0f]/90 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Background Decor */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 relative">
                            <Image src="/logo.png" alt="FantaMusiké" fill className="object-contain" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Onboarding</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-4 relative z-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* STEP: MANAGER NAME */}
                            {step === 'manager_name' && (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] border border-blue-500/30 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                        <Users className="text-blue-400" size={40} />
                                    </div>
                                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
                                        Scegli il tuo<br /><span className="text-blue-500">Nome Manager</span>
                                    </h2>
                                    <p className="text-gray-400 font-medium leading-relaxed max-w-xs mx-auto mb-8">
                                        Come vuoi essere conosciuto nel mondo di FantaMusiké?
                                    </p>

                                    <div className="relative max-w-xs mx-auto mb-8">
                                        <input
                                            type="text"
                                            value={managerName}
                                            onChange={(e) => {
                                                setManagerName(e.target.value);
                                                const v = validateUsername(e.target.value);
                                                setNameError(v.valid ? null : v.error || 'Nome non valido');
                                            }}
                                            placeholder="Il tuo nome manager..."
                                            className={`w-full h-14 bg-white/[0.05] border ${nameError ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-6 text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all`}
                                        />
                                        {nameError && (
                                            <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-widest">{nameError}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={nextStep}
                                        disabled={!isStepComplete}
                                        className="w-full h-16 bg-white text-black font-black uppercase tracking-tighter italic rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] disabled:opacity-50"
                                    >
                                        {isValidatingName ? <><Loader2 className="animate-spin" size={20} /> Verifica...</> : <>Conferma Nome <ArrowRight size={20} /></>}
                                    </button>
                                </div>
                            )}

                            {/* STEP: EXPLAIN FANTAMUSIKE (MERGED WELCOME) */}
                            {step === 'explain_fantamusike' && (
                                <div className="text-center py-4 space-y-6">
                                    <div className="w-20 h-20 bg-purple-500/20 rounded-[2rem] border border-purple-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                                        <Rocket className="text-purple-400" size={40} />
                                    </div>
                                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
                                        Benvenuto,<br /><span className="text-purple-500">{managerName}</span>
                                    </h2>

                                    <div className="space-y-3 text-left">
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Star className="text-purple-500" size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">Come si gioca</h4>
                                                <p className="text-[12px] text-gray-400 font-medium leading-relaxed">Il FantaMusiké è il fantacalcio della musica. Ogni giorno i tuoi artisti guadagnano o perdono punti in base a: <span className="text-white font-bold">Hype</span>, <span className="text-white font-bold">Attività di stream e nei social</span>, e <span className="text-white font-bold">Nuove uscite</span>.</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Zap className="text-blue-500" size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">Classifica e punteggio si resettano ogni settimana</h4>
                                                <p className="text-[12px] text-gray-400 font-medium leading-relaxed">Le modifiche alla tua squadra saranno attive dalla settimana successiva.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEPS: ARTIST SELECTION (BIG, MID, NEWGEN) */}
                            {(step === 'select_big' || step === 'select_mid' || step === 'select_newgen') && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            {step === 'select_big' ? <Trophy className="text-yellow-500" size={16} /> :
                                                step === 'select_mid' ? <Users className="text-blue-400" size={16} /> :
                                                    <Zap className="text-green-400" size={16} />}
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">
                                                {step === 'select_big' ? 'Step 1/3: Star' :
                                                    step === 'select_mid' ? 'Step 2/3: Popular' :
                                                        'Step 3/3: Underdog'}
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                                            {step === 'select_big' ? `Scegli la tua ${ARTIST_TIERS.BIG.label}` :
                                                step === 'select_mid' ? `Scegli 2 ${ARTIST_TIERS.MID.label}` :
                                                    `Scegli 2 ${ARTIST_TIERS.NEW_GEN.label}`}
                                        </h3>
                                        <p className="text-gray-500 text-xs font-medium">
                                            {step === 'select_big' ? `Un artista consolidato oltre i ${ARTIST_TIERS.BIG.min} di popolarità.` :
                                                step === 'select_mid' ? `Artisti promettenti tra ${ARTIST_TIERS.MID.min} e ${ARTIST_TIERS.MID.max} di popolarità.` :
                                                    `Talenti emergenti sotto i ${ARTIST_TIERS.NEW_GEN.max} di popolarità.`}
                                        </p>

                                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                                            <Star className="text-yellow-500 flex-shrink-0 mt-0.5" size={14} />
                                            <p className="text-[10px] text-yellow-500/80 font-medium leading-tight">
                                                <span className="font-bold uppercase">Consiglio Pro:</span> Gli artisti <span className="text-yellow-500 font-bold uppercase tracking-tighter italic whitespace-nowrap">Featured (Icona 👑)</span> scelti come Capitano raddoppiano i punti (<span className="text-white font-black italic">x2.0</span>), mentre i capitani normali ottengono <span className="text-white font-black italic">x1.5</span>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Selection Progress */}
                                    <div className="flex gap-2">
                                        {step === 'select_big' && (
                                            <div className={`flex-1 h-1.5 rounded-full ${team.slot_1 ? 'bg-purple-500' : 'bg-white/10'}`} />
                                        )}
                                        {step === 'select_mid' && (
                                            <>
                                                <div className={`flex-1 h-1.5 rounded-full ${team.slot_2 ? 'bg-purple-500' : 'bg-white/10'}`} />
                                                <div className={`flex-1 h-1.5 rounded-full ${team.slot_3 ? 'bg-purple-500' : 'bg-white/10'}`} />
                                            </>
                                        )}
                                        {step === 'select_newgen' && (
                                            <>
                                                <div className={`flex-1 h-1.5 rounded-full ${team.slot_4 ? 'bg-purple-500' : 'bg-white/10'}`} />
                                                <div className={`flex-1 h-1.5 rounded-full ${team.slot_5 ? 'bg-purple-500' : 'bg-white/10'}`} />
                                            </>
                                        )}
                                    </div>

                                    {/* Minimal Draft UI */}
                                    <div className="space-y-4">
                                        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
                                            <button
                                                onClick={() => setActiveTab('suggested')}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'suggested' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500'}`}
                                            >
                                                <Sparkles size={12} /> Suggeriti
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('featured')}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'featured' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-500'}`}
                                            >
                                                <Crown size={12} /> Featured
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('search')}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'search' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}
                                            >
                                                <Search size={12} /> Cerca
                                            </button>
                                        </div>

                                        {activeTab === 'search' && (
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Cerca artista..."
                                                    value={searchTerm}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {isSearching ? (
                                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500" /></div>
                                            ) : artistList.length > 0 ? (
                                                artistList.map(renderArtistCard)
                                            ) : (
                                                <div className="text-center py-10 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                                                    Nessun artista trovato in questa categoria
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP: CAPTAIN */}
                            {step === 'select_captain' && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="text-yellow-500" size={16} />
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">
                                                Fase Finale: Scegli il tuo leader
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs font-medium">
                                            Il capitano riceve un moltiplicatore di punti extra: <span className="text-yellow-500 font-bold italic">x2.0</span> se è un artista <span className="uppercase text-yellow-500 font-black tracking-tighter">Featured</span>, altrimenti <span className="text-white font-bold italic">x1.5</span>.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {[team.slot_1, team.slot_2, team.slot_3, team.slot_4, team.slot_5].map((artist, idx) => {
                                            if (!artist) return null;
                                            const isFeatured = featuredArtists.some(f => f.id === artist.id);

                                            return (
                                                <div
                                                    key={artist.id}
                                                    onClick={() => setCaptainId(artist.id)}
                                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${captainId === artist.id
                                                        ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg">
                                                        <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" />
                                                        {isFeatured && (
                                                            <div className="absolute top-1 right-1 bg-yellow-500 p-1 rounded-md shadow-lg">
                                                                <Crown size={10} className="text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-white uppercase tracking-tight">{artist.name}</h4>
                                                            {isFeatured && <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded italic">X2</span>}
                                                        </div>
                                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                                            {idx === 0 ? ARTIST_TIERS.BIG.label :
                                                                idx < 3 ? ARTIST_TIERS.MID.label :
                                                                    ARTIST_TIERS.NEW_GEN.label}
                                                        </p>
                                                    </div>
                                                    {captainId === artist.id && <Star size={20} className="text-yellow-500 fill-yellow-500" />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* STEP: EXPLAIN PROMUOVI */}
                            {step === 'explain_promuovi' && (
                                <div className="space-y-6 text-center py-4">
                                    <div className="w-20 h-20 bg-orange-500/20 rounded-[2rem] border border-orange-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                                        <Zap className="text-orange-400" size={40} />
                                        <div className="absolute -top-1 -right-1 bg-orange-500 w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                                            <Trophy size={14} className="text-black" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                                        Utilizzo dei <span className="text-orange-500">Musicoin</span>
                                    </h3>

                                    <div className="space-y-4 text-left">
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <Star className="text-orange-500" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">1. Guadagnarli</h4>
                                                <p className="text-[12px] text-gray-400 font-medium">Completando le MusiRewards, invitando amici, o condividendo la Share card sui social.</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                                <Zap className="text-yellow-500" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">2. Spenderli</h4>
                                                <p className="text-[12px] text-gray-400 font-medium">Usa i Musicoin per effettuare cambi artisti nella tua squadra o per acquistare mystery box esclusive.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP: EXPLAIN REWARDS */}
                            {step === 'explain_rewards' && (
                                <div className="space-y-6 text-center py-4">
                                    <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] border border-blue-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                                        <Gift className="text-blue-400" size={40} />
                                        <div className="absolute -top-1 -right-1 bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                                            <Sparkles size={14} className="text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                                        Ottieni le <br /><span className="text-blue-500">Mystery Box della musica</span>
                                    </h3>

                                    <div className="space-y-4 text-left">
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                <Search className="text-purple-400" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">Mystery Box Esclusive</h4>
                                                <p className="text-[12px] text-gray-400 font-medium">Usa i tuoi MusiCoin nel MusiMarket: sblocca Mystery Box piene di sorprese uniche.</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                <Star size={20} className="text-green-500 fill-green-500/20" />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1">Vinci sul Serio</h4>
                                                <p className="text-[12px] text-gray-400 font-medium">Scopri vantaggi digitali e premi fisici della musica che non troveresti da nessun'altra parte.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP: BIGLIETTO FUTURO */}
                            {step === 'biglietto_futuro' && (
                                <div className="text-center py-4 space-y-6">
                                    <motion.div
                                        className="relative w-56 h-56 mx-auto"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: [1, 1.05, 1],
                                            opacity: 1
                                        }}
                                        transition={{
                                            scale: {
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            },
                                            opacity: { duration: 0.8 }
                                        }}
                                    >
                                        {/* Multi-layered Glow */}
                                        <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-[60px] animate-pulse" />
                                        <div className="absolute inset-4 bg-blue-500/20 rounded-full blur-[40px] animate-pulse" style={{ animationDelay: '1s' }} />

                                        <motion.div
                                            className="relative w-full h-full bg-gradient-to-br from-white/15 to-white/5 rounded-[3rem] border border-white/20 p-2 flex items-center justify-center overflow-hidden group cursor-pointer"
                                            whileHover={{ scale: 1.1, rotate: 2 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                        >
                                            {/* Advanced Inner Glow */}
                                            <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600/40 via-blue-500/40 to-pink-500/40 opacity-20 blur group-hover:opacity-60 transition duration-700" />

                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <motion.div
                                                    animate={{
                                                        y: [0, -8, 0],
                                                        filter: ["drop-shadow(0 0 10px rgba(168,85,247,0.3))", "drop-shadow(0 0 30px rgba(168,85,247,0.6))", "drop-shadow(0 0 10px rgba(168,85,247,0.3))"]
                                                    }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                >
                                                    <Image
                                                        src="/badges/biglietto_futuro.png"
                                                        alt="Biglietto Futuro"
                                                        width={220}
                                                        height={220}
                                                        className="object-contain"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                const icon = document.createElement('div');
                                                                icon.className = 'w-24 h-24 bg-purple-500/20 rounded-3xl flex items-center justify-center border border-purple-500/30';
                                                                icon.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" class="text-purple-400"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 24.12 24.12 0 0 1 14.2 0 2 2 0 0 1 1.4 1.4c.5 3.3.5 6.7 0 10a2 2 0 0 1-1.4 1.4 24.12 24.12 0 0 1-14.2 0 2 2 0 0 1-1.4-1.4z"/><path d="M13 10h4"/><path d="M13 14h4"/><path d="m7 9 3 3-3 3"/></svg>';
                                                                parent.appendChild(icon);
                                                            }
                                                        }}
                                                    />
                                                </motion.div>
                                            </div>

                                            {/* Reflection sweep animation */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-[200%] -skew-x-12"
                                                animate={{ x: ['100%', '-100%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                            />
                                        </motion.div>
                                    </motion.div>

                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tight leading-none px-2">
                                            Hai ottenuto il<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 px-2">
                                                Biglietto Futuro
                                            </span>
                                        </h3>

                                        <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                            Conservalo gelosamente. Non possiamo ancora dirti cosa apre, ma questo è il tuo pass prioritario per accedere a qualcosa di veramente esclusivo.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* STEP: SUMMARY */}
                            {step === 'summary' && (
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-[2rem] border border-green-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <CheckCircle2 className="text-green-400" size={40} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                                        Label Pronta!
                                    </h3>

                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Budget Iniziale</span>
                                            <span className="text-xl font-black text-yellow-500 italic">50 <span className="text-[10px] not-italic opacity-60">MusiCoin</span></span>
                                        </div>
                                        <p className="text-gray-400 text-xs leading-relaxed">
                                            Ogni giorno guadagnerai punti in base alle performance dei tuoi artisti. Puoi usare i MusiCoin per cambiare artisti della tua squadra e prepararti per la prossima settimana.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleComplete}
                                        disabled={isSaving}
                                        className="w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase tracking-tighter italic rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" /> : <><Rocket size={20} /> Entra nel Gioco</>}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="p-8 pt-4 flex gap-4 relative z-10">
                    {currentStepIndex > 0 && currentStepIndex < steps.length - 1 && (
                        <button
                            onClick={prevStep}
                            className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    {currentStepIndex > 0 && currentStepIndex < steps.length - 1 && (
                        <button
                            onClick={nextStep}
                            disabled={!isStepComplete}
                            className={`flex-[2] h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isStepComplete
                                ? 'bg-white text-black hover:scale-[1.02]'
                                : 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5'
                                }`}
                        >
                            Avanti <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
