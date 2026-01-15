import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AvatarUpload from '@/components/profile/avatar-upload';
import ProfileForm from '@/components/profile/profile-form';
import DeleteAccount from '@/components/profile/delete-account';
import BadgeSection from '@/components/profile/badge-section';
import { ShieldCheck, Calendar } from 'lucide-react';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const username = profile?.username || user.user_metadata?.name || 'Manager';
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
    const email = user.email || '';
    const joinDate = new Date(user.created_at).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    return (
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-40 lg:pb-10">
            {/* Header Section */}
            <header className="mb-10 relative">
                <div className="absolute top-0 left-0 w-3/4 md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/20 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none mix-blend-screen opacity-50"></div>
                <div className="absolute top-20 right-0 md:right-20 w-1/2 md:w-[300px] h-[200px] md:h-[300px] bg-blue-600/10 rounded-full blur-[60px] md:blur-[100px] -z-10 pointer-events-none mix-blend-screen opacity-30"></div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-3 tracking-tight">Il tuo Profilo</h1>
                        <p className="text-gray-400 text-sm md:text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">Gestisci le tue informazioni personali, personalizza il tuo avatar e controlla la sicurezza del tuo account.</p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-3 md:gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Calendar size={14} className="text-purple-400" />
                            <span className="text-xs md:text-sm font-medium text-gray-300">Membro da {joinDate}</span>
                        </div>
                        {profile?.is_admin && (
                            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-purple-500/20 rounded-full border border-purple-500/30 backdrop-blur-md text-purple-300">
                                <ShieldCheck size={14} />
                                <span className="text-xs md:text-sm font-bold">Admin</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Identity & Avatar */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-10">
                    <div className="bg-[#1a1a24]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        {/* Decorative Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        <AvatarUpload
                            currentAvatarUrl={avatarUrl}
                            username={username}
                        />

                        <div className="mt-8 text-center">
                            <h2 className="text-2xl font-bold text-white mb-1 truncate">{username}</h2>
                            <p className="text-purple-400 font-medium text-sm">{email}</p>
                        </div>
                    </div>

                    <BadgeSection userId={user.id} />
                </div>

                {/* Right Column: Settings Forms */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                    {/* General Settings */}
                    <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/5 pb-4">Informazioni Personali</h3>
                            <ProfileForm
                                initialUsername={username}
                                email={email}
                                initialMarketingOptIn={profile?.marketing_opt_in ?? false}
                            />
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <DeleteAccount />
                </div>
            </div>
        </main>
    );
}
