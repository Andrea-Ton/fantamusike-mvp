'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <LogOut size={22} />
        </button>
    );
}
