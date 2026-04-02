import { useQuery } from '@tanstack/react-query';
import { 
  UserCircle, 
  Mail, 
  Building2, 
  Award,
  Shield,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { getEmployeeStats } from '@/services/evaluationApi';
import { getUserQuizResults } from '@/services/quizApi';
import { cn } from '@/lib/utils';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const isEmployee = user?.role === 'employee';

  const { data: employeeStats } = useQuery({
    queryKey: ['myStats', user?.id],
    queryFn: async () => {
      if (!user?.id || !isEmployee) return null;
      const response = await getEmployeeStats(user.id);
      return response.data;
    },
    enabled: !!user?.id && isEmployee
  });

  const { data: quizResults } = useQuery({
    queryKey: ['myQuizResults', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await getUserQuizResults(user.id);
      return response.data;
    },
    enabled: !!user?.id
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Fresh': return 'bg-blue-500/20 text-blue-400';
      case 'Implementor': return 'bg-green-500/20 text-green-400';
      case 'Maker': return 'bg-yellow-500/20 text-yellow-400';
      case 'Pro': return 'bg-purple-500/20 text-purple-400';
      case 'Mentor': return 'bg-[#F26B21]/20 text-[#F26B21]';
      case 'Pro / Mentor': return 'bg-white/10 text-white';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin': return <Shield className="w-5 h-5 text-[#F26B21]" />;
      case 'team_leader': return <Award className="w-5 h-5 text-[#F26B21]" />;
      default: return <UserCircle className="w-5 h-5 text-[#F26B21]" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-white/60">View your account information and performance</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-[#F26B21]/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-[#F26B21]">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                {getRoleIcon()}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                {user?.team && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{user.team}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getLevelColor(user?.level || '')}>
                {user?.level || 'N/A'}
              </Badge>
              <span className="text-white/50 text-sm">Level</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - For Employees Only */}
      {isEmployee && employeeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm font-medium">Total Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{employeeStats.totalEvaluations}</div>
              <p className="text-white/50 text-sm">Performance reviews</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('text-3xl font-bold', getPerformanceColor(employeeStats.averageScore))}>
                {employeeStats.averageScore}%
              </div>
              <p className="text-white/50 text-sm">Overall performance</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm font-medium">Best Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {employeeStats.bestPerformance?.score || 0}%
              </div>
              <p className="text-white/50 text-sm">
                {employeeStats.bestPerformance?.month} {employeeStats.bestPerformance?.year}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/60 text-sm font-medium">Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('text-3xl font-bold flex items-center gap-2', 
                employeeStats.improvement >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                <TrendingUp className="w-6 h-6" />
                {employeeStats.improvement > 0 ? '+' : ''}{employeeStats.improvement || 0}%
              </div>
              <p className="text-white/50 text-sm">Since first evaluation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Criterion Averages - For Employees Only */}
      {isEmployee && employeeStats?.criterionAverages && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Performance by Criteria</CardTitle>
            <CardDescription className="text-white/60">
              Your average scores across different evaluation criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(employeeStats.criterionAverages).map(([name, scoreVal]: [string, unknown]) => (
                <div key={name} className="flex items-center gap-4">
                  <span className="text-white/70 text-sm w-40">{name}</span>
                  <Progress value={scoreVal as number} className="flex-1 h-3 bg-white/10" />
                  <span className={cn('text-sm font-medium w-16 text-right', getPerformanceColor(scoreVal as number))}>
                    {scoreVal as number}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Results */}
      {quizResults && quizResults.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Quiz Results</CardTitle>
            <CardDescription className="text-white/60">
              Your performance in interview quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizResults.map((result: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div>
                    <p className="text-white font-medium">{result.quizTitle}</p>
                    <p className="text-white/50 text-sm">
                      Completed on {new Date(result.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn('text-xl font-bold', getPerformanceColor(result.percentage))}>
                        {result.percentage}%
                      </p>
                      <p className="text-white/50 text-xs">
                        {result.correctAnswers}/{result.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Information */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/50 text-sm mb-1">Full Name</p>
              <p className="text-white font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Email Address</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Role</p>
              <p className="text-white font-medium capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            {user?.team && (
              <div>
                <p className="text-white/50 text-sm mb-1">Team</p>
                <p className="text-white font-medium">{user.team}</p>
              </div>
            )}
            {user?.level && (
              <div>
                <p className="text-white/50 text-sm mb-1">Level</p>
                <p className="text-white font-medium">{user.level}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
