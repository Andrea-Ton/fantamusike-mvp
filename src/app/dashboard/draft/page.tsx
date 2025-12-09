'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, LogOut, Loader2, X, Save, Trophy, Users, Zap, ChevronUp, Star, Crown, Sparkles, RotateCcw, Info } from 'lucide-react';
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

// Helper to categorize artists based on popularity
const getCategory = (popularity: number) => {
    if (popularity >= ARTIST_TIERS.BIG.min) return 'Big';
    if (popularity >= ARTIST_TIERS.MID.min) return 'Mid Tier';
    return 'New Gen';
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
                    label="Headliner"
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
                    label="Mid Tier 1"
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
                    label="Mid Tier 2"
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
                    label="New Gen 1"
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
                    label="New Gen 2"
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
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                        {saveError}
                    </div>
                )}

                <button
                    onClick={handleSaveClick}
                    disabled={filledSlotsCount < 5 || !captainId || isSaving}
                    className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${filledSlotsCount === 5 && captainId
                        ? 'bg-white text-black hover:bg-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Salvataggio...' : cost > 0 ? `Salva (${cost} MusiCoin)` : 'Conferma Team (Gratis)'}
                </button>
            </div>
        );
    };

    return (
        <>
            {/* Cost Confirmation Modal */}
            {showCostModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1a1a24] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-purple-500/20 animate-scale-in">
                        <h3 className="text-xl font-bold text-white mb-4">Conferma Modifiche</h3>
                        <p className="text-gray-400 mb-6">
                            Hai apportato modifiche al tuo team.
                            <br />
                            Saranno attive dalla prossima settimana.
                            <br />
                            <br />
                            Costo totale: <span className="text-yellow-400 font-bold">{cost} MusiCoin</span>.
                            <br />
                            Saldo attuale: <span className={musiCoins < cost ? "text-red-400 font-bold" : "text-white font-bold"}>{musiCoins} MusiCoin</span>.
                        </p>

                        {musiCoins < cost ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                                <p className="text-red-400 font-bold text-sm mb-2">Saldo Insufficiente!</p>
                                <p className="text-gray-300 text-xs mb-3">Non hai abbastanza MusiCoin per completare questa operazione.</p>
                                <div className="flex flex-col gap-2">
                                    <p className="text-white text-xs font-bold">Vuoi 30 MusiCoin gratis?</p>
                                    <InviteButton referralCode={referralCode} />
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCostModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                disabled={isSaving || musiCoins < cost}
                                className={`flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${musiCoins < cost
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-yellow-500 text-black hover:bg-yellow-400'
                                    }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Zap size={18} className={musiCoins < cost ? "text-gray-500" : "fill-black"} />}
                                Paga e Salva
                            </button>
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
                    <div className="lg:col-span-8">
                        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Talent Scout</h1>
                                <p className="text-gray-400">Cerca le prossime star. Ricorda: hai un budget di popolarità da rispettare.</p>
                            </div>
                            <div className="flex gap-2 bg-[#1a1a24] p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={handleLoadSuggested}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'suggested' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Sparkles size={14} />
                                    Suggeriti
                                </button>
                                <button
                                    onClick={handleLoadFeatured}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'featured' ? 'bg-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Crown size={14} />
                                    Featured
                                </button>
                                <button
                                    onClick={() => setViewMode('search')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'search' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Cerca
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {viewMode === 'search' && (
                            <div className="relative mb-6 group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search className="text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cerca artista..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full h-14 pl-12 pr-4 bg-[#1a1a24] border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-xl"
                                />
                            </div>
                        )}

                        {/* Filters */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {['All', 'Big', 'Mid Tier', 'New Gen'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeFilter === filter
                                        ? 'bg-white text-black border-white'
                                        : 'bg-[#1a1a24] text-gray-400 border-white/10 hover:border-white/30'
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredArtists.map((artist) => {
                                    const availableSlots = getAvailableSlots(artist);
                                    const isSelected = Object.values(draftTeam).some(slot => slot?.id === artist.id);
                                    const isFeatured = featuredArtists.has(artist.id);

                                    return (
                                        <div key={artist.id} className={`bg-[#1a1a24] border rounded-2xl p-4 flex gap-4 transition-all group relative ${isFeatured ? 'border-yellow-500/50 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]' : 'border-white/5 hover:bg-[#23232f]'}`}>
                                            {isFeatured && (
                                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg z-10">
                                                    <Crown size={12} fill="black" />
                                                </div>
                                            )}
                                            <div className={`relative w-20 h-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0 ${isFeatured ? 'ring-2 ring-yellow-500/50' : ''}`}>
                                                {artist.images[0] ? (
                                                    <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                        <Users size={20} className="text-gray-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-white truncate">{artist.name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getCategory(artist.popularity) === 'Big' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        getCategory(artist.popularity) === 'Mid Tier' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>
                                                        {getCategory(artist.popularity)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                                    <span>Pop: <span className="text-white font-bold">{artist.popularity}</span></span>
                                                    <span>•</span>
                                                    <span>{artist.followers.total.toLocaleString()} followers</span>
                                                </div>

                                                {isSelected ? (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                        Selezionato
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {availableSlots.length > 0 ? (
                                                            availableSlots.map(slot => (
                                                                <button
                                                                    key={slot.key}
                                                                    onClick={() => handleAddToSlot(artist, slot.key)}
                                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white text-white hover:text-black text-xs font-bold transition-all flex items-center gap-1"
                                                                >
                                                                    <Plus size={12} />
                                                                    {slot.label}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-500 italic">Nessuno slot disponibile</span>
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
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        <div className="bg-[#1a1a24] border border-white/10 rounded-3xl p-6 sticky top-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Il tuo Team</h2>
                                    {!isNewSeasonEntry && (
                                        <p className="text-xs text-blue-400 font-medium">Prossima Settimana</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                        <Users size={14} className="text-gray-400" />
                                        <span className="text-sm font-bold text-white">{filledSlotsCount}/5</span>
                                    </div>
                                    {hasChanges && (
                                        <button
                                            onClick={handleUndo}
                                            className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Annulla modifiche"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Info Banner inside Team Card */}
                            {false && hasChanges && !isNewSeasonEntry && (
                                <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                                    <div className="p-1.5 bg-blue-500/20 rounded-lg shrink-0">
                                        <Info size={16} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-gray-300 text-xs leading-relaxed">
                                            Le modifiche saranno attive dalla prossima settimana.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <TeamSummaryContent />
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar */}
                <div className="lg:hidden fixed bottom-[90px] left-4 right-4 bg-[#1a1a24] border border-white/10 p-4 z-40 flex justify-between items-center rounded-2xl shadow-2xl shadow-black/50">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider">La tua Label</span>
                        <div className="font-bold text-white flex items-center gap-2">
                            {filledSlotsCount}/5 Slot
                            {filledSlotsCount === 5 && <span className="text-green-400 text-xs">● Completo</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMobileTeam(true)}
                        className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2"
                    >
                        <span>Vedi Team</span>
                        <ChevronUp size={18} />
                    </button>
                </div>

                {/* Mobile Team Modal/Sheet */}
                {showMobileTeam && (
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                        <div
                            className="bg-[#1a1a24] w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#1a1a24] z-10 pb-4 border-b border-white/5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white">La tua Label</h2>
                                        <button
                                            onClick={handleUndo}
                                            disabled={!hasChanges}
                                            className={`p-1.5 rounded-lg transition-colors ${hasChanges
                                                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                                                : 'text-gray-700 cursor-not-allowed'
                                                }`}
                                            title="Annulla modifiche"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400">Gestisci il tuo roster</p>
                                </div>
                                <button
                                    onClick={() => setShowMobileTeam(false)}
                                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="text-gray-400" size={20} />
                                </button>
                            </div>

                            <TeamSummaryContent />
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
        <div className={`relative p-4 rounded-xl border transition-all ${artist ? (isFeatured ? 'bg-yellow-500/5 border-yellow-500/50' : 'bg-white/5 border-white/10') : 'bg-white/5 border-dashed border-white/10 hover:border-white/20'}`}>
            {artist ? (
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={artist.images[0]?.url} alt={artist.name} className="w-12 h-12 rounded-lg object-cover" />
                        {isCaptain && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg z-10">
                                <Crown size={12} className="fill-black" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-white truncate">{artist.name}</div>
                            {isFeatured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                            {multiplier && multiplier > 1 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${multiplier === 2 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' : 'bg-purple-500/20 text-purple-400 border-purple-500/20'}`}>
                                    x{multiplier}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-400">
                            Pop: <span className="text-white font-bold">{artist.popularity}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onSetCaptain}
                            className={`p-1.5 rounded-lg transition-colors ${isCaptain ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            title="Imposta Capitano"
                        >
                            <Crown size={16} className={isCaptain ? 'fill-black' : ''} />
                        </button>
                        <button
                            onClick={onRemove}
                            className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between h-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                            {icon}
                        </div>
                        <div>
                            <div className="font-medium text-gray-400">{label}</div>
                            <div className="text-xs text-gray-500">{subLabel}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
