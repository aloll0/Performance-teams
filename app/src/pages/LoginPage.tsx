import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, QrCode, RefreshCcw, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import * as authApi from '@/services/authApi';

const QR_POLL_INTERVAL_MS = 2000;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithToken, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [qrNow, setQrNow] = useState<number>(Date.now());
  const [qrStatus, setQrStatus] = useState<'loading' | 'pending' | 'expired' | 'error'>('loading');

  const qrSecondsLeft = useMemo(() => {
    if (!qrExpiresAt) return 0;
    const remainingMs = qrExpiresAt - qrNow;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }, [qrExpiresAt, qrNow]);

  const loadQrToken = async () => {
    try {
      setQrStatus('loading');
      setQrImageUrl('');

      const response = await authApi.createQrLoginToken();
      const { token, expiresAt } = response.data;
      const approveUrl = `${window.location.origin}/qr-approve?token=${encodeURIComponent(token)}`;
      const imageUrl = await QRCode.toDataURL(approveUrl, {
        width: 240,
        margin: 1,
      });

      setQrToken(token);
      setQrImageUrl(imageUrl);
      setQrExpiresAt(new Date(expiresAt).getTime());
      setQrStatus('pending');
    } catch (error) {
      console.error('Failed to create QR login token:', error);
      setQrStatus('error');
      toast.error('Could not generate QR login code');
    }
  };

  useEffect(() => {
    loadQrToken();
  }, []);

  useEffect(() => {
    if (!qrExpiresAt || qrStatus !== 'pending') return;

    const timer = window.setInterval(() => {
      setQrNow(Date.now());
      if (Date.now() >= qrExpiresAt) {
        setQrStatus('expired');
        setQrToken(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [qrExpiresAt, qrStatus]);

  useEffect(() => {
    if (!qrToken || qrStatus !== 'pending') return;

    const poll = window.setInterval(async () => {
      try {
        const response = await authApi.getQrLoginStatus(qrToken);
        if (response.data.status === 'approved' && response.data.token && response.data.user) {
          loginWithToken({
            token: response.data.token,
            user: response.data.user,
          });
          toast.success('QR login successful!');
          navigate('/dashboard');
        }
      } catch (error: any) {
        const statusCode = error?.response?.status;
        if (statusCode === 404 || statusCode === 410) {
          setQrStatus('expired');
          setQrToken(null);
          return;
        }

        if (statusCode === 409) {
          return;
        }

        console.error('QR polling error:', error);
        setQrStatus('error');
      }
    }, QR_POLL_INTERVAL_MS);

    return () => window.clearInterval(poll);
  }, [qrToken, qrStatus, loginWithToken, navigate]);

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

  return (
    <div className="min-h-screen bg-[#0D132C] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <QrCode className="w-6 h-6 text-[#F26B21]" />
              <div>
                <CardTitle className="text-2xl text-white">Sign in with QR</CardTitle>
                <CardDescription className="text-white/60">
                  Scan using your logged-in mobile app session
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white p-4 mx-auto w-fit">
              {qrImageUrl && qrStatus === 'pending' ? (
                <img src={qrImageUrl} alt="QR login code" className="w-60 h-60" />
              ) : (
                <div className="w-60 h-60 grid place-items-center text-slate-600 border border-dashed border-slate-300 rounded-md">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="text-center text-sm text-white/70">
              {qrStatus === 'pending' && (
                <p>Code expires in {qrSecondsLeft}s</p>
              )}
              {qrStatus === 'loading' && <p>Generating secure QR code...</p>}
              {qrStatus === 'expired' && <p>QR code expired. Generate a new one.</p>}
              {qrStatus === 'error' && <p>Could not load QR login. Please try again.</p>}
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <p className="font-medium text-white mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#F26B21]" />
                How to use
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open the mobile app while already logged in.</li>
                <li>Go to QR Login and scan this code.</li>
                <li>Approve the login request on mobile.</li>
              </ol>
            </div>

            <Button
              type="button"
              onClick={loadQrToken}
              className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
