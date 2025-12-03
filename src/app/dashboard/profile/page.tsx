import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AvatarUpload from '@/components/profile/avatar-upload';
import ProfileForm from '@/components/profile/profile-form';
import DeleteAccount from '@/components/profile/delete-account';

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

    return (
        <main className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full animate-fade-in pb-40 lg:pb-10">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-white mb-2">Il tuo Profilo</h1>
                <p className="text-gray-400">Gestisci le tue informazioni personali e la sicurezza dell'account.</p>
            </header>

            <div className="bg-[#1a1a24] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20">
                <div className="flex flex-col md:flex-row gap-10">
                    {/* Left Column: Avatar */}
                    <div className="flex-shrink-0 flex justify-center md:justify-start">
                        <AvatarUpload
                            currentAvatarUrl={avatarUrl}
                            username={username}
                        />
                    </div>

                    {/* Right Column: Forms */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Informazioni Personali</h3>
                            <ProfileForm
                                initialUsername={username}
                                email={email}
                            />
                        </div>

                        <DeleteAccount />
                    </div>
                </div>
            </div>
        </main>
    );
}
