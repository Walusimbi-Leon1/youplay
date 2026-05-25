import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <motion.div
          className="navbar-logo"
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05 }}
        >
          <span className="logo-text">YouPlay</span>
        </motion.div>

        {currentUser && (
          <div className="navbar-content">
            <div className="navbar-info">
              <div className="coins-display">
                <span className="coin-icon">💵</span>
                <span>{userProfile?.coins || 0}</span>
              </div>
              <div className="level-display">
                <span className="level-badge">Lvl {userProfile?.level || 1}</span>
                <span className="rank-badge">{userProfile?.rank || 'Rookie'}</span>
              </div>
              <div className="streak-display">
                <span className="streak-badge">🔥 {userProfile?.dailyStreak || 1}</span>
              </div>
            </div>

            <div className="navbar-actions">
              <motion.button
                className="nav-btn"
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.05 }}
              >
                🏠 Home
              </motion.button>
              <motion.button
                className="nav-btn"
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.05 }}
              >
                👤 Profile
              </motion.button>
              <motion.button
                className="nav-btn logout-btn"
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
              >
                Logout
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
