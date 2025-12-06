import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Loading data..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <div className="logo-circle">
            <div className="logo-inner">
              <div className="logo-text">
                <span className="logo-fin">Fin</span>
                <span className="logo-xi">Ξ</span>
                <span className="logo-sthetique">sthétique</span>
              </div>
            </div>
          </div>
          <div className="loading-bars">
            <div className="bar bar-1"></div>
            <div className="bar bar-2"></div>
            <div className="bar bar-3"></div>
            <div className="bar bar-4"></div>
          </div>
        </div>
        <h2 className="loading-title">FinΞsthétique</h2>
        <p className="loading-message">{message}</p>
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
