'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { sendPasswordResetOtp, verifyPasswordResetOtp } from '@/app/auth/actions';
import { Loader2, Mail, ArrowLeft, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleSendOtp = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        const emailInput = formData.get('email') as string;
        setEmail(emailInput);

        const result = await sendPasswordResetOtp(formData);
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setStep('otp');
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        const token = formData.get('otp') as string;

        const result = await verifyPasswordResetOtp(email, token);
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            router.push('/auth/update-password');
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0b10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
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
                    <h1 className="text-2xl font-bold text-white">Recupera Password</h1>
                    <p className="text-gray-400 text-sm">
                        {step === 'email'
                            ? "Inserisci la tua email per ricevere il codice"
                            : "Inserisci il codice di 6 cifre ricevuto via email"}
                    </p>
                </div>

                {step === 'email' ? (
                    <form action={handleSendOtp} className="space-y-4">
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
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Mail size={20} /> Invia Codice</>}
                        </button>
                    </form>
                ) : (
                    <form action={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Codice OTP</label>
                            <input
                                name="otp"
                                type="text"
                                required
                                placeholder="123456"
                                maxLength={6}
                                className="w-full h-12 bg-[#1a1a24] border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-center tracking-widest text-lg"
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
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={20} /> Verifica Codice</>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cambia email
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-gray-400 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Torna al Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
