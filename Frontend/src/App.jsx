import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import CreateAchievement from "./pages/CreateAchievement";
import Dashboard from "./pages/Dashboard";


function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const navigate = useNavigate();


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
        setIsLoggedIn(false);
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

      {/* Fixed site-wide background */}
      <div className="app-background">
        <img
          src="https://res.cloudinary.com/ddcg0rzlo/image/upload/v1650305343/background_ebzfkk.jpg"
          className="app-background-img"
          alt="Background"
        />
        <div className="app-background-overlay" />
      </div>

      {/* Navbar */}
      <nav className="navbar">

        <div className="navbar-inner">

          <NavLink to="/" className="logo">
            <span className="logo-badge">🏆</span>
            <span className="logo-text">Proofolio</span>
          </NavLink>

          <div className="nav-links">

            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
              Home
            </NavLink>

            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
              Dashboard
            </NavLink>

            <NavLink to="/create" className={({ isActive }) => isActive ? "active" : ""}>
              Add Achievement
            </NavLink>

            {!isLoggedIn && (
              <>
                <NavLink to="/signin" className={({ isActive }) => isActive ? "active" : ""}>
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

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signin" element={<SignIn setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/create" element={<CreateAchievement />} />
        <Route path="/dashboard" element={<Dashboard />} />
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