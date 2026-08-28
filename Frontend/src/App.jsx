
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import CreateAchievement from "./pages/CreateAchievement";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          🏆 Proofolio
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/create">Add Achievement</Link>
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      </nav>

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/signup" element={<SignUp />} />

        <Route path="/signin" element={<SignIn />} />

        <Route
          path="/create"
          element={<CreateAchievement />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;

