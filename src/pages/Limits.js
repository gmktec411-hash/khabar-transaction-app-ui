import React, { useMemo } from "react";
import { BarChart3, TrendingUp, Scale, DollarSign } from "lucide-react";
import "./Limits.css";

const Limits = ({ transactions = [] }) => {
  // Calculate monthly totals (1st to last day of current month)
  const monthlyTotals = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // First day of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);

    // Last day of current month
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Filter transactions for current month
    const monthTransactions = safeTransactions.filter(tx => {
      const txDate = new Date(tx.sentAt);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    });

    // Group by app type - FILTER OUT NA
    const appTypeMap = {};
    monthTransactions.forEach(tx => {
      // Skip NA app types
      if (!tx.appType || tx.appType.toUpperCase() === 'NA') return;

      if (!appTypeMap[tx.appType]) {
        appTypeMap[tx.appType] = {
          totalSent: 0,
          totalReceived: 0,
          sentCount: 0,
          receivedCount: 0,
          apps: {}
        };
      }

      // Count sent (status "I")
      if (tx.status === "I") {
        appTypeMap[tx.appType].totalSent += tx.amount;
        appTypeMap[tx.appType].sentCount++;
      }

      // Count received (status "S" or "C")
      if (["S", "C"].includes(tx.status)) {
        appTypeMap[tx.appType].totalReceived += tx.amount;
        appTypeMap[tx.appType].receivedCount++;
      }

      // Track individual apps
      if (!appTypeMap[tx.appType].apps[tx.appName]) {
        appTypeMap[tx.appType].apps[tx.appName] = {
          sent: 0,
          received: 0,
          sentCount: 0,
          receivedCount: 0
        };
      }

      if (tx.status === "I") {
        appTypeMap[tx.appType].apps[tx.appName].sent += tx.amount;
        appTypeMap[tx.appType].apps[tx.appName].sentCount++;
      }

      if (["S", "C"].includes(tx.status)) {
        appTypeMap[tx.appType].apps[tx.appName].received += tx.amount;
        appTypeMap[tx.appType].apps[tx.appName].receivedCount++;
      }
    });

    return {
      startDate: startOfMonth,
      endDate: endOfMonth,
      appTypes: appTypeMap,
      totalTransactions: monthTransactions.length
    };
  }, [transactions]);

  // Grand totals
  const grandTotals = useMemo(() => {
    let totalSent = 0;
    let totalReceived = 0;
    let totalSentCount = 0;
    let totalReceivedCount = 0;

    Object.values(monthlyTotals.appTypes).forEach(appType => {
      totalSent += appType.totalSent;
      totalReceived += appType.totalReceived;
      totalSentCount += appType.sentCount;
      totalReceivedCount += appType.receivedCount;
    });

    return { totalSent, totalReceived, totalSentCount, totalReceivedCount };
  }, [monthlyTotals]);

  const [expandedAppTypes, setExpandedAppTypes] = React.useState({});
  const [visibleAppTypes, setVisibleAppTypes] = React.useState(50);

  const toggleExpandAppType = (appType) => {
    setExpandedAppTypes(prev => ({ ...prev, [appType]: !prev[appType] }));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="page-container">
      <div className="limits-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={32} style={{ marginRight: "12px" }} />
            Monthly Transaction Limits
          </h1>
          <p className="page-subtitle">
            Transaction totals from {formatDate(monthlyTotals.startDate)} to {formatDate(monthlyTotals.endDate)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="limits-summary">
        <div className="summary-card summary-success">
          <div className="summary-icon">
            <TrendingUp size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Received</p>
            <h3 className="summary-value">${grandTotals.totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="summary-detail">{grandTotals.totalReceivedCount} transactions</p>
          </div>
        </div>

        <div className="summary-card summary-primary">
          <div className="summary-icon">
            <DollarSign size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Sent</p>
            <h3 className="summary-value">${grandTotals.totalSent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="summary-detail">{grandTotals.totalSentCount} transactions</p>
          </div>
        </div>

        <div className="summary-card summary-info">
          <div className="summary-icon">
            <Scale size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">Net Balance</p>
            <h3 className={`summary-value ${grandTotals.totalReceived - grandTotals.totalSent >= 0 ? 'text-success' : 'text-danger'}`}>
              ${Math.abs(grandTotals.totalReceived - grandTotals.totalSent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="summary-detail">{grandTotals.totalReceived - grandTotals.totalSent >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>
        </div>
      </div>

      {/* App Type Limits Table */}
      <div className="table-card">
        <div className="table-header">
          <h2>{monthName} - Transaction Breakdown by App Type</h2>
        </div>
        <div className="table-wrapper">
          <table className="limits-table">
            <thead>
              <tr>
                <th className="text-left">App Type</th>
                <th className="text-center">Total Received</th>
                <th className="text-center">Total Sent</th>
                <th className="text-center">Net Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyTotals.appTypes).length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">
                    <BarChart3 size={48} />
                    <p>No transactions found for {monthName}</p>
                  </td>
                </tr>
              ) : (
                <>
                  {Object.entries(monthlyTotals.appTypes)
                    .sort((a, b) => b[1].totalReceived - a[1].totalReceived)
                    .slice(0, visibleAppTypes)
                    .map(([appType, data]) => {
                      const netBalance = data.totalReceived - data.totalSent;
                      return (
                        <React.Fragment key={appType}>
                          <tr className="expandable-row" onClick={() => toggleExpandAppType(appType)}>
                            <td className="text-left app-type-cell">
                              <span className={`expand-arrow ${expandedAppTypes[appType] ? "expanded" : ""}`}>▶</span>
                              <span className={`app-type-badge app-type-${appType.toLowerCase()}`}>{appType}</span>
                            </td>
                            <td className="text-center amount-cell amount-received">
                              ${data.totalReceived.toFixed(2)}
                              <span className="count-badge">{data.receivedCount}</span>
                            </td>
                            <td className="text-center amount-cell amount-sent">
                              ${data.totalSent.toFixed(2)}
                              <span className="count-badge">{data.sentCount}</span>
                            </td>
                            <td className={`text-center amount-cell ${netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                              ${Math.abs(netBalance).toFixed(2)}
                              <span className="balance-indicator">{netBalance >= 0 ? '↑' : '↓'}</span>
                            </td>
                          </tr>

                          {expandedAppTypes[appType] &&
                            Object.entries(data.apps).map(([appName, appData]) => {
                              const appNetBalance = appData.received - appData.sent;
                              return (
                                <tr key={appName} className="sub-row">
                                  <td className="text-left app-name-cell">{appName}</td>
                                  <td className="text-center amount-cell amount-received">
                                    ${appData.received.toFixed(2)}
                                    {appType.toUpperCase() === 'CH' && (
                                      <span
                                        className={`limit-badge-top ${10000 - appData.received < 1000 ? 'limit-danger' : 'limit-safe'}`}
                                        title={`Remaining receiving limit: $${(10000 - appData.received).toFixed(2)} out of $10,000 monthly limit`}
                                      >
                                        ${(10000 - appData.received).toFixed(0)}
                                      </span>
                                    )}
                                    <span className="count-badge">{appData.receivedCount}</span>
                                  </td>
                                  <td className="text-center amount-cell amount-sent">
                                    ${appData.sent.toFixed(2)}
                                    {appType.toUpperCase() === 'CH' && (
                                      <span
                                        className={`limit-badge-top ${5000 - appData.sent < 500 ? 'limit-danger' : 'limit-safe'}`}
                                        title={`Remaining sending limit: $${(5000 - appData.sent).toFixed(2)} out of $5,000 monthly limit`}
                                      >
                                        ${(5000 - appData.sent).toFixed(0)}
                                      </span>
                                    )}
                                    <span className="count-badge">{appData.sentCount}</span>
                                  </td>
                                  <td className={`text-center amount-cell ${appNetBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                                    ${Math.abs(appNetBalance).toFixed(2)}
                                    <span className="balance-indicator">{appNetBalance >= 0 ? '↑' : '↓'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}

                  {/* Grand Total Row */}
                  <tr className="grand-total-row">
                    <td className="text-left"><strong>Grand Total</strong></td>
                    <td className="text-center amount-cell">
                      <strong>
                        ${grandTotals.totalReceived.toFixed(2)}
                        <span className="count-badge">{grandTotals.totalReceivedCount}</span>
                      </strong>
                    </td>
                    <td className="text-center amount-cell">
                      <strong>
                        ${grandTotals.totalSent.toFixed(2)}
                        <span className="count-badge">{grandTotals.totalSentCount}</span>
                      </strong>
                    </td>
                    <td className={`text-center amount-cell ${grandTotals.totalReceived - grandTotals.totalSent >= 0 ? 'text-success' : 'text-danger'}`}>
                      <strong>
                        ${Math.abs(grandTotals.totalReceived - grandTotals.totalSent).toFixed(2)}
                        <span className="balance-indicator">
                          {grandTotals.totalReceived - grandTotals.totalSent >= 0 ? '↑' : '↓'}
                        </span>
                      </strong>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* See More Button */}
        {Object.keys(monthlyTotals.appTypes).length > visibleAppTypes && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="see-more-btn"
              onClick={() => setVisibleAppTypes(prev => prev + 50)}
            >
              See More (Showing {visibleAppTypes} of {Object.keys(monthlyTotals.appTypes).length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Limits;
