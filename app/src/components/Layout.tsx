import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = () => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-[#0D132C] flex">
      <Sidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <div
        className={cn(
          'flex-1 flex flex-col transition-[margin] duration-300 ease-in-out',
          isMobile ? 'ml-0' : isSidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <Header
          showMenuButton={isMobile}
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
