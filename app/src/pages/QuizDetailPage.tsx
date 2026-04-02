import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getQuizById, submitQuiz } from '@/services/quizApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const QuizDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isAutoSubmitTriggered, setIsAutoSubmitTriggered] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const response = await getQuizById(id!);
      return response.data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (quiz && !quiz.hasAttempted) {
      setTimeLeft(quiz.timeLimit * 60);
      setAnswers(new Array(quiz.questions.length).fill(-1));
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted]);

  const submitMutation = useMutation({
    mutationFn: (vars: { id: string; data: { answers: { selectedAnswer: number }[] } }) => submitQuiz(vars.id, vars.data),
    onSuccess: (response) => {
      setResult(response.data.result);
      setIsSubmitted(true);
      toast.success('Quiz submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    }
  });

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    if (submitMutation.isPending || isSubmitted) return;
    const formattedAnswers = answers.map(answer => ({ selectedAnswer: answer }));
    submitMutation.mutate({ id: id!, data: { answers: formattedAnswers } });
  };

  useEffect(() => {
    if (!quiz || quiz.hasAttempted || isSubmitted) return;

    const forceSubmit = () => {
      if (isAutoSubmitTriggered) return;
      setIsAutoSubmitTriggered(true);
      toast.error('Quiz auto-submitted because you left the exam page.');
      handleSubmit();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceSubmit();
      }
    };

    const onWindowBlur = () => {
      forceSubmit();
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isSubmitted) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [quiz, isSubmitted, isAutoSubmitTriggered, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (quiz?.hasAttempted && !isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Already Completed</h2>
            <p className="text-white/60 mb-6">
              You have already completed this quiz. You can only attempt each quiz once.
            </p>
            <Button 
              onClick={() => navigate('/quizzes')}
              className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Trophy className={cn('w-20 h-20 mx-auto mb-4', getScoreColor(result.percentage))} />
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-white/60 mb-6">
              Here's how you performed on {quiz?.title}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-white/50 text-sm mb-1">Score</p>
                <p className={cn('text-2xl font-bold', getScoreColor(result.percentage))}>
                  {result.percentage}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-white/50 text-sm mb-1">Correct</p>
                <p className="text-2xl font-bold text-white">
                  {result.correctAnswers}/{result.totalQuestions}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-white/50 text-sm mb-1">Points</p>
                <p className="text-2xl font-bold text-white">
                  {result.score}
                </p>
              </div>
            </div>

            {/* Answer Review */}
            <div className="text-left space-y-3">
              <h3 className="text-white font-medium mb-4">Answer Review</h3>
              {result.answerDetails.map((answer: any, index: number) => (
                <div 
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    answer.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                  )}
                >
                  {answer.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-white">Question {index + 1}</span>
                  <span className={cn('ml-auto text-sm', answer.isCorrect ? 'text-green-400' : 'text-red-400')}>
                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <Button 
                onClick={() => navigate('/quizzes')}
                className="flex-1 bg-[#F26B21] hover:bg-[#d85a1b] text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz?.questions?.[currentQuestion];
  const progress = ((currentQuestion + 1) / (quiz?.questions?.length || 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            toast.error('Leaving the quiz will auto-submit your answers.');
            handleSubmit();
            navigate('/quizzes');
          }}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Exit Quiz
        </Button>
        <div className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 text-[#F26B21]" />
          <span className={cn('font-mono text-lg', timeLeft < 60 && 'text-red-400')}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-white/60">
          <span>Question {currentQuestion + 1} of {quiz?.questions?.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 bg-white/10" />
      </div>

      {/* Question Card */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg leading-relaxed">
            {question?.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question?.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={cn(
                'w-full p-4 rounded-lg border text-left transition-all',
                answers[currentQuestion] === index
                  ? 'bg-[#F26B21]/20 border-[#F26B21] text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  answers[currentQuestion] === index
                    ? 'border-[#F26B21] bg-[#F26B21]'
                    : 'border-white/30'
                )}>
                  {answers[currentQuestion] === index && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentQuestion === (quiz?.questions?.length || 0) - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={answers.some(a => a === -1) || submitMutation.isPending}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-[#F26B21] hover:bg-[#d85a1b] text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {quiz?.questions.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={cn(
                  'w-10 h-10 rounded-lg font-medium transition-all',
                  currentQuestion === index
                    ? 'bg-[#F26B21] text-white'
                    : answers[index] !== -1
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizDetailPage;
