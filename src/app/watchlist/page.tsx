'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import Dashboard from '../../components/Dashboard';

export default function WatchlistPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}


