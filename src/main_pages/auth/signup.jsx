import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup 
} from "firebase/auth";
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [tempUserData, setTempUserData] = useState(null);
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

  const handleForgotPassword = async () => {
    try {
      if (!email) {
        setError({ type: "email", message: "Please enter your email address" });
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset link has been sent to your email");
      setError({ type: "", message: "" });
    } catch (error) {
      console.error("Password reset error:", error);
      setError({ 
        type: "auth", 
        message: "Failed to send reset email. Please try again." 
      });
    }
  };

  const sendOTPEmail = async (email, otp) => {
    try {
      console.log('Attempting to send OTP to:', email); // Add this log
      
      const response = await fetch('http://localhost:3000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          otp
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData); // Add this log
        throw new Error(errorData.message || 'Failed to send OTP email');
      }
  
      const result = await response.json();
      console.log('Server response success:', result); // Add this log
      return result;
    } catch (error) {
      console.error('Detailed error in sendOTPEmail:', error);
      throw error;
    }
  };

  const handleLogin = async () => {
    try {
      // Find user by username
      const userQuery = query(collection(db, "users"), where("username", "==", username.trim()));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error("User not found");
      }
      
      const userData = userSnapshot.docs[0].data();
      await signInWithEmailAndPassword(auth, userData.email, password);
      
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

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleRegister = async () => {
    try {
      if (password !== repeatPassword) {
        setError({ type: "passwordMismatch", message: "Passwords do not match" });
        return;
      }
  
      // Check username and email availability
      const usernameQuery = query(collection(db, "users"), where("username", "==", username.trim()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        setError({ type: "username", message: "Username is already taken" });
        return;
      }
  
      const emailQuery = query(collection(db, "users"), where("email", "==", email.trim()));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setError({ type: "email", message: "Email is already registered" });
        return;
      }
  
      setIsVerifying(true);
      
      // Generate OTP
      const otp = generateOTP();
      
      try {
        // Send OTP email
        await sendOTPEmail(email, otp);
      } catch (emailError) {
        setIsVerifying(false);
        setError({ type: "email", message: "Failed to send verification email. Please try again." });
        return;
      }
  
      // Store registration data in localStorage
      const registrationData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password, // Be cautious with storing password - it's temporary
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
      
      localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
      
      setIsVerifying(false);
      navigate('/verify-otp');
      
    } catch (error) {
      console.error("Registration error:", error);
      setShake(true);
      setIsVerifying(false);
      setError({ type: "auth", message: "Registration failed. Please try again." });
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider); // Fixed: pass provider instead of email

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", result.user.uid));

      if (!userDoc.exists()) {
        // Extract username from email (before @)
        const defaultUsername = result.user.email.split('@')[0];

        // Check if username is available
        const usernameQuery = query(
          collection(db, "users"), 
          where("username", "==", defaultUsername)
        );
        const usernameSnapshot = await getDocs(usernameQuery);

        // Create new user document
        await setDoc(doc(db, "users", result.user.uid), {
          username: finalUsername,
          email: result.user.email.toLowerCase(),
          firstLogin: true,
          interests: [],
          createdAt: new Date().toISOString()
        });

        navigate("/interests", { replace: true });
      } else {
        navigate("/library", { replace: true });
      }
    } catch (error) {
      console.error("Google auth error:", error);
      setShake(true);
      setError({ 
        type: "auth", 
        message: "Google authentication failed. Please try again." 
      });
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ type: "", message: "" });
    setSuccessMessage("");
    
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

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {isLogin && (
        <>
          <button
            type="button"
            className="btn btn-outline-dark w-100 mb-3"
            onClick={handleGoogleAuth}
          >
            <img 
              src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" 
              alt="Google"
              style={{ width: "20px", marginRight: "10px" }}
            />
            Continue with Google
          </button>

          <div className="text-center mb-3">
            <span className="px-3 bg-white text-muted">or</span>
            <hr className="mt-0" />
          </div>
        </>
      )}

      {isLogin ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="loginUsername" className="form-label">Username</label>
            <input
              type="text"
              placeholder="Enter username"
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
              placeholder="Enter password"
              className={`form-control ${error.type === "auth" ? "is-invalid" : ""}`}
              id="loginPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error.type === "auth" && <div className="text-danger small">{error.message}</div>}
          </div>
          <button type="submit" className="btn btn-primary w-100">Sign in</button>
          <div className="text-center mt-3">
            <button 
              type="button" 
              className="btn btn-link p-0" 
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="registerUsername" className="form-label">Username</label>
              <input
                type="text"
                placeholder="Enter username"
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
                placeholder="Enter your email id"
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
                placeholder="Enter password"
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
                placeholder="Repeat password"
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
            <button 
              type="submit" 
              className="btn btn-primary w-100 mt-3" 
              disabled={isVerifying}
            >
              {isVerifying ? "Sending verification..." : "Sign up"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;