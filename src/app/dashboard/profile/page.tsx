import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AvatarUpload from '@/components/profile/avatar-upload';
import ProfileForm from '@/components/profile/profile-form';
import DeleteAccount from '@/components/profile/delete-account';
import BadgeSection from '@/components/profile/badge-section';
import Image from 'next/image';
import LogoutButton from '@/components/logout-button';
import { getCurrentSeasonAction } from '@/app/actions/season';
import { ShieldCheck, Calendar } from 'lucide-react';
import ProfileViewTracker from '@/components/profile/profile-view-tracker';
import TutorialSettings from '@/components/profile/tutorial-settings';

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

    // Fetch Season for standardized header
    const currentSeason = await getCurrentSeasonAction();
    const seasonName = currentSeason?.name || 'Season Zero';

    return (
        <>
            <ProfileViewTracker />
            {/* Mobile Header */}
            <div className="md:hidden pt-12 px-6 flex justify-between items-center mb-4 bg-[#0a0a0e]/80 backdrop-blur-xl border-b border-white/5 pb-4 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="FantaMusiké Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">FantaMusiké</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{seasonName}</p>
                    </div>
                </div>
                <LogoutButton />
            </div>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-fade-in pb-40 lg:pb-10">
                {/* Header Section */}
                <header className="mb-6 relative">
                    <div className="absolute top-0 left-0 w-3/4 md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/20 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none mix-blend-screen opacity-50"></div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Profilo Manager</p>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">Impostazioni</h1>
                            <p className="text-gray-500 text-sm font-medium">Gestisci le tue informazioni personali e personalizza la tua identità.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                                <Calendar size={14} className="text-gray-500" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Membro da {joinDate}</span>
                            </div>
                            {profile?.is_admin && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-2xl border border-purple-500/20 backdrop-blur-md text-purple-400 shadow-inner">
                                    <ShieldCheck size={14} />
                                    <span className="text-xs font-black uppercase tracking-widest">Admin</span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Identity & Avatar */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-32 transition-all duration-500">
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                            {/* Decorative Background */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <AvatarUpload
                                currentAvatarUrl={avatarUrl}
                                username={username}
                            />

                            <div className="mt-8 text-center">
                                <h2 className="text-2xl font-black text-white italic tracking-tighter truncate leading-none mb-1">{username}</h2>
                                <p className="text-purple-400 font-black text-[10px] uppercase tracking-widest opacity-60">{email}</p>
                            </div>
                        </div>

                        <BadgeSection userId={user.id} />
                    </div>

                    {/* Right Column: Settings Forms */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                        {/* General Settings */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Dati Personali</h3>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Gestione Account</p>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </div>
                                </div>
                                <ProfileForm
                                    initialUsername={username}
                                    email={email}
                                    initialMarketingOptIn={profile?.marketing_opt_in ?? false}
                                />
                            </div>
                        </div>

                        {/* Tutorial Settings */}
                        <TutorialSettings />

                        {/* Danger Zone */}
                        <DeleteAccount />
                    </div>
                </div>
            </main>
        </>
    );
}
