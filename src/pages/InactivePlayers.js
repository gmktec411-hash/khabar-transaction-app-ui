import React, { useState, useMemo } from "react";
import { Users, Calendar, Clock, TrendingDown, ArrowLeft, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./InactivePlayers.css";

const InactivePlayers = ({ transactions = [] }) => {
  const navigate = useNavigate();
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [visibleCount, setVisibleCount] = useState(50);

  // Get players with their last active date
  const playerLastActive = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    // Only include players with Success ("S") or Confirm ("C") status
    const filtered = safeTransactions.filter(tx => tx.status === "S" || tx.status === "C");
    const map = {};

    filtered.forEach(tx => {
      // Skip if appName matches sender (player name)
      if (tx.appName.toLowerCase() === tx.sender.toLowerCase()) return;

      if (!map[tx.sender] || new Date(tx.sentAt) > new Date(map[tx.sender].lastActive)) {
        map[tx.sender] = {
          lastActive: tx.sentAt,
          transactionCount: 0,
          totalAmount: 0
        };
      }

      map[tx.sender].transactionCount++;
      map[tx.sender].totalAmount += tx.amount;
    });

    const arr = Object.keys(map).map(name => ({
      name,
      lastActive: map[name].lastActive,
      transactionCount: map[name].transactionCount,
      totalAmount: map[name].totalAmount,
      daysInactive: Math.floor((new Date() - new Date(map[name].lastActive)) / (1000 * 60 * 60 * 24))
    }));

    // Sort by days inactive ascending (least inactive first)
    arr.sort((a, b) => a.daysInactive - b.daysInactive);

    return arr;
  }, [transactions]);

  const inactivePlayers = playerLastActive.filter(p => p.daysInactive >= daysThreshold);

  const getInactivityLevel = (days) => {
    if (days >= 90) return { level: 'critical', label: 'Critical' };
    if (days >= 30) return { level: 'high', label: 'High' };
    if (days >= 14) return { level: 'medium', label: 'Medium' };
    return { level: 'low', label: 'Low' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="inactive-players-page">
      {/* Header */}
      <div className="inactive-header">
        <div>
          <button className="back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="inactive-title">
            <TrendingDown size={36} />
            Inactive Players
          </h1>
          <p className="inactive-subtitle">
            Players sorted by inactivity period (least to most inactive)
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <Filter size={20} />
          <label>Minimum Days Inactive:</label>
          <input
            type="number"
            min="1"
            value={daysThreshold}
            onChange={(e) => setDaysThreshold(Number(e.target.value))}
            className="days-input"
          />
          <span className="days-label">days</span>
        </div>
        <div className="filter-info">
          <Calendar size={16} />
          <span>Showing <strong>{inactivePlayers.length}</strong> inactive players</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-box">
          <Users size={24} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-label">Total Inactive</div>
            <div className="stat-value">{inactivePlayers.length}</div>
          </div>
        </div>
        <div className="stat-box">
          <Clock size={24} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-label">Average Inactivity</div>
            <div className="stat-value">
              {inactivePlayers.length > 0
                ? Math.round(inactivePlayers.reduce((sum, p) => sum + p.daysInactive, 0) / inactivePlayers.length)
                : 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="inactive-table-wrapper">
        {inactivePlayers.length === 0 ? (
          <div className="no-players">
            <Users size={48} />
            <p>No inactive players found for {daysThreshold}+ days</p>
          </div>
        ) : (
          <table className="inactive-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th className="text-left">Player Name</th>
                <th className="text-center">Total Transactions</th>
                <th className="text-center">Total Played</th>
                <th className="text-center">Days Inactive</th>
                <th className="text-center">Last Active</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {inactivePlayers.slice(0, visibleCount).map((player, index) => {
                const inactivityLevel = getInactivityLevel(player.daysInactive);
                return (
                  <tr key={player.name}>
                    <td className="rank-col">
                      <span className="rank-badge">{index + 1}</span>
                    </td>
                    <td className="text-left player-name-cell">{player.name}</td>
                    <td className="text-center transaction-count">
                      {player.transactionCount}
                    </td>
                    <td className="text-center amount-cell">
                      ${player.totalAmount.toFixed(2)}
                    </td>
                    <td className="text-center days-inactive-cell">
                      <span className="days-badge">{player.daysInactive}</span>
                    </td>
                    <td className="text-center last-active-cell">
                      {formatDate(player.lastActive)}
                    </td>
                    <td className="text-center">
                      <span className={`status-badge status-${inactivityLevel.level}`}>
                        {inactivityLevel.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* See More Button */}
        {inactivePlayers.length > visibleCount && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="see-more-btn"
              onClick={() => setVisibleCount(prev => prev + 50)}
            >
              See More (Showing {visibleCount} of {inactivePlayers.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InactivePlayers;
