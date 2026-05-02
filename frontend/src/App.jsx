import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Layout
import Layout from './layouts/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import Analytics from './pages/Analytics';
import QuizChat from './pages/QuizChat';
import Leaderboard from './pages/Leaderboard';
import CourseLearning from './pages/CourseLearning';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/ReactToastify.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes wrapped in Layout + ErrorBoundary */}
            <Route element={<ProtectedRoute><ErrorBoundary><Layout /></ErrorBoundary></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/curriculum" element={<Curriculum />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/quiz/:topicId" element={<QuizChat />} />
              <Route path="/quiz/competition" element={<QuizChat />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/course/:topicId" element={<CourseLearning />} />
            </Route>
          </Routes>
          <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} theme="dark" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
