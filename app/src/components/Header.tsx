import { useAuthStore } from '@/store/authStore';
import { Menu } from 'lucide-react';

type HeaderProps = {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
};

const Header = ({ showMenuButton = false, onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="h-16 bg-[#0D132C]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-md border border-white/20 p-2 text-white hover:bg-white/10"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-white text-base sm:text-lg font-semibold truncate">
          {getGreeting()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-white/50 text-xs sm:text-sm truncate">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
