'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handle the auth callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">✅ Password Updated</h1>
            <p className="auth-subtitle">
              Your password has been successfully updated
            </p>
          </div>
          <div className="auth-success">
            <p>You will be redirected to the dashboard in a few seconds...</p>
            <Link href="/" className="auth-button">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">🔑 Set New Password</h1>
          <p className="auth-subtitle">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter new password (min 6 characters)"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? (
              <div className="auth-spinner">
                <div className="spinner-border"></div>
                Updating password...
              </div>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            <Link href="/auth/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
