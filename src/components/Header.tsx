
import React from 'react';

const Header = () => {
  return (
    <header className="bg-primary text-white py-3 shadow-sm">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <h4 className="mb-0 ms-3 header-title">Stock Tracker Pro</h4>
        {/* You can add navigation or user info here if needed */}
      </div>
    </header>
  );
};

export default Header;
