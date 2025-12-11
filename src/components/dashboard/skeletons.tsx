import React from 'react';

export function StatsSkeleton() {
    return (
        <div className="w-full rounded-3xl bg-white/5 animate-pulse p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="h-4 w-24 bg-white/10 rounded mb-3"></div>
                        <div className="h-14 w-48 bg-white/10 rounded-xl"></div>
                    </div>
                    <div className="h-10 w-10 bg-white/10 rounded-full"></div>
                </div>

                <div className="mt-8 flex gap-6">
                    <div className="flex flex-col">
                        <div className="h-3 w-32 bg-white/10 rounded mb-2"></div>
                        <div className="h-7 w-28 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RosterSkeleton() {
    return (
        <div className="lg:col-span-7">
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse"></div>
                <div className="h-10 w-32 bg-white/5 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 w-full rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                ))}
            </div>
        </div>
    );
}

export function LeaderboardSkeleton() {
    return (
        <div className="h-[400px] w-full rounded-3xl bg-white/5 animate-pulse border border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-white/10"></div>
                <div className="h-6 w-32 bg-white/10 rounded"></div>
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-12 w-full rounded-xl bg-white/5"></div>
                ))}
            </div>
        </div>
    );
}
