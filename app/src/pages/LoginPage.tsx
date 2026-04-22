import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { getDemoCredentials } from '@/services/authApi';
import type { DemoCredentials } from '@/types';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState<DemoCredentials | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchDemoCredentials();
  }, []);

  const fetchDemoCredentials = async () => {
    try {
      const response = await getDemoCredentials();
      setDemoCredentials(response.data);
    } catch (error) {
      console.error('Failed to fetch demo credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedEmail || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      await login({
        email: normalizedEmail,
        password: formData.password
      });
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setFormData({ email, password });
  };

  const fillEmployeeEmailOnly = (email: string) => {
    setFormData({ email, password: '' });
  };

  return (
    <div className="min-h-screen bg-[#0D132C] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                {/* <span className="text-white font-bold text-xl">EP</span> */}
                <img src="/logo.svg" alt="Logo" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Welcome Back themiify</CardTitle>
                <CardDescription className="text-white/60">
                  Sign in to your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#F26B21] focus:ring-[#F26B21]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#F26B21] focus:ring-[#F26B21]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F26B21] hover:bg-[#d85a1b] text-white font-semibold py-6"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F26B21]" />
              Demo Access
            </CardTitle>
            <CardDescription className="text-white/60">
              Click on any credential to auto-fill the login form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5">
                <TabsTrigger value="admin" className="data-[state=active]:bg-[#F26B21] data-[state=active]:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="leaders" className="data-[state=active]:bg-[#F26B21] data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Team Leaders
                </TabsTrigger>
                <TabsTrigger value="employees" className="data-[state=active]:bg-[#F26B21] data-[state=active]:text-white">
                  Employees
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin" className="mt-4">
                {demoCredentials?.admin && (
                  <button
                    onClick={() => fillCredentials(demoCredentials.admin.email, demoCredentials.admin.password)}
                    className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F26B21]/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium group-hover:text-[#F26B21] transition-colors">
                          Administrator
                        </p>
                        <p className="text-white/50 text-sm">{demoCredentials.admin.email}</p>
                        <p className="text-white/30 text-xs">Password: {demoCredentials.admin.password}</p>
                      </div>
                      <Shield className="w-8 h-8 text-[#F26B21]/50 group-hover:text-[#F26B21] transition-colors" />
                    </div>
                  </button>
                )}
              </TabsContent>

              <TabsContent value="leaders" className="mt-4">
                <div className="space-y-2 max-h-80 overflow-auto pr-2">
                  {demoCredentials?.teamLeaders.map((leader, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (leader.password) {
                          fillCredentials(leader.email, leader.password);
                        } else {
                          fillEmployeeEmailOnly(leader.email);
                        }
                      }}
                      className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F26B21]/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium group-hover:text-[#F26B21] transition-colors">
                            {leader.team} Team
                          </p>
                          <p className="text-white/50 text-sm">{leader.email}</p>
                          <p className="text-white/30 text-xs">
                            Password: {leader.password || leader.passwordHint || 'use assigned password'}
                          </p>
                        </div>
                        <Users className="w-6 h-6 text-white/30 group-hover:text-[#F26B21] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="employees" className="mt-4">
                <p className="text-white/50 text-xs mb-3">
                  Employee passwords are set when accounts are created. Enter the assigned password manually.
                </p>
                <div className="space-y-2 max-h-80 overflow-auto pr-2">
                  {demoCredentials?.employees?.map((employee, index) => (
                    <button
                      key={`${employee.email}-${index}`}
                      onClick={() => fillEmployeeEmailOnly(employee.email)}
                      className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F26B21]/50 transition-all text-left"
                    >
                      <p className="text-white font-medium">{employee.name}</p>
                      <p className="text-white/50 text-sm">{employee.team}</p>
                      <p className="text-white/50 text-sm">{employee.email}</p>
                      <p className="text-white/30 text-xs">Password: use the one assigned by team leader</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
