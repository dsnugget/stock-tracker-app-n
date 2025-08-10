
import React from 'react';

const Footer = () => {
  return (
    <footer className="modern-footer">
      <div className="container-fluid">
        <div className="footer-content">
          <p className="footer-text">
            &copy; {new Date().getFullYear()} Stock Tracker Pro. Built with 💜 for investors.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
