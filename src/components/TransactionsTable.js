import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { Search, Calendar, Filter, TrendingUp, DollarSign, X, Receipt } from "lucide-react";
import debounce from "lodash.debounce";
import "./TransactionsTable.css";

// Ultra Modern Transaction Logo Component
const TransactionLogo = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="transGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Outer circle with gradient */}
    <circle cx="17" cy="17" r="15" fill="url(#transGradient)" opacity="0.08" />
    <circle cx="17" cy="17" r="15" stroke="url(#transGradient)" strokeWidth="1.5" fill="none" opacity="0.3" />

    {/* Inner modern design - layered cards with exchange arrows */}
    {/* Back card */}
    <rect x="11" y="10" width="12" height="8" rx="1.5" fill="url(#transGradient)" opacity="0.2" />
    {/* Front card */}
    <rect x="9" y="14" width="12" height="9" rx="1.5" fill="url(#transGradient)" opacity="0.15" />
    <rect x="9" y="14" width="12" height="9" rx="1.5" stroke="url(#transGradient)" strokeWidth="1.5" fill="none" filter="url(#glow)" />

    {/* Transaction details lines on card */}
    <line x1="11" y1="17" x2="19" y2="17" stroke="url(#transGradient)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    <line x1="11" y1="19.5" x2="16" y2="19.5" stroke="url(#transGradient)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

    {/* Modern circular exchange arrows */}
    <path d="M 22 15 L 25 17 L 22 19" stroke="url(#transGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M 25 20 L 22 22 L 25 24" stroke="url(#transGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

    {/* Decorative dots */}
    <circle cx="23.5" cy="17" r="1" fill="url(#transGradient)" opacity="0.6" />
    <circle cx="23.5" cy="22" r="1" fill="url(#transGradient)" opacity="0.6" />
  </svg>
);

// Memoized Table Row Component for better performance
const TableRow = memo(({ tx, index, highlightText, getStatusClass, getStatusText }) => {
  const dateObj = new Date(tx.sentAt);
  const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  const timeString = dateObj.toTimeString().split(" ")[0];

  // Determine amount color based on status - match status badge color exactly
  const getAmountClass = (status) => {
    const statusMap = {
      "S": "amount-success",
      "F": "amount-failed",
      "C": "amount-confirm",
      "I": "amount-sent",
      "A": "amount-accept",
      "R": "amount-request",
      "E": "amount-checkemail"
    };
    return statusMap[status] || "amount-success";
  };

  return (
    <tr className="table-row-animated">
      <td className="text-center sn-col">{index + 1}</td>
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
      <td className="text-left receiver-col">{tx.receiver}</td>
      <td className="text-left app-name-col">{highlightText(tx.appName)}</td>
      <td className="text-center app-type-col">
        <span className={`app-type-badge app-type-${tx.appType.toLowerCase()}`}>
          {tx.appType}
        </span>
      </td>
      <td className={`text-center amount-cell ${getAmountClass(tx.status)}`}>
        <span className="amount-value">${tx.amount.toFixed(2)}</span>
      </td>
      <td className="text-center status-col">
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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [searchBy, setSearchBy] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appTypeFilter, setAppTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // Debounced search update
  const debouncedSetSearch = useRef(
    debounce((value) => {
      setDebouncedSearchTerm(value);
    }, 300)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const requestSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const highlightText = useCallback((text) => {
    if (!debouncedSearchTerm || !text) return text;
    const regex = new RegExp(`(${debouncedSearchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="highlight">{part}</mark> : part
    );
  }, [debouncedSearchTerm]);

  // Build player suggestions based on transactions and current appTypeFilter
  useEffect(() => {
    if (!Array.isArray(transactions)) return;
    const names = new Set();
    transactions.forEach(tx => {
      if (!tx || !tx.sender) return;
      if (appTypeFilter !== 'all' && tx.appType !== appTypeFilter) return;
      names.add(tx.sender);
    });
    const list = Array.from(names).sort((a,b) => a.localeCompare(b));
    setSuggestions(list);
  }, [transactions, appTypeFilter]);

  // Handle keyboard navigation in suggestion list
  const handleSearchKeyDown = useCallback((e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        setSearchTerm(suggestions[activeSuggestion]);
      }
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }, [showSuggestions, suggestions, activeSuggestion]);

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
    setDebouncedSearchTerm("");
    debouncedSetSearch.cancel();
    setSearchBy("all");
    setStatusFilter("all");
    setAppTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  }, [debouncedSetSearch]);

  // Filter transactions with optimized logic
  const filteredTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    let filtered = [...safeTransactions];

    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
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
  }, [transactions, debouncedSearchTerm, searchBy, statusFilter, appTypeFilter, dateFrom, dateTo]);

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

    return sorted;
  }, [filteredTransactions, sortConfig]);

  // Paginated transactions - only show visibleCount items
  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice(0, visibleCount);
  }, [sortedTransactions, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 50);
  }, []);

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
            <TransactionLogo />
            Transactions Record
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    debouncedSetSearch(value);
                    setShowSuggestions(true);
                    setActiveSuggestion(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchTerm && (
                  <button className="clear-btn" onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                    debouncedSetSearch.cancel();
                  }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

              {/* Suggestions dropdown - only when searching by player or all and user has typed something */}
              {showSuggestions && searchTerm.trim() && (searchBy === 'all' || searchBy === 'sender') && suggestions.length > 0 && (() => {
                const filteredSuggestions = suggestions
                  .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 10);
                return filteredSuggestions.length > 0 && (
                  <div className="suggestions-wrapper">
                    <ul className="suggestions-list">
                      {filteredSuggestions.map((name, idx) => (
                        <li
                          key={name}
                          className={`suggestion-item ${idx === activeSuggestion ? 'active' : ''}`}
                          onMouseDown={(e) => { e.preventDefault(); setSearchTerm(name); setShowSuggestions(false); setActiveSuggestion(-1); }}
                          onMouseEnter={() => setActiveSuggestion(idx)}
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

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
                  { key: "appType", label: "Type" },
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
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx, index) => (
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

        {/* Load More Button */}
        {visibleCount < sortedTransactions.length && (
          <div className="load-more-section">
            <button className="load-more-btn" onClick={loadMore}>
              Load More ({Math.min(50, sortedTransactions.length - visibleCount)} more)
            </button>
          </div>
        )}

        {/* Total Count Footer */}
        {sortedTransactions.length > 0 && (
          <div className="total-info">
            Showing <strong>{paginatedTransactions.length}</strong> of <strong>{sortedTransactions.length}</strong> transactions
            {filteredTransactions.length < transactions.length && (
              <span className="filtered-note"> (filtered from {transactions.length} total)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TransactionsTable);
