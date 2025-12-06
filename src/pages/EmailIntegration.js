import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Mail, Plus, Trash2, Edit2, RefreshCw, CheckCircle, AlertCircle, Copy, Server } from "lucide-react";
import {
  getTokensByAdmin,
  startDeviceFlow,
  pollForToken,
  manualEmailCheck,
  deleteToken,
  updateTokenName
} from "../api/outlookApi";
import LoadingScreen from "../components/LoadingScreen";
import ConfirmModal from "../components/ConfirmModal";
import "./EmailIntegration.css";

const EmailIntegration = () => {
  const { user } = useContext(AuthContext);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  // Add Email Form State - 3 fields
  const [newEmail, setNewEmail] = useState({
    name: "",              // User ID or Name (required)
    emailAddress: "",      // Email Address (optional)
    emailType: "outlook"   // Email Type (optional, default outlook)
  });

  // Auth Flow State
  const [authData, setAuthData] = useState({
    deviceCode: "",
    userCode: "",
    verificationUri: "",
    userId: "",
    emailType: "",
    gmailId: ""
  });

  const [authStep, setAuthStep] = useState("idle");

  // Load email accounts from backend on mount
  useEffect(() => {
    if (user?.adminId) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      setLoadingTokens(true);
      const response = await getTokensByAdmin(user.adminId);

      console.log("Fetched tokens response:", response);

      // Map backend response to frontend format
      const accounts = response.tokens.map((token, index) => ({
        id: index + 1,
        name: token.name || token.userId,
        userId: token.userId,
        emailType: token.emailType,
        subscriptionEnabled: token.hasSubscription,
        tokenExpiresOn: token.tokenExpiresOn,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt
      }));

      console.log("Mapped accounts:", accounts);
      setEmailAccounts(accounts);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      showNotification("error", "Failed to load email accounts from server");
    } finally {
      setLoadingTokens(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 5000);
  };

  const handleAddEmail = async () => {
    if (!newEmail.name) {
      showNotification("error", "Please enter a User ID/Name");
      return;
    }

    if (newEmail.emailType === "gmail") {
      showNotification("info", "Gmail feature coming soon!");
      return;
    }

    try {
      setLoading(true);

      // Use emailAddress if provided, otherwise use name as email
      const userId = newEmail.emailAddress || newEmail.name;

      // Start device flow
      const response = await startDeviceFlow(user.adminId, userId, newEmail.emailType);

      setAuthData({
        deviceCode: response.device_code,
        userCode: response.user_code,
        verificationUri: response.verification_uri,
        userId: userId,
        emailType: newEmail.emailType,
        name: newEmail.name
      });

      setAuthStep("device-code");
      setShowAddModal(false);
      setShowAuthModal(true);

      showNotification("success", response.message || "Device code generated successfully!");
    } catch (error) {
      showNotification("error", "Failed to start authentication: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePollToken = async () => {
    try {
      setLoading(true);
      setAuthStep("polling");

      const response = await pollForToken(
        user.adminId,
        authData.userId,
        authData.emailType,
        authData.deviceCode
      );

      if (response.success) {
        setAuthStep("success");
        showNotification("success", response.message || "Email account added successfully!");

        // Wait a bit for backend to finalize the token
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh token list from backend
        await fetchTokens();

        setTimeout(async () => {
          setShowAuthModal(false);
          setAuthStep("idle");
          resetNewEmailForm();
          // Final refresh to ensure data is up to date
          await fetchTokens();
        }, 2000);
      }
    } catch (error) {
      setAuthStep("device-code");
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;

      if (errorMsg.includes("authorization_pending")) {
        showNotification("warning", "Authorization pending. Please complete the authorization in your browser.");
      } else {
        showNotification("error", "Failed to poll token: " + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async (account) => {
    try {
      setLoading(true);
      const response = await manualEmailCheck(user.adminId, account.userId, account.emailType);
      showNotification("success", response.message || `Checked emails: ${response.messagesProcessed || 0} messages processed`);
    } catch (error) {
      showNotification("error", "Failed to check emails: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (account) => {
    // Open modern confirmation modal instead of browser confirm dialogs
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDeleteToken = async () => {
    if (!accountToDelete) return;

    try {
      setLoading(true);
      const response = await deleteToken(user.adminId, accountToDelete.userId, accountToDelete.emailType);

      showNotification("success", response.message || "Email account deleted successfully!");

      // Close modal and refresh token list from backend
      setShowDeleteModal(false);
      setAccountToDelete(null);
      await fetchTokens();
    } catch (error) {
      showNotification("error", "Failed to delete token: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAccountToDelete(null);
    showNotification("info", "Deletion cancelled");
  };

  const handleEditAccount = async () => {
    if (!editingAccount || !editingAccount.userId) {
      showNotification("error", "Please enter an Account Name (User ID)");
      return;
    }

    try {
      setLoading(true);

      // Call API to update both userId and name
      const response = await updateTokenName(
        user.adminId,
        editingAccount.userId,
        editingAccount.emailType,
        editingAccount.name || ""
      );

      showNotification("success", response.message || "Account updated successfully!");

      // Refresh token list from backend
      await fetchTokens();

      setShowEditModal(false);
      setEditingAccount(null);
    } catch (error) {
      showNotification("error", "Failed to update account: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetNewEmailForm = () => {
    setNewEmail({ name: "", emailAddress: "", emailType: "outlook" });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("success", "Copied to clipboard!");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTokenStatus = (expiresOn) => {
    if (!expiresOn) return { status: "Unknown", className: "inactive" };
    const now = new Date();
    const expiry = new Date(expiresOn);
    return expiry > now
      ? { status: "Active", className: "active" }
      : { status: "Expired", className: "expired" };
  };

  return (
    <>
      {loadingTokens && <LoadingScreen message="Loading email integrations..." />}

      <div className="page-container">
        <div className="email-integration-header">
        <div>
          <h1 className="page-title">
            <Server size={32} style={{ marginRight: "12px" }} />
            Email Integration Management
          </h1>
          <p className="page-subtitle">Configure and monitor email accounts for automated transaction processing</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={fetchTokens}
            disabled={loadingTokens}
            title="Refresh email list"
          >
            <RefreshCw size={20} className={loadingTokens ? "spinning" : ""} />
            {loadingTokens ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            Add Email Integration
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === "success" && <CheckCircle size={20} />}
          {notification.type === "error" && <AlertCircle size={20} />}
          {notification.type === "info" && <AlertCircle size={20} />}
          {notification.type === "warning" && <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Email Accounts Table */}
      <div className="table-card">
        {loadingTokens ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading email integrations...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="email-integration-table">
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Account</th>
                  <th>Email</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Subscription</th>
                  <th>Expires</th>
                  <th>Registered Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      <Mail size={48} />
                      <p>No email integrations configured</p>
                      <button className="btn-secondary" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} />
                        Add Your First Integration
                      </button>
                    </td>
                  </tr>
                ) : (
                  emailAccounts.map((account) => {
                    const tokenStatus = getTokenStatus(account.tokenExpiresOn);
                    return (
                      <tr key={account.id}>
                        <td className="text-center">{account.id}</td>
                        <td className="text-left font-semibold">{account.userId}</td>
                        <td className="text-left">{account.name || 'N/A'}</td>
                        <td>
                          <span className={`badge badge-${account.emailType}`}>
                            {account.emailType.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status-indicator ${tokenStatus.className}`}>
                            {tokenStatus.status}
                          </span>
                        </td>
                        <td>
                          <span className={`status-indicator ${account.subscriptionEnabled ? 'active' : 'inactive'}`}>
                            {account.subscriptionEnabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-sm">{formatDateTime(account.tokenExpiresOn)}</td>
                        <td className="text-sm compact-dates">
                          <div className="date-created">{formatDateTime(account.createdAt)}</div>
                          <div className="date-updated muted">{formatDateTime(account.updatedAt)}</div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-btn icon-btn-primary"
                              title="Manual Check"
                              onClick={() => handleManualCheck(account)}
                              disabled={loading}
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              className="icon-btn icon-btn-secondary"
                              title="Edit Account"
                              onClick={() => {
                                setEditingAccount({ ...account });
                                setShowEditModal(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="icon-btn icon-btn-danger"
                              title="Delete"
                              onClick={() => handleDeleteToken(account)}
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Email Modal - Simplified */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Email Integration</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>User ID / Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe or user123"
                  value={newEmail.name}
                  onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })}
                  autoFocus
                />
                <small className="form-hint">⚠️ Required - This will be the Account Name and CANNOT be changed later</small>
              </div>
              <div className="form-group">
                <label>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="user@outlook.com or user@gmail.com"
                  value={newEmail.emailAddress}
                  onChange={(e) => setNewEmail({ ...newEmail, emailAddress: e.target.value })}
                />
                <small className="form-hint">Optional - If not provided, User ID/Name will be used</small>
              </div>
              <div className="form-group">
                <label>Email Provider (Optional)</label>
                <select
                  value={newEmail.emailType}
                  onChange={(e) => setNewEmail({ ...newEmail, emailType: e.target.value })}
                >
                  <option value="outlook">Outlook</option>
                  <option value="gmail">Gmail (Coming Soon)</option>
                </select>
                <small className="form-hint">Default: Outlook</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddEmail}
                disabled={loading}
              >
                {loading ? "Processing..." : "Start Authentication"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDeleteModal}
        onClose={cancelDelete}
        title={"Delete Email Integration"}
        subtitle={document.title || 'Application'}
        description={accountToDelete ? `${accountToDelete.name || accountToDelete.userId} will be removed from the system and you will need to re-authenticate it to add it back.` : ''}
        onConfirm={confirmDeleteToken}
        confirmText={"Delete Permanently"}
        cancelText={"Cancel"}
        loading={loading}
        danger={true}
        logoSrc={'/logo192.png'}
      />

      {/* Edit Account Modal */}
      {showEditModal && editingAccount && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Email Address</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Account Name (User ID)</label>
                <input
                  type="text"
                  value={editingAccount.userId}
                  disabled
                  placeholder="e.g., user123 or account_name"
                />
                <small className="form-hint">⚠️ Account Name cannot be changed once set</small>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="text"
                  value={editingAccount.name || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  placeholder="e.g., user@outlook.com"
                  autoFocus
                />
                <small className="form-hint">Enter or update the email address for this account</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleEditAccount}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content auth-modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Email Authentication</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthStep("idle");
                }}
              >×</button>
            </div>
            <div className="modal-body">
              {authStep === "device-code" && (
                <div className="auth-step-compact">
                  <div className="auth-icon-small">🔐</div>
                  <p className="auth-description">Complete these steps to authorize your email:</p>

                  <div className="code-box-compact">
                    <label>Your Authorization Code</label>
                    <div className="code-display-compact">
                      <span className="user-code-large">{authData.userCode}</span>
                      <button
                        className="icon-btn icon-btn-secondary"
                        onClick={() => copyToClipboard(authData.userCode)}
                        title="Copy code"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="instructions-compact">
                    <div className="instruction-step">
                      <span className="step-number">1</span>
                      <span>Click "Open Authorization Page" below</span>
                    </div>
                    <div className="instruction-step">
                      <span className="step-number">2</span>
                      <span>Enter the code: <strong>{authData.userCode}</strong></span>
                    </div>
                    <div className="instruction-step">
                      <span className="step-number">3</span>
                      <span>Sign in and grant permissions</span>
                    </div>
                    <div className="instruction-step">
                      <span className="step-number">4</span>
                      <span>Return here and click "Check Authorization"</span>
                    </div>
                  </div>

                  <div className="auth-link-box">
                    <p className="auth-link-label">Authorization URL:</p>
                    <a
                      href={authData.verificationUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="auth-link"
                    >
                      {authData.verificationUri}
                    </a>
                  </div>
                </div>
              )}

              {authStep === "polling" && (
                <div className="auth-step-compact">
                  <div className="spinner"></div>
                  <h3>Checking Authorization...</h3>
                  <p>Please wait while we verify your authorization</p>
                </div>
              )}

              {authStep === "success" && (
                <div className="auth-step-compact">
                  <div className="auth-icon-small success">✅</div>
                  <h3>Success!</h3>
                  <p>Your email account has been authorized and added successfully</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {authStep === "device-code" && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowAuthModal(false);
                      setAuthStep("idle");
                    }}
                  >
                    Cancel
                  </button>
                  <a
                    href={authData.verificationUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Open Authorization Page
                  </a>
                  <button
                    className="btn-primary"
                    onClick={handlePollToken}
                    disabled={loading}
                  >
                    {loading ? "Checking..." : "Check Authorization"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default EmailIntegration;
