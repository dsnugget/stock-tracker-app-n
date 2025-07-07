
'use client';

import React from 'react';
import "./globals.css";
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

// Metadata is typically static, so it's defined outside the component
// This is now in src/app/metadata.ts

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Header />
          <div className="main-content-wrapper">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
