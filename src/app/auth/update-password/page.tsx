'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSessionReady, setIsSessionReady] = useState(false); // Track if session is established
    const router = useRouter();

    // Create a single Supabase client instance for the component lifecycle
    const [supabase] = useState(() => createClient());

    React.useEffect(() => {
        // 1. Check if we already have a session (e.g. from cookie)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log("Session found immediately");
                setIsSessionReady(true);
            }
        });

        // 2. Listen for auth changes (specifically for the hash recovery flow)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                setIsSessionReady(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const handleSubmit = async (formData: FormData) => {
        if (!isSessionReady) {
            setError("Sessione non valida. Riprova o richiedi un nuovo link.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const password = formData.get('password') as string;

        // Use the SAME supabase instance that processed the hash
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            // Success
            router.push('/dashboard');
            router.refresh();
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
                    <h1 className="text-2xl font-bold text-white">Nuova Password</h1>
                    <p className="text-gray-400 text-sm">Inserisci la tua nuova password</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nuova Password</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                minLength={6}
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

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !isSessionReady}
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : !isSessionReady ? (
                            <><Loader2 className="animate-spin" size={20} /> Verifica Link...</>
                        ) : (
                            <><Lock size={20} /> Aggiorna Password</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
