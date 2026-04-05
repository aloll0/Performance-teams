import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Move,
  KeyRound,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getAllUsers, createUser, updateUser, deleteUser, moveEmployee, adminResetUserPassword } from '@/services/userApi';
import { getAllTeams } from '@/services/teamApi';
import type { User } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LEVELS = ['Fresh', 'Implementor', 'Maker', 'Pro', 'Mentor', 'Pro / Mentor'];

const EmployeesPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    team: '',
    level: 'Fresh'
  });
  const [moveTeam, setMoveTeam] = useState('');
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', selectedTeam, selectedRole, isAdmin],
    queryFn: async () => {
      const params: any = {};
      if (!isAdmin) {
        params.role = 'employee';
      } else if (selectedRole !== 'all') {
        params.role = selectedRole;
      }
      if (selectedTeam !== 'all') params.team = selectedTeam;
      const response = await getAllUsers(params);
      return response.data as User[];
    }
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await getAllTeams();
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['employees'], exact: false });
      toast.success(response?.data?.message || 'Employee created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'], exact: false });
      toast.success('Employee updated successfully');
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'], exact: false });
      toast.success('Account deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  });

  const moveMutation = useMutation({
    mutationFn: moveEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'], exact: false });
      toast.success('Employee moved successfully');
      setIsMoveDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to move employee');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminResetUserPassword(id, { newPassword }),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setIsResetPasswordDialogOpen(false);
      setSelectedUserForPassword(null);
      setResetPasswordData({ newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      team: user?.team || '',
      level: 'Fresh'
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For team leaders, automatically use their team
    const submitData = {
      ...formData,
      role: 'employee',
      team: isAdmin ? formData.team : (user?.team || formData.team)
    };
    createMutation.mutate(submitData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      updateMutation.mutate({
        id: selectedEmployee.id,
        data: {
          name: formData.name,
          email: formData.email,
          level: formData.level,
          team: isAdmin ? formData.team : undefined
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (resetPasswordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    resetPasswordMutation.mutate({
      id: selectedUserForPassword.id,
      newPassword: resetPasswordData.newPassword
    });
  };

  const handleMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      moveMutation.mutate({
        employeeId: selectedEmployee.id,
        newTeam: moveTeam
      });
    }
  };

  const openEditDialog = (employee: User) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      team: employee.team || '',
      level: employee.level || 'Fresh'
    });
    setIsEditDialogOpen(true);
  };

  const openMoveDialog = (employee: User) => {
    setSelectedEmployee(employee);
    setMoveTeam('');
    setIsMoveDialogOpen(true);
  };

  const openResetPasswordDialog = (selectedUser: User) => {
    setSelectedUserForPassword(selectedUser);
    setResetPasswordData({ newPassword: '', confirmPassword: '' });
    setIsResetPasswordDialogOpen(true);
  };

  const filteredEmployees = employees?.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeClass = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'team_leader':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      default:
        return 'bg-green-500/20 text-green-300 border-green-400/30';
    }
  };

  const getRoleLabel = (role: User['role']) => role.replace('_', ' ');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Fresh': return 'bg-blue-500/20 text-blue-400';
      case 'Implementor': return 'bg-green-500/20 text-green-400';
      case 'Maker': return 'bg-yellow-500/20 text-yellow-400';
      case 'Pro': return 'bg-purple-500/20 text-purple-400';
      case 'Mentor': return 'bg-[#F26B21]/20 text-[#F26B21]';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F26B21]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-white/60">Manage company accounts</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/50" />
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D132C] border-white/10">
                    <SelectItem value="all" className="text-white">All Roles</SelectItem>
                    <SelectItem value="employee" className="text-white">Employees</SelectItem>
                    <SelectItem value="team_leader" className="text-white">Team Leaders</SelectItem>
                    <SelectItem value="admin" className="text-white">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D132C] border-white/10">
                    <SelectItem value="all" className="text-white">All Teams</SelectItem>
                    {teams?.map((team: any) => (
                      <SelectItem key={team._id} value={team.name} className="text-white">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F26B21]" />
            Accounts List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Team</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Level</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees?.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F26B21]/20 flex items-center justify-center overflow-hidden">
                          {employee.avatar ? (
                            <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#F26B21] font-medium text-sm">
                              {employee.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-white font-medium">{employee.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/70">{employee.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getRoleBadgeClass(employee.role)}>
                        {getRoleLabel(employee.role)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {employee.team}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getLevelColor(employee.level || ''))}>
                        {employee.role === 'employee' ? employee.level : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0D132C] border-white/10">
                          <DropdownMenuItem 
                            onClick={() => openEditDialog(employee)}
                            className="text-white hover:bg-white/10"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem 
                              onClick={() => openMoveDialog(employee)}
                              disabled={employee.role !== 'employee'}
                              className="text-white hover:bg-white/10"
                            >
                              <Move className="w-4 h-4 mr-2" />
                              Move Team
                            </DropdownMenuItem>
                          )}
                          {isAdmin && employee.role !== 'admin' && (
                            <DropdownMenuItem
                              onClick={() => openResetPasswordDialog(employee)}
                              className="text-white hover:bg-white/10"
                            >
                              <KeyRound className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete this account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription className="text-white/60">
              Create a new employee account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select 
                  value={formData.team} 
                  onValueChange={(value) => setFormData({ ...formData, team: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D132C] border-white/10">
                    {teams?.map((team: any) => (
                      <SelectItem key={team._id} value={team.name} className="text-white">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D132C] border-white/10">
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level} className="text-white">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription className="text-white/60">
              {selectedUserForPassword
                ? `Set a new password for ${selectedUserForPassword.name}`
                : 'Set a new password'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-new-password">New Password</Label>
              <Input
                id="admin-new-password"
                type="password"
                value={resetPasswordData.newPassword}
                onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-confirm-password">Confirm Password</Label>
              <Input
                id="admin-confirm-password"
                type="password"
                value={resetPasswordData.confirmPassword}
                onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
                className="border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription className="text-white/60">
              Update employee information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="edit-team">Team</Label>
                <Select 
                  value={formData.team} 
                  onValueChange={(value) => setFormData({ ...formData, team: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D132C] border-white/10">
                    {teams?.map((team: any) => (
                      <SelectItem key={team._id} value={team.name} className="text-white">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-level">Level</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D132C] border-white/10">
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level} className="text-white">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Employee Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Move Employee</DialogTitle>
            <DialogDescription className="text-white/60">
              Move {selectedEmployee?.name} to a different team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMove} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-team">New Team</Label>
              <Select 
                value={moveTeam} 
                onValueChange={setMoveTeam}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select new team" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D132C] border-white/10">
                  {teams?.filter((t: any) => t.name !== selectedEmployee?.team).map((team: any) => (
                    <SelectItem key={team._id} value={team.name} className="text-white">
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsMoveDialogOpen(false)}
                className="border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={moveMutation.isPending || !moveTeam}
              >
                {moveMutation.isPending ? 'Moving...' : 'Move Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
