
import React from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Trophy, Zap, Target, Timer, Crown, TrendingUp, Music, BarChart3, Coins, Users, HelpCircle } from 'lucide-react';

export default function RulesPage() {
    return (
        <div className="min-h-screen bg-[#0b0b10] text-white font-sans">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32 animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-px bg-purple-500"></div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Game Mechanics</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-12">
                    Regole <span className="text-purple-500 text-6xl italic not-italic">di Gioco</span>
                </h1>

                <p className="text-xl text-gray-400 mb-16 font-medium max-w-2xl">
                    Benvenuto nel backstage di FantaMusiké. Qui scoprirai come trasformare il tuo intuito musicale in punti, scalare le classifiche e dominare il mercato.
                </p>

                <div className="space-y-32">
                    {/* 1. Team Scoring (Fanta Score) */}
                    <section>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                                    <Trophy size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Fanta Score (Team)</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-purple-400" />
                                    Popolarità
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Utilizziamo un indice di popolarità che aggrega vari fattori come interazioni social, aumento degli stream e hype.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <Music size={18} className="text-purple-400" />
                                    Follower
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">La crescita percentuale dei follower contribuisce direttamente al punteggio totale.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <Zap size={18} className="text-purple-400" />
                                    Bonus Release
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    <strong>+20 punti</strong> per ogni Singolo.<br />
                                    <strong>+50 punti</strong> per ogni Album/EP uscito nella settimana.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/10 p-6 rounded-3xl">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 p-2 bg-yellow-500/20 rounded-xl text-yellow-500">
                                    <Crown size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-yellow-500 mb-2">Il Capitano</h4>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Scegli bene il tuo Capitano: i suoi punti vengono moltiplicati per <strong>1.5x</strong>.
                                        Se il Capitano è un <span className="text-purple-400">Featured Artist</span>, il moltiplicatore sale a <strong>2.0x</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Promo Score (Promozioni) */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                <Target size={24} />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Promo Score (Promozioni)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <HelpCircle size={18} className="text-blue-400" />
                                    MusiQuiz
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Metti alla prova la tua conoscenza sull'artista. Rispondi correttamente per guadagnare punti Promo.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <Target size={18} className="text-blue-400" />
                                    MusiBet
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Sfida un rivale di mercato. Scegli chi otterrà la crescita migliore nelle prossime 24 ore.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-blue-400" />
                                    MusiBoost
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Sostieni l'artista su Spotify. Ogni supporto ti fa guadagnare punti Promo.</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Leaderboard & Reset */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                                <Timer size={24} />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Classifica & Ciclo Settimanale</h2>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                                    <p className="text-gray-300">Il punteggio totale è dato dalla somma di <span className="text-purple-400 font-bold">Fanta Score</span> + <span className="text-blue-400 font-bold">Promo Score</span>.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                                    <p className="text-gray-300">La classifica è settimanale e il Manager che vince la settimana viene inserito nella <span className="text-amber-400 font-bold">Hall of Fame</span>.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                                    <p className="text-gray-300 font-bold">Subito dopo la chiusura della classifica, i punteggi vengono azzerati per dare inizio a una nuova sfida settimanale.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-32 pt-12 border-t border-white/10 text-center">
                    <p className="text-gray-500 text-sm font-medium">
                        Hai ancora dubbi? Contattaci a <span className="text-white">support@musike.fm</span>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
