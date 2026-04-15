import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  History,
  Sparkles
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAllEvaluations, createOrUpdateEvaluation, getEmployeeStats } from '@/services/evaluationApi';
import { getAllUsers } from '@/services/userApi';
import type { Evaluation, User } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CRITERIA = ['Code Quality', 'Performance', 'Communication', 'Problem Solving', 'Teamwork', 'Punctuality'];
const getUserId = (value?: Partial<User> | null) => value?.id || (value as any)?._id || '';

const EvaluationsPage = () => {
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isEvaluateDialogOpen, setIsEvaluateDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<User | null>(null);
  const [evaluationData, setEvaluationData] = useState({
    employeeId: '',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    criteria: CRITERIA.map(name => ({ name, score: 70, notes: '' }))
  });

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const response = await getAllEvaluations();
      return response.data as Evaluation[];
    }
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-for-evaluation'],
    queryFn: async () => {
      const params: any = { role: 'employee' };
      const response = await getAllUsers(params);
      return response.data as User[];
    }
  });

  const { data: employeeStats } = useQuery({
    queryKey: ['employeeStats', getUserId(selectedEmployeeData)],
    queryFn: async () => {
      if (!selectedEmployeeData) return null;
      const employeeId = getUserId(selectedEmployeeData);
      if (!employeeId) return null;
      const response = await getEmployeeStats(employeeId);
      return response.data;
    },
    enabled: !!selectedEmployeeData
  });

  const evaluateMutation = useMutation({
    mutationFn: createOrUpdateEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast.success('Evaluation saved successfully');
      setIsEvaluateDialogOpen(false);
      resetEvaluationForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save evaluation');
    }
  });

  const resetEvaluationForm = () => {
    setEvaluationData({
      employeeId: '',
      month: MONTHS[new Date().getMonth()],
      year: new Date().getFullYear(),
      criteria: CRITERIA.map(name => ({ name, score: 70, notes: '' }))
    });
  };

  const handleEvaluateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    evaluateMutation.mutate(evaluationData);
  };

  const updateCriterionScore = (index: number, score: number) => {
    const newCriteria = [...evaluationData.criteria];
    newCriteria[index].score = score;
    setEvaluationData({ ...evaluationData, criteria: newCriteria });
  };

  const updateCriterionNotes = (index: number, notes: string) => {
    const newCriteria = [...evaluationData.criteria];
    newCriteria[index].notes = notes;
    setEvaluationData({ ...evaluationData, criteria: newCriteria });
  };

  const openEvaluateDialog = (employee?: User) => {
    if (employee) {
      setEvaluationData({
        ...evaluationData,
        employeeId: getUserId(employee)
      });
    }
    setIsEvaluateDialogOpen(true);
  };

  const openHistoryDialog = (employee: User) => {
    setSelectedEmployeeData(employee);
    setIsHistoryDialogOpen(true);
  };

  const calculateTotalScore = () => {
    const total = evaluationData.criteria.reduce((sum, c) => sum + c.score, 0);
    return Math.round(total / evaluationData.criteria.length);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPerformanceBadge = (level: string) => {
    const colors: Record<string, string> = {
      'Excellent': 'bg-green-500/20 text-green-400',
      'Good': 'bg-blue-500/20 text-blue-400',
      'Average': 'bg-yellow-500/20 text-yellow-400',
      'Needs Improvement': 'bg-orange-500/20 text-orange-400',
      'Poor': 'bg-red-500/20 text-red-400'
    };
    return colors[level] || 'bg-gray-500/20 text-gray-400';
  };

  const getTrendIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (improvement < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  const filteredEvaluations = evaluations?.filter(evaluation => {
    const employee = evaluation.employeeId as User;
    return employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           employee?.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const safeEvaluations = (filteredEvaluations || []).filter((evaluation) => Boolean(evaluation?.employeeId));

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
          <h1 className="text-2xl font-bold text-white">Evaluations</h1>
          <p className="text-white/60">Manage employee performance evaluations</p>
        </div>
        <Button 
          onClick={() => openEvaluateDialog()}
          className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Evaluation
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search evaluations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeEvaluations.map((evaluation) => {
          const employee = evaluation.employeeId as User | null;
          const employeeName = employee?.name || 'Unknown employee';
          const employeeTeam = employee?.team || 'Unknown team';
          const employeeInitial = employeeName.charAt(0) || '?';
          return (
            <Card key={evaluation._id} className="bg-white/5 border-white/10 hover:border-[#F26B21]/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F26B21]/20 flex items-center justify-center">
                      <span className="text-[#F26B21] font-bold">
                        {employeeInitial}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{employeeName}</CardTitle>
                      <CardDescription className="text-white/50">{employeeTeam}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getPerformanceBadge(evaluation.performanceLevel)}>
                    {evaluation.performanceLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total Score</span>
                  <span className={cn('text-2xl font-bold', getPerformanceColor(evaluation.totalScore))}>
                    {evaluation.totalScore}%
                  </span>
                </div>
                <Progress value={evaluation.totalScore} className="h-2 bg-white/10" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{evaluation.month} {evaluation.year}</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(evaluation.improvementPercentage)}
                    <span className={evaluation.improvementPercentage >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {evaluation.improvementPercentage > 0 ? '+' : ''}{evaluation.improvementPercentage}%
                    </span>
                  </div>
                </div>

                {/* AI Feedback */}
                {evaluation.aiFeedback && (
                  <div className="p-3 rounded-lg bg-[#F26B21]/10 border border-[#F26B21]/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-[#F26B21]" />
                      <span className="text-[#F26B21] text-xs font-medium">AI Insight</span>
                    </div>
                    <p className="text-white/70 text-sm line-clamp-2">{evaluation.aiFeedback}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-white/20  hover:bg-white/10"
                    onClick={() => employee && openEvaluateDialog(employee)}
                    disabled={!employee}
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2 text-black" />
                    Evaluate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-white/20  hover:bg-white/10"
                    onClick={() => employee && openHistoryDialog(employee)}
                    disabled={!employee}
                  >
                    <History className="w-4 h-4 mr-2 text-black" />
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Evaluation Dialog */}
      <Dialog open={isEvaluateDialogOpen} onOpenChange={setIsEvaluateDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Performance Evaluation</DialogTitle>
            <DialogDescription className="text-white/60">
              Evaluate employee performance across multiple criteria
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEvaluateSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select 
                value={evaluationData.employeeId} 
                onValueChange={(value) => setEvaluationData({ ...evaluationData, employeeId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D132C] border-white/10">
                  {employees?.map((employee) => (
                    <SelectItem key={getUserId(employee)} value={getUserId(employee)} className="text-white">
                      {employee.name} - {employee.team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month & Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select 
                  value={evaluationData.month} 
                  onValueChange={(value) => setEvaluationData({ ...evaluationData, month: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D132C] border-white/10">
                    {MONTHS.map((month) => (
                      <SelectItem key={month} value={month} className="text-white">
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={evaluationData.year}
                  onChange={(e) => setEvaluationData({ ...evaluationData, year: parseInt(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Criteria Scores */}
            <div className="space-y-4">
              <Label>Evaluation Criteria</Label>
              {evaluationData.criteria.map((criterion, index) => (
                <div key={criterion.name} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{criterion.name}</span>
                    <span className={cn('text-lg font-bold', getPerformanceColor(criterion.score))}>
                      {criterion.score}/100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={criterion.score}
                    onChange={(e) => updateCriterionScore(index, parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#F26B21]"
                  />
                  <Input
                    placeholder={`Notes for ${criterion.name}...`}
                    value={criterion.notes}
                    onChange={(e) => updateCriterionNotes(index, e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  />
                </div>
              ))}
            </div>

            {/* Total Score Preview */}
            <div className="p-4 rounded-lg bg-[#F26B21]/10 border border-[#F26B21]/20">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Predicted Total Score</span>
                <span className={cn('text-3xl font-bold', getPerformanceColor(calculateTotalScore()))}>
                  {calculateTotalScore()}%
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEvaluateDialogOpen(false)}
                className="border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={evaluateMutation.isPending || !evaluationData.employeeId}
              >
                {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Evaluation History</DialogTitle>
            <DialogDescription className="text-white/60">
              {selectedEmployeeData?.name || 'Employee'} - Performance over time
            </DialogDescription>
          </DialogHeader>
          
          {employeeStats && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm">Total Evaluations</p>
                  <p className="text-2xl font-bold text-white">{employeeStats.totalEvaluations}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm">Average Score</p>
                  <p className={cn('text-2xl font-bold', getPerformanceColor(employeeStats.averageScore))}>
                    {employeeStats.averageScore}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm">Trend</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(employeeStats.improvement)}
                    <span className={employeeStats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {employeeStats.improvement > 0 ? '+' : ''}{employeeStats.improvement}%
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm">Best Score</p>
                  <p className="text-2xl font-bold text-green-400">{employeeStats.bestPerformance?.score}%</p>
                </div>
              </div>

              {/* Criterion Averages */}
              {employeeStats.criterionAverages && (
                <div>
                  <h4 className="text-white font-medium mb-3">Criterion Averages</h4>
                  <div className="space-y-3">
                    {Object.entries(employeeStats.criterionAverages).map(([name, scoreVal]: [string, unknown]) => (
                      <div key={name} className="flex items-center gap-4">
                        <span className="text-white/70 text-sm w-32">{name}</span>
                        <Progress value={scoreVal as number} className="flex-1 h-2 bg-white/10" />
                        <span className={cn('text-sm font-medium w-12 text-right', getPerformanceColor(scoreVal as number))}>
                          {scoreVal as number}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Evaluations */}
              {employeeStats.recentEvaluations && (
                <div>
                  <h4 className="text-white font-medium mb-3">Recent Evaluations</h4>
                  <div className="space-y-2">
                    {employeeStats.recentEvaluations.map((evalData: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight className="w-4 h-4 text-white/30" />
                          <span className="text-white">{evalData.month} {evalData.year}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getPerformanceBadge(evalData.performanceLevel)}>
                            {evalData.performanceLevel}
                          </Badge>
                          <span className={cn('font-bold', getPerformanceColor(evalData.score))}>
                            {evalData.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluationsPage;
