import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RiskResult from './pages/RiskResult';
import ReportSpam from './pages/ReportSpam';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import './index.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!session) return <Navigate to="/auth" />;
    return children;
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar session={session} />
        <main style={{ padding: '1rem', flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/risk/:upiId" element={<RiskResult />} />
            <Route path="/report" element={
              <ProtectedRoute><ReportSpam /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute><AdminDashboard /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
