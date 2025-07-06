# Real-Time Quiz Application

A MERN stack application with Socket.io for real-time quiz functionality where teachers can create quizzes and students can participate in real-time.

## Features

- **Teacher Dashboard**: Create and manage quizzes with multiple choice questions
- **Student Interface**: Join quizzes and submit answers in real-time
- **Real-time Communication**: Socket.io for live updates
- **Timer System**: 60-second countdown for each quiz
- **Session Management**: Only one teacher can be active at a time
- **Results Display**: Live quiz results and statistics
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Styling**: CSS3 with modern design

## Project Structure

```
quiz-app/
├── backend/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Home.jsx
    │   │   ├── Teacher.jsx
    │   │   └── Student.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on default port 27017)
- npm or yarn

### Backend Setup

1. Create a new directory for the backend:
```bash
mkdir quiz-app-backend
cd quiz-app-backend
```

2. Create `package.json` and install dependencies:
```bash
npm init -y
npm install express socket.io mongoose cors
npm install -D nodemon
```

3. Create `server.js` with the backend code provided above

4. Update `package.json` scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Create a new Vite React project:
```bash
npm create vite@latest quiz-app-frontend -- --template react
cd quiz-app-frontend
```

2. Install additional dependencies:
```bash
npm install react-router-dom socket.io-client
```

3. Replace the default files with the provided code:
   - `src/App.jsx`
   - `src/App.css`
   - `src/main.jsx`
   - `src/index.css`
   - `index.html`
   - `vite.config.js`

4. Create the components directory and add component files:
```bash
mkdir src/components
```
   - `src/components/Home.jsx`
   - `src/components/Teacher.jsx`
   - `src/components/Student.jsx`

5. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Database Setup

1. Make sure MongoDB is running on your system
2. The application will automatically create a database named `quizapp`
3. Collections (`quizzes` and `teachers`) will be created automatically

## Usage

### For Teachers

1. Navigate to `http://localhost:5173/teacher`
2. Enter your name to join as a teacher
3. Create a quiz with:
   - A question
   - Four multiple choice options
   - Select the correct answer
4. Start the quiz (60-second timer)
5. View real-time responses and results

### For Students

1. Navigate to `http://localhost:5173/student`
2. Enter your name or generate a random name
3. Wait for the teacher to start a quiz
4. Select your answer and submit
5. View your result immediately

## API Endpoints

- `GET /api/quiz-history` - Get previous quiz history
- `GET /api/current-status` - Get current application status

## Socket Events

### Teacher Events
- `teacher-join` - Join as teacher
- `start-quiz` - Start a new quiz
- `get-results` - Get quiz results

### Student Events
- `student-join` - Join as student
- `submit-answer` - Submit quiz answer

### Broadcast Events
- `quiz-started` - Quiz started notification
- `timer-update` - Timer countdown updates
- `quiz-ended` - Quiz ended notification

## Key Features Implementation

1. **Session Storage**: Students use sessionStorage to maintain their session across page refreshes
2. **Single Teacher Limit**: Only one teacher can be active at a time
3. **Real-time Updates**: Socket.io provides real-time communication
4. **Timer System**: 60-second countdown with visual indicators
5. **Responsive Design**: Mobile-friendly interface

## Environment Variables

You can customize the following in the backend:
- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/quizapp)

## Troubleshooting

1. **Connection Issues**: Ensure MongoDB is running
2. **Port Conflicts**: Change ports in vite.config.js and server.js if needed
3. **CORS Issues**: Update CORS origin in server.js if frontend runs on different port

## Future Enhancements

- User authentication
- Multiple quiz types
- Quiz history for students
- Advanced analytics
- File upload for questions
- Voice/video integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.