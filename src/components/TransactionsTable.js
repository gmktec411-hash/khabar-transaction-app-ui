import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Search, Calendar, Filter, TrendingUp, DollarSign, X } from "lucide-react";
import "./TransactionsTable.css";

// Memoized Table Row Component for better performance
const TableRow = memo(({ tx, index, highlightText, getStatusClass, getStatusText }) => {
  const dateObj = new Date(tx.sentAt);
  const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  const timeString = dateObj.toTimeString().split(" ")[0];
  // Subject will be shown inline as a compact one-line element next to player name

  return (
    <tr className="table-row-animated">
      <td className="text-center">{index + 1}</td>
      <td className="text-center date-cell">
        <div className="date-time">
          <span className="date">{formattedDate}</span>
          <span className="time">{timeString}</span>
        </div>
      </td>
      <td className="text-left player-cell">
        <span className="player-name">
          {tx.sender}
          {tx.subject && (
            <span className="subject-tooltip">{tx.subject}</span>
          )}
        </span>
      </td>
      <td className="text-left player-name">{tx.receiver}</td>
      <td className="text-left app-name-cell">{highlightText(tx.appName)}</td>
      <td className="text-center">
        <span className={`app-badge app-badge-${tx.appType.toLowerCase()}`}>
          {tx.appType}
        </span>
      </td>
      <td className="text-right amount-cell">
        <span className="amount-value">${tx.amount.toFixed(2)}</span>
      </td>
      <td className="text-center">
        <span className={`status-badge ${getStatusClass(tx.status)}`}>
          {getStatusText(tx.status)}
        </span>
      </td>
    </tr>
  );
});

TableRow.displayName = 'TableRow';

const TransactionsTable = ({ transactions = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [visibleCount, setVisibleCount] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appTypeFilter, setAppTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const requestSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const highlightText = useCallback((text) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="highlight">{part}</mark> : part
    );
  }, [searchTerm]);

  const getStatusClass = useCallback((status) => {
    const statusMap = {
      "S": "status-success",
      "F": "status-failed",
      "C": "status-confirm",
      "I": "status-sent",
      "A": "status-accept",
      "R": "status-request",
      "E": "status-checkemail"
    };
    return statusMap[status] || "";
  }, []);

  const getStatusText = useCallback((status) => {
    const statusTextMap = {
      "S": "Success",
      "F": "Failed",
      "C": "Confirm",
      "I": "Sent",
      "A": "Accept",
      "R": "Request",
      "E": "Check Email"
    };
    return statusTextMap[status] || status;
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSearchBy("all");
    setStatusFilter("all");
    setAppTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  }, []);

  // Filter transactions with optimized logic
  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    // Filter for current month only
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let filtered = safeTransactions.filter(tx => {
      const txDate = new Date(tx.sentAt);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    });

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((tx) => {
        if (searchBy === "sender") return tx.sender?.toLowerCase().includes(term);
        if (searchBy === "receiver") return tx.receiver?.toLowerCase().includes(term);
        if (searchBy === "appName") return tx.appName?.toLowerCase().includes(term);
        return (
          tx.sender?.toLowerCase().includes(term) ||
          tx.receiver?.toLowerCase().includes(term) ||
          tx.appName?.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    if (appTypeFilter !== "all") {
      filtered = filtered.filter((tx) => tx.appType === appTypeFilter);
    }

    if (dateFrom) {
      const [year, month, day] = dateFrom.split("-").map(Number);
      const from = new Date(year, month - 1, day, 0, 0, 0, 0);
      filtered = filtered.filter(tx => new Date(tx.sentAt) >= from);
    }

    if (dateTo) {
      const [year, month, day] = dateTo.split("-").map(Number);
      const to = new Date(year, month - 1, day, 23, 59, 59, 999);
      filtered = filtered.filter(tx => new Date(tx.sentAt) <= to);
    }

    return filtered;
  }, [transactions, searchTerm, searchBy, statusFilter, appTypeFilter, dateFrom, dateTo]);

  // Sort transactions with optimized comparisons
  const sortedTransactions = useMemo(() => {
    let sorted = [...filteredTransactions];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === "amount" || sortConfig.key === "id") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        if (sortConfig.key === "sentAt") {
          return sortConfig.direction === "asc"
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }

        const aStr = aValue?.toString().toLowerCase() || "";
        const bStr = bValue?.toString().toLowerCase() || "";

        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sorted.slice(0, visibleCount);
  }, [filteredTransactions, sortConfig, visibleCount]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "all") count++;
    if (appTypeFilter !== "all") count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [searchTerm, statusFilter, appTypeFilter, dateFrom, dateTo]);

  const appTypes = useMemo(() =>
    Array.from(new Set(transactions.map(tx => tx.appType))).sort(),
    [transactions]
  );

  return (
    <div className="page-container transactions-page">
      {/* Modern Header */}
      <div className="transactions-header">
        <div className="header-content">
          <h1 className="page-title">
            <DollarSign size={32} />
            Customer Transactions - {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h1>
        </div>
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
        </button>
      </div>

      <div className="table-card">
        {/* Modern Filters */}
        {showFilters && (
          <div className="modern-filters">
            <div className="filter-section">
              <label className="filter-label">
                <Search size={16} />
                Search
              </label>
              <div className="search-wrapper">
                <input
                  type="text"
                  className="modern-input search-input"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="clear-btn" onClick={() => setSearchTerm("")}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-label">Search By</label>
              <select
                className="modern-select"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="all">All Fields</option>
                <option value="sender">Player Name</option>
                <option value="receiver">Receiver</option>
                <option value="appName">App Name</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">
                <Calendar size={16} />
                Date Range
              </label>
              <div className="date-range">
                <input
                  type="date"
                  className="modern-input date-input"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="modern-input date-input"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-label">Status</label>
              <select
                className="modern-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="S">Success</option>
                <option value="F">Failed</option>
                <option value="C">Confirm</option>
                <option value="I">Sent</option>
                <option value="A">Accept</option>
                <option value="R">Request</option>
                <option value="E">Check Email</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">App Type</label>
              <select
                className="modern-select"
                value={appTypeFilter}
                onChange={(e) => setAppTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {appTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="filter-section">
                <button className="clear-all-btn" onClick={clearFilters}>
                  <X size={16} />
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modern Table */}
        <div className="table-wrapper">
          <table className="transactions-table modern-table">
            <thead>
              <tr>
                {[
                  { key: "id", label: "SN" },
                  { key: "sentAt", label: "Date & Time" },
                  { key: "sender", label: "Player Name" },
                  { key: "receiver", label: "Receiver" },
                  { key: "appName", label: "App Name" },
                  { key: "appType", label: "App Type" },
                  { key: "amount", label: "Amount" },
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    className={sortConfig.key === col.key ? `sorted sorted-${sortConfig.direction}` : ""}
                  >
                    <div className="th-content">
                      {col.label}
                      {sortConfig.key === col.key && (
                        <span className="sort-icon">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((tx, index) => (
                  <TableRow
                    key={tx.id}
                    tx={tx}
                    index={index}
                    highlightText={highlightText}
                    getStatusClass={getStatusClass}
                    getStatusText={getStatusText}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <div className="empty-content">
                      <TrendingUp size={48} />
                      <p>No transactions found</p>
                      <span>Try adjusting your filters</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {visibleCount < filteredTransactions.length && (
          <div className="load-more-section">
            <button
              className="load-more-btn"
              onClick={() => setVisibleCount(prev => prev + 50)}
            >
              <TrendingUp size={18} />
              Load More ({visibleCount} of {filteredTransactions.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TransactionsTable);
