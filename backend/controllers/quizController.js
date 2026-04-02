const { validationResult } = require('express-validator');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Get all quizzes
const getAllQuizzes = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .select('-questions.correctAnswer') // Hide correct answers
      .sort({ createdAt: -1 });

    // Add user's attempt info if available
    const quizzesWithAttempts = quizzes.map(quiz => {
      const quizObj = quiz.toObject();
      const userResult = quiz.results.find(
        r => r.userId.toString() === req.user.id
      );
      
      return {
        ...quizObj,
        userAttempt: userResult ? {
          score: userResult.score,
          percentage: userResult.percentage,
          completedAt: userResult.completedAt
        } : null,
        hasAttempted: !!userResult
      };
    });

    res.json(quizzesWithAttempts);
  } catch (error) {
    console.error('Get all quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get quiz by ID (with questions for taking quiz)
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user has already attempted
    const hasAttempted = quiz.results.some(
      r => r.userId.toString() === req.user.id
    );

    // If taking the quiz, don't show correct answers
    const quizResponse = quiz.toObject();
    
    if (!hasAttempted) {
      // Hide correct answers for new attempts
      quizResponse.questions = quizResponse.questions.map(q => ({
        question: q.question,
        options: q.options,
        points: q.points
      }));
    }

    res.json({
      ...quizResponse,
      hasAttempted
    });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new quiz (Admin only)
const createQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, timeLimit } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      timeLimit: timeLimit || 30,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: await quiz.populate('createdBy', 'name email')
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update quiz (Admin only)
const updateQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, timeLimit, isActive } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (timeLimit) quiz.timeLimit = timeLimit;
    if (isActive !== undefined) quiz.isActive = isActive;

    await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: await quiz.populate('createdBy', 'name email')
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete quiz (Admin only)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quiz.deleteOne();

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit quiz attempt
const submitQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { answers } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isActive) {
      return res.status(400).json({ message: 'Quiz is not active' });
    }

    // Check if user has already attempted
    const hasAttempted = quiz.results.some(
      r => r.userId.toString() === req.user.id
    );

    if (hasAttempted) {
      return res.status(400).json({ message: 'You have already attempted this quiz' });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalScore = 0;
    const answerDetails = [];

    answers.forEach((answer, index) => {
      const question = quiz.questions[index];
      if (!question) return;

      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) {
        correctAnswers++;
        totalScore += question.points || 1;
      }

      answerDetails.push({
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    // Add result to quiz
    quiz.results.push({
      userId: req.user.id,
      score: totalScore,
      totalQuestions,
      correctAnswers,
      percentage,
      answers: answerDetails
    });

    await quiz.save();

    res.json({
      message: 'Quiz submitted successfully',
      result: {
        score: totalScore,
        totalQuestions,
        correctAnswers,
        percentage,
        totalPoints: quiz.totalPoints,
        answerDetails
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get quiz results for a user
const getUserQuizResults = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Users can only see their own results, admins can see all
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const quizzes = await Quiz.find({
      'results.userId': userId
    }).select('title description results totalPoints');

    const results = quizzes.map(quiz => {
      const userResult = quiz.results.find(
        r => r.userId.toString() === userId
      );
      
      return {
        quizId: quiz._id,
        quizTitle: quiz.title,
        score: userResult.score,
        totalPoints: quiz.totalPoints,
        totalQuestions: userResult.totalQuestions,
        correctAnswers: userResult.correctAnswers,
        percentage: userResult.percentage,
        completedAt: userResult.completedAt
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Get user quiz results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all quiz results (Admin only)
const getAllQuizResults = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'name email')
      .populate('results.userId', 'name email team');

    const allResults = quizzes.map(quiz => ({
      quizId: quiz._id,
      quizTitle: quiz.title,
      totalPoints: quiz.totalPoints,
      results: quiz.results.map(result => ({
        user: result.userId,
        score: result.score,
        percentage: result.percentage,
        completedAt: result.completedAt
      }))
    }));

    res.json(allResults);
  } catch (error) {
    console.error('Get all quiz results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getUserQuizResults,
  getAllQuizResults
};
