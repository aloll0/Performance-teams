import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BrainCircuit, 
  Plus, 
  Clock, 
  CheckCircle,
  Play,
  Trash2,
  MoreHorizontal,
  Trophy
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { getAllQuizzes, createQuiz, deleteQuiz } from '@/services/quizApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const QuizzesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canManageQuizzes = user?.role === 'admin' || user?.role === 'team_leader';
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    targetTeam: user?.role === 'team_leader' ? user.team : '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const response = await getAllQuizzes();
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete quiz');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      timeLimit: 30,
      targetTeam: user?.role === 'team_leader' ? user.team : '',
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]
    });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    (newQuestions[index] as any)[field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      targetTeam: user?.role === 'team_leader' ? user.team : (formData.targetTeam || null)
    };
    createMutation.mutate(payload);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const startQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}`);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
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
          <h1 className="text-2xl font-bold text-white">Interview Quizzes</h1>
          <p className="text-white/60">Test your skills and knowledge</p>
        </div>
        {canManageQuizzes && (
          <Button 
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger 
            value="available" 
            className="data-[state=active]:bg-[#F26B21] data-[state=active]:text-white text-white/70"
          >
            Available
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-[#F26B21] data-[state=active]:text-white text-white/70"
          >
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes?.filter((quiz: any) => !quiz.hasAttempted && quiz.isActive).map((quiz: any) => (
              <Card key={quiz._id} className="bg-white/5 border-white/10 hover:border-[#F26B21]/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F26B21]/20 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-[#F26B21]" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{quiz.title}</CardTitle>
                        <CardDescription className="text-white/50">
                          {quiz.questions?.length || 0} questions
                        </CardDescription>
                      </div>
                    </div>
                    {canManageQuizzes && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0D132C] border-white/10">
                          <DropdownMenuItem 
                            onClick={() => handleDelete(quiz._id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quiz.description && (
                    <p className="text-white/70 text-sm line-clamp-2">{quiz.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white/50">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.timeLimit} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                      <CheckCircle className="w-4 h-4" />
                      <span>{quiz.totalPoints} points</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => startQuiz(quiz._id)}
                    className="w-full bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes?.filter((quiz: any) => quiz.hasAttempted).map((quiz: any) => (
              <Card key={quiz._id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{quiz.title}</CardTitle>
                        <CardDescription className="text-white/50">
                          Completed
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white/70">Your Score</span>
                    <div className="text-right">
                      <span className={cn('text-2xl font-bold', getScoreColor(quiz.userAttempt?.percentage || 0))}>
                        {quiz.userAttempt?.percentage}%
                      </span>
                      <p className="text-white/50 text-xs">
                        {quiz.userAttempt?.score} / {quiz.totalPoints} points
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(quiz.userAttempt?.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Quiz Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-[#0D132C] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription className="text-white/60">
              Create an interview quiz with multiple choice questions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Quiz Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Time Limit (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <Label>Target Team (optional)</Label>
                <Input
                  value={formData.targetTeam}
                  onChange={(e) => setFormData({ ...formData, targetTeam: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Example: Debuger"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addQuestion}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {formData.questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Question {qIndex + 1}</span>
                    {formData.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Enter question"
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Options</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className="w-4 h-4 accent-[#F26B21]"
                        />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="bg-white/5 border-white/10 text-white"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="border-white/20  hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Quiz'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizzesPage;
