import React from 'react';
import { Trophy, TrendingUp, Info, LogOut } from 'lucide-react';
import ArtistCard, { Slot } from '@/components/dashboard/artist-card';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserTeamAction } from '@/app/actions/team';
import { getLeaderboardAction } from '@/app/actions/leaderboard';
import LeaderboardCard from '@/components/dashboard/leaderboard-card';
import Link from 'next/link';
import LogoutButton from '@/components/logout-button';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const totalScore = profile?.total_score || 0;
    const musiCoins = profile?.musi_coins || 0;

    // Fetch User Team
    const userTeam = await getUserTeamAction();

    // Fetch Leaderboard
    const leaderboard = await getLeaderboardAction(10);

    // Transform to Slot format for UI
    const teamSlots: Slot[] = [
        {
            id: 1,
            type: 'Big',
            label: 'Headliner',
            requirement: 'Popolarità > 75',
            artist: userTeam?.slot_1 ? {
                id: userTeam.slot_1.id,
                name: userTeam.slot_1.name,
                image: userTeam.slot_1.images[0]?.url || '',
                popularity: userTeam.slot_1.popularity,
                category: 'Big',
                trend: 0 // Placeholder for now
            } : null
        },
        {
            id: 2,
            type: 'Mid',
            label: 'Rising Star 1',
            requirement: 'Popolarità 30-75',
            artist: userTeam?.slot_2 ? {
                id: userTeam.slot_2.id,
                name: userTeam.slot_2.name,
                image: userTeam.slot_2.images[0]?.url || '',
                popularity: userTeam.slot_2.popularity,
                category: 'Mid',
                trend: 0
            } : null
        },
        {
            id: 3,
            type: 'Mid',
            label: 'Rising Star 2',
            requirement: 'Popolarità 30-75',
            artist: userTeam?.slot_3 ? {
                id: userTeam.slot_3.id,
                name: userTeam.slot_3.name,
                image: userTeam.slot_3.images[0]?.url || '',
                popularity: userTeam.slot_3.popularity,
                category: 'Mid',
                trend: 0
            } : null
        },
        {
            id: 4,
            type: 'New Gen',
            label: 'Scout Pick 1',
            requirement: 'Popolarità < 30',
            artist: userTeam?.slot_4 ? {
                id: userTeam.slot_4.id,
                name: userTeam.slot_4.name,
                image: userTeam.slot_4.images[0]?.url || '',
                popularity: userTeam.slot_4.popularity,
                category: 'New Gen',
                trend: 0
            } : null
        },
        {
            id: 5,
            type: 'New Gen',
            label: 'Scout Pick 2',
            requirement: 'Popolarità < 30',
            artist: userTeam?.slot_5 ? {
                id: userTeam.slot_5.id,
                name: userTeam.slot_5.name,
                image: userTeam.slot_5.images[0]?.url || '',
                popularity: userTeam.slot_5.popularity,
                category: 'New Gen',
                trend: 0
            } : null
        },
    ];

    const hasTeam = userTeam !== null;

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

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <header className="hidden md:flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-gray-400">Benvenuto, Manager. Ecco come sta andando la tua etichetta.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-[#1a1a24] rounded-lg border border-white/10 text-sm font-medium text-yellow-400 flex items-center gap-2">
                            <span>MusiCoins:</span>
                            <span className="font-bold">{musiCoins}</span>
                        </div>
                        <button className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-500/20">Invita Amico</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Stats & Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Score Card */}
                        <div className="w-full rounded-3xl bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium mb-2">Punteggio Totale</p>
                                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">{totalScore}</h2>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                                        <Trophy size={16} className="text-yellow-300" />
                                        <span className="text-sm font-bold">#-- Global</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Trend Settimanale</span>
                                        <div className="flex items-center gap-1 text-lg font-bold">
                                            <TrendingUp size={18} className="text-green-300" />
                                            +0 pts
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-white/20"></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Prossimo Update</span>
                                        <span className="text-lg font-bold">Venerdì 00:00</span>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative */}
                            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                            <div className="absolute bottom-0 right-0 opacity-20">
                                <svg width="150" height="120" viewBox="0 0 100 80" fill="none">
                                    <path d="M0 80 L40 40 L70 60 L100 10" stroke="white" strokeWidth="4" fill="none" />
                                </svg>
                            </div>
                        </div>

                        {/* Leaderboard Card */}
                        <div className="h-[400px]">
                            <LeaderboardCard entries={leaderboard} currentUserId={user.id} />
                        </div>

                        {/* Info Box - REMOVED as per user request */}
                        {/* <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 flex gap-4 items-start">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Info className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h4 className="text-blue-400 font-bold mb-1">Strategia Settimanale</h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Gli artisti <span className="text-white font-bold">"New Gen"</span> stanno performando il 20% meglio questa settimana grazie ai nuovi release. Considera di scambiare il tuo slot Scout Pick 2.
                                </p>
                            </div>
                        </div> */}
                    </div>

                    {/* Right Column: Roster */}
                    <div className="lg:col-span-7">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">La Tua Etichetta</h3>
                            <Link
                                href="/dashboard/draft"
                                className="px-4 py-2 rounded-full bg-[#1a1a24] border border-white/10 text-sm text-purple-400 font-medium hover:bg-purple-500 hover:text-white transition-all"
                            >
                                {hasTeam ? 'Gestisci Roster' : 'Crea Team'}
                            </Link>
                        </div>

                        {hasTeam ? (
                            <div className="grid grid-cols-1 gap-4">
                                {teamSlots.map((slot) => (
                                    <ArtistCard key={slot.id} slot={slot} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#1a1a24] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Trophy className="text-purple-400" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Nessun Team Trovato</h3>
                                <p className="text-gray-400 mb-6 max-w-md">Non hai ancora creato la tua etichetta discografica. Inizia subito a fare scouting per vincere la stagione!</p>
                                <Link
                                    href="/dashboard/draft"
                                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                                >
                                    Inizia il Draft
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
