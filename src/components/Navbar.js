import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RotateCcw, LogOut, User } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import AppConfig from "../config/appConfig";
import { getAvatarUrl } from "../utils/avatarUtils";
import "./Navbar.css";

// Professional Custom Logo SVG
const FinaesthLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    {/* Hexagon shape */}
    <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" fill="url(#logoGradient)" />
    {/* Greek Xi (Ξ) symbol */}
    <path d="M15 13H25M15 20H25M15 27H25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const Navbar = ({ onLogout, onRefresh, role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const avatarUrl = user ? getAvatarUrl(user.username) : "";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  const handleComingSoon = () => {
    alert("🚧 Feature coming soon!");
  };

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <div className="navbar-left" onClick={() => navigate("/")}>
        <FinaesthLogo />
        <div className="logo-text">
          <span className="navbar-logo">{AppConfig.APP_NAME}</span>
          <span className="navbar-logo-tagline">{AppConfig.APP_TAGLINE}</span>
        </div>
      </div>

      {/* Center Links */}
      <div className="navbar-center desktop-menu">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Transactions</Link>
        {role === "admin" && <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>}
        {role === "admin" && <Link to="/report" className={`nav-link ${location.pathname === '/report' ? 'active' : ''}`}>Report</Link>}
        {role === "admin" && <Link to="/limits" className={`nav-link ${location.pathname === '/limits' ? 'active' : ''}`}>Limits</Link>}
        {role === "admin" && <Link to="/email-integration" className={`nav-link ${location.pathname === '/email-integration' ? 'active' : ''}`}>Email Integration</Link>}
        <Link to="/inactive-players" className={`nav-link ${location.pathname === '/inactive-players' ? 'active' : ''}`}>Inactive Players</Link>

        <button className="refresh-btn" onClick={onRefresh}>
          <RotateCcw size={16} style={{ marginRight: "6px" }} />
          Refresh
        </button>
      </div>

      {/* Right: User Section */}
      <div className="navbar-right">
        {user && (
          <div className="user-dropdown" ref={dropdownRef}>
            <div
              className="user-box"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <img src={avatarUrl} alt="avatar" className="avatar-img" />
              <div className="user-text">
                <span className="username">{user.username}</span>
                <span className="user-role">
                  {role === "admin" ? "Administrator" : "User"}
                </span>
              </div>
            </div>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={handleProfileClick}>
                  <User size={16} />
                  <span>Profile</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={onLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hamburger for mobile */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <div className={`bar ${menuOpen ? "open" : ""}`} />
        <div className={`bar ${menuOpen ? "open" : ""}`} />
        <div className={`bar ${menuOpen ? "open" : ""}`} />
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Transactions</Link>
          {role === "admin" && <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {role === "admin" && <Link to="/report" className={`nav-link ${location.pathname === '/report' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Report</Link>}
          {role === "admin" && <Link to="/limits" className={`nav-link ${location.pathname === '/limits' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Limits</Link>}
          {role === "admin" && <Link to="/email-integration" className={`nav-link ${location.pathname === '/email-integration' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Email Integration</Link>}
          <Link to="/inactive-players" className={`nav-link ${location.pathname === '/inactive-players' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Inactive Players</Link>
          <button className="refresh-btn" onClick={() => { onRefresh(); setMenuOpen(false); }}>
            <RotateCcw size={16} style={{ marginRight: "6px" }} />
            Refresh
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
