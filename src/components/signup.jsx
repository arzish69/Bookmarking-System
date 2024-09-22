import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig"; // Import Firebase auth and Firestore
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore methods
import "./signup.css"; // Import the CSS file for animations

const SignUp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState({ type: "", message: "" }); // To handle different error messages
  const [shake, setShake] = useState(false); // For shake animation
  const navigate = useNavigate();

  const toggleForm = (formType) => {
    setIsLogin(formType === "login");
    setError({ type: "", message: "" }); // Reset errors when toggling
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ type: "", message: "" }); // Reset errors before submission

    try {
      if (isLogin) {
        // Handle login
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/mainhome"); // Navigate to /mainhome upon success
      } else {
        // Handle signup
        if (password !== repeatPassword) {
          setError({ type: "passwordMismatch", message: "Passwords do not match" });
          return;
        }

        // Create user with Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user data (name, username) in Firestore under `/users/{userId}`
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          username: username,
          email: email,
        });

        navigate("/mainhome");
      }
    } catch (error) {
      setShake(true); // Trigger the shake animation
      if (error.code === "auth/wrong-password") {
        setError({ type: "password", message: "Wrong password" });
      } else if (error.code === "auth/user-not-found") {
        setError({ type: "email", message: "Username not found" });
      } else {
        setError({ type: "other", message: error.message });
      }

      // Remove the shake animation after a brief period
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="toggle-buttons mb-3">
        <button
          type="button"
          className={`btn ${isLogin ? "btn-primary" : "btn-secondary"} mx-2`}
          onClick={() => toggleForm("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`btn ${!isLogin ? "btn-primary" : "btn-secondary"} mx-2`}
          onClick={() => toggleForm("register")}
        >
          Register
        </button>
      </div>

      <div className={`card p-4 ${shake ? "shake" : ""}`} style={{ width: "400px" }}>
        <div className="text-center mb-3">
          <h2>{isLogin ? "Login" : "Register"}</h2>
        </div>

        {isLogin ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label">Email address</label>
              <input
                type="email"
                className={`form-control ${error.type === "email" ? "is-invalid" : ""}`}
                id="loginEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error.type === "email" && <div className="text-danger small">{error.message}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="loginPassword" className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${error.type === "password" ? "is-invalid" : ""}`}
                id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error.type === "password" && <div className="text-danger small">{error.message}</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">Sign in</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="registerName" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="registerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerUsername" className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                id="registerUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerEmail" className="form-label">Email address</label>
              <input
                type="email"
                className={`form-control ${error.type === "email" ? "is-invalid" : ""}`}
                id="registerEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error.type === "email" && <div className="text-danger small">{error.message}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="registerPassword" className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${error.type === "password" ? "is-invalid" : ""}`}
                id="registerPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error.type === "password" && <div className="text-danger small">{error.message}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="registerRepeatPassword" className="form-label">Repeat password</label>
              <input
                type="password"
                className="form-control"
                id="registerRepeatPassword"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">Sign up</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;
