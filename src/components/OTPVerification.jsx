import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('pendingUserId');
    if (!userId) {
      navigate('/signup');
    }
  }, [navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input
    if (element.value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('pendingUserId');
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Check if OTP has expired
      if (new Date() > new Date(userData.otpExpiry)) {
        setError('OTP has expired. Please request a new one.');
        return;
      }

      // Verify OTP
      const enteredOTP = otp.join('');
      if (enteredOTP !== userData.verificationOTP) {
        setError('Invalid OTP. Please try again.');
        return;
      }

      // Update user verification status
      await updateDoc(userRef, {
        emailVerified: true,
        verificationOTP: null,
        otpExpiry: null
      });

      // Clear pending user ID
      localStorage.removeItem('pendingUserId');

      // Redirect to library
      navigate('/interests', { replace: true });

    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ width: "400px" }}>
        <h2 className="text-center mb-4">Verify Your Email</h2>
        <p className="text-center">
          Please enter the 6-digit code sent to your email
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-between mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                className="form-control text-center mx-1"
                style={{ width: "40px" }}
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyUp={(e) => {
                  if (e.key === "Backspace" && !e.target.value && index > 0) {
                    const prevInput = document.getElementById(`otp-${index - 1}`);
                    if (prevInput) {
                      prevInput.focus();
                    }
                  }
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || otp.some(digit => !digit)}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;