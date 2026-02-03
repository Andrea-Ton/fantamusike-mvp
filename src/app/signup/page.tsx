'use client';

import React from 'react';
import RegisterForm from '@/components/auth/register-form';

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-[#0b0b10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            </div>

            <RegisterForm />
        </div>
    );
}
