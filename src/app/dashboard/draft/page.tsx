'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, LogOut, Loader2, X, Save, Trophy, Users, Zap, ChevronUp, Star, Crown, Sparkles, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { searchArtistsAction } from '@/app/actions/spotify';
import { saveTeamAction, TeamSlots, getUserTeamAction } from '@/app/actions/team';
import { getFeaturedArtistsAction, getArtistAction } from '@/app/actions/artist';
import { getScoutSuggestionsAction, ScoutSuggestion } from '@/app/actions/scout';
import { getCurrentSeasonAction } from '@/app/actions/season';
import { SpotifyArtist } from '@/lib/spotify';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/logout-button';
import ScoutSuggestionModal from '@/components/dashboard/scout-suggestion-modal';
import { createClient } from '@/utils/supabase/client';
import InviteButton from '@/components/dashboard/invite-button';

// Helper to categorize artists based on popularity
const getCategory = (popularity: number) => {
    if (popularity >= 76) return 'Big';
    if (popularity >= 30) return 'Mid Tier';
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
    const [viewMode, setViewMode] = useState<'search' | 'featured'>('search');

    // MusiCoin & Season State
    const [initialTeam, setInitialTeam] = useState<TeamSlots | null>(null);
    const [initialCaptainId, setInitialCaptainId] = useState<string | null>(null);
    const [cost, setCost] = useState(0);
    const [showCostModal, setShowCostModal] = useState(false);
    const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
    const [isNewSeasonEntry, setIsNewSeasonEntry] = useState(false);
    const [musiCoins, setMusiCoins] = useState(0);
    const [referralCode, setReferralCode] = useState<string | undefined>(undefined);

    // Scout Report State
    const [isScoutModalOpen, setIsScoutModalOpen] = useState(false);
    const [scoutSuggestions, setScoutSuggestions] = useState<ScoutSuggestion[]>([]);
    const [isScoutLoading, setIsScoutLoading] = useState(false);
    const [activeScoutSlotId, setActiveScoutSlotId] = useState<keyof TeamSlots | null>(null);

    // Load Team (DB or LocalStorage)
    useEffect(() => {
        const loadData = async () => {
            // 0. Get Current Season & Profile
            const season = await getCurrentSeasonAction();
            if (season) setCurrentSeasonId(season.id);

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
            if (viewMode === 'featured') return;

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

    const handleLoadFeatured = async () => {
        setIsLoading(true);
        setViewMode('featured');
        setSearchTerm('');
        const featured = await getFeaturedArtistsAction();
        setArtists(featured);
        setIsLoading(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (viewMode === 'featured') {
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

    // Scout Handlers
    const handleOpenScout = async (slotKey: keyof TeamSlots) => {
        setActiveScoutSlotId(slotKey);
        setIsScoutModalOpen(true);
        setShowMobileTeam(false); // Close mobile team sheet if open
        setIsScoutLoading(true);
        try {
            const suggestions = await getScoutSuggestionsAction();
            setScoutSuggestions(suggestions);
        } catch (error) {
            console.error("Failed to fetch suggestions", error);
        } finally {
            setIsScoutLoading(false);
        }
    };

    const handleRerollScout = async () => {
        setIsScoutLoading(true);
        try {
            const suggestions = await getScoutSuggestionsAction();
            setScoutSuggestions(suggestions);
        } catch (error) {
            console.error("Failed to fetch suggestions", error);
        } finally {
            setIsScoutLoading(false);
        }
    };

    const handleSignScout = async (artist: ScoutSuggestion) => {
        if (!activeScoutSlotId) return;

        setIsScoutLoading(true);
        try {
            // Fetch full artist data from cache (includes followers)
            const fullArtist = await getArtistAction(artist.spotify_id);

            if (fullArtist) {
                handleAddToSlot(fullArtist, activeScoutSlotId);
            } else {
                // Fallback if not found (shouldn't happen for scouted artists)
                const fallbackArtist: SpotifyArtist = {
                    id: artist.spotify_id,
                    name: artist.name,
                    images: [{ url: artist.image_url, height: 0, width: 0 }],
                    popularity: artist.popularity,
                    genres: artist.genre ? [artist.genre] : [],
                    followers: { total: 0 }
                };
                handleAddToSlot(fallbackArtist, activeScoutSlotId);
            }
        } catch (error) {
            console.error("Failed to sign scouted artist", error);
        } finally {
            setIsScoutLoading(false);
            setIsScoutModalOpen(false);
            setActiveScoutSlotId(null);
        }
    };

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
                    subLabel="Pop > 75"
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
                    subLabel="Pop 30-75"
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
                    subLabel="Pop 30-75"
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
                    subLabel="Pop < 30"
                    artist={draftTeam.slot_4}
                    onRemove={() => handleRemoveFromSlot('slot_4')}
                    icon={<Zap size={14} className="text-green-400" />}
                    isCaptain={draftTeam.slot_4?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_4 && handleSetCaptain(draftTeam.slot_4.id)}
                    isFeatured={draftTeam.slot_4 ? featuredArtists.has(draftTeam.slot_4.id) : false}
                    onOpenScout={() => handleOpenScout('slot_4')}
                    showScoutBtn={!draftTeam.slot_4}
                    multiplier={draftTeam.slot_4?.id === captainId ? (featuredArtists.has(draftTeam.slot_4.id) ? 2 : 1.5) : undefined}
                />
                <SlotPreview
                    label="New Gen 2"
                    subLabel="Pop < 30"
                    artist={draftTeam.slot_5}
                    onRemove={() => handleRemoveFromSlot('slot_5')}
                    icon={<Zap size={14} className="text-green-400" />}
                    isCaptain={draftTeam.slot_5?.id === captainId}
                    onSetCaptain={() => draftTeam.slot_5 && handleSetCaptain(draftTeam.slot_5.id)}
                    isFeatured={draftTeam.slot_5 ? featuredArtists.has(draftTeam.slot_5.id) : false}
                    onOpenScout={() => handleOpenScout('slot_5')}
                    showScoutBtn={!draftTeam.slot_5}
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
                        <p className="text-xs text-gray-400">Season Zero</p>
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
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 bg-[#1a1a24] rounded-lg border border-white/10 text-sm font-medium text-yellow-400 flex items-center gap-2">
                                    <span>MusiCoins:</span>
                                    <span className="font-bold">{musiCoins}</span>
                                </div>
                                <InviteButton referralCode={referralCode} />
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col gap-4 mb-8 sticky top-4 z-40 bg-[#0b0b10]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Cerca artista (es. Shiva, thasup...)"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full h-12 pl-12 pr-4 bg-[#1a1a24] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/5 transition-all"
                                />
                                {isLoading && (
                                    <div className="absolute right-4 top-3.5">
                                        <Loader2 className="animate-spin text-purple-500" size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                                <button
                                    onClick={handleLoadFeatured}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${viewMode === 'featured'
                                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                        : 'bg-[#1a1a24] text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10'
                                        }`}
                                >
                                    <Star size={16} className={viewMode === 'featured' ? 'fill-black' : 'fill-yellow-500'} />
                                    Consigliati
                                </button>
                                {['All', 'New Gen', 'Mid Tier', 'Big'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeFilter === filter
                                            ? 'bg-white text-black shadow-lg shadow-white/10'
                                            : 'bg-[#1a1a24] text-gray-400 border border-white/5 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        {filter === 'New Gen' ? 'New Gen < 30' : filter === 'Mid Tier' ? 'Mid Tier 30-75' : filter === 'Big' ? 'Big > 75' : 'Tutti'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                {viewMode === 'featured'
                                    ? `Artisti Consigliati (${filteredArtists.length})`
                                    : searchTerm.length < 2
                                        ? 'Inizia a cercare...'
                                        : `Risultati Ricerca (${filteredArtists.length})`
                                }
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredArtists.map((artist) => {
                                    const category = getCategory(artist.popularity);
                                    const availableSlots = getAvailableSlots(artist);
                                    const isAlreadySelected = Object.values(draftTeam).some(slot => slot?.id === artist.id);
                                    const isFeatured = featuredArtists.has(artist.id);

                                    return (
                                        <div key={artist.id} className={`bg-[#1a1a24] p-4 rounded-2xl border transition-all group ${isAlreadySelected ? 'border-purple-500/50 opacity-50' : isFeatured ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-white/5 hover:border-purple-500/50'}`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex gap-4">
                                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-800">
                                                        {artist.images[0] ? (
                                                            <Image
                                                                src={artist.images[0].url}
                                                                alt={artist.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No IMG</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors line-clamp-1">{artist.name}</h4>
                                                            {isFeatured && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                                                        </div>
                                                        <span className="text-xs text-gray-400 line-clamp-1">{artist.genres[0] || 'Artist'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-gray-400 uppercase">Popolarità</span>
                                                    <span className="text-lg font-bold text-white">{artist.popularity}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    {isAlreadySelected ? (
                                                        <span className="text-xs text-purple-400 font-bold px-3 py-1 bg-purple-500/10 rounded-lg">Selezionato</span>
                                                    ) : availableSlots.length > 0 ? (
                                                        availableSlots.map(slot => (
                                                            <button
                                                                key={slot.key}
                                                                onClick={() => handleAddToSlot(artist, slot.key)}
                                                                className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-purple-400 transition-colors"
                                                            >
                                                                + {slot.label}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-500 px-3 py-1 bg-white/5 rounded-lg">Slot Pieni / Invalidi</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Right Column: Team Preview (Sticky) */}
                    <div className="hidden lg:block lg:col-span-4">
                        <div className="sticky top-8 bg-[#1a1a24] border border-white/5 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
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
                                <span className="text-sm text-purple-400 font-bold">{filledSlotsCount}/5</span>
                            </div>
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

                {/* Scout Modal */}
                <ScoutSuggestionModal
                    isOpen={isScoutModalOpen}
                    onClose={() => setIsScoutModalOpen(false)}
                    suggestions={scoutSuggestions}
                    onSign={handleSignScout}
                    onReroll={handleRerollScout}
                    isLoading={isScoutLoading}
                    maxPopularity={30}
                />

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
    onOpenScout,
    showScoutBtn,
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
    onOpenScout?: () => void,
    showScoutBtn?: boolean,
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
                        <div className="text-xs text-gray-400">{subLabel}</div>
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
                    {showScoutBtn && (
                        <button
                            onClick={onOpenScout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-xs font-bold border border-purple-500/20"
                        >
                            <Sparkles size={14} />
                            Suggerisci
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
