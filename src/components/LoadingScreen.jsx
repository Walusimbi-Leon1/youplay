import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-inner card">
        <div className="loading-logo">YouPlay</div>
        <div className="spinner" />
        <p>Loading your WordBet experience...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
