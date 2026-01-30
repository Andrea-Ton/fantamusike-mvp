import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
}

export default function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
    return (
        <div className="group relative p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl hover:bg-white/[0.06] transition-all duration-700 hover:-translate-y-3 overflow-hidden">
            {/* Background Decorative Bloom */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

            {/* Heroic Pedestal (Adapted for Cards) */}
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 backdrop-blur-3xl">
                    <Icon className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" size={32} />
                </div>
            </div>

            <h3 className="text-2xl font-black mb-4 text-white italic uppercase tracking-tighter leading-none group-hover:text-purple-400 transition-colors">{title}</h3>
            <p className="text-gray-500 leading-relaxed font-black text-[11px] uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity">{desc}</p>
        </div>
    );
}
