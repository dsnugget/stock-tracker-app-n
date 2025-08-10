'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMarketStatus } from '../lib/finnhub';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [marketStatus, setMarketStatus] = useState('Loading...');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth/');
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    // Only fetch market status if user is logged in
    if (!user) return;

    const fetchStatus = async () => {
      try {
        const status: any = await getMarketStatus('US'); // Fetch US market status
        if (status && typeof status.isOpen === 'boolean') {
          setMarketStatus(status.isOpen ? 'Open' : 'Closed');
        } else {
          setMarketStatus('N/A');
        }
      } catch (error) {
        console.error('Error fetching market status:', error);
        setMarketStatus('Error');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user]); // Only run when user changes

  // Close user menu on click outside or Escape key
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showUserMenu]);

  const isOpen = marketStatus === 'Open';
  const statusClass = isOpen ? 'text-success' : 'text-danger';
  const dotClass = isOpen ? 'status-dot status-dot-open' : 'status-dot status-dot-closed';

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="modern-header">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <div className="header-brand">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h4 className="mb-0 header-title">📈 Stock Tracker Pro</h4>
            <div className="header-subtitle">Real-time market insights</div>
          </Link>
        </div>
        <div className="header-info" style={{gap: '1.25rem'}}>
          {/* menu hidden for now */}
          {/* Only show market status for logged-in users */}
          {user && (
            <div className="market-status-badge">
              <div className={dotClass}></div>
              <span className="status-label">Market:</span> 
              <span className={`status-value ${statusClass}`}>{marketStatus}</span>
            </div>
          )}
          
          {!loading && !isAuthRoute && (
            <div className="header-auth">
              {user ? (
                <div className="user-menu" ref={menuRef}>
                  <button 
                    className="user-button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="user-avatar">
                      {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="user-name">
                      {user.user_metadata?.name || user.email}
                    </span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-item">
                        <strong>{user.user_metadata?.name || 'User'}</strong>
                        <small>{user.email}</small>
                      </div>
                      <hr className="dropdown-divider" />
                      <button onClick={handleSignOut} className="user-dropdown-button">
                        <span style={{marginRight: '8px'}}>🚪</span> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link href="/auth/login" className="auth-login-btn">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="auth-signup-btn">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
