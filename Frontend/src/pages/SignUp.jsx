
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const signUp = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/sign-up",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("STATUS:", response.status);
      console.log("RESPONSE:", data);

      if (response.ok) {
        setMessage(
          data.message || "Account created successfully!"
        );

        setTimeout(() => {
          navigate("/signin");
        }, 800);
      } else {
        setMessage(
          data.message || "Registration failed"
        );
      }

    } catch (error) {
      console.error("SIGN UP ERROR:", error);
      setMessage(error.message);
    }
  };

  return (
    <div className="page">

      <div className="form-card">

        <h1>Create Account</h1>

        <p>
          Start building your achievement portfolio.
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <button onClick={signUp}>
          Create Account
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <p>
          Already have an account?{" "}
          <Link to="/signin">
            Sign in
          </Link>
        </p>

      </div>

    </div>
  );
}

export default SignUp;

