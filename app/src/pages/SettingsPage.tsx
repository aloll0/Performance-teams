import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Settings, 
  Lock, 
  Bell, 
  Moon,
  Shield,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { changePassword } from '@/services/authApi';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    evaluationReminders: true,
    darkMode: true,
    language: 'en'
  });

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

      {/* Notifications */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F26B21]" />
            Notifications
          </CardTitle>
          <CardDescription className="text-white/60">
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Email Notifications</Label>
              <p className="text-white/50 text-sm">Receive email updates about your account</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, emailNotifications: checked })
              }
              className="data-[state=checked]:bg-[#F26B21]"
            />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Evaluation Reminders</Label>
              <p className="text-white/50 text-sm">Get reminded about upcoming evaluations</p>
            </div>
            <Switch
              checked={preferences.evaluationReminders}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, evaluationReminders: checked })
              }
              className="data-[state=checked]:bg-[#F26B21]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#F26B21]" />
            Appearance
          </CardTitle>
          <CardDescription className="text-white/60">
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Dark Mode</Label>
              <p className="text-white/50 text-sm">Use dark theme throughout the application</p>
            </div>
            <Switch
              checked={preferences.darkMode}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, darkMode: checked })
              }
              className="data-[state=checked]:bg-[#F26B21]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F26B21]" />
            Security
          </CardTitle>
          <CardDescription className="text-white/60">
            Security settings for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-white/50 text-sm">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Enable
              </Button>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Session Management</p>
                <p className="text-white/50 text-sm">Manage your active sessions</p>
              </div>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                View Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
