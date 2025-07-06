const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://socket-live-polling-system.vercel.app',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri =
  'mongodb+srv://assimfrommohania:wNPxNYtEpU8RKQbK@cluster0.css7qqh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'quizApp';

mongoose
  .connect(uri, {
    dbName: dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ Connection error:', err));

// Quiz Schema
const quizSchema = new mongoose.Schema({
  teacherName: String,
  question: String,
  options: [String],
  correctAnswer: Number,
  createdAt: { type: Date, default: Date.now },
  responses: [
    {
      studentName: String,
      answer: Number,
      isCorrect: Boolean,
      timestamp: Date,
    },
  ],
});

const Quiz = mongoose.model('Quiz', quizSchema);

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  name: String,
  isActive: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
});

const Teacher = mongoose.model('Teacher', teacherSchema);

// In-memory storage for current session
let currentTeacher = null;
let currentQuiz = null;
let connectedStudents = new Map();
let quizTimer = null;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('teacher-join', (teacherName) => {
    try {
      // If another teacher is already active
      if (currentTeacher) {
        socket.emit('error', 'Another teacher is already active');
        return;
      }

      // First, set the joining teacher
      currentTeacher = {
        id: socket.id,
        name: teacherName,
      };
      socket.join('teacher');

      console.log(`Teacher ${teacherName} joined`);

      // Case: there is already a current quiz ongoing
      if (currentQuiz) {
        console.log('currentQuiz', currentQuiz);
        if (currentQuiz.teacherName === teacherName) {
          // 👇 Same teacher reconnecting — restore quiz state
          socket.emit('teacher-joined', { name: teacherName });
          socket.emit('student-count', connectedStudents.size);
          socket.emit('current-quiz', currentQuiz);

          console.log(`Restored quiz for teacher ${teacherName}`);
        } else {
          // 👇 Different teacher while a quiz is active
          io.to('students').emit('quiz-ended', {
            reason: 'Teacher changed',
          });

          // Clear current quiz
          currentQuiz = null;

          // Notify new teacher
          socket.emit('teacher-joined', { name: teacherName });
          socket.emit('student-count', connectedStudents.size);
          socket.emit('current-quiz', currentQuiz);

          console.log(
            `Different teacher ${teacherName} joined, cleared previous quiz`
          );
        }
      } else {
        // No quiz in progress, normal join
        socket.emit('teacher-joined', { name: teacherName });
        socket.emit('student-count', connectedStudents.size);

        console.log(`Teacher ${teacherName} joined, no active quiz`);
      }
    } catch (error) {
      socket.emit('teacher-join-error', 'Error joining as teacher');
      console.error('Error in teacher-join:', error);
    }
  });

  // Student joins
  socket.on('student-join', (studentName) => {
    try {
      // Check if this student name is already in connectedStudents (active)
      const existingStudent = Array.from(connectedStudents.values()).find(
        (s) => s.name === studentName
      );

      if (existingStudent) {
        // Another active session with same name
        socket.emit('error', 'Student with this name is already active');
        return;
      }

      socket.join('students');

      // Check if student had already responded to the current quiz
      let isRejoinFromQuiz = false;
      let previousResponse = null;

      if (currentQuiz) {
        const response = currentQuiz.responses.find(
          (r) => r.studentName === studentName
        );

        if (response) {
          isRejoinFromQuiz = true;
          previousResponse = response;
        }
      }

      const studentData = {
        id: socket.id,
        name: studentName,
        joinedAt: new Date(),
      };

      connectedStudents.set(socket.id, studentData);

      if (isRejoinFromQuiz) {
        // Student rejoining after having submitted response earlier
        socket.emit('student-joined', { name: studentName, rejoin: true });
        socket.emit('current-quiz', currentQuiz);

        console.log(`Student ${studentName} rejoined (from quiz state)`);
      } else {
        // New student join
        socket.emit('student-joined', { name: studentName });

        if (currentQuiz) {
          const quizForStudent = {
            teacherName: currentQuiz.teacherName,
            question: currentQuiz.question,
            options: currentQuiz.options,
          };

          socket.emit('current-quiz', quizForStudent);
        }
        console.log(`Student ${studentName} joined`);
      }

      // Notify teacher of current student count
      io.to('teacher').emit('student-count', connectedStudents.size);
      socket.emit('student-count', connectedStudents.size);
    } catch (err) {
      socket.emit('student-join-error', 'Error joining as student');
      console.error('Error in student-join:', err);
    }
  });

  // Teacher starts quiz
  socket.on('start-quiz', async (quizData) => {
    try {
      // Check if caller is active teacher
      if (!currentTeacher || currentTeacher.id !== socket.id) {
        socket.emit('quiz-error', 'Only the active teacher can start a quiz.');
        return;
      }

      // Prevent starting a quiz if one is already active
      if (currentQuiz) {
        socket.emit('quiz-error', 'A quiz is already in progress.');
        return;
      }

      // Create new quiz
      const quiz = new Quiz({
        teacherName: currentTeacher.name,
        question: quizData.question,
        options: quizData.options,
        correctAnswer: quizData.correctAnswer,
      });

      await quiz.save();

      currentQuiz = {
        id: quiz._id,
        question: quizData.question,
        options: quizData.options,
        correctAnswer: quizData.correctAnswer,
        teacherName: currentTeacher.name,
        responses: [],
      };

      const quizForStudent = {
        teacherName: currentQuiz.teacherName,
        question: currentQuiz.question,
        options: currentQuiz.options,
      };

      // Broadcast quiz to students
      io.to('students').emit('current-quiz', quizForStudent);

      // Notify teacher
      socket.emit('current-quiz', currentQuiz);

      console.log(`Quiz started by ${currentTeacher.name}`);

      // Start timer
      startQuizTimer();
    } catch (error) {
      console.error('Error starting quiz:', error);
      socket.emit('quiz-error', 'An error occurred while starting the quiz.');
    }
  });

  // Teacher starts quiz
  socket.on('end-quiz', () => {
    try {
      // Check if caller is active teacher
      if (!currentTeacher || currentTeacher.id !== socket.id) {
        socket.emit('quiz-error', 'Only the active teacher can end a quiz.');
        return;
      }
      currentQuiz = null;

      // Broadcast quiz to students
      io.to('students').emit('current-quiz', currentQuiz);

      // Notify teacher
      socket.emit('current-quiz', currentQuiz);

      console.log(`Quiz ended by ${currentTeacher.name}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      socket.emit('quiz-error', 'An error occurred while starting the quiz.');
    }
  });

  // Student submits answer
  socket.on('submit-answer', async (answerData) => {
    try {
      if (!currentQuiz) {
        socket.emit('error', 'No active quiz');
        return;
      }

      const student = connectedStudents.get(socket.id);
      if (!student) {
        socket.emit('error', 'Student not found');
        return;
      }
      if (!quizTimer) {
        socket.emit('error', 'Quiz time out');
        return;
      }

      const isCorrect = answerData.answer === currentQuiz.correctAnswer;

      const response = {
        studentName: student.name,
        answer: answerData.answer,
        isCorrect: isCorrect,
        timestamp: new Date(),
      };

      // Add to current quiz responses
      currentQuiz.responses.push(response);

      // Update database
      await Quiz.findByIdAndUpdate(currentQuiz.id, {
        $push: { responses: response },
      });

      socket.emit('current-quiz', currentQuiz);

      // Update teacher with response count
      io.to('teacher').emit('current-quiz', currentQuiz);

      console.log(`${student.name} answered: ${answerData.answer}`);
    } catch (error) {
      socket.emit('error', 'Error submitting answer');
    }
  });

  // Teacher requests results
  socket.on('get-results', async () => {
    try {
      if (!currentTeacher || currentTeacher.id !== socket.id) {
        socket.emit('error', 'Only active teacher can get results');
        return;
      }

      if (!currentQuiz) {
        socket.emit('error', 'No quiz to get results for');
        return;
      }

      const results = {
        question: currentQuiz.question,
        options: currentQuiz.options,
        correctAnswer: currentQuiz.correctAnswer,
        totalStudents: connectedStudents.size,
        totalResponses: currentQuiz.responses.length,
        responses: currentQuiz.responses,
        correctCount: currentQuiz.responses.filter((r) => r.isCorrect).length,
      };

      socket.emit('quiz-results', results);
    } catch (error) {
      socket.emit('error', 'Error getting results');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove student
    if (connectedStudents.has(socket.id)) {
      const student = connectedStudents.get(socket.id);
      connectedStudents.delete(socket.id);
      io.to('teacher').emit('student-count', connectedStudents.size);
      console.log(`Student ${student.name} disconnected`);
    }

    // Remove teacher
    if (currentTeacher && currentTeacher.id === socket.id) {
      console.log(`Teacher ${currentTeacher.name} disconnected`);
      currentTeacher = null;
    }
  });
});

// Quiz timer function
function startQuizTimer() {
  if (quizTimer) clearInterval(quizTimer);

  let timeLeft = 60;
  quizTimer = setInterval(() => {
    timeLeft--;

    // Broadcast time to all students
    io.to('students').emit('timer-update', timeLeft);
    io.to('teacher').emit('timer-update', timeLeft);

    if (timeLeft <= 0) {
      clearInterval(quizTimer);
      quizTimer = null;
      // currentQuiz = null;

      // End quiz
      io.to('students').emit('quiz-ended');
      io.to('teacher').emit('quiz-ended');

      console.log('Quiz ended');
    }
  }, 1000);
}

// API Routes
app.get('/api/quiz-history', async (req, res) => {
  try {
    const { teacherName, studentName } = req.query;
    let query = {};

    if (teacherName) {
      query.teacherName = teacherName;
    } else if (studentName) {
      query['responses.studentName'] = studentName;
    }

    const quizzes = await Quiz.find(query).sort({ createdAt: -1 }).limit(10);

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching quiz history' });
  }
});

app.get('/api/current-status', (req, res) => {
  res.json({
    activeTeacher: currentTeacher?.name || null,
    activeQuiz: currentQuiz
      ? {
          question: currentQuiz.question,
          options: currentQuiz.options,
        }
      : null,
    connectedStudents: connectedStudents.size,
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
