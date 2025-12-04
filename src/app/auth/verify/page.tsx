'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, KeyRound } from 'lucide-react';
import { verifyOtp } from '@/app/auth/actions';

function VerifyContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);

        // Append email to formData since it's not in an input field
        formData.append('email', email);

        const result = await verifyOtp(formData);
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
            <div className="flex flex-col items-center mb-8">
                <div className="relative w-16 h-16 mb-4">
                    <Image
                        src="/logo.png"
                        alt="FantaMusiké"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className="text-2xl font-bold text-white">Verifica Codice</h1>
                <p className="text-gray-400 text-sm text-center">
                    Abbiamo inviato un codice a 6 cifre a <br />
                    <span className="text-white font-medium">{email}</span>
                </p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Codice di Verifica</label>
                    <input
                        name="code"
                        type="text"
                        required
                        placeholder="123456"
                        className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-center tracking-widest text-lg"
                        maxLength={6}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={20} /> Verifica</>}
                </button>
            </form>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen bg-[#0b0b10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            </div>

            <Suspense fallback={
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 flex items-center justify-center min-h-[400px]">
                    <Loader2 className="animate-spin text-purple-500" size={40} />
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
