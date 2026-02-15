'use client';

import React, { useState, useEffect } from 'react';
import { adminGetAllOrdersAction, adminUpdateOrderStatusAction } from '@/app/actions/orders';
import { Package, Clock, CheckCircle, Truck, Loader2, User, Coins, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'shipped' | 'completed';
    user_id: string;
    email?: string;
    box_id: string;
    prize_won: any;
    mystery_boxes: {
        title: string;
        type: string;
    };
    profiles: {
        username: string;
        id: string;
    };
}

const STATUS_CONFIG = {
    pending: { label: 'Da Evadere', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Clock },
    shipped: { label: 'Spedito', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Truck },
    completed: { label: 'Completato', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        const res = await adminGetAllOrdersAction();
        if (res.success && res.data) {
            setOrders(res.data as Order[]);
        }
        setIsLoading(false);
    };

    const handleUpdateStatus = async (orderId: string, status: any) => {
        setUpdatingId(orderId);
        const res = await adminUpdateOrderStatusAction(orderId, status);
        if (res.success) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        } else {
            alert(res.message);
        }
        setUpdatingId(null);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Gestione Ordini</h1>
                <p className="text-gray-400 mt-1">Monitora e gestisci le MysteryBox acquistate dagli utenti.</p>
            </div>

            <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Utente</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mystery Box</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Premio Vinto</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stato</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                        Nessun ordine trovato.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const status = STATUS_CONFIG[order.status];
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-xs text-white font-bold">
                                                    {format(new Date(order.created_at), 'dd MMM yyyy', { locale: it })}
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {format(new Date(order.created_at), 'HH:mm')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                                        <User size={14} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                                                            {order.profiles.username}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-medium">
                                                            {order.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-gray-500" />
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{order.mystery_boxes.title}</div>
                                                        <div className={`text-[10px] font-black uppercase tracking-tighter ${order.mystery_boxes.type === 'digital' ? 'text-blue-400' : 'text-orange-400'}`}>
                                                            {order.mystery_boxes.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    {Array.isArray(order.prize_won) ? (
                                                        order.prize_won.length > 0 ? (
                                                            order.prize_won.map((prize, idx) => (
                                                                <div key={idx} className={`flex items-center gap-2 font-black text-xs italic ${prize.type === 'musicoins' ? 'text-yellow-400' : 'text-purple-400'}`}>
                                                                    {prize.type === 'musicoins' ? <Coins size={12} /> : <Gift size={12} />}
                                                                    {prize.name}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic">Nessuno</div>
                                                        )
                                                    ) : order.prize_won ? (
                                                        <div className="flex items-center gap-2 text-yellow-400 font-black text-xs italic">
                                                            <Coins size={12} />
                                                            {order.prize_won.name}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic">Nessuno</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                                                    <StatusIcon size={12} />
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                                            disabled={updatingId === order.id}
                                                            className="text-[10px] font-black uppercase tracking-widest bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            {updatingId === order.id ? <Loader2 size={12} className="animate-spin" /> : 'Spedisci'}
                                                        </button>
                                                    )}
                                                    {(order.status === 'pending' || order.status === 'shipped') && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                            disabled={updatingId === order.id}
                                                            className="text-[10px] font-black uppercase tracking-widest bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            {updatingId === order.id ? <Loader2 size={12} className="animate-spin" /> : 'Completa'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
