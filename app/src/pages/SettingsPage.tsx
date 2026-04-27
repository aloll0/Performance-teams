import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Settings, 
  Lock, 
  Camera,
  Trash2,
  Shield,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { changePassword } from '@/services/authApi';
import { deleteUser, removeMyAvatar, updateMyAvatar } from '@/services/userApi';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');


  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) {
        throw new Error('User not found');
      }

      return deleteUser(user.id);
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      logout();
      navigate('/login', { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatar: string) => updateMyAvatar({ avatar }),
    onSuccess: (response: any) => {
      toast.success(response?.data?.message || 'Profile image updated successfully');
      if (response?.data?.user) {
        updateUser(response.data.user);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile image');
    }
  });

  const removeAvatarMutation = useMutation({
    mutationFn: removeMyAvatar,
    onSuccess: (response: any) => {
      toast.success(response?.data?.message || 'Profile image removed successfully');
      setAvatarUrl('');
      if (response?.data?.user) {
        updateUser(response.data.user);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove profile image');
    }
  });

  const handleDeleteAccount = () => {
    if (!user?.id) return;

    const confirmed = window.confirm('This will deactivate your account. Continue?');
    if (!confirmed) return;

    deleteAccountMutation.mutate();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setAvatarUrl(result);
      updateAvatarMutation.mutate(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUrlSave = () => {
    const value = avatarUrl.trim();
    if (!value) {
      toast.error('Please enter image URL first');
      return;
    }

    updateAvatarMutation.mutate(value);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    passwordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/60">Manage your account settings and preferences</p>
      </div>

      {/* Change Password */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#F26B21]" />
            Change Password
          </CardTitle>
          <CardDescription className="text-white/60">
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter your new password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Confirm your new password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
              disabled={passwordMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#F26B21]" />
            Profile Image
          </CardTitle>
          <CardDescription className="text-white/60">
            Upload or remove your account picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/70 text-xl font-semibold">{user?.name?.charAt(0)}</span>
              )}
            </div>
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={handleAvatarFileChange} className="bg-white/5 border-white/10 text-white file:text-white" />
              <p className="text-white/50 text-xs">Max 2 MB. PNG/JPG/WebP supported.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-url" className="text-white">Or Image URL</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
              onClick={handleAvatarUrlSave}
              disabled={updateAvatarMutation.isPending}
            >
              {updateAvatarMutation.isPending ? 'Saving...' : 'Save Image'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 hover:bg-white/10 text-white"
              onClick={() => removeAvatarMutation.mutate()}
              disabled={removeAvatarMutation.isPending || !user?.avatar}
            >
              <Trash2 className="w-4 h-4 mr-2 text-white" />
              {removeAvatarMutation.isPending ? 'Removing...' : 'Remove Image'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {user?.role === 'admin' && (
        <Card className="bg-white/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-white/60">
              Deactivate the current admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white font-medium">Delete My Account</p>
                <p className="text-white/50 text-sm">
                  This will deactivate your account and sign you out immediately.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* About */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F26B21]" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/50">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Build</span>
              <span className="text-white">2026.04.02</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Environment</span>
              <span className="text-white">Production</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
