import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
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
import NotificationCenter from "./components/NotificationCenter";


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

  const navigate = useNavigate();
  const userRole = typeof currentUser?.role === "string"
    ? currentUser.role.trim().toLowerCase()
    : null;
  const isLoggedIn = Boolean(currentUser && userRole);

  const getDashboardPath = (role) => {
    if (role === "faculty") return "/faculty";
    if (role === "admin") return "/admin";
    return "/dashboard";
  };

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isLoggedIn) {
      return <Navigate to="/signin" replace />;
    }

    if (allowedRoles.length && !allowedRoles.includes(userRole)) {
      const fallbackPath = getDashboardPath(userRole);
      return <Navigate to={fallbackPath} replace />;
    }

    return children;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/sign-out",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("proofolioUser");
        setCurrentUser(null);
        navigate("/");
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <div className="app-background">
        <img
          src="https://res.cloudinary.com/ddcg0rzlo/image/upload/v1650305343/background_ebzfkk.jpg"
          className="app-background-img"
          alt="Background"
        />
        <div className="app-background-overlay" />
      </div>

      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="logo">
            <span className="logo-badge">🏆</span>
            <span className="logo-text">Proofolio</span>
          </NavLink>

          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Home
            </NavLink>

            {isLoggedIn && userRole === "student" && (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
                  Dashboard
                </NavLink>
                <NavLink to="/mentoring" className={({ isActive }) => (isActive ? "active" : "")}>
                  My Mentoring
                </NavLink>
                <NavLink to="/student-profile" className={({ isActive }) => (isActive ? "active" : "")}>
                  My Profile
                </NavLink>
                <NavLink to="/create" className={({ isActive }) => (isActive ? "active" : "")}>
                  Add Achievement
                </NavLink>
              </>
            )}

            {isLoggedIn && userRole === "faculty" && (
              <NavLink to="/faculty" className={({ isActive }) => (isActive ? "active" : "")}>
                Faculty Dashboard
              </NavLink>
            )}

            {isLoggedIn && ["student", "faculty"].includes(userRole) && <NotificationCenter role={userRole} />}

            {isLoggedIn && userRole === "admin" && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
                Admin Dashboard
              </NavLink>
            )}

            {!isLoggedIn && (
              <>
                <NavLink to="/signin" className={({ isActive }) => (isActive ? "active" : "")}>
                  Sign In
                </NavLink>
                <NavLink to="/signup" className="nav-cta">
                  Sign Up
                </NavLink>
              </>
            )}

            {isLoggedIn && (
              <button onClick={handleLogout} className="logout-button">
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn setCurrentUser={setCurrentUser} />} />

        <Route
          path="/create"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <CreateAchievement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-profile"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentoring"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentMentoring />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/*"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;