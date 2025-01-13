import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import "./signup.css";

const SignUp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState({ type: "", message: "" });
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  
  // Cleanup function for Firebase listeners
  useEffect(() => {
    return () => {
      // Unsubscribe from any active listeners when component unmounts
      const unsubscribe = auth.onAuthStateChanged(() => {});
      unsubscribe();
    };
  }, []);

  const toggleForm = (formType) => {
    setIsLogin(formType === "login");
    setError({ type: "", message: "" });
    setUsername("");
    setEmail("");
    setPassword("");
    setRepeatPassword("");
  };

  const handleLogin = async () => {
    try {
      // Find user by username
      const userQuery = query(collection(db, "users"), where("username", "==", username.trim()));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error("User not found");
      }
      
      // Get the email associated with the username
      const userData = userSnapshot.docs[0].data();
      
      // Login with email (Firebase requirement)
      await signInWithEmailAndPassword(auth, userData.email, password);
      
      // Wait a brief moment before navigation to allow Firebase to complete its operations
      setTimeout(() => {
        navigate("/library", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      setShake(true);
      setError({ type: "auth", message: "Invalid username or password" });
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleRegister = async () => {
    try {
      if (password !== repeatPassword) {
        setError({ type: "passwordMismatch", message: "Passwords do not match" });
        return;
      }

      // Check username availability
      const usernameQuery = query(collection(db, "users"), where("username", "==", username.trim()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        setError({ type: "username", message: "Username is already taken" });
        return;
      }

      // Check email availability
      const emailQuery = query(collection(db, "users"), where("email", "==", email.trim()));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setError({ type: "email", message: "Email is already registered" });
        return;
      }

      // Create auth user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        firstLogin: true,
        interests: [],
        createdAt: new Date().toISOString()
      });

      // Wait a brief moment before navigation to allow Firebase to complete its operations
      setTimeout(() => {
        navigate("/interests", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Registration error:", error);
      setShake(true);
      if (error.code === "auth/weak-password") {
        setError({ type: "password", message: "Password should be at least 6 characters" });
      } else if (error.code === "auth/email-already-in-use") {
        setError({ type: "email", message: "Email is already registered" });
      } else {
        setError({ type: "auth", message: "Registration failed. Please try again." });
      }
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ type: "", message: "" });
    
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
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
              <label htmlFor="loginUsername" className="form-label">Username</label>
              <input
                type="text"
                className={`form-control ${error.type === "auth" ? "is-invalid" : ""}`}
                id="loginUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="loginPassword" className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${error.type === "auth" ? "is-invalid" : ""}`}
                id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error.type === "auth" && <div className="text-danger small">{error.message}</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">Sign in</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="registerUsername" className="form-label">Username</label>
              <input
                type="text"
                className={`form-control ${error.type === "username" ? "is-invalid" : ""}`}
                id="registerUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {error.type === "username" && <div className="text-danger small">{error.message}</div>}
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
                className={`form-control ${error.type === "passwordMismatch" ? "is-invalid" : ""}`}
                id="registerRepeatPassword"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
              />
              {error.type === "passwordMismatch" && (
                <div className="text-danger small">{error.message}</div>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">Sign up</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;