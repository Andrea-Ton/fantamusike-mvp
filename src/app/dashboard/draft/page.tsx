'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, LogOut, Loader2, X, Save, Trophy, Users, Zap, ChevronUp, Star, Crown, Sparkles, RotateCcw, Info, Rocket } from 'lucide-react';
import Image from 'next/image';
import { searchArtistsAction } from '@/app/actions/spotify';
import { saveTeamAction, TeamSlots, getUserTeamAction } from '@/app/actions/team';
import { getFeaturedArtistsAction, getArtistAction } from '@/app/actions/artist';
import { getCuratedRosterAction } from '@/app/actions/scout';
import { getCurrentSeasonAction } from '@/app/actions/season';
import { getCurrentWeekAction } from '@/app/actions/game';
import { SpotifyArtist } from '@/lib/spotify';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/logout-button';
import { createClient } from '@/utils/supabase/client';
import InviteButton from '@/components/dashboard/invite-button';
import { ARTIST_TIERS } from '@/config/game';

const getCategory = (popularity: number) => {
    if (popularity >= ARTIST_TIERS.BIG.min) return ARTIST_TIERS.BIG.label;
    if (popularity >= ARTIST_TIERS.MID.min) return ARTIST_TIERS.MID.label;
    return ARTIST_TIERS.NEW_GEN.label;
};

