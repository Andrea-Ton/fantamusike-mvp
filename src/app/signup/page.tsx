'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signup, signInWithProvider } from '@/app/auth/actions';
import { Loader2, UserPlus } from 'lucide-react';

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        const result = await signup(formData);
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result?.emailVerificationRequired) {
            setSuccess(true);
            setIsLoading(false);
        }
        // If success and no verification needed, the server action redirects
    };

    const handleOAuth = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        await signInWithProvider(provider);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0b0b10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                </div>
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in text-center">
                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <UserPlus className="text-green-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Controlla la tua Email</h1>
                    <p className="text-gray-400 mb-8">
                        Ti abbiamo inviato un link di conferma. Clicca sul link per attivare il tuo account e iniziare la tua carriera.
                    </p>
                    <Link href="/login">
                        <button className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                            Torna al Login
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0b10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            </div>

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
                    <h1 className="text-2xl font-bold text-white">Crea Account</h1>
                    <p className="text-gray-400 text-sm">Inizia la tua carriera da Manager</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            placeholder="Il tuo nome manager"
                            className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="nome@esempio.com"
                            className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Codice Invito (Opzionale)</label>
                        <input
                            name="referralCode"
                            type="text"
                            placeholder="Hai un codice amico?"
                            className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
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
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> Registrati</>}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-xs text-gray-500 font-medium">OPPURE</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleOAuth('google')}
                        disabled={isLoading}
                        className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        onClick={() => handleOAuth('apple')}
                        disabled={isLoading}
                        hidden={true}
                        className="w-full h-12 bg-black text-white border border-white/20 font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.99-.48-2.13-.48-3.14 0-1.09.51-2.09.55-3.02-.43C5.55 17.8 3.63 13.57 5.68 9.6c1.03-1.96 2.89-3.17 4.94-3.17 1.28 0 2.45.63 3.23.63.76 0 2.19-.63 3.66-.54 1.25.07 2.83.63 3.6 1.76-3.16 1.54-2.63 5.76.48 7.02-.65 1.68-1.55 3.33-2.54 4.38h.01zm-3.6-13.91c.56-1.18.99-2.43.56-3.71-1.18.17-2.55.85-3.23 2.06-.54.91-.84 2.21-.15 3.37 1.24.15 2.37-.59 2.82-1.72z" />
                        </svg>
                        Apple
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Hai già un account?{' '}
                        <Link href="/login" className="text-white font-bold hover:underline cursor-pointer">
                            Accedi
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
