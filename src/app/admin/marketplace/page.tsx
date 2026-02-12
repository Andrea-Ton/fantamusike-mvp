'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Loader2, Edit2, Check, X, Coins } from 'lucide-react';
import {
    adminGetAllMysteryBoxesAction,
    adminCreateMysteryBoxAction,
    adminUpdateMysteryBoxAction,
    adminDeleteMysteryBoxAction
} from '@/app/actions/mystery-box';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { Image as ImageIcon, Upload, Loader2 as Spinner } from 'lucide-react';

interface Prize {
    name: string;
    type: 'standard' | 'musicoins';
    musicoins_value?: number;
    probability: number;
    is_certain: boolean;
    image_url?: string;
}

interface MysteryBox {
    id: string;
    title: string;
    description: string;
    image_url: string;
    type: 'physical' | 'digital';
    price_musicoins: number;
    total_copies: number | null;
    available_copies: number | null;
    is_active: boolean;
    max_copies_per_user: number | null;
    target_user_goal: number | null;
    prizes: Prize[];
}

export default function AdminMarketplacePage() {
    const [boxes, setBoxes] = useState<MysteryBox[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    // Form State
    const [formData, setFormData] = useState<Partial<MysteryBox>>({
        title: '',
        description: '',
        type: 'digital',
        price_musicoins: 100,
        total_copies: null,
        max_copies_per_user: null,
        target_user_goal: null,
        is_active: true,
        prizes: []
    });

    useEffect(() => {
        fetchBoxes();
    }, []);

    const fetchBoxes = async () => {
        setIsLoading(true);
        const res = await adminGetAllMysteryBoxesAction();
        if (res.success && res.data) {
            setBoxes(res.data as MysteryBox[]);
        }
        setIsLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `boxes/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
            .from('marketplace')
            .upload(filePath, file);

        if (uploadError) {
            alert('Errore caricamento: ' + uploadError.message);
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('marketplace')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        }
        setIsUploading(false);
    };

    const handleSave = async () => {
        if (isEditing) {
            // Se total_copies viene cambiato, dobbiamo resettare available_copies
            // In un sistema reale useremmo una migrazione o un trigger, ma qui lo facciamo esplicitamente
            const res = await adminUpdateMysteryBoxAction(isEditing, {
                ...formData,
                available_copies: formData.total_copies
            });
            if (res.success) {
                setIsEditing(null);
                fetchBoxes();
            } else {
                alert(res.message);
            }
        } else {
            const res = await adminCreateMysteryBoxAction(formData);
            if (res.success) {
                setIsCreating(false);
                fetchBoxes();
                setFormData({
                    title: '',
                    description: '',
                    type: 'digital',
                    price_musicoins: 100,
                    total_copies: null,
                    max_copies_per_user: null,
                    is_active: true,
                    prizes: []
                });
            } else {
                alert(res.message);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminare questa MysteryBox?')) return;
        const res = await adminDeleteMysteryBoxAction(id);
        if (res.success) {
            fetchBoxes();
        } else {
            alert(res.message);
        }
    };

    const addPrize = () => {
        setFormData(prev => ({
            ...prev,
            prizes: [...(prev.prizes || []), { name: '', type: 'standard', probability: 0, is_certain: false }]
        }));
    };

    const removePrize = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prizes: (prev.prizes || []).filter((_, i) => i !== index)
        }));
    };

    const updatePrize = (index: number, field: keyof Prize, value: any) => {
        setFormData(prev => {
            const newPrizes = [...(prev.prizes || [])];
            newPrizes[index] = { ...newPrizes[index], [field]: value };
            return { ...prev, prizes: newPrizes };
        });
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Marketplace MysteryBoxes</h1>
                    <p className="text-gray-400 mt-1">Gestisci le MysteryBox in vendita e i relativi premi.</p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setIsEditing(null);
                        setFormData({
                            title: '',
                            description: '',
                            type: 'digital',
                            price_musicoins: 100,
                            total_copies: null,
                            is_active: true,
                            prizes: []
                        });
                    }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20"
                >
                    <Plus size={20} />
                    Nuova MysteryBox
                </button>
            </div>

            {(isCreating || isEditing) && (
                <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        {isEditing ? <Edit2 size={20} className="text-purple-400" /> : <Plus size={20} className="text-purple-400" />}
                        {isEditing ? 'Modifica MysteryBox' : 'Crea Nuova MysteryBox'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Titolo</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                    placeholder="Es: Box Leggendaria Sanremo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Descrizione</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors h-24"
                                    placeholder="Descrivi cosa contiene la box..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                    >
                                        <option value="digital">Digitale</option>
                                        <option value="physical">Fisico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Prezzo (MusiCoins)</label>
                                    <input
                                        type="number"
                                        value={formData.price_musicoins}
                                        onChange={(e) => setFormData({ ...formData, price_musicoins: parseInt(e.target.value) })}
                                        className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Disponibilità Copie</label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.total_copies === null}
                                            onChange={(e) => setFormData({ ...formData, total_copies: e.target.checked ? null : 1 })}
                                            className="w-4 h-4 rounded border-white/10 bg-[#0f0f16] text-purple-600 focus:ring-purple-500 transition-all"
                                        />
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-purple-400 transition-colors">ILLIMITATE</span>
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    value={formData.total_copies === null ? '' : formData.total_copies}
                                    onChange={(e) => setFormData({ ...formData, total_copies: e.target.value ? parseInt(e.target.value) : 1 })}
                                    disabled={formData.total_copies === null}
                                    className={`w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors ${formData.total_copies === null ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    placeholder={formData.total_copies === null ? 'Stock Infinito' : 'Inserisci numero copie...'}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Limite per Utente</label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={formData.max_copies_per_user === null}
                                            onChange={(e) => setFormData({ ...formData, max_copies_per_user: e.target.checked ? null : 1 })}
                                            className="w-4 h-4 rounded border-white/10 bg-[#0f0f16] text-purple-600 focus:ring-purple-500 transition-all"
                                        />
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-purple-400 transition-colors">ILLIMITATO</span>
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    value={formData.max_copies_per_user === null ? '' : formData.max_copies_per_user}
                                    onChange={(e) => setFormData({ ...formData, max_copies_per_user: e.target.value ? parseInt(e.target.value) : 1 })}
                                    disabled={formData.max_copies_per_user === null}
                                    className={`w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors ${formData.max_copies_per_user === null ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    placeholder={formData.max_copies_per_user === null ? 'Nessun limite' : 'Max copie per utente...'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Obiettivo Community (Target Utenti)</label>
                                <input
                                    type="number"
                                    value={formData.target_user_goal === null ? '' : formData.target_user_goal}
                                    onChange={(e) => setFormData({ ...formData, target_user_goal: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                    placeholder="Es: 500 (Lascia vuoto per sblocco immediato)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Immagine Box</label>
                                <div className="flex gap-4 items-start">
                                    <div className="relative w-32 h-32 rounded-2xl bg-white/5 border border-dashed border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 group">
                                        {formData.image_url ? (
                                            <>
                                                <Image
                                                    src={formData.image_url}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"
                                                >
                                                    Rimuovi
                                                </button>
                                            </>
                                        ) : (
                                            <ImageIcon size={32} className="text-gray-600" />
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <Spinner size={24} className="animate-spin text-purple-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleUpload}
                                                className="hidden"
                                                id="box-image-upload"
                                                disabled={isUploading}
                                            />
                                            <label
                                                htmlFor="box-image-upload"
                                                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-gray-300 cursor-pointer transition-all"
                                            >
                                                <Upload size={16} />
                                                {isUploading ? 'Caricamento...' : 'Scegli Immagine'}
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="O inserisci URL..."
                                            value={formData.image_url || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                            className="w-full bg-[#0f0f16] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Premi della Box</label>
                                <button
                                    onClick={addPrize}
                                    className="text-xs bg-white/5 hover:bg-white/10 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                                >
                                    <Plus size={14} /> Aggiungi Premio
                                </button>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {formData.prizes?.map((prize, idx) => (
                                    <div key={idx} className="bg-[#0f0f16] border border-white/5 p-4 rounded-xl space-y-3 relative group">
                                        <button
                                            onClick={() => removePrize(idx)}
                                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 p-1 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={prize.name}
                                                onChange={(e) => updatePrize(idx, 'name', e.target.value)}
                                                className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white"
                                                placeholder="Nome Premio"
                                            />
                                            <select
                                                value={prize.type}
                                                onChange={(e) => updatePrize(idx, 'type', e.target.value as any)}
                                                className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white"
                                            >
                                                <option value="standard">Standard (Concierge)</option>
                                                <option value="musicoins">MusiCoins (Instant)</option>
                                            </select>
                                        </div>

                                        <div className="flex gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Probabilità (%)</label>
                                                <input
                                                    type="number"
                                                    value={prize.probability}
                                                    onChange={(e) => updatePrize(idx, 'probability', parseFloat(e.target.value))}
                                                    className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white"
                                                />
                                            </div>
                                            {prize.type === 'musicoins' && (
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-yellow-500 font-bold uppercase block mb-1">Valore MusiCoins</label>
                                                    <input
                                                        type="number"
                                                        value={prize.musicoins_value || 0}
                                                        onChange={(e) => updatePrize(idx, 'musicoins_value', parseInt(e.target.value))}
                                                        className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2 text-sm text-yellow-400"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 pb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={prize.is_certain}
                                                    onChange={(e) => updatePrize(idx, 'is_certain', e.target.checked)}
                                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500"
                                                />
                                                <label className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">Certo</label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!formData.prizes || formData.prizes.length === 0) && (
                                    <div className="text-center py-8 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                                        Nessun premio aggiunto
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-white/5">
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setIsEditing(null);
                            }}
                            className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
                        >
                            Salva MysteryBox
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl" />
                    ))
                ) : boxes.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Package size={48} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Nessuna MysteryBox creata</p>
                    </div>
                ) : (
                    boxes.map((box) => (
                        <div key={box.id} className="group relative bg-[#1a1a24] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 shadow-xl flex flex-col">
                            {/* Box Image Preview in List */}
                            {box.image_url && (
                                <div className="h-32 w-full relative border-b border-white/5 bg-black/20 overflow-hidden">
                                    <Image
                                        src={box.image_url}
                                        alt={box.title}
                                        fill
                                        className="object-cover opacity-60 hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] to-transparent" />
                                </div>
                            )}

                            {/* Card Content */}
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${box.type === 'digital' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {box.type}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/10">
                                        <Coins size={14} />
                                        <span className="text-sm font-black tracking-tighter">{box.price_musicoins} Coins</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-white mb-2">{box.title}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 h-10 mb-6">{box.description}</p>

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                        <span className="text-gray-500">Stock:</span>
                                        <span className="text-white">
                                            {box.total_copies === null ? 'Illimitati' : `${box.available_copies} / ${box.total_copies}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                        <span className="text-gray-500">Premi:</span>
                                        <span className="text-purple-400">{box.prizes.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                        <span className="text-gray-500">Stato:</span>
                                        <span className={box.is_active ? 'text-green-500' : 'text-red-500'}>
                                            {box.is_active ? 'ATTIVO' : 'DISATTIVATO'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Actions Footer */}
                            <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                                <button
                                    onClick={async () => {
                                        const res = await adminUpdateMysteryBoxAction(box.id, { is_active: !box.is_active });
                                        if (res.success) fetchBoxes();
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${box.is_active
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                        : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                                        }`}
                                >
                                    {box.is_active ? 'Disattiva' : 'Attiva'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(box.id);
                                        setIsCreating(false);
                                        setFormData(box);
                                    }}
                                    className="p-2.5 bg-white/5 text-white hover:bg-purple-600 rounded-xl transition-all"
                                    title="Modifica"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(box.id)}
                                    className="p-2.5 bg-white/5 text-white hover:bg-red-600 rounded-xl transition-all"
                                    title="Elimina"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
