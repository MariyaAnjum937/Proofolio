import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUp({ setIsLoggedIn }) {

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

        localStorage.setItem("isLoggedIn", "true");

        setIsLoggedIn(true);

        setMessage(
          data.message || "Account created successfully!"
        );

        setTimeout(() => {
          navigate("/dashboard");
        }, 500);


      } else {

        setMessage(
          data.message || "Registration failed"
        );

      }

    } catch (error) {

      console.error("SIGN UP ERROR:", error);

      setMessage("Server error");

    }
  };


  return (
    <div className="page">

      <div className="form-card">

        <h1>Create Account</h1>

        <p>
          Start building your achievement portfolio.
        </p>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={signUp}>
          Create Account
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <p className="form-footer">
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