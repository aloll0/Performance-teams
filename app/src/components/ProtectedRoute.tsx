import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D132C]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F26B21]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
