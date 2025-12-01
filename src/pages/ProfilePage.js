import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { User, Shield, Clock, Key, Settings as SettingsIcon, Award } from "lucide-react";
import { getAvatarUrl } from "../utils/avatarUtils";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");

  const avatarUrl = user ? getAvatarUrl(user.username) : "";

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate session time remaining
  const getSessionTimeRemaining = () => {
    const expiry = localStorage.getItem("authExpiry");
    if (!expiry) return "N/A";

    const expiryTime = parseInt(expiry, 10);
    const now = new Date().getTime();
    const remaining = expiryTime - now;

    if (remaining <= 0) return "Expired";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Modern Profile Card */}
        <div className="profile-card">
          {/* Decorative Background */}
          <div className="profile-card-bg"></div>

          {/* Profile Header */}
          <div className="profile-header-modern">
            <div className="profile-avatar-wrapper">
              <img src={avatarUrl} alt="Profile" className="profile-avatar-modern" />
              <div className="avatar-ring"></div>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{user?.username || "User"}</h1>
              <div className="profile-role-modern">
                <Shield size={16} />
                <span>{user?.role === "admin" ? "Administrator" : "User"}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="profile-tabs-modern">
            <button
              className={`tab-modern ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button
              className={`tab-modern ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-content-modern">
            {activeTab === "profile" && (
              <div className="tab-panel">
                <div className="info-section">
                  <h3 className="section-heading">
                    <User size={20} />
                    Account Information
                  </h3>

                  <div className="info-rows">
                    <div className="info-row">
                      <span className="info-label">Username</span>
                      <span className="info-value">{user?.username || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Admin ID</span>
                      <span className="info-value">{user?.adminId || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Role</span>
                      <span className="info-badge">
                        <Award size={14} />
                        {user?.role === "admin" ? "Administrator" : "User"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3 className="section-heading">
                    <Clock size={20} />
                    Session Information
                  </h3>

                  <div className="info-rows">
                    <div className="info-row">
                      <span className="info-label">Session Duration</span>
                      <span className="info-value">2 hours</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Time Remaining</span>
                      <span className="info-value-highlight">{getSessionTimeRemaining()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Auto-Logout</span>
                      <span className="info-value">When session expires</span>
                    </div>
                  </div>
                </div>

                <div className="security-note">
                  <Key size={18} />
                  <div>
                    <strong>Security Notice</strong>
                    <p>Your session will automatically expire after 2 hours of inactivity for security purposes.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="tab-panel">
                <div className="settings-content">
                  <div className="settings-icon-large">⚙️</div>
                  <h3>Settings & Preferences</h3>
                  <p className="settings-description">
                    Customize your experience and manage your account preferences.
                  </p>

                  <div className="upcoming-features">
                    <h4>Coming Soon</h4>
                    <div className="feature-grid">
                      <div className="feature-item">
                        <div className="feature-icon">🎨</div>
                        <span>Theme Customization</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">🔔</div>
                        <span>Notifications</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">🔐</div>
                        <span>Security Settings</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">📧</div>
                        <span>Email Preferences</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">📊</div>
                        <span>Display Options</span>
                      </div>
                      <div className="feature-item">
                        <div className="feature-icon">💾</div>
                        <span>Data Export</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
