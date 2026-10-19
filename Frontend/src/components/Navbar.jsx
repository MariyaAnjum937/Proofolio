import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import Icon from "./Icons";
import NotificationCenter from "./NotificationCenter";
import { RoleBadge } from "./Badge";
import { API_BASE_URL } from "../config/api";
import useTheme from "../context/useTheme";

export function Navbar({ currentUser, setCurrentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const userRole = typeof currentUser?.role === "string"
    ? currentUser.role.trim().toLowerCase()
    : null;
  const isLoggedIn = Boolean(currentUser && userRole);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("proofolioUser");
        setCurrentUser(null);
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "text-indigo-600 dark:text-orange-400 bg-indigo-50/80 dark:bg-orange-950/30 font-semibold"
        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? "text-indigo-600 dark:text-orange-400 bg-indigo-50 dark:bg-orange-950/30 font-semibold"
        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 focus:outline-none group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 dark:from-orange-600 dark:to-amber-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-orange-950/40 transition-all">
                <Icon name="award" className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight font-display text-slate-900 dark:text-orange-500 brand-logo-text transition-colors">
                  Proofolio
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium tracking-wide uppercase -mt-1 hidden sm:block">
                  Verified Portfolio
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>

              {isLoggedIn && userRole === "student" && (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/mentoring" className={navLinkClass}>
                    Mentoring
                  </NavLink>
                  <NavLink to="/student-profile" className={navLinkClass}>
                    Profile
                  </NavLink>
                  <NavLink to="/create" className={navLinkClass}>
                    <Icon name="plus" className="w-4 h-4 mr-1 text-indigo-600" />
                    Add Achievement
                  </NavLink>
                </>
              )}

              {isLoggedIn && userRole === "faculty" && (
                <NavLink to="/faculty" className={navLinkClass}>
                  Faculty Hub
                </NavLink>
              )}

              {isLoggedIn && userRole === "admin" && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin Console
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Icon name={isDark ? "sun" : "moon"} className="w-5 h-5 transition-transform" />
            </button>

            {isLoggedIn && ["student", "faculty"].includes(userRole) && (
              <NotificationCenter role={userRole} />
            )}

            {isLoggedIn ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center border border-indigo-200">
                    {currentUser?.fullName
                      ? currentUser.fullName.charAt(0).toUpperCase()
                      : currentUser?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-tight">
                      {currentUser?.fullName || currentUser?.username}
                    </p>
                    <RoleBadge role={userRole} className="scale-90 origin-left mt-0.5" />
                  </div>
                  <Icon name="chevron-down" className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {currentUser?.fullName || currentUser?.username}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                    </div>

                    {userRole === "student" && (
                      <>
                        <Link
                          to="/student-profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Icon name="user" className="w-4 h-4 text-slate-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/create"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Icon name="plus" className="w-4 h-4 text-slate-400" />
                          Upload Certificate
                        </Link>
                      </>
                    )}

                    {userRole === "faculty" && (
                      <Link
                        to="/faculty/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Icon name="user" className="w-4 h-4 text-slate-400" />
                        Faculty Profile
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name={isDark ? "sun" : "moon"} className="w-4 h-4 text-slate-400" />
                        <span>Theme</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isDark ? "Dark" : "Light"}</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Icon name="log-out" className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/signin"
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Icon name={mobileMenuOpen ? "x" : "menu"} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1 bg-white">
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              Home
            </NavLink>

            {isLoggedIn && userRole === "student" && (
              <>
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/mentoring" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  My Mentoring
                </NavLink>
                <NavLink to="/student-profile" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  My Profile
                </NavLink>
                <NavLink to="/create" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  Add Achievement
                </NavLink>
              </>
            )}

            {isLoggedIn && userRole === "faculty" && (
              <NavLink to="/faculty" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Faculty Dashboard
              </NavLink>
            )}

            {isLoggedIn && userRole === "admin" && (
              <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Admin Dashboard
              </NavLink>
            )}

            {!isLoggedIn && (
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg"
                >
                  Create Account
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appearance</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700"
              >
                <Icon name={isDark ? "sun" : "moon"} className="w-4 h-4 text-indigo-500" />
                <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
