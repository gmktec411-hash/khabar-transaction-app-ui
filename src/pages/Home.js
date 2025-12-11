import React, { useState, useMemo, useCallback } from "react";
import { Users, Package, TrendingUp, DollarSign, Calendar, Filter, BarChart2, Search, Download, FileText, ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportToPDF, exportToCSV, formatPlayerDataForExport, formatAppDataForExport } from "../utils/exportUtils";
import "./Home.css";

const Home = ({ transactions = [] }) => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("month"); // today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [viewMode, setViewMode] = useState("player"); // player or app
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const [expandedAppTypes, setExpandedAppTypes] = useState({});
  const [showFilters, setShowFilters] = useState(false);

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

  // Success includes both "S" and "C" status
  const successfulTransactions = useMemo(() => {
    return filteredTransactions.filter(tx => tx.status === "S" || tx.status === "C");
  }, [filteredTransactions]);

  // Calculate Player Dashboard Metrics
  const playerMetrics = useMemo(() => {
    const playerMap = {};

    filteredTransactions.forEach(tx => {
      // For received transactions (S or C status)
      if (tx.status === "S" || tx.status === "C") {
        // Exclude if appName matches sender (player name)
        if (tx.appName.toLowerCase() === tx.sender.toLowerCase()) return;

        if (!playerMap[tx.sender]) {
          playerMap[tx.sender] = {
            receivedAmount: 0,
            receivedCount: 0,
            sentAmount: 0,
            sentCount: 0,
            apps: new Set(),
            lastActive: tx.sentAt
          };
        }

        playerMap[tx.sender].receivedAmount += tx.amount;
        playerMap[tx.sender].receivedCount++;
        playerMap[tx.sender].apps.add(tx.appName);

        if (new Date(tx.sentAt) > new Date(playerMap[tx.sender].lastActive)) {
          playerMap[tx.sender].lastActive = tx.sentAt;
        }
      }

      // For sent transactions (I status) - use receiver name
      if (tx.status === "I" && tx.receiver) {
        // Exclude if appName matches receiver (player name)
        if (tx.appName.toLowerCase() === tx.receiver.toLowerCase()) return;

        if (!playerMap[tx.receiver]) {
          playerMap[tx.receiver] = {
            receivedAmount: 0,
            receivedCount: 0,
            sentAmount: 0,
            sentCount: 0,
            apps: new Set(),
            lastActive: tx.sentAt
          };
        }

        playerMap[tx.receiver].sentAmount += tx.amount;
        playerMap[tx.receiver].sentCount++;
        playerMap[tx.receiver].apps.add(tx.appName);

        if (new Date(tx.sentAt) > new Date(playerMap[tx.receiver].lastActive)) {
          playerMap[tx.receiver].lastActive = tx.sentAt;
        }
      }
    });

    return Object.entries(playerMap)
      .map(([name, data]) => ({
        name,
        receivedAmount: data.receivedAmount,
        receivedCount: data.receivedCount,
        sentAmount: data.sentAmount,
        sentCount: data.sentCount,
        totalAmount: data.receivedAmount + data.sentAmount,
        totalTransactions: data.receivedCount + data.sentCount,
        appCount: data.apps.size,
        apps: Array.from(data.apps),
        netBalance: data.receivedAmount - data.sentAmount,
        lastActive: data.lastActive
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions]);

  // Calculate App Dashboard Metrics - Grouped by App Type
  const appMetrics = useMemo(() => {
    const appTypeMap = {};

    filteredTransactions.forEach(tx => {
      // Skip NA app types
      if (!tx.appType || tx.appType.toUpperCase() === 'NA') return;

      // For received transactions (S or C status)
      if (tx.status === "S" || tx.status === "C") {
        // Skip if appName matches sender
        if (tx.appName.toLowerCase() === tx.sender.toLowerCase()) return;

        // Initialize app type if not exists
        if (!appTypeMap[tx.appType]) {
          appTypeMap[tx.appType] = {
            receivedAmount: 0,
            receivedCount: 0,
            sentAmount: 0,
            sentCount: 0,
            uniquePlayers: new Set(),
            apps: {},
            lastActive: tx.sentAt
          };
        }

        // Add to app type totals
        appTypeMap[tx.appType].receivedAmount += tx.amount;
        appTypeMap[tx.appType].receivedCount++;
        appTypeMap[tx.appType].uniquePlayers.add(tx.sender);

        // Initialize individual app if not exists
        if (!appTypeMap[tx.appType].apps[tx.appName]) {
          appTypeMap[tx.appType].apps[tx.appName] = {
            receivedAmount: 0,
            receivedCount: 0,
            sentAmount: 0,
            sentCount: 0,
            uniquePlayers: new Set(),
            lastActive: tx.sentAt
          };
        }

        // Add to individual app totals
        appTypeMap[tx.appType].apps[tx.appName].receivedAmount += tx.amount;
        appTypeMap[tx.appType].apps[tx.appName].receivedCount++;
        appTypeMap[tx.appType].apps[tx.appName].uniquePlayers.add(tx.sender);

        // Update last active for both app type and individual app
        if (new Date(tx.sentAt) > new Date(appTypeMap[tx.appType].lastActive)) {
          appTypeMap[tx.appType].lastActive = tx.sentAt;
        }
        if (new Date(tx.sentAt) > new Date(appTypeMap[tx.appType].apps[tx.appName].lastActive)) {
          appTypeMap[tx.appType].apps[tx.appName].lastActive = tx.sentAt;
        }
      }

      // For sent transactions (I status)
      if (tx.status === "I" && tx.receiver) {
        // Skip if appName matches receiver
        if (tx.appName.toLowerCase() === tx.receiver.toLowerCase()) return;

        // Initialize app type if not exists
        if (!appTypeMap[tx.appType]) {
          appTypeMap[tx.appType] = {
            receivedAmount: 0,
            receivedCount: 0,
            sentAmount: 0,
            sentCount: 0,
            uniquePlayers: new Set(),
            apps: {},
            lastActive: tx.sentAt
          };
        }

        // Add to app type totals
        appTypeMap[tx.appType].sentAmount += tx.amount;
        appTypeMap[tx.appType].sentCount++;
        appTypeMap[tx.appType].uniquePlayers.add(tx.receiver);

        // Initialize individual app if not exists
        if (!appTypeMap[tx.appType].apps[tx.appName]) {
          appTypeMap[tx.appType].apps[tx.appName] = {
            receivedAmount: 0,
            receivedCount: 0,
            sentAmount: 0,
            sentCount: 0,
            uniquePlayers: new Set(),
            lastActive: tx.sentAt
          };
        }

        // Add to individual app totals
        appTypeMap[tx.appType].apps[tx.appName].sentAmount += tx.amount;
        appTypeMap[tx.appType].apps[tx.appName].sentCount++;
        appTypeMap[tx.appType].apps[tx.appName].uniquePlayers.add(tx.receiver);

        // Update last active for both app type and individual app
        if (new Date(tx.sentAt) > new Date(appTypeMap[tx.appType].lastActive)) {
          appTypeMap[tx.appType].lastActive = tx.sentAt;
        }
        if (new Date(tx.sentAt) > new Date(appTypeMap[tx.appType].apps[tx.appName].lastActive)) {
          appTypeMap[tx.appType].apps[tx.appName].lastActive = tx.sentAt;
        }
      }
    });

    // Convert to array format with app type groups
    return Object.entries(appTypeMap)
      .map(([appType, data]) => ({
        appType,
        receivedAmount: data.receivedAmount,
        receivedCount: data.receivedCount,
        sentAmount: data.sentAmount,
        sentCount: data.sentCount,
        totalAmount: data.receivedAmount + data.sentAmount,
        totalTransactions: data.receivedCount + data.sentCount,
        playerCount: data.uniquePlayers.size,
        netBalance: data.receivedAmount - data.sentAmount,
        lastActive: data.lastActive,
        apps: Object.entries(data.apps).map(([appName, appData]) => ({
          name: appName,
          receivedAmount: appData.receivedAmount,
          receivedCount: appData.receivedCount,
          sentAmount: appData.sentAmount,
          sentCount: appData.sentCount,
          totalAmount: appData.receivedAmount + appData.sentAmount,
          totalTransactions: appData.receivedCount + appData.sentCount,
          playerCount: appData.uniquePlayers.size,
          netBalance: appData.receivedAmount - appData.sentAmount,
          lastActive: appData.lastActive
        })).sort((a, b) => b.totalAmount - a.totalAmount)
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions]);

  // Filter metrics by search term
  const filteredPlayerMetrics = useMemo(() => {
    if (!searchTerm.trim()) return playerMetrics;
    const lowerSearch = searchTerm.toLowerCase();
    return playerMetrics.filter(player =>
      player.name.toLowerCase().includes(lowerSearch)
    );
  }, [playerMetrics, searchTerm]);

  const filteredAppMetrics = useMemo(() => {
    if (!searchTerm.trim()) return appMetrics;
    const lowerSearch = searchTerm.toLowerCase();
    return appMetrics.filter(appTypeGroup =>
      appTypeGroup.appType.toLowerCase().includes(lowerSearch) ||
      appTypeGroup.apps.some(app => app.name.toLowerCase().includes(lowerSearch))
    );
  }, [appMetrics, searchTerm]);

  // Overall Summary Stats
  const summaryStats = useMemo(() => {
    const totalPlayers = playerMetrics.length;
    const totalApps = appMetrics.reduce((sum, appTypeGroup) => sum + appTypeGroup.apps.length, 0);

    // Calculate total received (S and C status)
    const totalReceived = filteredTransactions
      .filter(tx => tx.status === "S" || tx.status === "C")
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate total sent (I status)
    const totalSent = filteredTransactions
      .filter(tx => tx.status === "I")
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Net balance
    const netBalance = totalReceived - totalSent;

    const totalAmount = successfulTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = successfulTransactions.length;

    // Calculate transaction velocity (transactions per day) - optimized
    let velocity = 0;
    if (filteredTransactions.length > 0) {
      let minTime = Infinity;
      let maxTime = -Infinity;

      for (let i = 0; i < filteredTransactions.length; i++) {
        const time = new Date(filteredTransactions[i].sentAt).getTime();
        if (time < minTime) minTime = time;
        if (time > maxTime) maxTime = time;
      }

      const daysDiff = Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
      velocity = totalTransactions / daysDiff;
    }

    return {
      totalPlayers,
      totalApps,
      totalAmount,
      totalReceived,
      totalSent,
      netBalance,
      totalTransactions,
      avgPerTransaction: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
      velocity
    };
  }, [playerMetrics.length, appMetrics.length, successfulTransactions, filteredTransactions]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getActivityLevel = useCallback((totalTransactions) => {
    if (totalTransactions >= 10) return { level: 'high', label: 'High Activity' };
    if (totalTransactions >= 5) return { level: 'medium', label: 'Active' };
    return { level: 'low', label: 'Low Activity' };
  }, []);

  const toggleExpandAppType = useCallback((appType) => {
    setExpandedAppTypes(prev => ({ ...prev, [appType]: !prev[appType] }));
  }, []);

  const getDateRangeLabel = useCallback(() => {
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
  }, [dateRange, customStartDate, customEndDate]);

  // Export handlers
  const handleExportPlayerData = useCallback((format) => {
    const dataToExport = searchTerm ? filteredPlayerMetrics : playerMetrics;
    const formattedData = formatPlayerDataForExport(dataToExport);
    const filename = `player_dashboard_${getDateRangeLabel().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      const summaryData = {
        dateRange: getDateRangeLabel(),
        totalTransactions: summaryStats.totalTransactions,
        totalAmount: summaryStats.totalAmount,
        activeCount: dataToExport.length,
        viewMode: 'player'
      };
      exportToPDF(formattedData, filename, summaryData);
    } else {
      exportToCSV(formattedData, filename);
    }
  }, [searchTerm, filteredPlayerMetrics, playerMetrics, getDateRangeLabel, summaryStats]);

  const handleExportAppData = useCallback((format) => {
    const dataToExport = searchTerm ? filteredAppMetrics : appMetrics;
    const formattedData = formatAppDataForExport(dataToExport);
    const filename = `app_dashboard_${getDateRangeLabel().replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      const summaryData = {
        dateRange: getDateRangeLabel(),
        totalTransactions: summaryStats.totalTransactions,
        totalAmount: summaryStats.totalAmount,
        activeCount: dataToExport.length,
        viewMode: 'app'
      };
      exportToPDF(formattedData, filename, summaryData);
    } else {
      exportToCSV(formattedData, filename);
    }
  }, [searchTerm, filteredAppMetrics, appMetrics, getDateRangeLabel, summaryStats]);

  return (
    <div className="home-container">
      {/* Header with Filters */}
      <div className="home-header">
        <div>
          <h1 className="home-title">
            <BarChart2 size={36} />
            Analytics Dashboard
          </h1>
          <p className="home-subtitle">Comprehensive insights and performance metrics</p>
        </div>

        <div className="filter-section">
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {showFilters && (
            <div className="filter-controls">
              <select
                className="date-range-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {dateRange === "custom" && (
        <div className="custom-date-picker">
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

      {/* Period Label */}
      <div className="period-label">
        <Calendar size={18} />
        <span>Showing data for: <strong>{getDateRangeLabel()}</strong></span>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card card-success">
          <div className="card-icon">
            <ArrowUpCircle size={28} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Received</p>
            <h3 className="card-value">${summaryStats.totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="card-detail">Incoming transactions</p>
          </div>
        </div>

        <div className="summary-card card-warning">
          <div className="card-icon">
            <ArrowDownCircle size={28} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Sent</p>
            <h3 className="card-value">${summaryStats.totalSent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="card-detail">Outgoing transactions</p>
          </div>
        </div>

        <div className={`summary-card ${summaryStats.netBalance >= 0 ? 'card-positive' : 'card-negative'}`}>
          <div className="card-icon">
            <Scale size={28} />
          </div>
          <div className="card-content">
            <p className="card-label">Net Balance</p>
            <h3 className={`card-value ${summaryStats.netBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
              ${Math.abs(summaryStats.netBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="card-detail">{summaryStats.netBalance >= 0 ? 'Positive balance ↑' : 'Negative balance ↓'}</p>
          </div>
        </div>

        <div className="summary-card card-primary clickable-card" onClick={() => navigate('/active-players')}>
          <div className="card-icon">
            <Users size={28} />
          </div>
          <div className="card-content">
            <p className="card-label">Active Players</p>
            <h3 className="card-value">{summaryStats.totalPlayers}</h3>
            <p className="card-detail">Click to view details</p>
          </div>
        </div>

        <div className="summary-card card-info">
          <div className="card-icon">
            <Package size={28} />
          </div>
          <div className="card-content">
            <p className="card-label">Active Apps</p>
            <h3 className="card-value">{summaryStats.totalApps}</h3>
            <p className="card-detail">Across all players</p>
          </div>
        </div>

        <div className="summary-card card-accent">
          <div className="card-icon">
            <TrendingUp size={28} />
          </div>
          <div className="card-content">
            <p className="card-label">Daily Velocity</p>
            <h3 className="card-value">{Math.round(summaryStats.velocity)}</h3>
            <p className="card-detail">transactions/day</p>
          </div>
        </div>
      </div>

      {/* Dashboard View Selector */}
      <div className="view-selector">
        <button
          className={`view-btn ${viewMode === "player" ? "active" : ""}`}
          onClick={() => setViewMode("player")}
        >
          <Users size={20} />
          Player Dashboard
        </button>
        <button
          className={`view-btn ${viewMode === "app" ? "active" : ""}`}
          onClick={() => setViewMode("app")}
        >
          <Package size={20} />
          App Dashboard
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={viewMode === "player" ? "Search by player name..." : "Search by app name or type..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Player Dashboard View */}
      {viewMode === "player" && (
        <div className="dashboard-view">
          <div className="view-header">
            <h2>
              <Users size={24} />
              Player Performance Dashboard
            </h2>
            <div className="view-header-actions">
              <span className="item-count">
                {searchTerm ? `${filteredPlayerMetrics.length} of ${playerMetrics.length}` : `${playerMetrics.length}`} players
              </span>
              <div className="export-buttons">
                <button className="export-btn pdf-btn" onClick={() => handleExportPlayerData('pdf')} title="Export to PDF">
                  <FileText size={18} />
                  PDF
                </button>
                <button className="export-btn csv-btn" onClick={() => handleExportPlayerData('csv')} title="Export to CSV">
                  <Download size={18} />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="rank-col">#</th>
                  <th className="text-left">Player Name</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Sent</th>
                  <th className="text-right">Net Balance</th>
                  <th className="text-center">Apps Used</th>
                  <th className="text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayerMetrics.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center no-results">
                      No players found matching "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredPlayerMetrics.slice(0, visibleCount).map((player, index) => {
                    const activity = getActivityLevel(player.totalTransactions);
                    return (
                      <tr key={player.name}>
                        <td className="rank-col">
                          <span className="rank-badge">{index + 1}</span>
                        </td>
                        <td className="text-left player-name-cell">
                          <div className="activity-row">
                            <span className={`activity-badge activity-${activity.level}`}>
                              {activity.label}
                            </span>
                            <span className="count-badge">{player.totalTransactions}</span>
                          </div>
                          <span className="player-name-text">{player.name}</span>
                        </td>
                        <td className="text-right amount-received">
                          ${Math.round(player.receivedAmount)}
                          <span className="count-badge">{player.receivedCount}</span>
                        </td>
                        <td className="text-right amount-sent">
                          ${Math.round(player.sentAmount)}
                          <span className="count-badge">{player.sentCount}</span>
                        </td>
                        <td className={`text-right ${player.netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                          ${Math.round(Math.abs(player.netBalance))}
                          <span className="balance-arrow">{player.netBalance >= 0 ? '↑' : '↓'}</span>
                        </td>
                        <td className="text-center apps-used-cell" title={player.apps.join(', ')}>
                          {player.appCount}
                        </td>
                        <td className="text-right last-active-cell">{formatDate(player.lastActive)}</td>
                      </tr>
                    );
                  })
                )
                }
              </tbody>
            </table>

            {/* See More Button for Players */}
            {filteredPlayerMetrics.length > visibleCount && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  className="see-more-btn"
                  onClick={() => setVisibleCount(prev => prev + 50)}
                >
                  See More (Showing {visibleCount} of {filteredPlayerMetrics.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Dashboard View */}
      {viewMode === "app" && (
        <div className="dashboard-view">
          <div className="view-header">
            <h2>
              <Package size={24} />
              Application Performance Dashboard
            </h2>
            <div className="view-header-actions">
              <span className="item-count">
                {searchTerm ? `${filteredAppMetrics.length} of ${appMetrics.length}` : `${appMetrics.length}`} apps
              </span>
              <div className="export-buttons">
                <button className="export-btn pdf-btn" onClick={() => handleExportAppData('pdf')} title="Export to PDF">
                  <FileText size={18} />
                  PDF
                </button>
                <button className="export-btn csv-btn" onClick={() => handleExportAppData('csv')} title="Export to CSV">
                  <Download size={18} />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="rank-col">#</th>
                  <th className="text-left">App Type / App Name</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Sent</th>
                  <th className="text-right">Net Balance</th>
                  <th className="text-center">Players</th>
                  <th className="text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppMetrics.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center no-results">
                      No apps found matching "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredAppMetrics.slice(0, visibleCount).map((appTypeGroup, index) => {
                    return (
                      <React.Fragment key={appTypeGroup.appType}>
                        {/* App Type Row - Expandable */}
                        <tr className="expandable-row" onClick={() => toggleExpandAppType(appTypeGroup.appType)}>
                          <td className="rank-col">
                            <span className="rank-badge">{index + 1}</span>
                          </td>
                          <td className="text-left app-type-cell">
                            <span className={`expand-arrow ${expandedAppTypes[appTypeGroup.appType] ? "expanded" : ""}`}>▶</span>
                            <span className={`app-type-badge app-type-${appTypeGroup.appType.toLowerCase()}`}>{appTypeGroup.appType}</span>
                          </td>
                          <td className="text-right amount-received">
                            ${Math.round(appTypeGroup.receivedAmount)}
                            <span className="count-badge">{appTypeGroup.receivedCount}</span>
                          </td>
                          <td className="text-right amount-sent">
                            ${Math.round(appTypeGroup.sentAmount)}
                            <span className="count-badge">{appTypeGroup.sentCount}</span>
                          </td>
                          <td className={`text-right ${appTypeGroup.netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                            ${Math.round(Math.abs(appTypeGroup.netBalance))}
                            <span className="balance-arrow">{appTypeGroup.netBalance >= 0 ? '↑' : '↓'}</span>
                          </td>
                          <td className="text-center">{appTypeGroup.playerCount}</td>
                          <td className="text-right last-active-cell">{formatDate(appTypeGroup.lastActive)}</td>
                        </tr>

                        {/* Individual App Rows - Shown when expanded */}
                        {expandedAppTypes[appTypeGroup.appType] &&
                          appTypeGroup.apps.map((app) => {
                            const appActivity = getActivityLevel(app.totalTransactions);
                            return (
                              <tr key={app.name} className="sub-row">
                                <td className="rank-col"></td>
                                <td className="text-left app-name-cell">
                                  <div className="activity-row">
                                    <span className={`activity-badge activity-${appActivity.level}`}>
                                      {appActivity.label}
                                    </span>
                                    <span className="count-badge">{app.totalTransactions}</span>
                                  </div>
                                  <span className="app-name-text">{app.name}</span>
                                </td>
                                <td className="text-right amount-received">
                                  ${Math.round(app.receivedAmount)}
                                  <span className="count-badge">{app.receivedCount}</span>
                                </td>
                                <td className="text-right amount-sent">
                                  ${Math.round(app.sentAmount)}
                                  <span className="count-badge">{app.sentCount}</span>
                                </td>
                                <td className={`text-right ${app.netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                                  ${Math.round(Math.abs(app.netBalance))}
                                  <span className="balance-arrow">{app.netBalance >= 0 ? '↑' : '↓'}</span>
                                </td>
                                <td className="text-center">{app.playerCount}</td>
                                <td className="text-right last-active-cell">{formatDate(app.lastActive)}</td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* See More Button for Apps */}
            {filteredAppMetrics.length > visibleCount && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  className="see-more-btn"
                  onClick={() => setVisibleCount(prev => prev + 50)}
                >
                  See More (Showing {visibleCount} of {filteredAppMetrics.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
