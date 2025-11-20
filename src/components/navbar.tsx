import Image from 'next/image';

const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
    <div className={`${className} relative flex-shrink-0`}>
        <Image
            src="/logo.png"
            alt="FantaMusiké Logo"
            fill
            className="object-contain"
            priority
        />
    </div>
);

export default function Navbar({ onLogin }: { onLogin?: () => void }) {
    return (
        <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto animate-fade-in-down">
            <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <span className="text-xl font-bold tracking-tight text-white">FantaMusiké</span>
            </div>
            <button
                onClick={onLogin}
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all text-sm font-medium text-white cursor-pointer"
            >
                Login
            </button>
        </nav>
    );
}
