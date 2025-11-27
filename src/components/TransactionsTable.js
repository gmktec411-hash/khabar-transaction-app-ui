import React, { useState, useMemo } from "react";
import "./TransactionsTable.css";

const TransactionsTable = ({ transactions = [], onRefresh }) => {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [visibleCount, setVisibleCount] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appTypeFilter, setAppTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <span key={index} className="highlight">{part}</span> : part
    );
  };

  // 🔹 Filter transactions
  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    let filtered = [...safeTransactions];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((tx) => {
        if (searchBy === "sender") return tx.sender.toLowerCase().includes(term);
        if (searchBy === "receiver") return tx.receiver.toLowerCase().includes(term);
        if (searchBy === "appName") return tx.appName.toLowerCase().includes(term);
        return (
          tx.sender.toLowerCase().includes(term) ||
          tx.receiver.toLowerCase().includes(term) ||
          tx.appName.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== "all") filtered = filtered.filter((tx) => tx.status === statusFilter);
    if (appTypeFilter !== "all") filtered = filtered.filter((tx) => tx.appType === appTypeFilter);
    // if (dateFrom) filtered = filtered.filter((tx) => new Date(tx.sentAt) >= new Date(dateFrom));
    // if (dateTo) filtered = filtered.filter((tx) => new Date(tx.sentAt) <= new Date(dateTo));
    if (dateFrom) {
      const [year, month, day] = dateFrom.split("-").map(Number);
      const from = new Date(year, month - 1, day, 0, 0, 0, 0); // start of day
      filtered = filtered.filter(tx => new Date(tx.sentAt) >= from);
    }

    if (dateTo) {
      const [year, month, day] = dateTo.split("-").map(Number);
      const to = new Date(year, month - 1, day, 23, 59, 59, 999); // end of day
      filtered = filtered.filter(tx => new Date(tx.sentAt) <= to);
    }


    return filtered;
  }, [transactions, searchTerm, searchBy, statusFilter, appTypeFilter, dateFrom, dateTo]);

  // 🔹 Sort transactions
  const sortedTransactions = useMemo(() => {
    let sorted = [...filteredTransactions];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Numeric sort for amount or id
        if (sortConfig.key === "amount" || sortConfig.key === "id") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Date sort for sentAt
        if (sortConfig.key === "sentAt") {
          return sortConfig.direction === "asc"
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }

        // String sort for everything else
        aValue = aValue ? aValue.toString().toLowerCase() : "";
        bValue = bValue ? bValue.toString().toLowerCase() : "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sorted.slice(0, visibleCount);
  }, [filteredTransactions, sortConfig, visibleCount]);

  const getStatusClass = (status) => {
    switch (status) {
      case "S": return "status-success";
      case "F": return "status-failed";
      case "C": return "status-confirm";
      case "I": return "status-sent";
      case "A": return "status-accept";
      case "R": return "status-request";
      case "E": return "status-checkemail";
      default: return "";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "S": return "Success";
      case "F": return "Failed";
      case "C": return "Confirm";
      case "I": return "Sent";
      case "A": return "Accept";
      case "R": return "Request";
      case "E": return "Check_Email";
      default: return status;
    }
  };

  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    let values = [];
    if (searchBy === "sender" || searchBy === "all") values.push(...transactions.map((tx) => tx.sender));
    if (searchBy === "receiver" || searchBy === "all") values.push(...transactions.map((tx) => tx.receiver));
    if (searchBy === "appName" || searchBy === "all") values.push(...transactions.map((tx) => tx.appName));
    return [...new Set(values)].filter((v) => v.toLowerCase().includes(term));
  }, [transactions, searchTerm, searchBy]);

  const totalAmount = sortedTransactions.reduce((sum, tx) => sum + tx.amount, 0);


  return (
    <div className="page-container">
      <div className="page-title">Customer Transactions</div>
      <div className="table-card">
        <div className="filters">
          <div style={{ flex: "1 1 200px", position: "relative" }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((s) => (
                  <li key={s} onMouseDown={() => { setSearchTerm(s); setShowSuggestions(false); }}>{s}</li>
                ))}
              </ul>
            )}
          </div>


          <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)}>
            <option value="all">ALL</option>
            <option value="sender">PLAYER_NAME</option>
            <option value="receiver">RECEIVER</option>
            <option value="appName">APP_NAME</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />


          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="S">Success</option>
            <option value="F">Failed</option>
            <option value="C">Confirm</option>
            <option value="I">Sent</option>
            <option value="A">Accept</option>
            <option value="R">Request</option>
            <option value="E">Check_Email</option>
          </select>

          <select value={appTypeFilter} onChange={(e) => setAppTypeFilter(e.target.value)}>
            <option value="all">All App Types</option>
            {Array.from(new Set(transactions.map(tx => tx.appType))).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>


        </div>

        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                {[{ key: "id", label: "SN" },
                { key: "sentAt", label: "RECEIVED_DATE" },
                { key: "sender", label: "PLAYER_NAME" },
                { key: "receiver", label: "RECEIVER" },
                { key: "appName", label: "APP_NAME" },
                { key: "appType", label: "APP_TYPE" },
                { key: "amount", label: "AMOUNT" },
                { key: "status", label: "STATUS" },
                ].map((col) => {
                  let thClass = "";
                  if (sortConfig.key === col.key) {
                    thClass = sortConfig.direction === "asc" ? "sorted-asc" : "sorted-desc";
                  }
                  return (
                    <th key={col.key} onClick={() => requestSort(col.key)} className={thClass}>
                      {col.label}{sortConfig.key === col.key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx, index) => {
                const dateObj = new Date(tx.sentAt);
                const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                const timeString = dateObj.toTimeString().split(" ")[0];
                return (
                  <tr key={tx.id}>
                    <td>{index + 1}</td>
                    <td>{formattedDate} {timeString}</td>

                    {/* Player name with subject tooltip */}

                    <td className="text-left player-cell">
                      <span className="player-name">
                        {highlightText(tx.sender)}
                        {tx.subject && (
                          <span className="subject-tooltip">{tx.subject}</span>
                        )}
                      </span>
                    </td>


                    <td className="text-left">{highlightText(tx.receiver)}</td>
                    <td className="text-left">{highlightText(tx.appName)}</td>
                    <td>{tx.appType}</td>
                    <td className="amount">${tx.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(tx.status)}`}>
                        {getStatusText(tx.status)}
                      </span>
                    </td>
                  </tr>

                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="6" style={{ textAlign: "right", fontWeight: "bold" }}>Total Amount:</td>
                <td className="amount" style={{ fontWeight: "bold" }}>${totalAmount.toFixed(2)}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {visibleCount < transactions.length && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button className="show-more-btn" onClick={() => setVisibleCount(prev => prev + 100)}>Show More</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
