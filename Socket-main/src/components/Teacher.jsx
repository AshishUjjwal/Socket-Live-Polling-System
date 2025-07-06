import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const Teacher = () => {
  const [socket, setSocket] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [teacherName, setTeacherName] = useState('');

  const [pollHistory, setPollHistory] = useState(null);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const [studentCount, setStudentCount] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedTeacher = sessionStorage.getItem('teacherName');

    const newSocket = io('/');
    setSocket(newSocket);

    if (savedTeacher) {
      setTeacherName(savedTeacher);
      setIsJoined(true);
      if (savedTeacher.trim() && newSocket) {
        newSocket.emit('teacher-join', savedTeacher.trim());
      }
    }

    newSocket.on('teacher-joined', (data) => {
      setIsJoined(true);
      setSuccess(`Welcome, ${data.name}!`);
      setError('');
      // Save to session storage
      sessionStorage.setItem('teacherName', data.name);
    });

    newSocket.on('error', (message) => {
      setError(message);
      setSuccess('');
    });

    newSocket.on('student-count', (count) => {
      setStudentCount(count);
    });

    newSocket.on('timer-update', (time) => {
      setTimeLeft(time);
    });

    newSocket.on('current-quiz', (data) => {
      setCurrentQuiz(data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinAsTeacher = () => {
    if (teacherName.trim() && socket) {
      socket.emit('teacher-join', teacherName.trim());
    }
  };

  const startQuiz = () => {
    if (question.trim() && options.every((opt) => opt.trim()) && socket) {
      const quizData = {
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctAnswer: correctAnswer,
      };
      socket.emit('start-quiz', quizData);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handlePollHistory = async () => {
    try {
      if (pollHistory) {
        setPollHistory(null);
        return;
      }

      const response = await fetch(
        `/api/quiz-history?teacherName=${encodeURIComponent(teacherName)}`
      );
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setPollHistory(data);
      console.log('Quiz History:', data);
      // TODO: display it in your UI
    } catch (err) {
      console.error(err);
      alert('Could not fetch quiz history');
    }
  };

  if (!isJoined) {
    return (
      <div className='teacher-container'>
        <div className='teacher-join'>
          <Link to='/' className='back-btn'>
            ← Back to Home
          </Link>
          <h2>Join as Teacher</h2>
          {error && <div className='error'>{error}</div>}
          {success && <div className='success'>{success}</div>}
          <div className='join-form'>
            <input
              type='text'
              placeholder='Enter your name'
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinAsTeacher()}
            />
            <button onClick={joinAsTeacher}>Join as Teacher</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='teacher-container'>
      <div className='teacher-dashboard'>
        <div className='teacher-header'>
          <Link to='/' className='back-btn'>
            ← Back to Home
          </Link>
          <h2>Teacher Dashboard</h2>
          <div className='teacher-info'>
            <span>Welcome, {teacherName}!</span>
            <div className='stats'>
              <span>Students: {studentCount}</span>
              {currentQuiz && <span>Timer: {timeLeft}s</span>}
            </div>
          </div>
        </div>

        {error && <div className='error'>{error}</div>}
        {success && <div className='success'>{success}</div>}

        <button onClick={handlePollHistory} className='poll-history-btn'>
          👁 View Poll history
        </button>

        {!currentQuiz && (
          <div className='quiz-creator'>
            <h3>Create New Quiz</h3>
            <div className='form-group'>
              <label>Question:</label>
              <input
                type='text'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='Enter your question'
              />
            </div>

            <div className='options-section'>
              <label>Options:</label>
              {options.map((option, index) => (
                <div key={index} className='option-group'>
                  <input
                    type='text'
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <label className='radio-label'>
                    <input
                      type='radio'
                      name='correctAnswer'
                      value={index}
                      checked={correctAnswer === index}
                      onChange={(e) =>
                        setCorrectAnswer(parseInt(e.target.value))
                      }
                    />
                    Correct
                  </label>
                </div>
              ))}
            </div>

            <button
              className='start-quiz-btn'
              onClick={startQuiz}
              disabled={!question.trim() || !options.every((opt) => opt.trim())}
            >
              Start Quiz (60s)
            </button>
          </div>
        )}

        {currentQuiz && (
          <div className='quiz-active'>
            <h3>Quiz Response</h3>
            <div className='quiz-info'>
              <p>
                <strong>Question:</strong> {question}
              </p>
              <div className='quiz-stats'>
                <span>Time Left: {timeLeft}s</span>
                <span>
                  Responses: {currentQuiz.responses.length}/{studentCount}
                </span>
              </div>
            </div>
          </div>
        )}

        {currentQuiz && (
          <div className='quiz-results'>
            <div className='results-header'>
              <h2>Question</h2>
              <div className='quiz-timer'>
                ⏲{' '}
                <span className={timeLeft <= 10 ? 'time-low' : ''}>
                  {timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
              </div>
              <button onClick={handlePollHistory} className='poll-history-btn'>
                👁 View Poll history
              </button>
            </div>

            <div className='results-card'>
              <div className='results-question'>{currentQuiz.question}</div>

              {currentQuiz.options.map((opt, idx) => {
                const responseCount = currentQuiz.responses.filter(
                  (r) => r.answer === idx
                ).length;
                const percentage =
                  Math.round((responseCount / studentCount) * 100) || 0;
                return (
                  <div key={idx} className='result-bar'>
                    <div className='result-option'>
                      <span className='option-number'>{idx + 1}</span>
                      <span>{opt}</span>
                    </div>
                    <div className='bar'>
                      <div
                        className='fill'
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className='percentage'>{percentage}%</div>
                  </div>
                );
              })}
            </div>

            <button
              className='ask-new-question-btn'
              disabled={timeLeft}
              onClick={() => {
                socket.emit('end-quiz');
                setCurrentQuiz(null);
                setQuestion('');
                setOptions(['', '', '', '']);
                setCorrectAnswer(0);
                setTimeLeft(0);
              }}
            >
              + Ask a new question
            </button>
          </div>
        )}

        {pollHistory &&
          pollHistory.map((quiz, quizIdx) => {
            const totalResponses = quiz.responses.length || 1; // avoid div by 0

            return (
              <div key={quiz._id} className='results-card'>
                <div className='results-question'>
                  {quizIdx + 1}. {quiz.question}
                </div>

                <div className='correct-answer'>
                  ✅ Correct Answer:{' '}
                  <strong>{quiz.options[quiz.correctAnswer]}</strong>
                </div>

                {quiz.options.map((opt, idx) => {
                  const responseCount = quiz.responses.filter(
                    (r) => r.answer === idx
                  ).length;

                  const percentage = Math.round(
                    (responseCount / totalResponses) * 100
                  );

                  const isCorrect = idx === quiz.correctAnswer;

                  return (
                    <div
                      key={idx}
                      className={`result-bar ${
                        isCorrect ? 'correct-option' : ''
                      }`}
                    >
                      <div className='result-option'>
                        <span className='option-number'>{idx + 1}</span>
                        <span>{opt}</span>
                      </div>
                      <div className='bar'>
                        <div
                          className='fill'
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className='percentage'>{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Teacher;
