import React, { useState, useMemo } from "react";
import { Users, Calendar, TrendingUp, Search, ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportToExcel, exportToCSV } from "../utils/exportUtils";
import "./ActivePlayers.css";

const ActivePlayers = ({ transactions = [] }) => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        return safeTransactions;
    }

    if (!startDate || !endDate) return safeTransactions;

    return safeTransactions.filter(tx => {
      const txDate = new Date(tx.sentAt);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, dateRange, customStartDate, customEndDate]);

  // Calculate player summary data only (NO transactions stored)
  const playersData = useMemo(() => {
    const playerMap = {};

    filteredTransactions.forEach(tx => {
      // For received transactions (S or C status)
      if (tx.status === "S" || tx.status === "C") {
        if (tx.appName.toLowerCase() === tx.sender.toLowerCase()) return;

        if (!playerMap[tx.sender]) {
          playerMap[tx.sender] = {
            name: tx.sender,
            totalReceived: 0,
            totalSent: 0,
            transactionCount: 0,
            lastActive: tx.sentAt,
            appTypes: new Set()
          };
        }

        playerMap[tx.sender].totalReceived += tx.amount;
        playerMap[tx.sender].transactionCount++;

        // Track app type (skip NA)
        if (tx.appType && tx.appType.toUpperCase() !== 'NA') {
          playerMap[tx.sender].appTypes.add(tx.appType);
        }

        if (new Date(tx.sentAt) > new Date(playerMap[tx.sender].lastActive)) {
          playerMap[tx.sender].lastActive = tx.sentAt;
        }
      }

      // For sent transactions (I status)
      if (tx.status === "I" && tx.receiver) {
        if (tx.appName.toLowerCase() === tx.receiver.toLowerCase()) return;

        if (!playerMap[tx.receiver]) {
          playerMap[tx.receiver] = {
            name: tx.receiver,
            totalReceived: 0,
            totalSent: 0,
            transactionCount: 0,
            lastActive: tx.sentAt,
            appTypes: new Set()
          };
        }

        playerMap[tx.receiver].totalSent += tx.amount;
        playerMap[tx.receiver].transactionCount++;

        // Track app type (skip NA)
        if (tx.appType && tx.appType.toUpperCase() !== 'NA') {
          playerMap[tx.receiver].appTypes.add(tx.appType);
        }

        if (new Date(tx.sentAt) > new Date(playerMap[tx.receiver].lastActive)) {
          playerMap[tx.receiver].lastActive = tx.sentAt;
        }
      }
    });

    // Convert Set to Array for each player
    return Object.values(playerMap).map(player => ({
      ...player,
      appTypes: Array.from(player.appTypes)
    })).sort((a, b) => {
      const dateA = new Date(a.lastActive);
      const dateB = new Date(b.lastActive);
      return dateB - dateA;
    });
  }, [filteredTransactions]);

  // Filter players by search term
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return playersData;
    const lowerSearch = searchTerm.toLowerCase();
    return playersData.filter(player =>
      player.name.toLowerCase().includes(lowerSearch)
    );
  }, [playersData, searchTerm]);


  const getDateRangeLabel = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case "custom":
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
        }
        return "Custom Range";
      default:
        return "All Time";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = (format) => {
    const dataToExport = filteredPlayers.map(player => ({
      'Player Name': player.name,
      'App Types': player.appTypes.join(', '),
      'Total Received': `$${player.totalReceived.toFixed(2)}`,
      'Total Sent': `$${player.totalSent.toFixed(2)}`,
      'Net Balance': `$${(player.totalReceived - player.totalSent).toFixed(2)}`,
      'Transaction Count': player.transactionCount,
      'Last Active': formatDate(player.lastActive)
    }));

    const filename = `active_players_summary_${getDateRangeLabel().replace(/\s+/g, '_')}`;

    if (format === 'excel') {
      exportToExcel(dataToExport, filename);
    } else {
      exportToCSV(dataToExport, filename);
    }
  };

  return (
    <div className="active-players-container">
      {/* Header */}
      <div className="active-players-header">
        <div>
          <button className="back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="active-players-title">
            <Users size={36} />
            Active Players & Transactions
          </h1>
          <p className="active-players-subtitle">
            Detailed view of all active players and their transaction history
          </p>
        </div>

        <div className="header-actions">
          <div className="export-buttons">
            <button className="export-btn excel-btn" onClick={() => handleExport('excel')}>
              <FileSpreadsheet size={18} />
              Excel
            </button>
            <button className="export-btn csv-btn" onClick={() => handleExport('csv')}>
              <Download size={18} />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="filter-section">
        <div className="filter-group">
          <Calendar size={20} />
          <select
            className="date-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === "custom" && (
          <div className="custom-date-inputs">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="period-info">
          <Calendar size={16} />
          <span>Showing: <strong>{getDateRangeLabel()}</strong></span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm("")}>
            ×
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-box">
          <TrendingUp size={24} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-label">Total Active Players</div>
            <div className="stat-value">{filteredPlayers.length}</div>
          </div>
        </div>
        <div className="stat-box">
          <Users size={24} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">
              {filteredPlayers.reduce((sum, p) => sum + p.transactionCount, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Players List - Simple Summary Table */}
      <div className="players-table-wrapper">
        {filteredPlayers.length === 0 ? (
          <div className="no-players">
            <Users size={48} />
            <p>No active players found{searchTerm ? ` matching "${searchTerm}"` : ""}</p>
          </div>
        ) : (
          <table className="players-summary-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th className="text-left">Player Name</th>
                <th className="text-center">App Types</th>
                <th className="text-center">Total Received</th>
                <th className="text-center">Total Sent</th>
                <th className="text-center">Net Balance</th>
                <th className="text-center">Transactions</th>
                <th className="text-center">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.slice(0, visibleCount).map((player, index) => {
                const netBalance = player.totalReceived - player.totalSent;
                return (
                  <tr key={player.name}>
                    <td className="rank-col">
                      <span className="rank-badge">{index + 1}</span>
                    </td>
                    <td className="text-left player-name-cell">{player.name}</td>
                    <td className="text-center app-types-cell">
                      {player.appTypes.length > 0 ? (
                        <div className="app-type-badges">
                          {player.appTypes.map(appType => (
                            <span key={appType} className={`app-type-tag app-type-${appType.toLowerCase()}`}>{appType}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="no-app-type">-</span>
                      )}
                    </td>
                    <td className="text-center amount-received">
                      ${player.totalReceived.toFixed(2)}
                    </td>
                    <td className="text-center amount-sent">
                      ${player.totalSent.toFixed(2)}
                    </td>
                    <td className={`text-center ${netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                      ${Math.abs(netBalance).toFixed(2)}
                      <span className="balance-arrow">{netBalance >= 0 ? '↑' : '↓'}</span>
                    </td>
                    <td className="text-center transaction-count">
                      {player.transactionCount}
                    </td>
                    <td className="text-center last-active-cell">
                      {formatDate(player.lastActive)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* See More Button */}
        {filteredPlayers.length > visibleCount && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="see-more-btn"
              onClick={() => setVisibleCount(prev => prev + 50)}
            >
              See More (Showing {visibleCount} of {filteredPlayers.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivePlayers;
