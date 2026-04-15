import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Award,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  CalendarDays,
  Clock3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { getDashboardAnalytics, getTeamLeaderPerformance } from '@/services/analyticsApi';
import { getAllQuizzes } from '@/services/quizApi';
import { getMyWorkLogs } from '@/services/workLogApi';
import type { DashboardAnalytics } from '@/types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#F26B21', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const DashboardPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  const canViewAnalytics = isAdmin || user?.role === 'team_leader';

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const response = await getDashboardAnalytics();
      return response.data as DashboardAnalytics;
    },
    enabled: canViewAnalytics
  });

  const { data: teamLeaderPerformance } = useQuery({
    queryKey: ['teamLeaderPerformance'],
    queryFn: async () => {
      const response = await getTeamLeaderPerformance();
      return response.data;
    },
    enabled: isAdmin
  });

  const { data: employeeQuizzes } = useQuery({
    queryKey: ['dashboardEmployeeQuizzes'],
    queryFn: async () => {
      const response = await getAllQuizzes({ isActive: true });
      return response.data;
    },
    enabled: isEmployee
  });

  const { data: employeeLogs } = useQuery({
    queryKey: ['dashboardEmployeeLogs'],
    queryFn: async () => {
      const response = await getMyWorkLogs();
      return response.data;
    },
    enabled: isEmployee
  });

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend,
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    description: string; 
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white/60 text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-[#F26B21]/20">
          <Icon className="w-4 h-4 text-[#F26B21]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`flex items-center text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          <p className="text-white/50 text-xs">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F26B21]"></div>
      </div>
    );
  }

  if (isEmployee) {
    const today = new Date().toISOString().split('T')[0];
    const todayLog = (employeeLogs || []).find((log: any) => log.date === today);
    const availableQuizzes = (employeeQuizzes || []).filter((quiz: any) => !quiz.hasAttempted && quiz.isActive);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="text-white/60">Your team exams and today's work summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#F26B21]" />
                Team Exams
              </CardTitle>
              <CardDescription className="text-white/60">Assigned quizzes from your team leader</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableQuizzes.length === 0 ? (
                <p className="text-white/60 text-sm">No active quizzes assigned to your team yet.</p>
              ) : (
                availableQuizzes.slice(0, 4).map((quiz: any) => (
                  <div key={quiz._id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                    <p className="text-white font-medium">{quiz.title}</p>
                    <p className="text-white/50 text-xs mt-1">{quiz.questions?.length || 0} questions • {quiz.timeLimit} min</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#F26B21]" />
                Today's Work
              </CardTitle>
              <CardDescription className="text-white/60">Tasks submitted in your daily log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!todayLog ? (
                <p className="text-white/60 text-sm">You have not submitted your daily tasks yet.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock3 className="w-4 h-4 text-[#F26B21]" />
                    <span>Total: {todayLog.totalHours} / 7 hours</span>
                  </div>
                  {todayLog.items.map((item: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg border border-white/10 bg-white/5">
                      <p className="text-white text-sm font-medium">{item.task}</p>
                      <p className="text-white/50 text-xs mt-1">{item.hours}h {item.notes ? `• ${item.notes}` : ''}</p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const performanceData = analytics?.performanceDistribution 
    ? Object.entries(analytics.performanceDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const monthlyData = analytics?.monthlyTrend || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Overview of your team's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={analytics?.overview.totalEmployees || 0}
          description="Active employees"
          icon={Users}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Evaluations"
          value={analytics?.overview.totalEvaluations || 0}
          description="Total evaluations"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Average Score"
          value={`${analytics?.overview.averageScore || 0}%`}
          description="Team average"
          icon={TrendingUp}
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="This Month"
          value={analytics?.overview.evaluatedThisMonth || 0}
          description="Evaluations completed"
          icon={Award}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Monthly Performance Trend</CardTitle>
            <CardDescription className="text-white/60">
              Average scores over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#ffffff60" fontSize={12} />
                <YAxis stroke="#ffffff60" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D132C', 
                    border: '1px solid #ffffff20',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="#F26B21" 
                  strokeWidth={2}
                  dot={{ fill: '#F26B21' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Performance Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Breakdown by performance level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {performanceData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D132C', 
                    border: '1px solid #ffffff20',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {performanceData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-white/70 text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Only Sections */}
      {isAdmin && (
        <>
          {/* Team Statistics */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F26B21]" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Team</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Employees</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Evaluations</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Average Score</th>
                      <th className="text-left py-3 px-4 text-white/60 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.teamStats.map((team) => (
                      <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-medium">{team.teamName}</td>
                        <td className="py-3 px-4 text-white/70">{team.employeeCount}</td>
                        <td className="py-3 px-4 text-white/70">{team.evaluationCount}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            team.averageScore >= 80 ? 'text-green-400' :
                            team.averageScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {team.averageScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Progress 
                            value={team.averageScore} 
                            className="h-2 w-24 bg-white/10"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Team Leader Performance */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Team Leader Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamLeaderPerformance?.map((leader: any) => (
                  <div 
                    key={leader.leader.id} 
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#F26B21]/20 flex items-center justify-center">
                        <span className="text-[#F26B21] font-bold">
                          {leader.leader.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{leader.leader.name}</p>
                        <p className="text-white/50 text-sm">{leader.leader.team}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Team Size</span>
                        <span className="text-white">{leader.teamSize}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Average Score</span>
                        <span className={`font-semibold ${
                          leader.averageScore >= 80 ? 'text-green-400' :
                          leader.averageScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {leader.averageScore}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Evaluations</span>
                        <span className="text-white">{leader.totalEvaluations}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Top Performers */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F26B21]" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics?.topPerformers.map((performer, index) => (
              <div 
                key={performer.employee.id} 
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#F26B21]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#F26B21] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    performer.performanceLevel === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                    performer.performanceLevel === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {performer.performanceLevel}
                  </span>
                </div>
                <p className="text-white font-medium truncate">{performer.employee.name}</p>
                <p className="text-white/50 text-sm">{performer.employee.team}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#F26B21]">{performer.score}%</span>
                  <span className="text-white/30 text-xs">{performer.month}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
