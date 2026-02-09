'use client';

import React, { useState } from 'react';
import { Package, Coins, ShoppingCart, Loader2, Gift, CheckCircle2, ChevronRight, X, Frown } from 'lucide-react';
import { buyMysteryBoxAction } from '@/app/actions/mystery-box';
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
    prizes: any[];
}

interface MarketplaceClientProps {
    initialBoxes: MysteryBox[];
    userMusiCoins: number;
    userOrderCounts: Record<string, number>;
}

export default function MarketplaceClient({ initialBoxes, userMusiCoins, userOrderCounts }: MarketplaceClientProps) {
    const [selectedBox, setSelectedBox] = useState<MysteryBox | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [wonPrizes, setWonPrizes] = useState<any[] | null>(null);
    const [isNoWin, setIsNoWin] = useState(false);
    const router = useRouter();

    const handleBuy = async (boxId: string) => {
        setIsBuying(true);
        const res = await buyMysteryBoxAction(boxId);
        if (res.success && res.data) {
            if (res.data.isNoWin) {
                setIsNoWin(true);
            } else {
                setWonPrizes(res.data.wonPrizes);
            }
            router.refresh();
        } else {
            alert(res.message);
            setSelectedBox(null);
        }
        setIsBuying(false);
    };

    return (
        <div className="space-y-12">
            {/* MusiCoins Balance - Responsive */}
            <div className="lg:hidden md:hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-[2.5rem] p-4 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] mb-1">Il tuo Saldo Attuale</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                            <Coins size={28} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-yellow-400 italic tracking-tighter">{userMusiCoins}</span>
                            <span className="text-sm font-black text-yellow-600 uppercase tracking-widest italic">MusiCoins</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {initialBoxes.map((box) => (
                    <div
                        key={box.id}
                        className="group relative bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl"
                    >
                        {/* Box Image / Visual Placeholder */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center overflow-hidden">
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
                                <Coins size={12} className="text-yellow-400" />
                                <span className="text-xs font-black text-white uppercase tracking-tighter">{box.price_musicoins}</span>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${box.type === 'digital' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {box.type === 'digital' ? 'Digital' : 'Fisico'}
                                </div>
                                {box.available_copies !== null && (
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Stock: {box.available_copies}
                                    </div>
                                )}
                                {box.max_copies_per_user !== null && (
                                    <div className={`text-[10px] font-bold uppercase tracking-wider ${(userOrderCounts[box.id] || 0) >= box.max_copies_per_user ? 'text-red-500' : 'text-purple-400'}`}>
                                        Limite: {userOrderCounts[box.id] || 0}/{box.max_copies_per_user}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2 group-hover:text-purple-400 transition-colors">{box.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">{box.description}</p>

                            <button
                                onClick={() => setSelectedBox(box)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                Scopri di più
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
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
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Hai Vinto:</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                                    {wonPrizes.map((prize, i) => (
                                        <div key={i} className="relative group bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-all">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${prize.type === 'musicoins' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {prize.type === 'musicoins' ? <Coins size={24} /> : <Gift size={24} />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-lg font-black text-white leading-tight uppercase italic">{prize.name}</p>
                                                {prize.type === 'musicoins' ? (
                                                    <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Accreditati</p>
                                                ) : (
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Standard Item</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

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
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Potresti vincere:</h4>
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
