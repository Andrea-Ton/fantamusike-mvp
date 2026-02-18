
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { getWeeklyScoresAction } from '@/app/actions/dashboard';
import { UserTeamResponse } from '@/app/actions/team';
import CountdownTimer from './countdown-timer';

interface StatsSectionProps {
    userId: string;
    userTeamPromise: Promise<UserTeamResponse>;
    totalScore: number;
}

export default async function StatsSection({ userId, userTeamPromise, totalScore }: StatsSectionProps) {
    const supabase = await createClient();
    const userTeam = await userTeamPromise;

    let weeklyTrend = 0;
    let weeklyFanta = 0;
    let weeklyPromo = 0;

    if (userTeam) {
        const artistIds = [
            userTeam.slot_1?.id,
            userTeam.slot_2?.id,
            userTeam.slot_3?.id,
            userTeam.slot_4?.id,
            userTeam.slot_5?.id
        ].filter(Boolean) as string[];

        const { scores, fantaScores, promoScores } = await getWeeklyScoresAction(artistIds, userTeam.captain_id, userId);

        weeklyTrend = artistIds.reduce((total, id) => total + (scores[id] || 0), 0);
        weeklyFanta = artistIds.reduce((total, id) => total + (fantaScores[id] || 0), 0);
        weeklyPromo = artistIds.reduce((total, id) => total + (promoScores[id] || 0), 0);
    }

    return (
        <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-[#1a1a2e] via-[#11111a] to-[#0a0a0f] p-8 text-white border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Punteggio Totale</p>
                        </div>
                        <h2 id="tour-total-score" className="text-6xl md:text-7xl font-black tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 leading-tight py-4 px-8 -ml-8 -my-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                            {totalScore}
                        </h2>
                    </div>

                    {/* Minimal Timer Badge */}
                    <div className="flex flex-col items-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest leading-none" style={{ textAlign: 'end' }}>Prossima Assegnazione</span>
                        <CountdownTimer
                            targetHour={3}
                            showScoringStatus={true}
                            label=""
                            variant="small"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Main Trend */}
                    {/* TODO: Nascosto per ora */}
                    <div className="hidden flex flex-col">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Trend Settimanale</span>
                        <div className={`flex items-center gap-2 text-2xl font-black italic uppercase ${weeklyTrend > 0 ? 'text-green-400' : weeklyTrend < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {weeklyTrend > 0 ? '+' : ''}{weeklyTrend} <span className="text-sm opacity-60 not-italic font-bold">PTS</span>
                        </div>
                    </div>

                    {/* Breakdown Header */}
                    <div className="h-px bg-white/5 w-full"></div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-8 px-2">
                        {/* Fanta Points */}
                        <div className="flex flex-col group/item transition-opacity hover:opacity-100 opacity-80">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em]">Punti Fanta</span>
                            </div>
                            <div className="text-xl font-black text-white/90 italic tracking-tighter">
                                {weeklyFanta > 0 ? '+' : ''}{weeklyFanta}
                            </div>
                        </div>

                        {/* Promo Points */}
                        <div className="flex flex-col group/item transition-opacity hover:opacity-100 opacity-80 border-l border-white/5 pl-8">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em]">Punti Promo</span>
                            </div>
                            <div className="text-xl font-black text-white/90 italic tracking-tighter">
                                {weeklyPromo > 0 ? '+' : ''}{weeklyPromo}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
