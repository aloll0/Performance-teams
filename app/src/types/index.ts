export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'team_leader' | 'employee';
  team?: string;
  level?: 'Fresh' | 'Implementor' | 'Maker' | 'Pro' | 'Mentor' | 'Pro / Mentor';
  isActive?: boolean;
  createdAt?: string;
}

export interface Team {
  _id: string;
  name: string;
  leaderId: string | User;
  description?: string;
  employeeCount?: number;
  createdAt?: string;
}

export interface Criterion {
  name: string;
  score: number;
  notes?: string;
}

export interface Evaluation {
  _id: string;
  employeeId: string | User;
  evaluatedBy: string | User;
  month: string;
  year: number;
  criteria: Criterion[];
  totalScore: number;
  aiFeedback: string;
  aiInsights: {
    trend?: string;
    consistency?: string;
    strongAreas?: string;
    weakAreas?: string;
  };
  improvementPercentage: number;
  performanceLevel: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'Poor';
  suggestion: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  targetTeam?: string | null;
  createdBy: string | User;
  questions: Question[];
  totalPoints: number;
  timeLimit: number;
  isActive: boolean;
  results?: QuizResult[];
  hasAttempted?: boolean;
  userAttempt?: {
    score: number;
    percentage: number;
    completedAt: string;
  };
  createdAt?: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer?: number;
  points: number;
}

export interface QuizResult {
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  answers: {
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
  completedAt: string;
}

export interface DashboardAnalytics {
  overview: {
    totalEmployees: number;
    totalEvaluations: number;
    averageScore: number;
    evaluatedThisMonth: number;
  };
  performanceDistribution: Record<string, number>;
  teamStats: TeamStat[];
  topPerformers: TopPerformer[];
  monthlyTrend: MonthlyTrend[];
  levelDistribution: Record<string, number>;
}

export interface TeamStat {
  teamName: string;
  employeeCount: number;
  evaluationCount: number;
  averageScore: number;
}

export interface TopPerformer {
  employee: User;
  score: number;
  performanceLevel: string;
  month: string;
  year: number;
}

export interface MonthlyTrend {
  month: string;
  averageScore: number;
  evaluationCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DemoCredentials {
  admin: {
    email: string;
    password: string;
  };
  teamLeaders: {
    team: string;
    email: string;
    password?: string;
    passwordHint?: string;
  }[];
  employees: {
    name: string;
    team: string;
    email: string;
    password?: string;
  }[];
}

export interface WorkLogItem {
  task: string;
  hours: number;
  notes?: string;
}

export interface WorkLog {
  _id: string;
  employeeId: string | User;
  team: string;
  date: string;
  items: WorkLogItem[];
  totalHours: number;
  status: 'submitted' | 'reviewed';
  leaderComment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningCourse {
  id: string;
  title: string;
  url: string;
  platform?: string;
  focusArea?: string;
  notes?: string;
  team: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  completionCount: number;
  teamSize: number;
  completionRate: number;
  isCompletedByMe: boolean;
  completions: {
    userId: string;
    userName?: string;
    completedAt: string;
  }[];
}
