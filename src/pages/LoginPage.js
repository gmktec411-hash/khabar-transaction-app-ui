import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import "../components/TransactionsTable.css";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fade, setFade] = useState(false);
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [flash, setFlash] = useState(false);
  const [bubbleId, setBubbleId] = useState(0);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userObj, setUserObj] = useState(null);

  // Generate DiceBear avatar URL dynamically
  const avatarUrl = userObj
    ? `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(username)}`
    : "";

  const funnyMessages = [
    "🤔 Are you sure those are your credentials?",
    "🚫 Nope, that combo doesn’t work. Try again!",
    "🕵️‍♂️ Invalid credentials — maybe check your caps lock?",
    "😬 That’s not it… wanna give it another go?",
    "👀 The login gods have rejected you. Try again!",
    "🧠 Username and password are having an identity crisis.",
    "🙈 Access denied. But nice try though!",
    "🔐 Wrong keys, wrong door!",
    "😅 If at first you don’t succeed… maybe spellcheck?",
    "🪄 That password must be from a parallel universe!",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      setShowConfetti(true);
      setUserObj({ username }); // store logged-in username
      setTimeout(() => setShowConfetti(false), 4000);
      setTimeout(() => navigate("/"), 1500);
    } else {
      const randomMsg =
        funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setError(randomMsg);
      setFade(false);
      setShake(true);
      setBounce(true);
      setFlash(true);
      setBubbleId(prev => prev + 1);
      setTimeout(() => setFade(true), 2000);
      setTimeout(() => setError(""), 3000);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setBounce(false), 600);
      setTimeout(() => setFlash(false), 300);
    }
  };

  return (
    <div
      className="page-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4f8, #e2e8f0)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
      }}
    >
      {showConfetti && <Confetti numberOfPieces={100} recycle={false} />}

      <form
        onSubmit={handleSubmit}
        className={`login-form ${shake ? "shake" : ""}`}
        style={{
          width: "400px",
          padding: "30px",
          borderRadius: "15px",
          background: "#ffffff",
          boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
          position: "relative",
          textAlign: "center",
        }}
      >
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              marginBottom: "15px",
              border: "2px solid #2563eb",
            }}
          />
        )}


        <h2 style={{ marginBottom: "20px", color: "#1e3a8a" }}>Welcome Back</h2>

        {error && (
          <div
            key={bubbleId}
            className="error-bubble"
            style={{
              position: "absolute",
              top: "-60px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#f87171",
              color: "white",
              padding: "10px 15px",
              borderRadius: "20px",
              fontWeight: "500",
              opacity: fade ? 0 : 1,
              transition: "opacity 1s ease-in-out",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {error}
          </div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Username"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            outline: "none",
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Password"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "25px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            outline: "none",
          }}
        />

        <button
          type="submit"
          className={`login-btn ${bounce ? "bounce" : ""} ${flash ? "flash" : ""}`}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "16px",
            marginBottom: "15px",
          }}
        >
          Login
        </button>

        <p
          style={{ fontSize: "12px", color: "#6b7280", cursor: "pointer" }}
          onClick={() => alert("🙏 Forgot your password? Reach out to God! 😇")}
        >
          Forgot your password? <span style={{ color: "#2563eb" }}>Reset</span>
        </p>

        {/* Add Sign Up */}
        <p
          style={{
            fontSize: "12px",
            color: "#6b7280",
            cursor: "pointer",
            marginTop: "10px"
          }}
          onClick={() => {
            const funnySignupMessages = [
              "🙏 Sign up? Better pray to God first! 😇",
              "🕊️ The signup gods are not accepting mortals today!",
              "🚫 No signups here! Go meditate and try again tomorrow.",
              "😅 Signup? Reach out to the Almighty first!",
              "🌌 Only the chosen ones may sign up. Are you one of them?"
            ];
            const msg = funnySignupMessages[Math.floor(Math.random() * funnySignupMessages.length)];
            alert(msg);
          }}
        >
          Don't have an account? <span style={{ color: "#2563eb", fontWeight: "600" }}>Sign Up</span>
        </p>


      </form>
    </div>
  );
};

export default LoginPage;
