import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EmployeesPage from '@/pages/EmployeesPage';
import EvaluationsPage from '@/pages/EvaluationsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import QuizzesPage from '@/pages/QuizzesPage';
import QuizDetailPage from '@/pages/QuizDetailPage';
import WorkLogsPage from '@/pages/WorkLogsPage';
import TeamsPage from '@/pages/TeamsPage';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import './App.css';
import CoursesPage from './pages/CoursesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/employees" element={user?.role === 'employee' ? <Navigate to="/dashboard" replace /> : <EmployeesPage />} />
              <Route path="/evaluations" element={user?.role === 'employee' ? <Navigate to="/dashboard" replace /> : <EvaluationsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/quizzes/:id" element={<QuizDetailPage />} />
              <Route path="/work-logs" element={<WorkLogsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/CoursesPage" element={<CoursesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
      
export default App;
