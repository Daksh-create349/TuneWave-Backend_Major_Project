import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Mail, Lock, CheckCircle2, LogOut } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function AuthPage({ initialMode = 'login', onBack, currentUser, onAuthSuccess, onContinueToApp, onLogout }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(!!currentUser);
  const [activeUser, setActiveUser] = useState(currentUser || null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
      setLoginSuccess(true);
    }
  }, [currentUser]);

  // Support ESC key to smoothly exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBackWithAnimation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackWithAnimation = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onBack) onBack();
    }, 280);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'signup'
        ? `${API_BASE}/api/auth/register`
        : `${API_BASE}/api/auth/login`;

      const payload = mode === 'signup'
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save token & user
      if (data.token) {
        localStorage.setItem('tunewave_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('tunewave_user', JSON.stringify(data.user));
        setActiveUser(data.user);
        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      }

      setLoginSuccess(true);
      setError('');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tunewave_token');
    localStorage.removeItem('tunewave_user');
    setActiveUser(null);
    setLoginSuccess(false);
    if (onLogout) onLogout();
  };

  return (
    <div className={`auth-split-screen ${isExiting ? 'auth-screen-exit' : 'auth-screen-enter'}`}>
      {/* ====================================================
          LEFT SIDE: THE WEEKND CONCERT LIVE FOOTAGE (NO OVERLAYS)
          ==================================================== */}
      <div className="auth-stage-column">
        <video
          className="stage-footage-video"
          src="/videos/the-weeknd-live.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Subtle Edge Vignette */}
        <div className="stage-footage-scrim"></div>
      </div>

      {/* ====================================================
          RIGHT SIDE: CLEAN, PROFESSIONAL LOGIN / SIGN UP
          ==================================================== */}
      <div className="auth-form-column">
        {/* Top Bar */}
        <div className="auth-column-top">
          <button
            type="button"
            className="btn-back-landing"
            onClick={handleBackWithAnimation}
            title="Return to TuneWave"
          >
            <ArrowLeft size={16} />
            <span>Back to TuneWave</span>
          </button>

          <div className="brand-mini-lockup">
            <span className="brand-star">✳</span>
            <span className="brand-title">TUNEWAVE</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="auth-column-center">
          {loginSuccess && activeUser ? (
            /* CLEAN LOGIN SUCCESSFUL STATE */
            <div className="auth-success-card">
              <div className="badge-ok">
                <CheckCircle2 size={16} />
                <span>Verified Account</span>
              </div>

              <h1 className="success-screen-title">Welcome Back</h1>

              <div className="success-terminal-card">
                <div className="st-row">
                  <span className="st-key">Name:</span>
                  <span className="st-val">{activeUser.name}</span>
                </div>
                <div className="st-row">
                  <span className="st-key">Email:</span>
                  <span className="st-val">{activeUser.email}</span>
                </div>
                <div className="st-row">
                  <span className="st-key">Status:</span>
                  <span className="st-val highlight-lime">Active Session</span>
                </div>
              </div>

              <div className="success-actions-wrap">
                <button
                  type="button"
                  className="btn-brutalist-lime w-full btn-large"
                  onClick={onContinueToApp || onBack}
                >
                  <span>Continue Streaming</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  className="btn-auth-logout-alt"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* MINIMAL LOGIN / SIGN UP FORM */
            <div className="auth-form-container">
              {/* Tab Selector */}
              <div className="auth-nav-tabs">
                <button
                  type="button"
                  className={`auth-nav-tab ${mode === 'login' ? 'active-tab' : ''}`}
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className={`auth-nav-tab ${mode === 'signup' ? 'active-tab' : ''}`}
                  onClick={() => { setMode('signup'); setError(''); }}
                >
                  Sign Up
                </button>
              </div>

              {/* Title */}
              <h1 className="auth-page-title">
                {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
              </h1>
              <p className="auth-page-subtitle">
                {mode === 'login'
                  ? 'Access your saved crates, favorite artists, and lossless playback.'
                  : 'Start streaming high-fidelity audio with spatial dynamics.'}
              </p>

              {/* Error Message */}
              {error && (
                <div className="auth-page-error">
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-page-form">
                {mode === 'signup' && (
                  <div className="page-form-group">
                    <label className="page-label">Full Name</label>
                    <div className="page-input-wrap">
                      <User size={18} className="page-input-icon" />
                      <input
                        type="text"
                        className="page-input"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="page-form-group">
                  <label className="page-label">Email Address</label>
                  <div className="page-input-wrap">
                    <Mail size={18} className="page-input-icon" />
                    <input
                      type="email"
                      className="page-input"
                      placeholder="listener@tunewave.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="page-form-group">
                  <label className="page-label">Password</label>
                  <div className="page-input-wrap">
                    <Lock size={18} className="page-input-icon" />
                    <input
                      type="password"
                      className="page-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-page-submit"
                >
                  <span>
                    {loading
                      ? 'Connecting...'
                      : mode === 'login'
                      ? 'Log In'
                      : 'Create Account'}
                  </span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Switcher */}
              <div className="auth-page-switcher">
                {mode === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="page-switch-link"
                      onClick={() => { setMode('signup'); setError(''); }}
                    >
                      Sign Up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="page-switch-link"
                      onClick={() => { setMode('login'); setError(''); }}
                    >
                      Log In
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clean Minimal Footer */}
        <div className="auth-column-bottom">
          <span>TuneWave Audio Streaming</span>
        </div>
      </div>
    </div>
  );
}
