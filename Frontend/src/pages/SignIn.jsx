import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";

function SignIn({ setCurrentUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signIn = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/sign-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const user = data.user || {};
        const role = typeof user.role === "string" ? user.role.trim().toLowerCase() : "";
        const allowedRoles = ["student", "faculty", "admin"];

        if (!allowedRoles.includes(role)) {
          setMessage("Your account role could not be loaded. Please sign in again.");
          return;
        }

        const status = typeof user.status === "string" ? user.status.trim().toLowerCase() : "approved";

        if (role === "faculty" && status !== "approved") {
          setMessage("Your faculty account is pending admin approval.");
          return;
        }

        const authenticatedUser = { ...user, role, status };
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("proofolioUser", JSON.stringify(authenticatedUser));
        setCurrentUser(authenticatedUser);

        const redirectPath =
          role === "faculty"
            ? "/faculty"
            : role === "admin"
              ? "/admin"
              : "/dashboard";

        navigate(redirectPath, { replace: true });
      } else {
        setMessage(data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 sm:py-16">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <Icon name="award" className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to Proofolio</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Access your achievements, reviews, and academic records.
          </p>
        </div>

        {message && (
          <div className={`p-3.5 rounded-xl text-xs font-medium mb-6 flex items-start gap-2.5 ${
            message.toLowerCase().includes("success")
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <Icon
              name={message.toLowerCase().includes("success") ? "check-circle" : "alert-triangle"}
              className="w-4 h-4 shrink-0 mt-0.5"
            />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={signIn} className="space-y-4">
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="field">
            <div className="flex items-center justify-between">
              <label htmlFor="password">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-indigo-600 hover:text-indigo-800 focus:outline-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {loading && <Icon name="clock" className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;