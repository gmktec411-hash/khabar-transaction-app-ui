import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RotateCcw, LogOut, Settings, User } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = ({ onLogout, onRefresh, role }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const avatarUrl = user
    ? `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(user.username)}`
    : "";

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

  const handleComingSoon = () => {
    alert("🚧 Feature coming soon!");
  };

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <div className="navbar-left" onClick={() => navigate("/")}>
        <label className="navbar-logo"> المعاملات</label>
      </div>

      {/* Center Links */}
      <div className="navbar-center desktop-menu">
        <Link to="/" className="nav-link">Home</Link>
        {role === "admin" && <Link to="/report" className="nav-link">Report</Link>}
        <Link to="/inactive-players" className="nav-link">Inactive Players</Link>

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
                <div className="dropdown-item" onClick={handleComingSoon}>
                  <User size={16} />
                  <span>Profile</span>
                </div>
                <div className="dropdown-item" onClick={handleComingSoon}>
                  <Settings size={16} />
                  <span>Settings</span>
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
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
          {role === "admin" && <Link to="/report" className="nav-link" onClick={() => setMenuOpen(false)}>Report</Link>}
          <Link to="/inactive-players" className="nav-link" onClick={() => setMenuOpen(false)}>Inactive Players</Link>
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
