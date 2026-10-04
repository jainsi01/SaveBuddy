import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import GoalsPage from './pages/goals/GoalsPage';
import GoalDetailsPage from './pages/goals/GoalDetailsPage';
import GroupGoalsPage from './pages/groups/GroupGoalsPage';
import GroupGoalDetailsPage from './pages/groups/GroupGoalDetailsPage';
import AIPlannerPage from './pages/AIPlannerPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HealthCheckPage from './pages/HealthCheckPage';

export default function App() {
  const [systemStatus, setSystemStatus] = useState({
    api: 'UP',
    database: 'CONNECTED',
  });

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#FBF9F6] text-[#241813] font-sans antialiased selection:bg-coffee-200 selection:text-coffee-950">
          <Header />

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Routes>
              {/* Consumer Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Primary Consumer Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Unified Cash Flow & Transactions Ledger */}
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionsPage />
                  </ProtectedRoute>
                }
              />

              {/* Savings Goals Routes */}
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <GoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals/:id"
                element={
                  <ProtectedRoute>
                    <GoalDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Collaborative Group Goals Routes */}
              <Route
                path="/group-goals"
                element={
                  <ProtectedRoute>
                    <GroupGoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/group-goals/:id"
                element={
                  <ProtectedRoute>
                    <GroupGoalDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Dedicated Gemini AI Savings Planner */}
              <Route
                path="/ai-planner"
                element={
                  <ProtectedRoute>
                    <AIPlannerPage />
                  </ProtectedRoute>
                }
              />

              {/* User Financial Profile & Settings */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Developer & Internal Diagnostics Route (Isolated) */}
              <Route
                path="/dev/system-health"
                element={<HealthCheckPage onStatusUpdate={setSystemStatus} />}
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
