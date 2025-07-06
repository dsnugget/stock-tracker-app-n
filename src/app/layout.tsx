
import type { Metadata } from "next";
import "./globals.css";
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

export const metadata: Metadata = {
  title: "Stock Ticker Tracker",
  description: "A minimalist stock tracking app.",
  icons: { 
    icon: '/favicon.svg',
  }
};

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
