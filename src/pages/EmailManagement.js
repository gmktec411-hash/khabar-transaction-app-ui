import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Mail, Plus, Trash2, Edit2, RefreshCw, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { startDeviceFlow, pollForToken, manualEmailCheck, deleteToken } from "../api/outlookApi";
import ConfirmModal from "../components/ConfirmModal";
import "./EmailManagement.css";

const EmailManagement = () => {
  const { user } = useContext(AuthContext);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  // Add Email Form State
  const [newEmail, setNewEmail] = useState({
    name: "",
    userId: "",
    emailType: "outlook"
  });

  // Auth Flow State
  const [authData, setAuthData] = useState({
    deviceCode: "",
    userCode: "",
    verificationUri: "",
    userId: "",
    emailType: "",
    name: ""
  });

  const [authStep, setAuthStep] = useState("idle"); // idle, device-code, polling, success

  // Load email accounts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("emailAccounts");
    if (stored) {
      setEmailAccounts(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever accounts change
  useEffect(() => {
    if (emailAccounts.length > 0) {
      localStorage.setItem("emailAccounts", JSON.stringify(emailAccounts));
    }
  }, [emailAccounts]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 5000);
  };

  const handleAddEmail = async () => {
    if (!newEmail.name || !newEmail.userId || !newEmail.emailType) {
      showNotification("error", "Please fill in all fields");
      return;
    }

    if (newEmail.emailType === "gmail") {
      showNotification("info", "Gmail feature coming soon!");
      return;
    }

    try {
      setLoading(true);

      // Start device flow
      const response = await startDeviceFlow(user.adminId, newEmail.userId, newEmail.emailType);

      setAuthData({
        deviceCode: response.device_code,
        userCode: response.user_code,
        verificationUri: response.verification_uri,
        userId: newEmail.userId,
        emailType: newEmail.emailType,
        name: newEmail.name
      });

      setAuthStep("device-code");
      setShowAddModal(false);
      setShowAuthModal(true);

      showNotification("success", "Device code generated successfully!");
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
        // Add to email accounts list
        const newAccount = {
          id: Date.now(),
          name: authData.name,
          userId: authData.userId,
          emailType: authData.emailType,
          subscriptionId: response.subscriptionId,
          subscriptionEnabled: response.subscriptionEnabled,
          expiresOn: response.expiresOn,
          addedAt: new Date().toISOString()
        };

        setEmailAccounts([...emailAccounts, newAccount]);

        setAuthStep("success");
        showNotification("success", "Email account added successfully!");

        setTimeout(() => {
          setShowAuthModal(false);
          setAuthStep("idle");
          resetNewEmailForm();
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
      showNotification("success", `Checked emails: ${response.messagesProcessed} messages processed`);
    } catch (error) {
      showNotification("error", "Failed to check emails: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDeleteToken = async () => {
    if (!accountToDelete) return;
    try {
      setLoading(true);
      // call API if available
      await deleteToken(user.adminId, accountToDelete.userId, accountToDelete.emailType);

      setEmailAccounts(emailAccounts.filter(a => a.id !== accountToDelete.id));
      showNotification("success", "Email account deleted successfully!");
      setShowDeleteModal(false);
      setAccountToDelete(null);
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

  const handleEditName = () => {
    if (!editingAccount || !editingAccount.name) {
      showNotification("error", "Please enter a name");
      return;
    }

    setEmailAccounts(emailAccounts.map(account =>
      account.id === editingAccount.id
        ? { ...account, name: editingAccount.name }
        : account
    ));

    showNotification("success", "Name updated successfully!");
    setShowEditModal(false);
    setEditingAccount(null);
  };

  const resetNewEmailForm = () => {
    setNewEmail({ name: "", userId: "", emailType: "outlook" });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("success", "Copied to clipboard!");
  };

  return (
    <div className="page-container">
      <div className="email-management-header">
        <div>
          <h1 className="page-title">
            <Mail size={32} style={{ marginRight: "12px" }} />
            Email Account Management
          </h1>
          <p className="page-subtitle">Manage Outlook and Gmail email accounts for transaction notifications</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Add Email Account
        </button>
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
        <table className="email-accounts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email Address</th>
              <th>Email Type</th>
              <th>Status</th>
              <th>Added Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emailAccounts.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <Mail size={48} />
                  <p>No email accounts added yet</p>
                  <button className="btn-secondary" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} />
                    Add Your First Email Account
                  </button>
                </td>
              </tr>
            ) : (
              emailAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="text-left">{account.name}</td>
                  <td className="text-left">{account.userId}</td>
                  <td>
                    <span className={`badge badge-${account.emailType}`}>
                      {account.emailType.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${account.subscriptionEnabled ? 'active' : 'inactive'}`}>
                      {account.subscriptionEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(account.addedAt).toLocaleDateString()}</td>
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
                        title="Edit Name"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Email Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Email Account</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  placeholder="e.g., My Outlook Account"
                  value={newEmail.name}
                  onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="user@outlook.com"
                  value={newEmail.userId}
                  onChange={(e) => setNewEmail({ ...newEmail, userId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Type</label>
                <select
                  value={newEmail.emailType}
                  onChange={(e) => setNewEmail({ ...newEmail, emailType: e.target.value })}
                >
                  <option value="outlook">Outlook</option>
                  <option value="gmail">Gmail (Coming Soon)</option>
                </select>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={cancelDelete}
        title={"Delete Email Account"}
        subtitle={document.title || 'Application'}
        description={accountToDelete ? `${accountToDelete.name || accountToDelete.userId} will be removed from the local list and the server.` : ''}
        onConfirm={confirmDeleteToken}
        confirmText={"Delete Permanently"}
        cancelText={"Cancel"}
        loading={loading}
        danger={true}
        logoSrc={'/logo192.png'}
      />

      {/* Edit Name Modal */}
      {showEditModal && editingAccount && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Account Name</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleEditName}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
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
                <div className="auth-step">
                  <div className="auth-icon">🔐</div>
                  <h3>Authorization Required</h3>
                  <p>Please complete the following steps to authorize your email account:</p>

                  <div className="code-box">
                    <label>User Code:</label>
                    <div className="code-display">
                      <span className="user-code">{authData.userCode}</span>
                      <button
                        className="icon-btn icon-btn-secondary"
                        onClick={() => copyToClipboard(authData.userCode)}
                        title="Copy code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="instructions">
                    <h4>Steps to authorize:</h4>
                    <ol>
                      <li>Click the button below to open the authorization page</li>
                      <li>Enter the User Code: <strong>{authData.userCode}</strong></li>
                      <li>Sign in with your email account</li>
                      <li>Grant the requested permissions</li>
                      <li>Return here and click "Check Authorization"</li>
                    </ol>
                  </div>

                  <a
                    href={authData.verificationUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-large"
                  >
                    Open Authorization Page
                  </a>
                </div>
              )}

              {authStep === "polling" && (
                <div className="auth-step">
                  <div className="auth-icon spinner">⏳</div>
                  <h3>Checking Authorization...</h3>
                  <p>Please wait while we verify your authorization</p>
                </div>
              )}

              {authStep === "success" && (
                <div className="auth-step">
                  <div className="auth-icon success">✅</div>
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
  );
};

export default EmailManagement;