// Helper to debounce search
function useDebounce<T>(value: T, delay: number): T {
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

const INITIAL_SLOTS: TeamSlots = {
    slot_1: null,
    slot_2: null,
    slot_3: null,
    slot_4: null,
    slot_5: null,
};

export default function TalentScoutPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [activeFilter, setActiveFilter] = useState('All');
    const [artists, setArtists] = useState<SpotifyArtist[]>([]);
    const [featuredArtists, setFeaturedArtists] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [draftTeam, setDraftTeam] = useState<TeamSlots>(INITIAL_SLOTS);
    const [captainId, setCaptainId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showMobileTeam, setShowMobileTeam] = useState(false);
    const [isTeamLoaded, setIsTeamLoaded] = useState(false);
    const [viewMode, setViewMode] = useState<'search' | 'featured' | 'suggested'>('suggested');

    // MusiCoin & Season State
    const [initialTeam, setInitialTeam] = useState<TeamSlots | null>(null);
    const [initialCaptainId, setInitialCaptainId] = useState<string | null>(null);
    const [cost, setCost] = useState(0);
    const [showCostModal, setShowCostModal] = useState(false);
    const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
    const [seasonName, setSeasonName] = useState<string>('Season Zero');
    const [isNewSeasonEntry, setIsNewSeasonEntry] = useState(false);
    const [musiCoins, setMusiCoins] = useState(0);
    const [referralCode, setReferralCode] = useState<string | undefined>(undefined);

    const [currentWeek, setCurrentWeek] = useState<number>(1);

    // Load Team (DB or LocalStorage)
    useEffect(() => {
        const loadData = async () => {
            // 0. Get Current Season & Profile
            const season = await getCurrentSeasonAction();
            if (season) {
                setCurrentSeasonId(season.id);
                setSeasonName(season.name);
            }

            const week = await getCurrentWeekAction();
            setCurrentWeek(week);

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('musi_coins, referral_code').eq('id', user.id).single();
                if (profile) {
                    setMusiCoins(profile.musi_coins);
                    setReferralCode(profile.referral_code);
                }
            }

            // 1. Try fetching from DB
            const dbTeam = await getUserTeamAction();

            if (dbTeam) {
                const loadedTeam = {
                    slot_1: dbTeam.slot_1,
                    slot_2: dbTeam.slot_2,
                    slot_3: dbTeam.slot_3,
                    slot_4: dbTeam.slot_4,
                    slot_5: dbTeam.slot_5,
                };
                setDraftTeam(loadedTeam);
                setInitialTeam(loadedTeam);

                if (dbTeam.captain_id) {
                    setCaptainId(dbTeam.captain_id);
                    setInitialCaptainId(dbTeam.captain_id);
                } else {
                    setInitialCaptainId(null);
                }

                // Check if new season entry
                if (season && (!dbTeam.season_id || dbTeam.season_id !== season.id)) {
                    setIsNewSeasonEntry(true);
                } else {
                    setIsNewSeasonEntry(false);
                }
            } else {
                // 2. If no DB team, try LocalStorage
                const savedDraft = localStorage.getItem('draftTeam');
                const savedCaptain = localStorage.getItem('captainId');

                if (savedDraft) {
                    try {
                        const parsedDraft = JSON.parse(savedDraft);
                        setDraftTeam(parsedDraft);
                        setInitialTeam(parsedDraft);
                    } catch (e) {
                        console.error('Failed to parse draft team', e);
                        setInitialTeam(INITIAL_SLOTS);
                    }
                } else {
                    setInitialTeam(INITIAL_SLOTS);
                }

                if (savedCaptain) {
                    setCaptainId(savedCaptain);
                    setInitialCaptainId(savedCaptain);
                } else {
                    setInitialCaptainId(null);
                }

                // No DB team means it's a new entry (free)
                setIsNewSeasonEntry(true);
            }
            setIsTeamLoaded(true);
        };

        const fetchFeatured = async () => {
            const featured = await getFeaturedArtistsAction();
            setFeaturedArtists(new Set(featured.map(a => a.id)));
        };

        loadData();
        fetchFeatured();
    }, []);

    // Calculate Cost
    useEffect(() => {
        if (isNewSeasonEntry) {
            setCost(0);
            return;
        }

        if (!initialTeam) {
            setCost(0);
            return;
        }

        let newCost = 0;

        // Check artist changes (20 coins each)
        const slots: (keyof TeamSlots)[] = ['slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5'];
        let changedArtists = 0;

        slots.forEach(slot => {
            const initialId = initialTeam[slot]?.id;
            const currentId = draftTeam[slot]?.id;
            if (initialId !== currentId) {
                changedArtists++;
            }
        });

        newCost += changedArtists * 20;

        // Check captain change (10 coins)
        if (initialCaptainId && captainId && initialCaptainId !== captainId) {
            newCost += 10;
        }

        setCost(newCost);
    }, [draftTeam, captainId, initialTeam, initialCaptainId, isNewSeasonEntry]);

    // Save to LocalStorage on change (only if loaded)
    useEffect(() => {
        if (isTeamLoaded) {
            localStorage.setItem('draftTeam', JSON.stringify(draftTeam));
            if (captainId) {
                localStorage.setItem('captainId', captainId);
            } else {
                localStorage.removeItem('captainId');
            }
        }
    }, [draftTeam, captainId, isTeamLoaded]);

    useEffect(() => {
        const fetchArtists = async () => {
            if (viewMode === 'featured' || viewMode === 'suggested') return;

            if (debouncedSearchTerm.length < 2) {
                setArtists([]);
                return;
            }

            setIsLoading(true);
            const result = await searchArtistsAction(debouncedSearchTerm);
            if (result.success && result.data) {
                setArtists(result.data);
            }
            setIsLoading(false);
        };

        fetchArtists();
    }, [debouncedSearchTerm, viewMode]);

    // Load Suggested artists on mount if viewMode is 'suggested'
    useEffect(() => {
        if (viewMode === 'suggested') {
            handleLoadSuggested();
        }
    }, []); // Run once on mount

    const handleLoadFeatured = async () => {
        setIsLoading(true);
        setViewMode('featured');
        setSearchTerm('');
        const featured = await getFeaturedArtistsAction();
        setArtists(featured);
        setIsLoading(false);
    };

    const handleLoadSuggested = async () => {
        setIsLoading(true);
        setViewMode('suggested');
        setSearchTerm('');
        const suggested = await getCuratedRosterAction();
        // Map ScoutSuggestion to SpotifyArtist
        const mappedArtists: SpotifyArtist[] = suggested.map(s => ({
            id: s.spotify_id,
            name: s.name,
            external_urls: { spotify: '' },
            images: [{ url: s.image_url, height: 0, width: 0 }],
            popularity: s.popularity,
            genres: s.genre ? [s.genre] : [],
            followers: { total: s.followers || 0 }
        }));
        setArtists(mappedArtists);
        setIsLoading(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (viewMode === 'featured' || viewMode === 'suggested') {
            setViewMode('search');
        }
    };

    const filteredArtists = artists.filter(artist => {
        const category = getCategory(artist.popularity);
        const matchesFilter = activeFilter === 'All' ||
            (activeFilter === 'New Gen' && category === 'New Gen') ||
            (activeFilter === 'Mid Tier' && category === 'Mid Tier') ||
            (activeFilter === 'Big' && category === 'Big');
        return matchesFilter;
    });

    const handleAddToSlot = (artist: SpotifyArtist, slotKey: keyof TeamSlots) => {
        setDraftTeam(prev => ({ ...prev, [slotKey]: artist }));
        // Reset captain if the slot was the captain
        if (draftTeam[slotKey]?.id === captainId) {
            setCaptainId(null);
        }
    };

    const handleRemoveFromSlot = (slotKey: keyof TeamSlots) => {
        const artistId = draftTeam[slotKey]?.id;
        if (artistId === captainId) {
            setCaptainId(null);
        }
        setDraftTeam(prev => ({ ...prev, [slotKey]: null }));
    };

    const handleSetCaptain = (artistId: string) => {
        setCaptainId(artistId);
    };

    const hasChanges = useMemo(() => {
        if (!initialTeam) return false;
        const slots = ['slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5'] as const;
        const teamChanged = slots.some(slot => draftTeam[slot]?.id !== initialTeam[slot]?.id);
        const captainChanged = captainId !== initialCaptainId;
        return teamChanged || captainChanged;
    }, [draftTeam, captainId, initialTeam, initialCaptainId]);

    const handleUndo = () => {
        if (!initialTeam) return;
        if (window.confirm('Vuoi annullare tutte le modifiche non salvate?')) {
            setDraftTeam(initialTeam);
            setCaptainId(initialCaptainId);
        }
    };

    const handleSaveClick = () => {
        // Basic client-side validation check
        const emptySlots = Object.values(draftTeam).some(slot => slot === null);
        if (emptySlots) {
            setSaveError('Devi riempire tutti gli slot prima di salvare!');
            return;
        }

        if (!captainId) {
            setSaveError('Devi selezionare un Capitano!');
            return;
        }

        if (cost > 0) {
            setShowCostModal(true);
        } else {
            handleConfirmSave();
        }
    };

    const handleConfirmSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        setShowCostModal(false);

        const result = await saveTeamAction(draftTeam, captainId);

        if (result.success) {
            localStorage.removeItem('draftTeam');
            localStorage.removeItem('captainId');
            router.push('/dashboard');
        } else {
            setSaveError(result.message || 'Errore durante il salvataggio');
            if (result.errors) {
                console.error(result.errors);
            }
        }
        setIsSaving(false);
    };

    const getAvailableSlots = (artist: SpotifyArtist) => {
        const category = getCategory(artist.popularity);
        const slots: { key: keyof TeamSlots; label: string }[] = [];

        if (category === 'Big') {
            if (!draftTeam.slot_1) slots.push({ key: 'slot_1', label: 'Headliner' });
        } else if (category === 'Mid Tier') {
            if (!draftTeam.slot_2) slots.push({ key: 'slot_2', label: 'Mid Tier 1' });
            if (!draftTeam.slot_3) slots.push({ key: 'slot_3', label: 'Mid Tier 2' });
        } else if (category === 'New Gen') {
            if (!draftTeam.slot_4) slots.push({ key: 'slot_4', label: 'New Gen 1' });
            if (!draftTeam.slot_5) slots.push({ key: 'slot_5', label: 'New Gen 2' });
        }
        return slots;
    };

    const filledSlotsCount = Object.values(draftTeam).filter(Boolean).length;



    const TeamSummaryContent = () => {
        if (!isTeamLoaded) {
            return (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/5"></div>
                    ))}
                    <div className="h-12 bg-white/5 rounded-xl mt-4"></div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Headliner */}
                <SlotPreview
                    label={ARTIST_TIERS.BIG.label}
                    subLabel={`Pop > ${ARTIST_TIERS.BIG.min - 1}`}
                    artist={draftTeam.slot_1}
                    onRemove={() => handleRemoveFromSlot('slot_1')}
                    icon={<Trophy size={14} className="text-yellow-500" />}
                    isCaptain={draftTeam.slot_1?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_1 && handleSetCaptain(draftTeam.slot_1.id)}
                    isFeatured={draftTeam.slot_1 ? featuredArtists.has(draftTeam.slot_1.id) : false}
                    multiplier={draftTeam.slot_1?.id === captainId ? (featuredArtists.has(draftTeam.slot_1.id) ? 2 : 1.5) : undefined}
                />

                {/* Mid Tier */}
                <SlotPreview
                    label={ARTIST_TIERS.MID.label}
                    subLabel={`Pop ${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max}`}
                    artist={draftTeam.slot_2}
                    onRemove={() => handleRemoveFromSlot('slot_2')}
                    icon={<Users size={14} className="text-blue-400" />}
                    isCaptain={draftTeam.slot_2?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_2 && handleSetCaptain(draftTeam.slot_2.id)}
                    isFeatured={draftTeam.slot_2 ? featuredArtists.has(draftTeam.slot_2.id) : false}
                    multiplier={draftTeam.slot_2?.id === captainId ? (featuredArtists.has(draftTeam.slot_2.id) ? 2 : 1.5) : undefined}
                />
                <SlotPreview
                    label={ARTIST_TIERS.MID.label}
                    subLabel={`Pop ${ARTIST_TIERS.MID.min}-${ARTIST_TIERS.MID.max}`}
                    artist={draftTeam.slot_3}
                    onRemove={() => handleRemoveFromSlot('slot_3')}
                    icon={<Users size={14} className="text-blue-400" />}
                    isCaptain={draftTeam.slot_3?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_3 && handleSetCaptain(draftTeam.slot_3.id)}
                    isFeatured={draftTeam.slot_3 ? featuredArtists.has(draftTeam.slot_3.id) : false}
                    multiplier={draftTeam.slot_3?.id === captainId ? (featuredArtists.has(draftTeam.slot_3.id) ? 2 : 1.5) : undefined}
                />

                {/* New Gen */}
                <SlotPreview
                    label={ARTIST_TIERS.NEW_GEN.label}
                    subLabel={`Pop < ${ARTIST_TIERS.NEW_GEN.max + 1}`}
                    artist={draftTeam.slot_4}
                    onRemove={() => handleRemoveFromSlot('slot_4')}
                    icon={<Zap size={14} className="text-green-400" />}
                    isCaptain={draftTeam.slot_4?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_4 && handleSetCaptain(draftTeam.slot_4.id)}
                    isFeatured={draftTeam.slot_4 ? featuredArtists.has(draftTeam.slot_4.id) : false}
                    multiplier={draftTeam.slot_4?.id === captainId ? (featuredArtists.has(draftTeam.slot_4.id) ? 2 : 1.5) : undefined}
                />
                <SlotPreview
                    label={ARTIST_TIERS.NEW_GEN.label}
                    subLabel={`Pop < ${ARTIST_TIERS.NEW_GEN.max + 1}`}
                    artist={draftTeam.slot_5}
                    onRemove={() => handleRemoveFromSlot('slot_5')}
                    icon={<Zap size={14} className="text-green-400" />}
                    isCaptain={draftTeam.slot_5?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_5 && handleSetCaptain(draftTeam.slot_5.id)}
                    isFeatured={draftTeam.slot_5 ? featuredArtists.has(draftTeam.slot_5.id) : false}
                    multiplier={draftTeam.slot_5?.id === captainId ? (featuredArtists.has(draftTeam.slot_5.id) ? 2 : 1.5) : undefined}
                />

                {saveError && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase tracking-widest">
                        {saveError}
                    </div>
                )}

                <button
                    onClick={handleSaveClick}
                    disabled={filledSlotsCount < 5 || !captainId || isSaving}
                    className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all duration-300 ${filledSlotsCount === 5 && captainId
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                        }`}
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Salvataggio...' : cost > 0 ? `Salva (${cost} MusiCoin)` : 'Conferma Team'}
                </button>
            </div>
        );
    };

    return (
        <>
            {/* Cost Confirmation Modal */}
            {showCostModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-[#0a0a0f]/90 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-scale-in relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Transaction Security</p>
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-6">Confirm Changes</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Costo Operazione</span>
                                    <span className="text-xl font-black text-yellow-500 italic uppercase">{cost} <span className="text-[10px] not-italic opacity-60">MusiCoin</span></span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Il tuo Bilancio</span>
                                    <span className={`text-xl font-black italic uppercase ${musiCoins < cost ? 'text-red-500' : 'text-white'}`}>
                                        {musiCoins} <span className="text-[10px] not-italic opacity-60">MusiCoin</span>
                                    </span>
                                </div>
                            </div>

                            {musiCoins < cost ? (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-[1.5rem] p-6 mb-8 group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <X size={40} className="text-red-500" />
                                    </div>
                                    <p className="text-red-500 font-black text-xs uppercase tracking-widest mb-2">Insufficient Balance</p>
                                    <p className="text-gray-400 text-[11px] leading-relaxed mb-6">Non hai abbastanza MusiCoin per confermare queste modifiche. Puoi guadagnarne invitando amici o promuovendo artisti.</p>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <p className="text-white text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Users size={12} className="text-blue-400" /> Invitando Amici
                                            </p>
                                            <InviteButton referralCode={referralCode} />
                                        </div>
                                        <button
                                            onClick={() => router.push('/dashboard')}
                                            className="w-full py-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-purple-500/20 flex items-center justify-center gap-2 shadow-inner"
                                        >
                                            <Rocket size={14} />
                                            Vai alla Dashboard
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-xs italic mb-8">
                                    Le modifiche saranno applicate istantaneamente all'inizio della prossima settimana di gioco.
                                </p>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowCostModal(false)}
                                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-white/5 text-gray-400 hover:bg-white/10 transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    disabled={isSaving || musiCoins < cost}
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 ${musiCoins < cost
                                        ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5'
                                        : 'bg-yellow-500 text-black hover:scale-[1.05] shadow-[0_10px_20px_rgba(234,179,8,0.2)]'
                                        }`}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : <Zap size={14} className={musiCoins < cost ? "opacity-30" : "fill-black"} />}
                                    Paga e Salva
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Mobile Header */}
            <div className="md:hidden pt-12 px-6 flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="FantaMusiké Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">FantaMusiké</h1>
                        <p className="text-xs text-gray-400">
                            {seasonName} {isNewSeasonEntry ? '' : '- Prossima Settimana'}
                        </p>
                    </div>
                </div>
                <LogoutButton />
            </div>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-40 lg:pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Search */}
                    <div className="lg:col-span-7">
                        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Drafting Lab</p>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">Talent Scout</h1>
                                <p className="text-gray-500 text-sm font-medium">Trova le star della tua label rispettando il budget di popolarità.</p>
                            </div>
                            <div className="flex gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                <button
                                    onClick={handleLoadSuggested}
                                    className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'suggested' ? 'bg-purple-500 text-white shadow-[0_5px_15px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Sparkles size={14} />
                                    Suggeriti
                                </button>
                                <button
                                    onClick={handleLoadFeatured}
                                    className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'featured' ? 'bg-yellow-500 text-black shadow-[0_5px_15px_rgba(234,179,8,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Crown size={14} className={viewMode === 'featured' ? 'fill-black' : ''} />
                                    Featured
                                </button>
                                <button
                                    onClick={() => setViewMode('search')}
                                    className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'search' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Cerca
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {viewMode === 'search' && (
                            <div className="relative mb-8 group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Search className="text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Scrivi il nome di un artista..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white font-bold placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all backdrop-blur-xl"
                                />
                            </div>
                        )}

                        {/* Filters */}
                        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                            {['All', ARTIST_TIERS.BIG.label, ARTIST_TIERS.MID.label, ARTIST_TIERS.NEW_GEN.label].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border ${activeFilter === filter
                                        ? 'bg-white text-black border-white shadow-lg'
                                        : 'bg-white/[0.03] text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Artist Grid */}
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-purple-500" size={40} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredArtists.map((artist) => {
                                    const availableSlots = getAvailableSlots(artist);
                                    const isSelected = Object.values(draftTeam).some(slot => slot?.id === artist.id);
                                    const isFeatured = featuredArtists.has(artist.id);

                                    return (
                                        <div key={artist.id} className={`bg-white/[0.03] border rounded-[2rem] p-5 flex flex-col gap-5 transition-all duration-300 group relative backdrop-blur-md overflow-hidden ${isFeatured ? 'border-yellow-500/30' : 'border-white/5 hover:bg-white/[0.06] hover:scale-[1.02]'}`}>
                                            {isFeatured && (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-yellow-500/10 transition-colors" />
                                            )}

                                            <div className="flex gap-5 items-start">
                                                <div className={`relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 ${isFeatured ? 'ring-2 ring-yellow-500/30' : 'ring-1 ring-white/10'}`}>
                                                    {artist.images[0] ? (
                                                        <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                            <Users size={24} className="text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 py-1">
                                                    <div className="flex justify-between items-start mb-1 gap-2">
                                                        <div className="marquee-container flex-1">
                                                            <h3 className="font-black text-white italic uppercase tracking-tighter truncate leading-none pt-1 group-hover:animate-marquee">
                                                                {artist.name}
                                                            </h3>
                                                        </div>
                                                        {isFeatured && (
                                                            <div className="bg-yellow-500/20 text-yellow-500 p-1.5 rounded-lg border border-yellow-500/20 shrink-0">
                                                                <Crown size={10} fill="currentColor" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${getCategory(artist.popularity) === ARTIST_TIERS.BIG.label ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                            getCategory(artist.popularity) === ARTIST_TIERS.MID.label ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                'bg-green-500/10 text-green-400 border-green-500/20'
                                                            }`}>
                                                            {getCategory(artist.popularity)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                                            <span>Pop: <span className="text-white">{artist.popularity}</span></span>
                                                            <span className="opacity-30">•</span>
                                                            <span>Followers: <span className="text-white">{artist.followers.total.toLocaleString()}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                {isSelected ? (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/10 w-full justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                                        Drafted
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {availableSlots.length > 0 ? (
                                                            availableSlots.map(slot => (
                                                                <button
                                                                    key={slot.key}
                                                                    onClick={() => handleAddToSlot(artist, slot.key)}
                                                                    className="group/btn flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white text-white hover:text-black text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white shadow-inner flex items-center justify-center gap-2"
                                                                >
                                                                    <Plus size={10} className="group-hover/btn:scale-125 transition-transform" />
                                                                    {slot.label}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-gray-600 font-bold italic uppercase tracking-widest px-1">No slot available</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Team Summary (Desktop) */}
                    <div className="hidden lg:block lg:col-span-5 space-y-6">
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sticky top-6 backdrop-blur-3xl shadow-2xl overflow-hidden group/sidebar">
                            {/* Background Accents */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 blur-[50px] rounded-full group-hover/sidebar:bg-purple-500/10 transition-colors" />
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/5 blur-[50px] rounded-full group-hover/sidebar:bg-blue-500/10 transition-colors" />

                            <div className="relative z-10 flex justify-between items-center mb-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Componi il tuo team di artisti</p>
                                    </div>
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">La tua Label</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 shadow-inner">
                                        <Users size={14} className="text-purple-400" />
                                        <span className="text-[11px] font-black text-white">{filledSlotsCount}/5</span>
                                    </div>
                                    {hasChanges && (
                                        <button
                                            onClick={handleUndo}
                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20 shadow-inner"
                                            title="Annulla modifiche"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <TeamSummaryContent />
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar */}
                <div className="lg:hidden fixed mb-4 bottom-24 left-4 right-4 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 p-5 z-40 flex justify-between items-center rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest leading-none">Draft Progress</p>
                        <div className="font-black text-white italic uppercase tracking-tighter text-lg flex items-center gap-2">
                            {filledSlotsCount}/5 <span className="text-[10px] not-italic text-gray-500 pt-0.5">Artists</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMobileTeam(true)}
                        className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_20px_rgba(168,85,247,0.3)] flex items-center gap-2 active:scale-95 transition-transform"
                    >
                        <span>Vedi Team</span>
                        <ChevronUp size={16} className="animate-bounce" />
                    </button>
                </div>

                {/* Mobile Team Modal/Sheet */}
                {showMobileTeam && (
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-end justify-center animate-in fade-in duration-300">
                        <div
                            className="bg-[#050507] w-full max-w-lg rounded-t-[2.5rem] border-t border-x border-white/10 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

                            <div className="flex justify-between items-center mb-10 mt-2 sticky top-0 bg-[#050507] z-20 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Roster Management</p>
                                    </div>
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Draft Review</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleUndo}
                                        disabled={!hasChanges}
                                        className={`p-3 rounded-xl border transition-all ${hasChanges
                                            ? 'text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                                            : 'text-gray-700 border-white/5 bg-white/5 cursor-not-allowed'}`}
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                    <button
                                        onClick={() => setShowMobileTeam(false)}
                                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                                    >
                                        <X className="text-white" size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <TeamSummaryContent />
                            </div>
                        </div>
                        {/* Click outside to close */}
                        <div className="absolute inset-0 -z-10" onClick={() => setShowMobileTeam(false)} />
                    </div>
                )}



            </main>
        </>
    );
}

function SlotPreview({
    label,
    subLabel,
    artist,
    onRemove,
    icon,
    isCaptain,
    onSetCaptain,
    isFeatured,
    multiplier
}: {
    label: string,
    subLabel: string,
    artist: SpotifyArtist | null,
    onRemove: () => void,
    icon: React.ReactNode,
    isCaptain: boolean,
    onSetCaptain: () => void,
    isFeatured: boolean,
    multiplier?: number
}) {
    return (
        <div className={`relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${artist ? (isFeatured ? 'bg-yellow-500/[0.03] border-yellow-500/30' : 'bg-white/[0.04] border-white/10 shadow-inner') : 'bg-white/[0.01] border-dashed border-white/10 hover:border-white/20'}`}>
            {artist && isCaptain && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-yellow-500 rounded-r-full" />
            )}

            {artist ? (
                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative group/avatar">
                        <div className={`w-14 h-14 rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 ${isFeatured ? 'ring-2 ring-yellow-500/30' : 'ring-1 ring-white/10'}`}>
                            <img src={artist.images[0]?.url} alt={artist.name} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform" />
                        </div>
                        {isCaptain && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-lg shadow-xl z-20 animate-bounce-slow">
                                <Crown size={12} className="fill-black" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="marquee-container flex-1">
                                <div className="font-black text-white italic uppercase tracking-tighter truncate leading-none pt-1 group-hover:animate-marquee">
                                    {artist.name}
                                </div>
                            </div>
                            {isFeatured && <Sparkles size={10} className="text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Pop: <span className="text-white">{artist.popularity}</span></span>
                            {multiplier && multiplier > 1 && (
                                <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg border uppercase tracking-widest ${multiplier === 2 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                    x{multiplier}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onSetCaptain}
                            className={`p-2.5 rounded-xl transition-all shadow-inner border ${isCaptain ? 'bg-yellow-500 text-black border-yellow-400 scale-110' : 'bg-white/5 text-gray-500 hover:text-white border-white/5 hover:border-white/10'}`}
                            title="Imposta Capitano"
                        >
                            <Crown size={16} className={isCaptain ? 'fill-black' : ''} />
                        </button>
                        <button
                            onClick={onRemove}
                            className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20 shadow-inner"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between h-14 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 shadow-inner">
                            {icon}
                        </div>
                        <div>
                            <div className="font-black text-[11px] text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</div>
                            <div className="text-[9px] text-gray-600 font-bold uppercase tracking-tight italic opacity-60">{subLabel}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
