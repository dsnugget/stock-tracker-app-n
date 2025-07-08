'use client';

import React, { useState, useEffect } from 'react';
import { getMarketStatus } from '../lib/finnhub';
import Clock from './Clock';

const Header = () => {
  const [marketStatus, setMarketStatus] = useState('Loading...');

  useEffect(() => {
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
  }, []);

  const statusClass = marketStatus === 'Open' ? 'text-success' : 'text-danger';

  return (
    <header className="bg-primary text-white py-3 shadow-sm">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <h4 className="mb-0 ms-3 header-title">Stock Tracker Pro</h4>
        <div className="d-flex flex-column align-items-end me-3">
          <div className="market-status-indicator bg-white px-2 py-1 rounded fw-bold">
            <span className="text-black">Market:</span> <span className={statusClass}>{marketStatus}</span>
          </div>
          <Clock />
        </div>
      </div>
    </header>
  );
};

export default Header;