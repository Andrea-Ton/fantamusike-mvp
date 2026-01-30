import React from 'react';
import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero-section';
import FeatureCard from '@/components/feature-card';
import ArtistTicker from '@/components/landing/artist-ticker';
import { Search, TrendingUp, Trophy, Music } from 'lucide-react';
import { getCurrentSeasonAction } from '@/app/actions/season';
import { getFeaturedArtistsAction } from '@/app/actions/artist';

import { createClient } from '@/utils/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const currentSeason = await getCurrentSeasonAction();
  const seasonName = currentSeason?.name || 'Season Zero';
  const featuredArtists = await getFeaturedArtistsAction();

  return (
    <div className="min-h-screen bg-[#0b0b10] relative overflow-hidden font-sans text-white selection:bg-purple-500/30">
      {/* Dynamic Background Orchestration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[150px] delay-1000 animate-pulse" />
        <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] bg-pink-600/5 rounded-full blur-[120px]" />
      </div>

      <Navbar user={user} />

      <HeroSection seasonName={seasonName} featuredArtists={featuredArtists} user={user} />

      {/* Real-time Impact Section */}
      <ArtistTicker artists={featuredArtists} />

      {/* Core Features - Redesigned Grid */}
      <section className="relative z-10 py-32 bg-black/40 backdrop-blur-3xl border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              Experience the game
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-white max-w-2xl">
              DETTA LE REGOLE DELLA <span className="text-purple-500">PROSSIMA SCENA</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Talent Scout", desc: "Non scegliere i soliti big. Trova artisti emergenti under 100k ascoltatori mensili." },
              { icon: Music, title: "Firma i Contratti", desc: "Usa i tuoi MusiCoins per mettere sotto contratto i talenti prima che esplodano." },
              { icon: Trophy, title: "Vinci Premi", desc: "Scala la classifica stagionale e vinci biglietti per i concerti e merch esclusivo." }
            ].map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Simple Closing */}
      <footer className="relative z-10 py-20 bg-black/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-2xl font-black text-white italic uppercase tracking-tighter">FantaMusiké</span>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-2">© 2026 Musiké • All rights reserved</span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
