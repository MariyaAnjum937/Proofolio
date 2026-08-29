import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignIn({ setIsLoggedIn }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");


  const signIn = async () => {

    try {

      const response = await fetch(
        "http://localhost:3000/api/auth/sign-in",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );


      const data = await response.json();


      if (response.ok) {

        localStorage.setItem("isLoggedIn", "true");

        setIsLoggedIn(true);

        setMessage(
          data.message || "Signed in successfully!"
        );

        setTimeout(() => {
          navigate("/dashboard");
        }, 500);


      } else {

        setMessage(
          data.message || "Invalid credentials"
        );

      }

    } catch (error) {

      console.error(error);
      setMessage("Server error");

    }
  };


  return (
    <div className="page">

      <div className="form-card">

        <h1>Welcome Back 👋</h1>

        <p>
          Sign in to access your achievements.
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={signIn}>
          Sign In
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <p className="form-footer">
          Don't have an account?{" "}
          <Link to="/signup">
            Create one
          </Link>
        </p>

      </div>

    </div>
  );
}


export default SignIn;