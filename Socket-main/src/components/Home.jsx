import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to the Live Polling System</h1>
        <p>Please select the role that best describes you to begin using the live polling system</p>
        
        <div className="role-buttons">
          <Link to="/teacher" className="role-btn teacher-btn">
            <div className="role-icon">👨‍🏫</div>
            <h3>Teacher</h3>
            <p>Create and manage quizzes</p>
          </Link>
          
          <Link to="/student" className="role-btn student-btn">
            <div className="role-icon">👨‍🎓</div>
            <h3>Student</h3>
            <p>Join and participate in quizzes</p>
          </Link>
        </div>
        
        <div className="features">
          <h3>Features</h3>
          <ul>
            <li>Real-time quiz participation</li>
            <li>Multiple choice questions</li>
            <li>60-second timer per quiz</li>
            <li>Live results and statistics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Home