import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import QuestionList from './pages/QuestionList';
import AskQuestion from './pages/AskQuestion';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
// import LanguageSwitcher from './components/LanguageSwitcher';
import Navbar from './components/Navbar';
import api from './api';
import QuestionDetail from './pages/QuestionDetail';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <Router>
      {/* <LanguageSwitcher /> */}
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/questions" element={<QuestionList />} />
        <Route path="/questions/:id" element={<QuestionDetail />} />
        <Route path="/ask" element={user ? <AskQuestion /> : <Navigate to="/login" replace />} />
        {/* Admin login route removed, unified login used */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
