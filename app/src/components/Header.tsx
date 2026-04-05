import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

const Header = () => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="h-16 bg-[#0D132C]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h2 className="text-white text-lg font-semibold">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-white/50 text-sm">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </header>
  );
};

export default Header;
