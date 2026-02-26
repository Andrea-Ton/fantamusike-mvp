'use client';

import React, { useState } from 'react';
import {
    Package,
    Coins,
    ChevronRight,
    X,
    AlertCircle,
    ShoppingBag,
    Sparkles,
    Gift,
    Filter,
    LayoutGrid,
    CheckCircle2,
    Unlock,
    Zap,
    Monitor,
    Box,
    Frown,
    Loader2,
    ShoppingCart,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal
} from 'lucide-react';
import { buyMysteryBoxAction } from '@/app/actions/mystery-box';
import { NotificationPing } from '@/components/ui/notification-ping';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface MysteryBox {
    id: string;
    title: string;
    description: string;
    image_url: string;
    type: 'physical' | 'digital';
    price_musicoins: number;
    available_copies: number | null;
    max_copies_per_user: number | null;
    target_user_goal: number | null;
    prizes: any[];
}

interface MarketplaceClientProps {
    initialBoxes: MysteryBox[];
    userMusiCoins: number;
    userOrderCounts: Record<string, number>;
    totalUsers: number;
}

export default function MarketplaceClient({ initialBoxes, userMusiCoins, userOrderCounts, totalUsers }: MarketplaceClientProps) {
    const [selectedBox, setSelectedBox] = useState<MysteryBox | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [wonPrizes, setWonPrizes] = useState<any[] | null>(null);
    const [isNoWin, setIsNoWin] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [hasNonCoinPrize, setHasNonCoinPrize] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const router = useRouter();

    const FILTER_OPTIONS = [
        { id: 'all', label: 'Tutte', icon: LayoutGrid },
        { id: 'available', label: 'Disponibili', icon: CheckCircle2 },
        { id: 'locked', label: 'Da Sbloccare', icon: Unlock },
        { id: 'physical', label: 'Fisiche', icon: Box },
        { id: 'digital', label: 'Digitali', icon: Monitor },
        { id: 'free', label: 'Free', icon: Zap },
    ];

    // Sorting & Filtering Logic
    const filteredAndSortedBoxes = React.useMemo(() => {
        let result = [...initialBoxes];

        // 1. Filter
        if (activeFilter !== 'all') {
            result = result.filter(box => {
                const isLimitReached = box.max_copies_per_user !== null && (userOrderCounts[box.id] || 0) >= box.max_copies_per_user;
                const isOutOfStock = box.available_copies !== null && box.available_copies <= 0;
                const isUnavailable = isLimitReached || isOutOfStock;
                const isCommunityLocked = box.target_user_goal !== null && totalUsers < box.target_user_goal;

                switch (activeFilter) {
                    case 'available': return !isUnavailable && !isCommunityLocked;
                    case 'locked': return isCommunityLocked;
                    case 'physical': return box.type === 'physical';
                    case 'digital': return box.type === 'digital';
                    case 'free': return box.price_musicoins === 0;
                    default: return true;
                }
            });
        }

        // 2. Sort: Available first, then Free first, then Price Descending
        return result.sort((a, b) => {
            const isLimitReachedA = a.max_copies_per_user !== null && (userOrderCounts[a.id] || 0) >= a.max_copies_per_user;
            const isOutOfStockA = a.available_copies !== null && a.available_copies <= 0;
            const isCommunityLockedA = a.target_user_goal !== null && totalUsers < a.target_user_goal;
            const isUnavailableA = isLimitReachedA || isOutOfStockA || isCommunityLockedA;

            const isLimitReachedB = b.max_copies_per_user !== null && (userOrderCounts[b.id] || 0) >= b.max_copies_per_user;
            const isOutOfStockB = b.available_copies !== null && b.available_copies <= 0;
            const isCommunityLockedB = b.target_user_goal !== null && totalUsers < b.target_user_goal;
            const isUnavailableB = isLimitReachedB || isOutOfStockB || isCommunityLockedB;

            // Group 1: Availability (Available first)
            if (!isUnavailableA && isUnavailableB) return -1;
            if (isUnavailableA && !isUnavailableB) return 1;

            // If both available, Group 2: Free first
            if (!isUnavailableA && !isUnavailableB) {
                const isFreeA = a.price_musicoins === 0;
                const isFreeB = b.price_musicoins === 0;
                if (isFreeA && !isFreeB) return -1;
                if (!isFreeA && isFreeB) return 1;
            }

            // Group 3: Price Descending (for both paid available or both unavailable)
            return b.price_musicoins - a.price_musicoins;
        });
    }, [initialBoxes, userOrderCounts, activeFilter, totalUsers]);

    const handleBuy = async (boxId: string) => {
        setIsBuying(true);
        const res = await buyMysteryBoxAction(boxId);
        if (res.success && res.data) {
            if (res.data.isNoWin) {
                setIsNoWin(true);
            } else {
                setWonPrizes(res.data.wonPrizes);
                setUserEmail(res.data.userEmail || null);
                setHasNonCoinPrize(res.data.hasNonCoinPrize || false);
            }
            router.refresh();
        } else {
            alert(res.message);
            setSelectedBox(null);
        }
        setIsBuying(false);
    };

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Premium & Luxurious Filter Bar */}
            <div className="space-y-2">
                <button
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className="flex items-center gap-2 group transition-all"
                >
                    <div className="h-px w-6 bg-gradient-to-r from-purple-500 to-transparent opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic group-hover:text-purple-400 flex items-center gap-2 transition-colors">
                        <SlidersHorizontal size={12} className="opacity-50" />
                        Filtra Collezione
                        {isFilterExpanded ? <ChevronUp size={12} className="opacity-30" /> : <ChevronDown size={12} className="opacity-30" />}
                    </span>
                </button>

                <div className={`
                    overflow-hidden transition-all duration-500 ease-in-out
                    ${isFilterExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
                `}>
                    <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3">
                        {FILTER_OPTIONS.map((filter) => {
                            const Icon = filter.icon;
                            const isActive = activeFilter === filter.id;
                            const isNicheFilter = filter.id === 'physical' || filter.id === 'digital';

                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`
                                        relative flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3.5 py-3 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 border
                                        ${isNicheFilter ? 'hidden md:flex' : 'flex'}
                                        ${isActive
                                            ? 'bg-[#1a1a2e]/80 text-white border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)] scale-[1.02]'
                                            : 'bg-white/[0.02] text-gray-500 border-transparent md:border-white/5 hover:bg-white/[0.05] hover:text-gray-300 hover:border-white/10'
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-1.5 md:p-2 rounded-lg transition-colors duration-500
                                        ${isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'}
                                    `}>
                                        <Icon size={isActive ? 14 : 12} className={isActive ? 'animate-pulse' : ''} />
                                    </div>
                                    {filter.label}

                                    {isActive && (
                                        <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-tr from-purple-600/10 to-blue-600/10 pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedBoxes.map((box) => {
                    const isLimitReached = box.max_copies_per_user !== null && (userOrderCounts[box.id] || 0) >= box.max_copies_per_user;
                    const isOutOfStock = box.available_copies !== null && box.available_copies <= 0;
                    const isUnavailable = isLimitReached || isOutOfStock;
                    const isCommunityLocked = box.target_user_goal !== null && totalUsers < box.target_user_goal;

                    const canAfford = userMusiCoins >= box.price_musicoins;
                    const showPing = !isUnavailable && !isCommunityLocked && canAfford;

                    return (
                        <div
                            key={box.id}
                            className={`group relative bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl ${isUnavailable ? 'opacity-50 grayscale-[0.5]' : ''
                                }`}
                        >
                            {showPing && (
                                <NotificationPing className="absolute top-4 left-4 z-20 scale-125" />
                            )}
                            {/* Box Image / Visual Placeholder */}
                            <div className={`relative h-48 bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center overflow-hidden ${isUnavailable ? 'blur-[1px]' : ''}`}>
                                <div className="absolute inset-0 bg-[#0b0b10]/20" />
                                {box.image_url ? (
                                    <Image
                                        src={box.image_url}
                                        alt={box.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <Package size={80} className="text-purple-500/40 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
                                )}
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                                    <Coins size={12} className={`text-yellow-400 ${box.price_musicoins === 0 ? 'hidden' : ''}`} />
                                    <span className={`text-xs font-black text-white uppercase tracking-tighter ${box.price_musicoins === 0 ? 'text-green-400' : ''}`}>
                                        {box.price_musicoins === 0 ? 'FREE' : box.price_musicoins}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${box.type === 'digital' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {box.type === 'digital' ? 'Digital' : 'Fisico'}
                                    </div>
                                    {box.available_copies !== null && (
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isOutOfStock ? 'text-red-500' : 'text-gray-500'}`}>
                                            Stock: {box.available_copies}
                                        </div>
                                    )}
                                    {box.max_copies_per_user !== null && (
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isLimitReached ? 'text-red-500' : 'text-purple-400'}`}>
                                            Limite: {userOrderCounts[box.id] || 0}/{box.max_copies_per_user}
                                        </div>
                                    )}
                                </div>

                                {isCommunityLocked ? (
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2 flex items-center gap-2 break-words">
                                            <Package className="opacity-20" size={20} />
                                            {box.title}
                                        </h3>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Obiettivo Community</span>
                                                <span className="text-[10px] font-black text-gray-500">{totalUsers}/{box.target_user_goal}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (totalUsers / (box.target_user_goal || 1)) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-tighter leading-tight italic">
                                                Mancano <span className="text-purple-400">{(box.target_user_goal || 0) - totalUsers}</span> utenti per sbloccare questa MysteryBox!
                                            </p>
                                        </div>
                                        <div className="w-full bg-black/20 text-gray-600 font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl border border-white/5 flex items-center justify-center gap-2 cursor-not-allowed">
                                            Contenuto Bloccato
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2 group-hover:text-purple-400 transition-colors break-words">{box.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">{box.description}</p>

                                        <button
                                            onClick={() => setSelectedBox(box)}
                                            className={`w-full font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 group/btn ${isUnavailable
                                                ? 'bg-black/20 text-gray-600 border-white/5 cursor-not-allowed'
                                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                                }`}
                                        >
                                            {isUnavailable ? 'Non disponibile' : 'Scopri di più'}
                                            {!isUnavailable && <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selection/Open Modal */}
            {selectedBox && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isBuying && !wonPrizes && !isNoWin && setSelectedBox(null)} />

                    <div className="relative w-full max-w-xl bg-[#12121a] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-300">
                        {wonPrizes ? (
                            <div className="p-10 text-center space-y-8 py-16 animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.3em]">Complimenti!</h2>
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Hai ottenuto:</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                                    {wonPrizes.map((prize, i) => (
                                        <div key={i} className="relative group bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-all">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${prize.type === 'musicoins' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {prize.type === 'musicoins' ? <Coins size={24} /> : <Gift size={24} />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-lg font-black text-white leading-tight uppercase italic break-words">{prize.name}</p>
                                                {prize.type === 'musicoins' ? (
                                                    <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Accreditati</p>
                                                ) : (
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Standard Item</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {hasNonCoinPrize && userEmail && (
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-[2.5rem] p-8 md:p-10 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-[0_0_50px_rgba(168,85,247,0.1)] mb-4">
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-400 italic mb-2">
                                            Grazie per l'acquisto! ✨
                                        </p>
                                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                            Verrai contattato al più presto all'indirizzo:<br />
                                            <span className="text-white font-bold text-lg md:text-xl block mt-1 break-words">{userEmail}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="pt-8 px-8">
                                    <button
                                        onClick={() => {
                                            setSelectedBox(null);
                                            setWonPrizes(null);
                                            setIsNoWin(false);
                                        }}
                                        className="w-full bg-white text-black font-black uppercase tracking-widest py-5 rounded-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    >
                                        Fantastico!
                                    </button>
                                </div>
                            </div>
                        ) : isNoWin ? (
                            <div className="p-10 text-center space-y-8 py-16 animate-in zoom-in duration-500">
                                <div className="relative w-32 h-32 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-gray-500/20 rounded-full blur-3xl animate-pulse" />
                                    <div className="relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center shadow-2xl border border-white/10">
                                        <Frown size={48} className="text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">Niente da fare...</h2>
                                    <h3 className="text-4x font-black text-white italic uppercase tracking-tighter">Che sfortuna!</h3>
                                    <p className="text-gray-400 text-sm mt-4 max-w-[280px] mx-auto leading-relaxed">
                                        Questa volta la box era vuota, ma non preoccuparti:
                                        <span className="block text-yellow-500 font-black mt-1">NON HAI SPESO MUSICOINS!</span>
                                    </p>
                                </div>
                                <div className="pt-8 px-8">
                                    <button
                                        onClick={() => {
                                            setSelectedBox(null);
                                            setWonPrizes(null);
                                            setIsNoWin(false);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-white/10 transition-all"
                                    >
                                        Riprova più tardi
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => !isBuying && setSelectedBox(null)}
                                    className="absolute top-6 right-6 md:top-8 md:right-8 p-2 text-gray-400 hover:text-white transition-colors z-[110]"
                                >
                                    <X size={20} className="md:w-6 md:h-6" />
                                </button>

                                <div className="p-6 md:p-10">
                                    <div className="flex items-center gap-4 md:gap-6 mb-8 pr-10 md:pr-12">
                                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 overflow-hidden flex-shrink-0 shadow-lg">
                                            {selectedBox.image_url ? (
                                                <Image src={selectedBox.image_url} alt={selectedBox.title} fill className="object-cover" />
                                            ) : (
                                                <Package size={28} className="md:w-8 md:h-8" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tight break-words leading-[1.1]">{selectedBox.title}</h2>
                                            <div className="flex items-center gap-2 text-yellow-400 mt-1.5 md:mt-2">
                                                <Coins size={12} className="md:w-3.5 md:h-3.5" />
                                                <span className="text-xs md:text-sm font-black uppercase tracking-widest">{selectedBox.price_musicoins} MusiCoins</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Contiene:</h4>
                                            <div className="space-y-3">
                                                {selectedBox.prizes.map((prize: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${prize.type === 'musicoins' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                                {prize.type === 'musicoins' ? <Coins size={16} /> : <Gift size={16} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-gray-200">{prize.name}</span>
                                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                                                                    {prize.type === 'musicoins' ? 'Bonus' : 'Premio'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] font-black text-gray-500 group-hover:text-purple-400 transition-colors">
                                                            {prize.is_certain ? (
                                                                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[8px] uppercase tracking-tighter shadow-sm border border-purple-500/10 shadow-purple-500/20">SICURO</span>
                                                            ) : (
                                                                `${prize.probability}%`
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBuy(selectedBox.id)}
                                        disabled={
                                            isBuying ||
                                            userMusiCoins < selectedBox.price_musicoins ||
                                            (selectedBox.max_copies_per_user !== null && (userOrderCounts[selectedBox.id] || 0) >= selectedBox.max_copies_per_user) ||
                                            (selectedBox.available_copies !== null && selectedBox.available_copies <= 0)
                                        }
                                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${(userMusiCoins < selectedBox.price_musicoins ||
                                            (selectedBox.max_copies_per_user !== null && (userOrderCounts[selectedBox.id] || 0) >= selectedBox.max_copies_per_user) ||
                                            (selectedBox.available_copies !== null && selectedBox.available_copies <= 0))
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25'
                                            }`}
                                    >
                                        {isBuying ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (selectedBox.max_copies_per_user !== null && (userOrderCounts[selectedBox.id] || 0) >= selectedBox.max_copies_per_user) ? (
                                            'Limite Raggiunto'
                                        ) : (selectedBox.available_copies !== null && selectedBox.available_copies <= 0) ? (
                                            'Esaurito'
                                        ) : userMusiCoins < selectedBox.price_musicoins ? (
                                            'MusiCoins Insufficienti'
                                        ) : (
                                            <>
                                                <ShoppingCart size={20} />
                                                Acquista Ora
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
