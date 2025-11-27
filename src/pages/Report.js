import React, { useState, useMemo } from "react";
import "../components/TransactionsTable.css";

const Report = ({ transactions = [] }) => {
  const safeTransactions = Array.isArray(transactions)
    ? transactions.filter(tx => !["A", "R"].includes(tx.status))
    : [];

  const [filterOption, setFilterOption] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [expandedAppTypes, setExpandedAppTypes] = useState({});
  const [expandedPlayers, setExpandedPlayers] = useState({});

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    const startOfDay = (d) => { const date = new Date(d); date.setHours(0,0,0,0); return date; };
    const endOfDay = (d) => { const date = new Date(d); date.setHours(23,59,59,999); return date; };
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
      if (!map[tx.appType]) map[tx.appType] = { totalSent: 0, totalReceived: 0, apps: {} };
      if (tx.status === "I") map[tx.appType].totalSent += tx.amount;
      if (["S", "C"].includes(tx.status)) map[tx.appType].totalReceived += tx.amount;

      if (!map[tx.appType].apps[tx.appName]) map[tx.appType].apps[tx.appName] = { sent: 0, received: 0 };
      if (tx.status === "I") map[tx.appType].apps[tx.appName].sent += tx.amount;
      if (["S", "C"].includes(tx.status)) map[tx.appType].apps[tx.appName].received += tx.amount;
    });
    return map;
  }, [filteredTransactions]);

  const playerTotals = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(tx => {
      if (!map[tx.sender]) map[tx.sender] = { totalSent: 0, totalReceived: 0, appTypes: {} };
      if (tx.status === "I") map[tx.sender].totalSent += tx.amount;
      if (["S", "C"].includes(tx.status)) map[tx.sender].totalReceived += tx.amount;

      if (!map[tx.sender].appTypes[tx.appType])
        map[tx.sender].appTypes[tx.appType] = { totalSent: 0, totalReceived: 0, apps: {} };

      if (tx.status === "I") map[tx.sender].appTypes[tx.appType].totalSent += tx.amount;
      if (["S", "C"].includes(tx.status))
        map[tx.sender].appTypes[tx.appType].totalReceived += tx.amount;

      if (!map[tx.sender].appTypes[tx.appType].apps[tx.appName])
        map[tx.sender].appTypes[tx.appType].apps[tx.appName] = { sent: 0, received: 0 };

      if (tx.status === "I")
        map[tx.sender].appTypes[tx.appType].apps[tx.appName].sent += tx.amount;
      if (["S", "C"].includes(tx.status))
        map[tx.sender].appTypes[tx.appType].apps[tx.appName].received += tx.amount;
    });
    return map;
  }, [filteredTransactions]);

  const grandTotalsApp = useMemo(() => {
    let sent = 0, received = 0;
    Object.values(appTypeTotals).forEach(v => { sent += v.totalSent; received += v.totalReceived; });
    return { sent, received };
  }, [appTypeTotals]);

  const grandTotalsPlayer = useMemo(() => {
    let sent = 0, received = 0;
    Object.values(playerTotals).forEach(v => { sent += v.totalSent; received += v.totalReceived; });
    return { sent, received };
  }, [playerTotals]);

  return (
    <div className="page-container">
      <h1 className="page-title"> Transaction Report</h1>

      {/* Filter Buttons */}
      <div className="filter-buttons" style={{ textAlign: "center", marginBottom: "30px" }}>
        {["today", "yesterday", "thisWeek", "lastWeek"].map(option => (
          <button
            key={option}
            className={`filter-btn ${filterOption === option ? "active" : ""}`}
            onClick={() => setFilterOption(option)}
          >
            {option === "today"
              ? "Today"
              : option === "yesterday"
              ? "Yesterday"
              : option === "thisWeek"
              ? "This Week"
              : "Last Week"}
          </button>
        ))}

        {/* Custom Range Button */}
        <button
          className={`filter-btn ${filterOption === "custom" ? "active" : ""}`}
          onClick={() => setFilterOption("custom")}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Range Picker */}
      {filterOption === "custom" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "15px",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label style={{ fontWeight: "500", marginRight: "8px" }}>From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div>
            <label style={{ fontWeight: "500", marginRight: "8px" }}>To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      )}

      {/* ---- Tables ---- */}
      <div className="table-card" style={{ marginBottom: "40px" }}>
        <h2 className="table-title">App Type Totals</h2>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>App Type</th>
              <th>Total Received</th>
              <th>Total Sent</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(appTypeTotals).map(([type, data]) => (
              <React.Fragment key={type}>
                <tr className="expandable-row" onClick={() => toggleExpandAppType(type)}>
                  <td className="text-left" style={{ paddingLeft: "15px" }}>
                    <span className={`expand-arrow ${expandedAppTypes[type] ? "expanded" : ""}`}>▶</span>
                    {type}
                  </td>
                  <td>${data.totalReceived.toFixed(2)}</td>
                  <td>${data.totalSent.toFixed(2)}</td>
                </tr>
                {expandedAppTypes[type] &&
                  Object.entries(data.apps).map(([appName, aData]) => (
                    <tr key={appName} className="sub-row hover-sub-row">
                      <td className="text-left" style={{ paddingLeft: "30px" }}>{appName}</td>
                      <td>${aData.received.toFixed(2)}</td>
                      <td>${aData.sent.toFixed(2)}</td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
            <tr className="grand-total-row">
              <td className="text-left" style={{ paddingLeft: "15px" }}>Grand Total</td>
              <td>${grandTotalsApp.received.toFixed(2)}</td>
              <td>${grandTotalsApp.sent.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Player Totals Table */}
      <div className="table-card">
        <h2 className="table-title">Player Totals</h2>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Total Received</th>
              <th>Total Sent</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(playerTotals)
              .sort((a, b) => b[1].totalReceived - a[1].totalReceived)
              .map(([player, data]) => (
                <React.Fragment key={player}>
                  <tr className="expandable-row" onClick={() => toggleExpandPlayer(player)}>
                    <td className="text-left" style={{ paddingLeft: "15px" }}>
                      <span className={`expand-arrow ${expandedPlayers[player] ? "expanded" : ""}`}>▶</span>
                      {player}
                    </td>
                    <td>${data.totalReceived.toFixed(2)}</td>
                    <td>${data.totalSent.toFixed(2)}</td>
                  </tr>

                  {expandedPlayers[player] &&
                    Object.entries(data.appTypes).map(([appType, aData]) => (
                      <React.Fragment key={appType}>
                        <tr className="sub-row hover-sub-row">
                          <td className="text-left" style={{ paddingLeft: "30px" }}>{appType}</td>
                          <td>${aData.totalReceived.toFixed(2)}</td>
                          <td>${aData.totalSent.toFixed(2)}</td>
                        </tr>
                        {Object.entries(aData.apps).map(([appName, appData]) => (
                          <tr key={appName} className="sub-row hover-sub-row">
                            <td className="text-left" style={{ paddingLeft: "50px" }}>{appName}</td>
                            <td>${appData.received.toFixed(2)}</td>
                            <td>${appData.sent.toFixed(2)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                </React.Fragment>
              ))}
            <tr className="grand-total-row">
              <td className="text-left" style={{ paddingLeft: "15px" }}>Grand Total</td>
              <td>${grandTotalsPlayer.received.toFixed(2)}</td>
              <td>${grandTotalsPlayer.sent.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;
