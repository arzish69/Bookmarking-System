import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      navigate("/library");
    } else {
      navigate("/library");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ width: "400px" }}>
        <div className="text-center mb-3">
          <h2>{isLogin ? "Login" : "Register"}</h2>
        </div>

        {isLogin ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="loginEmail"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="loginPassword" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="loginPassword"
                required
              />
            </div>
            <div className="d-flex justify-content-between">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <a href="#!" className="text-decoration-none">
                Forgot password?
              </a>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">
              Sign in
            </button>
            <div className="text-center mt-3">
              <p>
                Not a member?{" "}
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={toggleForm}
                >
                  Register
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="registerName" className="form-label">
                Name
              </label>
              <input
                type="text"
                className="form-control"
                id="registerName"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerUsername" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="registerUsername"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerEmail" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="registerEmail"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerPassword" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="registerPassword"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerRepeatPassword" className="form-label">
                Repeat password
              </label>
              <input
                type="password"
                className="form-control"
                id="registerRepeatPassword"
                required
              />
            </div>
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="agreeTerms"
                required
              />
              <label className="form-check-label" htmlFor="agreeTerms">
                I agree to the terms and conditions
              </label>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-3">
              Sign up
            </button>
            <div className="text-center mt-3">
              <p>
                Already a member?{" "}
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={toggleForm}
                >
                  Login
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;
