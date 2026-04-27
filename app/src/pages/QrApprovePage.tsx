import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { verifyQrLoginToken } from '@/services/authApi';
import { toast } from 'sonner';

const QrApprovePage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const initialToken = useMemo(() => (params.get('token') || '').trim(), [params]);
  const [token, setToken] = useState(initialToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      toast.error('QR token is required');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login first on mobile, then approve QR login');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyQrLoginToken(normalizedToken);
      setIsApproved(true);
      toast.success('Desktop login approved successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve QR login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D132C] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-[#F9A56D]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm">Secure QR Approval</span>
          </div>
          <CardTitle className="text-white text-2xl">Approve Desktop Login</CardTitle>
          <CardDescription className="text-white/60">
            Confirm this request only if you started login on desktop.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isAuthenticated && user && (
            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              Logged in as <span className="text-white font-medium">{user.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qr-token" className="text-white">QR Token</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                id="qr-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste scanned token"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          {!isApproved ? (
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full bg-[#F26B21] hover:bg-[#d95e19] text-white"
            >
              {isSubmitting ? 'Approving...' : 'Approve Login'}
            </Button>
          ) : (
            <div className="rounded-md border border-green-400/30 bg-green-500/10 p-3 text-green-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Approved. You can now return to your desktop.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QrApprovePage;