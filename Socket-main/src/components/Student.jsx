import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const Student = () => {
  const [socket, setSocket] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [studentName, setStudentName] = useState('');

  const [pollHistory, setPollHistory] = useState(null);

  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if student already joined (session storage)
    const savedStudent = sessionStorage.getItem('studentName');

    // const newSocket = io('https://socket-live-polling-system.onrender.com');
    const newSocket = io(import.meta.env.NEXT_PUBLIC_BACKEND_URL);
    setSocket(newSocket);

    if (savedStudent) {
      setStudentName(savedStudent);
      setIsJoined(true);
      if (savedStudent.trim() && newSocket) {
        newSocket.emit('student-join', savedStudent.trim());
      }
    }

    newSocket.on('student-joined', (data) => {
      setIsJoined(true);
      setSuccess(`Welcome, ${data.name}!`);
      setError('');
      // Save to session storage
      sessionStorage.setItem('studentName', data.name);
    });

    newSocket.on('current-quiz', (quizData) => {
      console.log('quizData', quizData);
      if (!quizData) {
        setSubmitted(false);
      }
      if (quizData && quizData.responses?.length > 0) {
        setSubmitted(true);
      }
      setCurrentQuiz(quizData);
    });

    newSocket.on('timer-update', (time) => {
      setTimeLeft(time);
    });

    newSocket.on('error', (message) => {
      setError(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // console.log("Backend URL: ", import.meta.env.NEXT_PUBLIC_BACKEND_URL);

  const joinAsStudent = () => {
    if (studentName.trim() && socket) {
      socket.emit('student-join', studentName.trim());
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer !== null && socket && !submitted) {
      socket.emit('submit-answer', { answer: selectedAnswer });
    }
  };

  const handleNameChange = (e) => {
    setStudentName(e.target.value);
  };

  const Studentresponse = useMemo(() => {
    return currentQuiz?.responses?.find((r) => r.studentName === studentName);
  }, [currentQuiz?.responses, studentName]);

  const generateStudentName = () => {
    const adjectives = ['Smart', 'Quick', 'Bright', 'Clever', 'Sharp', 'Wise'];
    const nouns = ['Student', 'Learner', 'Scholar', 'Pupil', 'Mind'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 100);
    return `${randomAdj}${randomNoun}${randomNum}`;
  };

  const myResponse = currentQuiz?.responses?.find(
    (r) => r.studentName === studentName
  );

  const handlePollHistory = async () => {
    try {
      if (pollHistory) {
        setPollHistory(null);
        return;
      }

      // const response = await fetch(
      //   `https://socket-live-polling-system.onrender.com/api/quiz-history?studentName=${encodeURIComponent(studentName)}`
      // );
      const response = await fetch(
        `${import.meta.env.NEXT_PUBLIC_BACKEND_URL}/api/quiz-history?studentName=${encodeURIComponent(studentName)}`
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
      <div className='student-container'>
        <div className='student-join'>
          <Link to='/' className='back-btn'>
            ← Back to Home
          </Link>
          <h2>Join as Student</h2>
          {error && <div className='error'>{error}</div>}
          {success && <div className='success'>{success}</div>}
          <div className='join-form'>
            <input
              type='text'
              placeholder='Enter your name'
              value={studentName}
              onChange={handleNameChange}
              onKeyPress={(e) => e.key === 'Enter' && joinAsStudent()}
            />
            <button onClick={joinAsStudent}>Join Quiz</button>
            <button
              className='generate-btn'
              onClick={() => setStudentName(generateStudentName())}
            >
              Generate Random Name
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='student-container'>
      <div className='student-dashboard'>
        <div className='student-header'>
          <Link to='/' className='back-btn'>
            ← Back to Home
          </Link>
          <h2>Student Dashboard</h2>
          <div className='student-info'>
            <span>Welcome, {studentName}!</span>
            {timeLeft > 0 && <span className='timer'>Time: {timeLeft}s</span>}
          </div>
        </div>

        {error && <div className='error'>{error}</div>}
        {success && <div className='success'>{success}</div>}

        <button onClick={handlePollHistory} className='poll-history-btn'>
          👁 View Poll history
        </button>

        {!currentQuiz && (
          <div className='waiting-room'>
            <h3>Waiting for Quiz</h3>
            <p>Please wait for the teacher to start a quiz...</p>
            <div className='loading-spinner'></div>
          </div>
        )}

        {currentQuiz && !submitted && (
          <div className='quiz-section'>
            <h3>Quiz Question</h3>
            <div className='question-card'>
              <p className='question'>{currentQuiz.question}</p>
              <div className='timer-bar'>
                <div
                  className='timer-fill'
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className='options-list'>
              {currentQuiz.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-item ${
                    selectedAnswer === index ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedAnswer(index)}
                >
                  <span className='option-letter'>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className='option-text'>{option}</span>
                </div>
              ))}
            </div>

            <button
              className='submit-btn'
              onClick={submitAnswer}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </button>
          </div>
        )}

        {currentQuiz && submitted && (
          <div className='result-section'>
            <h3>Your Answer</h3>
            <div
              className={`result-card ${
                Studentresponse.isCorrect ? 'correct' : 'incorrect'
              }`}
            >
              <div className='result-icon'>
                {Studentresponse.isCorrect ? '✓' : '✗'}
              </div>
              <p>{Studentresponse.isCorrect ? 'Correct!' : 'Wrong Answer'}</p>
              <p className='result-message'>
                {Studentresponse.isCorrect
                  ? 'Great job! You got it right!'
                  : "Don't worry, better luck next time!"}
              </p>
            </div>
            <p className='waiting-text'>Waiting for next quiz...</p>
          </div>
        )}

        {currentQuiz && currentQuiz.responses?.length && (
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
              <div className='results-question'>
                {1}. {currentQuiz.question}
              </div>

              <div className='correct-answer'>
                ✅ Correct Answer:{' '}
                <strong>
                  {currentQuiz.options[currentQuiz.correctAnswer]}
                </strong>
              </div>

              {myResponse ? (
                <div className='selected-answer'>
                  🎯 Your Answer:{' '}
                  <strong>{currentQuiz.options[myResponse.answer]}</strong>{' '}
                  {myResponse.isCorrect ? (
                    <span style={{ color: 'green' }}>✔️ Correct</span>
                  ) : (
                    <span style={{ color: 'red' }}>❌ Wrong</span>
                  )}
                </div>
              ) : (
                <div className='selected-answer'>
                  🤷 You didn’t answer this question
                </div>
              )}

              {currentQuiz.options.map((opt, idx) => {
                const responseCount = currentQuiz.responses.filter(
                  (r) => r.answer === idx
                ).length;

                const percentage = Math.round(
                  (responseCount / currentQuiz.responses.length) * 100
                );

                const isCorrect = idx === currentQuiz.correctAnswer;

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
          </div>
        )}
        {pollHistory &&
          pollHistory.map((quiz, quizIdx) => {
            const totalResponses = quiz.responses.length || 1; // avoid div by 0
            const studentResponse = quiz.responses?.find(
              (r) => r.studentName === studentName
            );

            return (
              <div key={quiz._id} className='results-card'>
                <div className='results-question'>
                  {quizIdx + 1}. {quiz.question}
                </div>

                <div className='correct-answer'>
                  ✅ Correct Answer:{' '}
                  <strong>{quiz.options[quiz.correctAnswer]}</strong>
                </div>

                {myResponse ? (
                  <div className='selected-answer'>
                    🎯 Your Answer:{' '}
                    <strong>{quiz.options[studentResponse.answer]}</strong>{' '}
                    {studentResponse.isCorrect ? (
                      <span style={{ color: 'green' }}>✔️ Correct</span>
                    ) : (
                      <span style={{ color: 'red' }}>❌ Wrong</span>
                    )}
                  </div>
                ) : (
                  <div className='selected-answer'>
                    🤷 You didn’t answer this question
                  </div>
                )}

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

export default Student;
