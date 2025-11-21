'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, LogOut, Loader2, X, Save, Trophy, Users, Zap, ChevronUp, Star, Crown } from 'lucide-react';
import Image from 'next/image';
import { searchArtistsAction } from '@/app/actions/spotify';
import { saveTeamAction, TeamSlots } from '@/app/actions/team';
import { getFeaturedArtistsAction } from '@/app/actions/artist';
import { SpotifyArtist } from '@/lib/spotify';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/logout-button';

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

    useEffect(() => {
        const fetchFeatured = async () => {
            const featured = await getFeaturedArtistsAction();
            setFeaturedArtists(new Set(featured.map(a => a.id)));
        };
        fetchFeatured();
    }, []);

    useEffect(() => {
        const fetchArtists = async () => {
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
    }, [debouncedSearchTerm]);

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

    const handleSaveTeam = async () => {
        setIsSaving(true);
        setSaveError(null);

        // Basic client-side validation check
        const emptySlots = Object.values(draftTeam).some(slot => slot === null);
        if (emptySlots) {
            setSaveError('Devi riempire tutti gli slot prima di salvare!');
            setIsSaving(false);
            return;
        }

        if (!captainId) {
            setSaveError('Devi selezionare un Capitano!');
            setIsSaving(false);
            return;
        }

        const result = await saveTeamAction(draftTeam, captainId);

        if (result.success) {
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

    const TeamSummaryContent = () => (
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
            />

            {saveError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    {saveError}
                </div>
            )}

            <button
                onClick={handleSaveTeam}
                disabled={filledSlotsCount < 5 || !captainId || isSaving}
                className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${filledSlotsCount === 5 && captainId
                    ? 'bg-white text-black hover:bg-purple-400 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Salvataggio...' : 'Conferma Team'}
            </button>
        </div>
    );

    return (
        <>
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
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Talent Scout</h1>
                            <p className="text-gray-400">Cerca le prossime star. Ricorda: hai un budget di popolarità da rispettare.</p>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-4 z-40 bg-[#0b0b10]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Cerca artista (es. Shiva, thasup...)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-[#1a1a24] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/5 transition-all"
                                />
                                {isLoading && (
                                    <div className="absolute right-4 top-3.5">
                                        <Loader2 className="animate-spin text-purple-500" size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
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
                                {searchTerm.length < 2 ? 'Inizia a cercare...' : `Risultati Ricerca (${filteredArtists.length})`}
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
                                <h2 className="text-xl font-bold text-white">La tua Label</h2>
                                <span className="text-sm text-purple-400 font-bold">{filledSlotsCount}/5</span>
                            </div>
                            <TeamSummaryContent />
                        </div>
                    </div>

                </div>

                {/* Mobile Bottom Bar */}
                <div className="lg:hidden fixed bottom-[72px] left-4 right-4 bg-[#1a1a24] border border-white/10 p-4 z-40 flex justify-between items-center rounded-2xl shadow-2xl shadow-black/50">
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
                                    <h2 className="text-xl font-bold text-white">La tua Label</h2>
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

function SlotPreview({ label, subLabel, artist, onRemove, icon, isCaptain, onSetCaptain, isFeatured }: { label: string, subLabel: string, artist: SpotifyArtist | null, onRemove: () => void, icon: React.ReactNode, isCaptain: boolean, onSetCaptain: () => void, isFeatured: boolean }) {
    return (
        <div className={`p-3 rounded-xl border transition-all ${artist ? (isCaptain ? 'bg-purple-500/10 border-purple-500' : 'bg-white/5 border-purple-500/30') : 'bg-black/20 border-white/5 border-dashed'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-bold text-gray-300">{label}</span>
                </div>
                <span className="text-[10px] text-gray-500">{subLabel}</span>
            </div>

            {artist ? (
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        {artist.images[0] && (
                            <Image src={artist.images[0].url} alt={artist.name} fill className="object-cover" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-sm font-bold text-white truncate">{artist.name}</p>
                            {isFeatured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                        </div>
                        <p className="text-[10px] text-gray-400">Pop: {artist.popularity}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onSetCaptain}
                            className={`p-1.5 rounded-lg transition-colors ${isCaptain ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            title="Imposta Capitano"
                        >
                            <Crown size={16} className={isCaptain ? 'fill-black' : ''} />
                        </button>
                        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-10 flex items-center justify-center text-xs text-gray-600">
                    Vuoto
                </div>
            )}
        </div>
    );
}

