
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-light text-center text-muted py-3 mt-auto" style={{ borderTop: '5px solid #e0e0e0' }}>
      <div className="container-fluid">
        <p className="mb-0">&copy; {new Date().getFullYear()} Stock Tracker Pro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
