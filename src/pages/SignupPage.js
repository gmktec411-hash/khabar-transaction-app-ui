import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const SignupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-logo">💰</div>
          <h1 className="auth-title">FinΞsthétique</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        {/* Info Box */}
        <div className="auth-info-box">
          <div className="auth-info-icon">🔐</div>
          <h3 className="auth-info-title">Account Registration</h3>
          <p className="auth-info-text">
            Account creation is currently managed by administrators.
            To request access to FinΞsthétique, please contact your system administrator.
          </p>
          <div className="auth-info-contact">
            📧 Contact Admin
          </div>
        </div>

        {/* Coming Soon Alternative */}
        <div className="auth-divider">
          <span className="auth-divider-text">or</span>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '12px' }}>
            Self-service registration coming soon! 🚀
          </p>
          <p style={{ color: '#718096', fontSize: '13px', lineHeight: '1.6' }}>
            We're working on enabling automatic account creation.
            Stay tuned for updates!
          </p>
        </div>

        {/* Footer Links */}
        <div className="auth-footer">
          <p className="auth-link">
            Already have an account?{" "}
            <span
              className="auth-link-highlight"
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
