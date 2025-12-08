import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const renderApp = () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Load external config (runtime)
fetch("/config.js")
  .then(() => {
    console.log("✅ Loaded external config.js");
    renderApp();
  })
  .catch((err) => {
    console.warn("⚠️ Could not load config.js, using defaults.", err);
    window._env_ = {}; // fallback so app doesn’t crash
    renderApp();
  });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
