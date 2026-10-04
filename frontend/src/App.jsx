import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import HealthCheckPage from './pages/HealthCheckPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [systemStatus, setSystemStatus] = useState({
    api: 'UP',
    database: 'CONNECTED',
  });

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#F7F3EE] text-[#241813]">
          <Header systemStatus={systemStatus} />

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Foundation System Health */}
              <Route
                path="/"
                element={<HealthCheckPage onStatusUpdate={setSystemStatus} />}
              />

              {/* Module 2: Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Profile Route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
