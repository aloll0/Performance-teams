import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, QrCode, RefreshCcw, Smartphone, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import * as authApi from '@/services/authApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showQr, setShowQr] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [qrNow, setQrNow] = useState<number>(Date.now());
  const [qrStatus, setQrStatus] = useState<'loading' | 'pending' | 'expired' | 'error'>('loading');

  const qrSecondsLeft = useMemo(() => {
    if (!qrExpiresAt) return 0;
    return Math.max(0, Math.ceil((qrExpiresAt - qrNow) / 1000));
  }, [qrExpiresAt, qrNow]);

  const loadQrToken = async () => {
    try {
      setQrStatus('loading');
      const response = await authApi.createQrLoginToken();
      const { token, expiresAt } = response.data;
      const approveUrl = `${window.location.origin}/qr-approve?token=${encodeURIComponent(token)}`;
      const imageUrl = await QRCode.toDataURL(approveUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#0D132C', light: '#FFFFFF' }
      });
      setQrImageUrl(imageUrl);
      setQrExpiresAt(new Date(expiresAt).getTime());
      setQrStatus('pending');
    } catch (error) {
      setQrStatus('error');
      toast.error('Could not generate QR login code');
    }
  };

  useEffect(() => {
    if (!qrExpiresAt || qrStatus !== 'pending') return;
    const timer = window.setInterval(() => {
      setQrNow(Date.now());
      if (Date.now() >= qrExpiresAt) {
        setQrStatus('expired');
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [qrExpiresAt, qrStatus]);

  const handleOpenQr = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowQr(true);
    loadQrToken();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleCloseQr = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowQr(false);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: formData.email.trim().toLowerCase(), password: formData.password });
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#060b1d] bg-[radial-gradient(circle_at_50%_50%,_#131b3d_0%,_#060b1d_100%)] flex items-center justify-center p-6">

      <div className="w-full max-w-md relative overflow-hidden bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl">

        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]"
          style={{ transform: showQr ? 'translateX(-50%)' : 'translateX(0%)', width: '200%' }}
        >

          <div className="w-1/2 p-8 lg:p-10 flex-shrink-0">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-gradient-to-tr from-[#F26B21] to-[#ff9d6a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#F26B21]/20">
                <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
                <p className="text-white/50 text-sm">Sign in to themiify dashboard</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white/80 text-xs uppercase tracking-widest ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F26B21]" />
                  <Input
                    type="email"
                    placeholder="admin@demo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 pl-12 bg-white/[0.05] border-white/10 text-white rounded-xl focus:ring-1 focus:ring-[#F26B21] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80 text-xs uppercase tracking-widest ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F26B21]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-14 pl-12 pr-12 bg-white/[0.05] border-white/10 text-white rounded-xl focus:ring-1 focus:ring-[#F26B21] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F26B21]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-[#F26B21] to-[#ff8c4a] hover:opacity-90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#F26B21]/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={handleOpenQr}
              className="group w-full flex items-center justify-between px-5 h-14 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-[#F26B21]/40 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-[#F26B21]" />
                <span className="text-white/70 group-hover:text-white text-sm font-medium transition-colors">
                  Login with QR Code
                </span>
              </div>
              <span className="text-[#F26B21] opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-200 text-lg">→</span>
            </button>
          </div>

          <div className="w-1/2 p-8 lg:p-10 flex-shrink-0 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={handleCloseQr}
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white">Quick Scan</h2>
                <p className="text-white/40 text-xs">Login with your mobile app</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="relative p-4 bg-white rounded-[1.75rem] shadow-2xl shadow-black/50 overflow-hidden group">
                {qrImageUrl && qrStatus === 'pending' ? (
                  <>
                    <img src={qrImageUrl} alt="QR Code" className="w-56 h-56" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[2px]">
                      <img src="/logo.svg" className="w-10 h-10 p-2 bg-white rounded-full shadow-lg" alt="" />
                    </div>
                  </>
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300">
                    <RefreshCcw className={`w-10 h-10 text-slate-400 ${qrStatus === 'loading' ? 'animate-spin' : ''}`} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#F26B21] animate-pulse" />
                <p className="text-xs font-mono text-white/70">
                  {qrStatus === 'pending'
                    ? `Expires in ${qrSecondsLeft}s`
                    : 'QR Code Status: ' + qrStatus}
                </p>
              </div>

              <div className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                <div className="flex items-start gap-3 text-xs text-white/60 leading-relaxed">
                  <Smartphone className="w-5 h-5 text-[#F26B21] shrink-0 mt-0.5" />
                  <p>Open <b>themiify mobile</b>, scan the code, and confirm the login request to proceed.</p>
                </div>
              </div>

              <Button
                onClick={loadQrToken}
                variant="ghost"
                className="w-full text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Regenerate Code
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;