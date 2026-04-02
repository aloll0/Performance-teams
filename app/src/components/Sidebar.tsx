import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Building2, 
  BrainCircuit,
  UserCircle, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/evaluations', label: 'Evaluations', icon: ClipboardCheck },
    ...(user?.role === 'admin' ? [{ path: '/teams', label: 'Teams', icon: Building2 }] : []),
    { path: '/quizzes', label: 'Quizzes', icon: BrainCircuit },
    { path: '/profile', label: 'Profile', icon: UserCircle },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0D132C] border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F26B21] flex items-center justify-center">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Performance</h1>
            <p className="text-white/50 text-xs">SaaS Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-[#F26B21] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-4 px-4 py-3 bg-white/5 rounded-lg">
          <p className="text-white font-medium truncate">{user?.name}</p>
          <p className="text-white/50 text-sm capitalize">{user?.role?.replace('_', ' ')}</p>
          {user?.team && (
            <p className="text-[#F26B21] text-xs mt-1">{user.team}</p>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
