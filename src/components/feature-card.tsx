import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
}

export default function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
    return (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group hover:-translate-y-2 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Icon className="text-purple-300" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}
