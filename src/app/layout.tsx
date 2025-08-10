
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import "./globals.css";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthProvider } from '../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

// Metadata is typically static, so it's defined outside the component
// This is now in src/app/metadata.ts

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth/');
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Header />
            {isAuthRoute ? (
              <main>{children}</main>
            ) : (
              <div className="main-content-wrapper">
                {children}
              </div>
            )}
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
