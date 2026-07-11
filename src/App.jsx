import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { UserProvider, useUser } from './context/UserContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Overview from './pages/dashboard/Overview';
import TaskManager from './pages/tasks/TaskManager';
import DailyAssessment from './pages/health/DailyAssessment';
import VoiceAssistant from './pages/assistant/VoiceAssistant';
import Analytics from './pages/analytics/Analytics';
import Settings from './pages/settings/Settings';
import Preferences from './pages/preferences/Preferences';
import Onboarding from './pages/onboarding/Onboarding';
import MindModel from './pages/ai/MindModel';
import Landing from './pages/landing/Landing';
import Sidebar from './components/Sidebar';
import FocusMode from './pages/focus/FocusMode';

// Admin Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAIModel from './pages/admin/AdminAIModel';
import AdminLogs from './pages/admin/AdminLogs';

const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background text-slate-200">
      <Sidebar />
      <main className="flex-1 pl-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto pt-2 px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { userData, loading } = useUser();

  // 1. Initial Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 animate-pulse">Synchronizing MindSync...</p>
      </div>
    );
  }

  // 2. Guest/Public Routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 3. Onboarding Guard
  // If authenticated but onboarding not done (and NOT admin), force them to onboarding
  if (isAuthenticated && userData && !userData.hasCompletedOnboarding && !userData.is_admin) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // 4. Data Integrity Check
  // If authenticated but no data yet (and not loading), something is wrong
  if (isAuthenticated && !userData) {
    const { logout } = useAuth();
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold mb-2">Connection Issue</h2>
        <p className="text-slate-400 max-w-sm">
          MindSync is having trouble reaching the neural servers. Please ensure your backend is running and try again.
        </p>
        <div className="flex gap-4 mt-8">
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry Connection
          </button>
          <button onClick={logout} className="btn-secondary">
            Logout & Back to Login
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = userData?.is_admin === true;

  // 5. Main Application Routes (Authenticated & Onboarded)
  return (
    <AppLayout>
      <Routes>
        {isAdmin ? (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/ai-model" element={<AdminAIModel />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Overview />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/focus" element={<FocusMode />} />
            <Route path="/health" element={<DailyAssessment />} />
            <Route path="/assistant" element={<VoiceAssistant />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai" element={<MindModel />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/settings" element={<Settings />} />
            {/* Redirect any stray onboarding attempts back to dashboard */}
            <Route path="/onboarding" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
