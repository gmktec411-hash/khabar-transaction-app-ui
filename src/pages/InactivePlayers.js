import React, { useState, useMemo } from "react";
import "./InactivePlayers.css";

const InactivePlayers = ({ transactions }) => {
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [daysThreshold, setDaysThreshold] = useState(7);

  // Get players with their last active date
  const playerLastActive = useMemo(() => {
    // Only exclude status "I"
    const filtered = transactions.filter(tx => tx.status !== "I" || tx.status !== "E");
    const map = {};

    filtered.forEach(tx => {
      if (!map[tx.sender] || new Date(tx.sentAt) > new Date(map[tx.sender])) {
        map[tx.sender] = tx.sentAt;
      }
    });

    const arr = Object.keys(map).map(name => ({
      name,
      lastActive: map[name],
      transactions: filtered.filter(tx => tx.sender === name),
    }));

    // Sort by last active ascending (most inactive first)
    arr.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

    return arr;
  }, [transactions]);

  const now = new Date();
  const inactivePlayers = playerLastActive.filter(p => {
    const diffDays = Math.floor((now - new Date(p.lastActive)) / (1000 * 60 * 60 * 24));
    return diffDays >= daysThreshold;
  });

  return (
    <div className="inactive-players-container">
      <h2>Inactive Players</h2>
      <div className="filter-days">
        <label>Show players inactive for at least: </label>
        <input
          type="number"
          min="1"
          value={daysThreshold}
          onChange={(e) => setDaysThreshold(Number(e.target.value))}
        />{" "}
        days
      </div>

      <ul className="player-list">
        {inactivePlayers.map((player) => {
          const diffDays = Math.floor((now - new Date(player.lastActive)) / (1000 * 60 * 60 * 24));
          return (
            <li key={player.name} className="player-item">
              <div
                className="player-summary"
                onClick={() => setExpandedPlayer(expandedPlayer === player.name ? null : player.name)}
              >
                <span className="player-name">{player.name}</span>
                <span className="player-last-active">
                  Last Active: {new Date(player.lastActive).toLocaleDateString()} ({diffDays} days ago)
                </span>
                <span className="toggle-icon">{expandedPlayer === player.name ? "▲" : "▼"}</span>
              </div>

              {expandedPlayer === player.name && (
                <div className="player-transactions">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Receiver</th>
                        <th>App Name</th>
                        <th>App Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{new Date(tx.sentAt).toLocaleString()}</td>
                          <td>{tx.receiver}</td>
                          <td>{tx.appName}</td>
                          <td>{tx.appType}</td>
                          <td>${tx.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          );
        })}
        {inactivePlayers.length === 0 && <li>No inactive players found for selected days.</li>}
      </ul>
    </div>
  );
};

export default InactivePlayers;
