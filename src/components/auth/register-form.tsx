'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signup, signInWithProvider } from '@/app/auth/actions';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { sendGTMEvent } from '@next/third-parties/google';

interface RegisterFormProps {
    onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Controlled states to preserve values on error
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [marketingOptIn, setMarketingOptIn] = useState(false);
    const [hasEngaged, setHasEngaged] = useState(false);

    const handleEngagement = () => {
        if (!hasEngaged) {
            setHasEngaged(true);
            sendGTMEvent({ event: 'signup_engagement', category: 'auth' });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!acceptTerms) {
            setError("Devi accettare i Termini e le Condizioni per continuare.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        // Ensure marketingOptIn is correctly handled as 'on' if checked
        if (marketingOptIn) formData.set('marketingOptIn', 'on');

        const result = await signup(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            sendGTMEvent({ event: 'signup_error', category: 'auth', error: result.error });
        } else if (result?.emailVerificationRequired) {
            setSuccess(true);
            setIsLoading(false);
            sendGTMEvent({ event: 'signup_success', category: 'auth' });
            if (onSuccess) onSuccess();
        }
    };

    const handleOAuth = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        await signInWithProvider(provider);
    };

    if (success) {
        return (
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
        );
    }

    return (
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in mx-auto">
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
                <h1 className="text-2xl font-bold text-white uppercase tracking-tighter italic">Crea Account</h1>
                <p className="text-gray-400 text-sm">Inizia la tua carriera da Manager</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            handleEngagement();
                        }}
                        placeholder="nome@esempio.com"
                        className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                    <div className="relative">
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Codice Invito (Opzionale)</label>
                    <input
                        name="referralCode"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Hai un codice amico?"
                        className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                <div className="space-y-4 pt-2">
                    {/* Mandatory Terms Checkbox */}
                    <div className="flex items-start gap-3 group">
                        <div className="relative flex items-center mt-0.5">
                            <input
                                type="checkbox"
                                id="terms-accept"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/10 bg-[#1a1a24] transition-all checked:border-[#9333ea] checked:bg-[#9333ea]"
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <label htmlFor="terms-accept" className="cursor-pointer select-none text-xs text-gray-400 leading-tight">
                            Accetto i <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/20 underline-offset-4 font-bold">Termini e le Condizioni</Link> del servizio e dichiaro di aver letto la <Link href="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/20 underline-offset-4 font-bold">Privacy Policy</Link>.
                        </label>
                    </div>

                    {/* Optional Marketing Checkbox */}
                    <div className="flex items-start gap-3">
                        <div className="relative flex items-center mt-0.5">
                            <input
                                name="marketingOptIn"
                                type="checkbox"
                                id="marketing-opt-in"
                                checked={marketingOptIn}
                                onChange={(e) => setMarketingOptIn(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/10 bg-[#1a1a24] transition-all checked:border-[#9333ea] checked:bg-[#9333ea]"
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <label htmlFor="marketing-opt-in" className="cursor-pointer select-none text-xs text-gray-400 leading-tight">
                            Desidero ricevere newsletter e aggiornamenti promozionali (Opzionale).
                        </label>
                    </div>
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

            <div className="mt-8 text-center">
                <p className="text-gray-400 text-sm">
                    Hai già un account?{' '}
                    <Link href="/login" className="text-white font-bold hover:underline cursor-pointer">
                        Accedi
                    </Link>
                </p>
            </div>
        </div>
    );
}
