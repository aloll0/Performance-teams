import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  UserCircle,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getAllTeams, createTeam, updateTeam, deleteTeam } from '@/services/teamApi';
import { getTeamLeaders } from '@/services/userApi';
import { toast } from 'sonner';

const TeamsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: ''
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await getAllTeams();
      return response.data;
    }
  });

  const { data: teamLeaders } = useQuery({
    queryKey: ['teamLeaders'],
    queryFn: async () => {
      const response = await getTeamLeaders();
      return response.data;
    },
    enabled: isAdmin
  });

  const getLeaderName = (leaderId: any) => {
    if (!leaderId) return 'Unknown';
    if (typeof leaderId === 'object') {
      return leaderId?.name || 'Unknown';
    }
    return 'Unknown';
  };

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update team');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete team');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      leaderId: ''
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam) {
      updateMutation.mutate({
        id: selectedTeam._id,
        data: formData
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (team: any) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      leaderId: typeof team.leaderId === 'object' ? team.leaderId._id : team.leaderId
    });
    setIsEditDialogOpen(true);
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
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <p className="text-white/60">Manage teams and their leaders</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          disabled={!isAdmin}
          className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams?.map((team: any) => (
          <Card key={team._id} className="bg-white/5 border-white/10 hover:border-[#F26B21]/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#F26B21]/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#F26B21]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{team.name}</CardTitle>
                    <CardDescription className="text-white/50">
                      {team.employeeCount || 0} employees
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" disabled={!isAdmin}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#0D132C] border-white/10">
                    <DropdownMenuItem 
                      onClick={() => openEditDialog(team)}
                      className="text-white"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(team._id)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.description && (
                <p className="text-white/70 text-sm">{team.description}</p>
              )}
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <UserCircle className="w-5 h-5 text-[#F26B21]" />
                <div>
                  <p className="text-white/50 text-xs">Team Leader</p>
                  <p className="text-white font-medium">
                    {getLeaderName(team.leaderId)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 text-sm">{team.employeeCount || 0} Members</span>
                </div>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Team Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
            <DialogDescription className="text-white/60">
              Create a new team and assign a leader
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leader">Team Leader</Label>
              <Select 
                value={formData.leaderId} 
                onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select team leader" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D132C] border-white/10">
                  {teamLeaders?.map((leader: any) => (
                    <SelectItem key={leader.id} value={leader.id} className="text-white">
                      {leader.name} - {leader.team || 'No team'}
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
                className="border-white/20 "
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription className="text-white/60">
              Update team information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Team Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-leader">Team Leader</Label>
              <Select 
                value={formData.leaderId} 
                onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select team leader" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D132C] border-white/10">
                  {teamLeaders?.map((leader: any) => (
                    <SelectItem key={leader.id} value={leader.id} className="text-white">
                      {leader.name}
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
                className="border-white/20  "
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsPage;
