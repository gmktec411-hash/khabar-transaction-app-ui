import React, { useMemo } from "react";
import { TrendingUp, DollarSign, Users, Activity, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import "./Dashboard.css";

const Dashboard = ({ transactions = [] }) => {
  // Calculate key metrics
  const metrics = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayTxns = safeTransactions.filter(tx => new Date(tx.sentAt) >= startOfToday);
    const weekTxns = safeTransactions.filter(tx => new Date(tx.sentAt) >= startOfWeek);
    const monthTxns = safeTransactions.filter(tx => new Date(tx.sentAt) >= startOfMonth);

    const totalAmount = safeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalSuccess = safeTransactions.filter(tx => tx.status === "S").length;
    const totalFailed = safeTransactions.filter(tx => tx.status === "F").length;
    const totalPending = safeTransactions.filter(tx => ["C", "I", "A", "R", "E"].includes(tx.status)).length;

    const uniquePlayers = new Set(safeTransactions.map(tx => tx.sender)).size;
    const uniqueApps = new Set(safeTransactions.map(tx => tx.appName)).size;

    return {
      total: safeTransactions.length,
      today: todayTxns.length,
      week: weekTxns.length,
      month: monthTxns.length,
      totalAmount,
      totalSuccess,
      totalFailed,
      totalPending,
      uniquePlayers,
      uniqueApps,
      successRate: safeTransactions.length > 0 ? ((totalSuccess / safeTransactions.length) * 100).toFixed(1) : 0
    };
  }, [transactions]);

  // Recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    return [...safeTransactions]
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, 15);
  }, [transactions]);

  // Top players by transaction count
  const topPlayers = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const playerMap = {};
    safeTransactions.forEach(tx => {
      if (!playerMap[tx.sender]) {
        playerMap[tx.sender] = { count: 0, amount: 0 };
      }
      playerMap[tx.sender].count++;
      playerMap[tx.sender].amount += tx.amount;
    });
    return Object.entries(playerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [transactions]);

  // Top apps by transaction count
  const topApps = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const appMap = {};
    safeTransactions.forEach(tx => {
      if (!appMap[tx.appName]) {
        appMap[tx.appName] = { count: 0, amount: 0 };
      }
      appMap[tx.appName].count++;
      appMap[tx.appName].amount += tx.amount;
    });
    return Object.entries(appMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [transactions]);

  const getStatusText = (status) => {
    const statuses = {
      "S": "Success", "F": "Failed", "C": "Confirm",
      "I": "Sent", "A": "Accept", "R": "Request", "E": "Check Email"
    };
    return statuses[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      "S": "status-success", "F": "status-failed", "C": "status-confirm",
      "I": "status-sent", "A": "status-accept", "R": "status-request", "E": "status-checkemail"
    };
    return classes[status] || "";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">
            <Activity size={32} style={{ marginRight: "12px" }} />
            Dashboard
          </h1>
          <p className="page-subtitle">Overview of transaction metrics and system performance</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-primary">
          <div className="metric-icon">
            <DollarSign size={28} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">${metrics.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="metric-label">Total Transaction Value</p>
            <span className="metric-badge">{metrics.total} transactions</span>
          </div>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-icon">
            <CheckCircle size={28} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{metrics.totalSuccess.toLocaleString()}</h3>
            <p className="metric-label">Successful Transactions</p>
            <span className="metric-badge">{metrics.successRate}% success rate</span>
          </div>
        </div>

        <div className="metric-card metric-danger">
          <div className="metric-icon">
            <XCircle size={28} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{metrics.totalFailed.toLocaleString()}</h3>
            <p className="metric-label">Failed Transactions</p>
            <span className="metric-badge">{metrics.totalPending} pending</span>
          </div>
        </div>

        <div className="metric-card metric-info">
          <div className="metric-icon">
            <Users size={28} />
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{metrics.uniquePlayers.toLocaleString()}</h3>
            <p className="metric-label">Active Players</p>
            <span className="metric-badge">{metrics.uniqueApps} apps</span>
          </div>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <Calendar size={20} />
          <div>
            <p className="stat-value">{metrics.today}</p>
            <p className="stat-label">Today</p>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <p className="stat-value">{metrics.week}</p>
            <p className="stat-label">This Week</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={20} />
          <div>
            <p className="stat-value">{metrics.month}</p>
            <p className="stat-label">This Month</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="dashboard-card compact-card">
          <div className="card-header">
            <h2>Recent Transactions</h2>
            <span className="card-badge">{recentTransactions.length} latest</span>
          </div>
          <div className="card-body compact-body">
            {recentTransactions.length === 0 ? (
              <p className="empty-message">No recent transactions</p>
            ) : (
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Player</th>
                    <th>App</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="compact-row">
                      <td>{formatDate(tx.sentAt)}</td>
                      <td className="player-cell">{tx.sender}</td>
                      <td className="app-cell">{tx.appName}</td>
                      <td className="text-right dashboard-amount">${tx.amount.toFixed(2)}</td>
                      <td className="text-center"><span className={`status-badge ${getStatusClass(tx.status)}`}>{getStatusText(tx.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Players */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Top Players</h2>
            <span className="card-badge">By transaction count</span>
          </div>
          <div className="card-body">
            {topPlayers.length === 0 ? (
              <p className="empty-message">No player data available</p>
            ) : (
              <div className="top-list">
                {topPlayers.map((player, index) => (
                  <div key={player.name} className="top-item">
                    <div className="top-rank">#{index + 1}</div>
                    <div className="top-info">
                      <p className="top-name">{player.name}</p>
                      <p className="top-detail">{player.count} transactions • <span className="top-amount">${player.amount.toFixed(2)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Apps */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Top Applications</h2>
            <span className="card-badge">By transaction count</span>
          </div>
          <div className="card-body">
            {topApps.length === 0 ? (
              <p className="empty-message">No app data available</p>
            ) : (
              <div className="top-list">
                {topApps.map((app, index) => (
                  <div key={app.name} className="top-item">
                    <div className="top-rank">#{index + 1}</div>
                    <div className="top-info">
                      <p className="top-name">{app.name}</p>
                      <p className="top-detail">{app.count} transactions • <span className="top-amount">${app.amount.toFixed(2)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
