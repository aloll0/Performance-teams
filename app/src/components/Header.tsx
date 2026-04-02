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

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#F26B21] focus:ring-[#F26B21]"
          />
        </div>
        <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5 text-white/70" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#F26B21] rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
