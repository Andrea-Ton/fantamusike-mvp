'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero-section';
import FeatureCard from '@/components/feature-card';
import { Search, TrendingUp, Trophy } from 'lucide-react';

export default function LandingPage() {


  return (
    <div className="min-h-screen bg-[#0b0b10] relative overflow-hidden font-sans text-white selection:bg-purple-500/30">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] delay-700" />
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-pink-600/10 rounded-full blur-[100px]" />

      <Navbar />
      <HeroSection />

      {/* Features Grid */}
      <section className="relative z-10 py-20 bg-black/20 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Talent Scout", desc: "Non scegliere i soliti big. Trova artisti under 100k ascoltatori." },
            { icon: TrendingUp, title: "Dati Reali", desc: "Punteggi basati su crescita Spotify, non sui like di Instagram." },
            { icon: Trophy, title: "Vinci Premi", desc: "Scala la classifica e vinci biglietti per i concerti." }
          ].map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>
    </div>
  );
}
