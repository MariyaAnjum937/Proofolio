import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import CreateAchievement from "./pages/CreateAchievement";
import Dashboard from "./pages/Dashboard";
import StudentProfile from "./pages/StudentProfile";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentMentoring from "./pages/StudentMentoring";
import Navbar from "./components/Navbar";
import Icon from "./components/Icons";
import { EmptyState } from "./components/EmptyState";
import { ThemeProvider } from "./context/ThemeContext";

const getDashboardPath = (role) => {
  if (role === "faculty") return "/faculty";
  if (role === "admin") return "/admin";
  return "/dashboard";
};

function ProtectedRoute({ currentUser, allowedRoles = [], children }) {
  const userRole = typeof currentUser?.role === "string"
    ? currentUser.role.trim().toLowerCase()
    : null;
  const isLoggedIn = Boolean(currentUser && userRole);

  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    const fallbackPath = getDashboardPath(userRole);
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("proofolioUser");
      if (!storedUser) return null;

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.role) {
        localStorage.removeItem("proofolioUser");
        localStorage.removeItem("isLoggedIn");
        return null;
      }

      return parsedUser;
    } catch (error) {
      console.error("Failed to parse stored user", error);
      localStorage.removeItem("proofolioUser");
      localStorage.removeItem("isLoggedIn");
      return null;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800 dark:selection:bg-indigo-900/40 dark:selection:text-indigo-200 transition-colors duration-150">
      <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn setCurrentUser={setCurrentUser} />} />

          <Route
            path="/create"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={["student"]}>
                <CreateAchievement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={["student"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-profile"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={["student"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentoring"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={["student"]}>
                <StudentMentoring />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty/*"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={["faculty"]}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <EmptyState
                icon="alert-triangle"
                title="Page not found"
                description="The page you requested does not exist."
                actionLabel="Return home"
                actionTo="/"
              />
            }
          />
        </Routes>
      </main>

      {/* Production-grade SaaS Footer */}
      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 dark:bg-orange-500 flex items-center justify-center text-white">
              <Icon name="award" className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-orange-500 brand-logo-text">Proofolio</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Academic Achievement & Certificate Management System</span>
          </div>

          <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Icon name="shield" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified Institutional Security
            </span>
            <span>&copy; {new Date().getFullYear()} Proofolio. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default AppWrapper;