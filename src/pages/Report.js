import React, { useState, useMemo } from "react";
import { FileText, Calendar, TrendingUp, TrendingDown, Users, Package, ChevronRight, Scale } from "lucide-react";
import "./Report.css";

const Report = ({ transactions = [] }) => {
  const safeTransactions = useMemo(() => {
    return Array.isArray(transactions)
      ? transactions.filter(tx => !["A", "R"].includes(tx.status))
      : [];
  }, [transactions]);

  const [filterOption, setFilterOption] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [expandedAppTypes, setExpandedAppTypes] = useState({});
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [visibleAppTypes, setVisibleAppTypes] = useState(50);
  const [visiblePlayers, setVisiblePlayers] = useState(50);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    const startOfDay = (d) => { const date = new Date(d); date.setHours(0, 0, 0, 0); return date; };
    const endOfDay = (d) => { const date = new Date(d); date.setHours(23, 59, 59, 999); return date; };
    const startOfWeek = (d) => { const date = new Date(d); date.setDate(date.getDate() - date.getDay()); return startOfDay(date); };
    const endOfWeek = (d) => { const start = startOfWeek(d); const end = new Date(start); end.setDate(end.getDate() + 6); return endOfDay(end); };

    switch (filterOption) {
      case "today": startDate = startOfDay(now); endDate = endOfDay(now); break;
      case "yesterday":
        const y = new Date(now); y.setDate(now.getDate() - 1);
        startDate = startOfDay(y); endDate = endOfDay(y); break;
      case "thisWeek": startDate = startOfWeek(now); endDate = endOfWeek(now); break;
      case "lastWeek":
        const lwEnd = new Date(now); lwEnd.setDate(now.getDate() - now.getDay() - 1);
        const lwStart = new Date(lwEnd); lwStart.setDate(lwEnd.getDate() - 6);
        startDate = startOfDay(lwStart); endDate = endOfDay(lwEnd); break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = startOfDay(new Date(customStartDate));
          endDate = endOfDay(new Date(customEndDate));
        }
        break;
      default:
        startDate = null; endDate = null;
    }

    if (!startDate || !endDate) return safeTransactions;

    return safeTransactions.filter(txn => {
      const txnDate = new Date(txn.sentAt);
      return txnDate >= startDate && txnDate <= endDate;
    });
  }, [safeTransactions, filterOption, customStartDate, customEndDate]);

  const toggleExpandAppType = (appType) =>
    setExpandedAppTypes(prev => ({ ...prev, [appType]: !prev[appType] }));

  const toggleExpandPlayer = (player) =>
    setExpandedPlayers(prev => ({ ...prev, [player]: !prev[player] }));

  /** Totals **/
  const appTypeTotals = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(tx => {
      // Skip NA app types
      if (!tx.appType || tx.appType.toUpperCase() === 'NA') return;

      if (!map[tx.appType]) map[tx.appType] = { totalSent: 0, totalReceived: 0, sentCount: 0, receivedCount: 0, totalCount: 0, apps: {} };
      if (tx.status === "I") {
        map[tx.appType].totalSent += tx.amount;
        map[tx.appType].sentCount++;
        map[tx.appType].totalCount++;
      }
      if (["S", "C"].includes(tx.status)) {
        map[tx.appType].totalReceived += tx.amount;
        map[tx.appType].receivedCount++;
        map[tx.appType].totalCount++;
      }

      if (!map[tx.appType].apps[tx.appName]) map[tx.appType].apps[tx.appName] = { sent: 0, received: 0, sentCount: 0, receivedCount: 0 };
      if (tx.status === "I") {
        map[tx.appType].apps[tx.appName].sent += tx.amount;
        map[tx.appType].apps[tx.appName].sentCount++;
      }
      if (["S", "C"].includes(tx.status)) {
        map[tx.appType].apps[tx.appName].received += tx.amount;
        map[tx.appType].apps[tx.appName].receivedCount++;
      }
    });
    return map;
  }, [filteredTransactions]);

  const playerTotals = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(tx => {
      // determine target player for this transaction: for received (S/C) it's the sender,
      // for sent (I) it's the receiver (if available), otherwise fall back to sender
      const targetPlayer = (["S", "C"].includes(tx.status)) ? tx.sender : (tx.receiver || tx.sender);

      if (!map[targetPlayer]) map[targetPlayer] = { totalSent: 0, totalReceived: 0, sentCount: 0, receivedCount: 0, appTypes: {} };

      if (tx.status === "I") {
        map[targetPlayer].totalSent += tx.amount;
        map[targetPlayer].sentCount++;
      }
      if (["S", "C"].includes(tx.status)) {
        map[targetPlayer].totalReceived += tx.amount;
        map[targetPlayer].receivedCount++;
      }

      // Skip NA app types in player breakdown
      if (tx.appType && tx.appType.toUpperCase() !== 'NA') {
        if (!map[targetPlayer].appTypes[tx.appType])
          map[targetPlayer].appTypes[tx.appType] = { totalSent: 0, totalReceived: 0, sentCount: 0, receivedCount: 0, apps: {} };

        if (tx.status === "I") {
          map[targetPlayer].appTypes[tx.appType].totalSent += tx.amount;
          map[targetPlayer].appTypes[tx.appType].sentCount++;
        }
        if (["S", "C"].includes(tx.status)) {
          map[targetPlayer].appTypes[tx.appType].totalReceived += tx.amount;
          map[targetPlayer].appTypes[tx.appType].receivedCount++;
        }

        if (!map[targetPlayer].appTypes[tx.appType].apps[tx.appName])
          map[targetPlayer].appTypes[tx.appType].apps[tx.appName] = { sent: 0, received: 0, sentCount: 0, receivedCount: 0 };

        if (tx.status === "I") {
          map[targetPlayer].appTypes[tx.appType].apps[tx.appName].sent += tx.amount;
          map[targetPlayer].appTypes[tx.appType].apps[tx.appName].sentCount++;
        }
        if (["S", "C"].includes(tx.status)) {
          map[targetPlayer].appTypes[tx.appType].apps[tx.appName].received += tx.amount;
          map[targetPlayer].appTypes[tx.appType].apps[tx.appName].receivedCount++;
        }
      }
    });
    return map;
  }, [filteredTransactions]);

  const grandTotalsApp = useMemo(() => {
    let sent = 0, received = 0, sentCount = 0, receivedCount = 0;
    Object.values(appTypeTotals).forEach(v => {
      sent += v.totalSent;
      received += v.totalReceived;
      sentCount += v.sentCount;
      receivedCount += v.receivedCount;
    });
    return { sent, received, sentCount, receivedCount };
  }, [appTypeTotals]);

  const grandTotalsPlayer = useMemo(() => {
    let sent = 0, received = 0, sentCount = 0, receivedCount = 0;
    Object.values(playerTotals).forEach(v => {
      sent += v.totalSent;
      received += v.totalReceived;
      sentCount += v.sentCount;
      receivedCount += v.receivedCount;
    });
    return { sent, received, sentCount, receivedCount };
  }, [playerTotals]);

  const getFilterLabel = () => {
    switch (filterOption) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "thisWeek": return "This Week";
      case "lastWeek": return "Last Week";
      case "custom":
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
        }
        return "Custom Range";
      default: return "All Time";
    }
  };

  return (
    <div className="report-container">
      {/* Header Section */}
      <div className="report-header">
        <div>
          <h1 className="report-title">
            <FileText size={36} />
            Transaction Report
          </h1>
          <p className="report-subtitle">Detailed breakdown of all transactions and performance metrics</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="report-filter-section">
        <div className="filter-header">
          <Calendar size={20} />
          <span>Select Time Period</span>
        </div>
        <div className="filter-buttons">
          {["today", "yesterday", "thisWeek", "lastWeek", "custom"].map(option => (
            <button
              key={option}
              className={`filter-btn ${filterOption === option ? "active" : ""}`}
              onClick={() => setFilterOption(option)}
            >
              {option === "today" ? "Today" :
                option === "yesterday" ? "Yesterday" :
                  option === "thisWeek" ? "This Week" :
                    option === "lastWeek" ? "Last Week" : "Custom Range"}
            </button>
          ))}
        </div>

        {filterOption === "custom" && (
          <div className="custom-range-picker">
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

        <div className="active-filter-label">
          <Calendar size={16} />
          <span>Showing data for: <strong>{getFilterLabel()}</strong></span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="report-summary-grid">
        <div className="summary-stat-card stat-success">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Received</p>
            <h3 className="summary-value">${grandTotalsApp.received.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="summary-stat-card stat-primary">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Sent</p>
            <h3 className="summary-value">${grandTotalsApp.sent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="summary-stat-card stat-info">
          <div className="stat-icon">
            <Scale size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Net Balance</p>
            <h3 className={`summary-value ${(grandTotalsApp.received - grandTotalsApp.sent) >= 0 ? 'text-success' : 'text-danger'}`}>
              ${Math.abs(grandTotalsApp.received - grandTotalsApp.sent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className={`stat-label ${(grandTotalsApp.received - grandTotalsApp.sent) >= 0 ? 'text-success' : 'text-danger'}`} style={{ marginTop: "4px", fontSize: "0.75rem", textTransform: "none" }}>
              {(grandTotalsApp.received - grandTotalsApp.sent) >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </div>
        </div>
        <div className="summary-stat-card stat-info">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">App Types</p>
            <h3 className="summary-value">{Object.keys(appTypeTotals).length}</h3>
          </div>
        </div>
        <div className="summary-stat-card stat-accent">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Players</p>
            <h3 className="summary-value">{Object.keys(playerTotals).length}</h3>
          </div>
        </div>
      </div>

      {/* App Type Totals Table */}
      <div className="report-section">
        <div className="section-header">
          <div className="section-title">
            <Package size={24} />
            <h2>App Type Breakdown</h2>
          </div>
          <span className="section-badge">{Object.keys(appTypeTotals).length} types</span>
        </div>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th className="text-left">App Type</th>
                <th className="text-center">Total Received</th>
                <th className="text-center">Total Sent</th>
                <th className="text-center">Net Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(appTypeTotals)
                .sort((a, b) => b[1].totalReceived - a[1].totalReceived)
                .slice(0, visibleAppTypes)
                .map(([type, data]) => {
                  const netBalance = data.totalReceived - data.totalSent;
                  return (
                    <React.Fragment key={type}>
                      <tr className="expandable-row" onClick={() => toggleExpandAppType(type)}>
                        <td className="text-left">
                          <span className={`expand-icon ${expandedAppTypes[type] ? "expanded" : ""}`}>
                            <ChevronRight size={18} />
                          </span>
                          <span className={`app-type-tag app-type-${type.toLowerCase()}`}>{type}</span>
                        </td>
                        <td className="text-center report-amount-received">
                          ${data.totalReceived.toFixed(2)}
                          <span className="count-badge">{data.receivedCount}</span>
                        </td>
                        <td className="text-center report-amount-sent">
                          ${data.totalSent.toFixed(2)}
                          <span className="count-badge">{data.sentCount}</span>
                        </td>
                        <td className={`text-center ${netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                          ${Math.abs(netBalance).toFixed(2)}
                          <span className="balance-arrow">{netBalance >= 0 ? '↑' : '↓'}</span>
                        </td>
                      </tr>
                      {expandedAppTypes[type] &&
                        Object.entries(data.apps).map(([appName, aData]) => {
                          const appNet = aData.received - aData.sent;
                          return (
                            <tr key={appName} className="sub-row">
                              <td className="text-left sub-name">{appName}</td>
                              <td className="text-center report-amount-received">
                                ${aData.received.toFixed(2)}
                                <span className="count-badge">{aData.receivedCount}</span>
                              </td>
                              <td className="text-center report-amount-sent">
                                ${aData.sent.toFixed(2)}
                                <span className="count-badge">{aData.sentCount}</span>
                              </td>
                              <td className={`text-center ${appNet >= 0 ? 'net-positive' : 'net-negative'}`}>
                                ${Math.abs(appNet).toFixed(2)}
                                <span className="balance-arrow">{appNet >= 0 ? '↑' : '↓'}</span>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              <tr className="grand-total-row">
                <td className="text-left"><strong>Grand Total ({grandTotalsApp.receivedCount + grandTotalsApp.sentCount})</strong></td>
                <td className="text-center">
                  <strong>${grandTotalsApp.received.toFixed(2)}</strong>
                  <span className="count-badge">{grandTotalsApp.receivedCount}</span>
                </td>
                <td className="text-center">
                  <strong>${grandTotalsApp.sent.toFixed(2)}</strong>
                  <span className="count-badge">{grandTotalsApp.sentCount}</span>
                </td>
                <td className={`text-center ${(grandTotalsApp.received - grandTotalsApp.sent) >= 0 ? 'net-positive' : 'net-negative'}`}>
                  <strong>
                    ${Math.abs(grandTotalsApp.received - grandTotalsApp.sent).toFixed(2)}
                    <span className="balance-arrow">{(grandTotalsApp.received - grandTotalsApp.sent) >= 0 ? '↑' : '↓'}</span>
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* See More Button for App Types */}
        {Object.keys(appTypeTotals).length > visibleAppTypes && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="see-more-btn"
              onClick={() => setVisibleAppTypes(prev => prev + 50)}
            >
              See More (Showing {visibleAppTypes} of {Object.keys(appTypeTotals).length})
            </button>
          </div>
        )}
      </div>

      {/* Player Totals Table */}
      <div className="report-section">
        <div className="section-header">
          <div className="section-title">
            <Users size={24} />
            <h2>Player Performance</h2>
          </div>
          <span className="section-badge">{Object.keys(playerTotals).length} players</span>
        </div>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th className="text-left">Player Name</th>
                <th className="text-center">Total Received</th>
                <th className="text-center">Total Sent</th>
                <th className="text-center">Net Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(playerTotals)
                .sort((a, b) => b[1].totalReceived - a[1].totalReceived)
                .slice(0, visiblePlayers)
                .map(([player, data]) => {
                  const playerNet = data.totalReceived - data.totalSent;
                  return (
                    <React.Fragment key={player}>
                      <tr className="expandable-row" onClick={() => toggleExpandPlayer(player)}>
                        <td className="text-left">
                          <span className={`expand-icon ${expandedPlayers[player] ? "expanded" : ""}`}>
                            <ChevronRight size={18} />
                          </span>
                          <span className="player-name-text">{player}</span>
                          <span className="count-badge">{data.receivedCount + data.sentCount}</span>
                        </td>
                        <td className="text-center report-amount-received">
                          ${data.totalReceived.toFixed(2)}
                          <span className="count-badge">{data.receivedCount}</span>
                        </td>
                        <td className="text-center report-amount-sent">
                          ${data.totalSent.toFixed(2)}
                          <span className="count-badge">{data.sentCount}</span>
                        </td>
                        <td className={`text-center ${playerNet >= 0 ? 'net-positive' : 'net-negative'}`}>
                          ${Math.abs(playerNet).toFixed(2)}
                          <span className="balance-arrow">{playerNet >= 0 ? '↑' : '↓'}</span>
                        </td>
                      </tr>

                      {expandedPlayers[player] &&
                        Object.entries(data.appTypes).map(([appType, aData]) => {
                          const typeNet = aData.totalReceived - aData.totalSent;
                          return (
                            <React.Fragment key={appType}>
                              <tr className="sub-row level-1">
                                <td className="text-left sub-name">{appType}</td>
                                <td className="text-center report-amount-received">
                                  ${aData.totalReceived.toFixed(2)}
                                  <span className="count-badge">{aData.receivedCount}</span>
                                </td>
                                <td className="text-center report-amount-sent">
                                  ${aData.totalSent.toFixed(2)}
                                  <span className="count-badge">{aData.sentCount}</span>
                                </td>
                                <td className={`text-center ${typeNet >= 0 ? 'net-positive' : 'net-negative'}`}>
                                  ${Math.abs(typeNet).toFixed(2)}
                                  <span className="balance-arrow">{typeNet >= 0 ? '↑' : '↓'}</span>
                                </td>
                              </tr>
                              {Object.entries(aData.apps).map(([appName, appData]) => {
                                const appNetBalance = appData.received - appData.sent;
                                return (
                                  <tr key={appName} className="sub-row level-2">
                                    <td className="text-left sub-sub-name">{appName}</td>
                                    <td className="text-center amount-received">
                                      ${appData.received.toFixed(2)}
                                      <span className="count-badge">{appData.receivedCount}</span>
                                    </td>
                                    <td className="text-center amount-sent">
                                      ${appData.sent.toFixed(2)}
                                      <span className="count-badge">{appData.sentCount}</span>
                                    </td>
                                    <td className={`text-center ${appNetBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                                      ${Math.abs(appNetBalance).toFixed(2)}
                                      <span className="balance-arrow">{appNetBalance >= 0 ? '↑' : '↓'}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              <tr className="grand-total-row">
                <td className="text-left"><strong>Grand Total</strong></td>
                <td className="text-center">
                  <strong>${grandTotalsPlayer.received.toFixed(2)}</strong>
                  <span className="count-badge">{grandTotalsPlayer.receivedCount}</span>
                </td>
                <td className="text-center">
                  <strong>${grandTotalsPlayer.sent.toFixed(2)}</strong>
                  <span className="count-badge">{grandTotalsPlayer.sentCount}</span>
                </td>
                <td className={`text-center ${(grandTotalsPlayer.received - grandTotalsPlayer.sent) >= 0 ? 'net-positive' : 'net-negative'}`}>
                  <strong>
                    ${Math.abs(grandTotalsPlayer.received - grandTotalsPlayer.sent).toFixed(2)}
                    <span className="balance-arrow">{(grandTotalsPlayer.received - grandTotalsPlayer.sent) >= 0 ? '↑' : '↓'}</span>
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* See More Button for Players */}
        {Object.keys(playerTotals).length > visiblePlayers && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="see-more-btn"
              onClick={() => setVisiblePlayers(prev => prev + 50)}
            >
              See More (Showing {visiblePlayers} of {Object.keys(playerTotals).length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
