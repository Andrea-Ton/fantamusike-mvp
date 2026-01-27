
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

        // @ts-ignore
        const { scores, fantaScores, promoScores } = await getWeeklyScoresAction(artistIds, userTeam.captain_id, userId);

        weeklyTrend = artistIds.reduce((total, artistId) => {
            return total + (scores[artistId] || 0);
        }, 0);

        weeklyFanta = artistIds.reduce((total, artistId) => {
            return total + (fantaScores?.[artistId] || 0);
        }, 0);

        weeklyPromo = artistIds.reduce((total, artistId) => {
            return total + (promoScores?.[artistId] || 0);
        }, 0);
    }

    return (
        <div className="w-full rounded-3xl bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] p-8 text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-purple-200 text-sm font-medium mb-2">Punteggio Totale</p>
                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">{totalScore}</h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                        <CountdownTimer
                            targetHour={3}
                            showScoringStatus={true}
                            label="Prossima assegnazione"
                            variant="large"
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row gap-6">
                    {/* Total Trend */}
                    <div className="flex flex-col">
                        <span className="text-xs text-purple-200 uppercase tracking-wider mb-1">Trend Settimanale</span>
                        <div className={`flex items-center gap-1 text-lg font-bold ${weeklyTrend > 0 ? 'text-green-300' : weeklyTrend < 0 ? 'text-red-300' : 'text-gray-300'}`}>
                            {weeklyTrend > 0 ? <TrendingUp size={18} /> : weeklyTrend < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                            {weeklyTrend > 0 ? '+' : ''}{weeklyTrend} pts
                        </div>
                    </div>

                    {/* Divider (Mobile hidden) */}
                    <div className="hidden md:block w-px bg-white/20 h-10 self-center"></div>

                    {/* Breakdown */}
                    <div className="flex gap-6">
                        {/* Fanta Points */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-purple-200 uppercase tracking-wider mb-1 opacity-80">Punti Fanta</span>
                            <div className="flex items-center gap-1.5 text-base font-medium text-white/90">
                                {weeklyFanta > 0 ? '+' : ''}{weeklyFanta}
                            </div>
                        </div>

                        {/* Promo Points */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-purple-200 uppercase tracking-wider mb-1 opacity-80">Punti Promo</span>
                            <div className="flex items-center gap-1.5 text-base font-medium text-white/90">
                                {weeklyPromo > 0 ? '+' : ''}{weeklyPromo}
                            </div>
                        </div>
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
    );
}
