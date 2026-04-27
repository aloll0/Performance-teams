import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Building2, 
  BrainCircuit,
  NotebookPen,
  UserCircle,
  Album, 
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { PanelRightOpen } from 'lucide-react';

type SidebarProps = {
  isOpen: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onClose: () => void;
};

const Sidebar = ({ isOpen, isMobile, onToggle, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const expanded = isMobile ? true : isOpen;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(user?.role !== 'employee' ? [{ path: '/employees', label: 'Employees', icon: Users }] : []),
    ...(user?.role !== 'employee' ? [{ path: '/evaluations', label: 'Evaluations', icon: ClipboardCheck }] : []),
    ...(user?.role === 'admin' ? [{ path: '/teams', label: 'Teams', icon: Building2 }] : []),
    { path: '/quizzes', label: 'Quizzes', icon: BrainCircuit },
    { path: '/work-logs', label: 'Daily Work Log', icon: NotebookPen },
    { path: '/courses', label: 'Courses', icon: Album },
    { path: '/profile', label: 'Profile', icon: UserCircle },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/55"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-[#0D132C] border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out',
          isMobile
            ? cn('w-72', isOpen ? 'translate-x-0' : '-translate-x-full')
            : isOpen
              ? 'w-64'
              : 'w-20'
        )}
      >
      {/* Logo */}
      <div className={cn('border-b border-white/10 transition-all duration-300', expanded ? 'p-6' : 'p-3')}>
        <div className={cn('flex items-center gap-3', expanded ? 'justify-between' : 'flex-col justify-center')}>
          <div className={cn('rounded-lg flex items-center', expanded ? 'justify-start' : 'justify-center w-full')}>
            <img src="/logo.svg" alt="Logo" width="50" height="50" />
            <h1
              className={cn(
                'text-white font-bold text-lg overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'max-w-[140px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'
              )}
            >
              Themiify
            </h1>
          </div>
      {isMobile && (
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center text-white"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      {!isMobile && (
      <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center text-white transition-all duration-200',
            isOpen ? 'opacity-100' : 'opacity-100'
          )}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelRightOpen className={cn('transition-transform duration-300', !isOpen && 'rotate-180')} />
      </button>
      )}
        </div>
      </div>


      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map((item) => (
            item.path && (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg transition-all duration-200',
                    expanded ? 'gap-3 px-4 py-3 justify-start' : 'justify-center h-11 w-11 mx-auto p-0 gap-0',
                    isActive
                      ? 'bg-[#F26B21] text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
                onClick={() => {
                  if (isMobile) {
                    onClose();
                  }
                }}
              >
                <item.icon className="w-5 h-5" />
                <span
                  className={cn(
                    'font-medium overflow-hidden whitespace-nowrap transition-all duration-300',
                    expanded ? 'opacity-100 max-w-[180px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-1'
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            )
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/10">
        <div
          className={cn(
            'mb-4 px-4 py-3 bg-white/5 rounded-lg transition-all duration-300 overflow-hidden',
            expanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 mb-0 p-0'
          )}
        >
          <p className="text-white font-medium truncate">{user?.name}</p>
          <p className="text-white/50 text-sm capitalize">{user?.role?.replace('_', ' ')}</p>
          {user?.team && (
            <p className="text-[#F26B21] text-xs mt-1">{user.team}</p>
          )}
        </div>
        <button
          className={cn(
            'flex items-center w-full rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200',
            expanded ? 'gap-3 px-4 py-3 justify-start' : 'justify-center h-11 w-11 mx-auto p-0 gap-0'
          )}
          onClick={() => {
            logout();
            if (isMobile) {
              onClose();
            }
          }}
        >
          <LogOut className="w-5 h-5" />
          <span
            className={cn(
              'font-medium overflow-hidden whitespace-nowrap transition-all duration-300',
              expanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'
            )}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
