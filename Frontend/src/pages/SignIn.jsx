
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignIn() {

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

        setMessage(
          data.message || "Signed in successfully!"
        );

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);

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

        <p>Sign in to access your achievements.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={signIn}>
          Sign In
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <p>
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

