import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, User, Mail, Lock, LogOut } from 'lucide-react';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, currentUser, onAuthSuccess, onLogout }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(!!currentUser);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (currentUser) {
      setLoginSuccess(true);
    } else {
      setLoginSuccess(false);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Success
      localStorage.setItem('tunewave_token', data.token);
      localStorage.setItem('tunewave_user', JSON.stringify(data.user));
      onAuthSuccess(data.user, data.token);
      setLoginSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tunewave_token');
    localStorage.removeItem('tunewave_user');
    setLoginSuccess(false);
    setName('');
    setEmail('');
    setPassword('');
    onLogout();
  };

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Terminal Bar */}
        <div className="auth-modal-header mono">
          <div className="header-badge">
            <span className="dot-indicator"></span>
            <span>TUNESYSTEM // AUTH PROTOCOL</span>
          </div>
          <button
            type="button"
            className="btn-modal-close mono"
            onClick={onClose}
            aria-label="Close modal"
          >
            [ ESC / CLOSE ✕ ]
          </button>
        </div>

        {/* Successful State: strictly show Login Successful */}
        {loginSuccess && (currentUser || localStorage.getItem('tunewave_user')) ? (
          <div className="auth-success-screen">
            <div className="success-banner mono">
              <span className="success-tag">[ STATUS: 200 OK • VERIFIED ]</span>
              <span className="success-pill">LIVE SESSION</span>
            </div>

            <div className="success-headline-box">
              <h2 className="success-title">LOGIN SUCCESSFUL</h2>
              <p className="success-sub mono">
                Session token granted. You are authenticated to stream and sync.
              </p>
            </div>

            <div className="auth-profile-terminal mono">
              <div className="profile-row">
                <span className="p-key">USER NAME:</span>
                <span className="p-val">{currentUser?.name || JSON.parse(localStorage.getItem('tunewave_user') || '{}')?.name || 'Daksh'}</span>
              </div>
              <div className="profile-row">
                <span className="p-key">EMAIL ADDR:</span>
                <span className="p-val">{currentUser?.email || JSON.parse(localStorage.getItem('tunewave_user') || '{}')?.email}</span>
              </div>
              <div className="profile-row">
                <span className="p-key">ACCESS LEVEL:</span>
                <span className="p-val highlight-lime">VERIFIED STREAMER</span>
              </div>
              <div className="profile-row">
                <span className="p-key">SESSION STATUS:</span>
                <span className="p-val highlight-green">● ACTIVE & CONNECTED</span>
              </div>
            </div>

            <div className="success-action-buttons">
              <button
                type="button"
                className="btn-brutalist-lime w-full"
                onClick={onClose}
              >
                <span>CONTINUE TO TUNESYSTEM</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn-auth-logout mono"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                <span>[ LOG OUT SESSION ]</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form State: Log In or Sign Up */
          <div className="auth-form-screen">
            {/* Mode Tabs */}
            <div className="auth-tabs-row mono">
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'login' ? 'tab-active' : ''}`}
                onClick={() => { setMode('login'); setError(''); }}
              >
                [ 01 // LOG IN ]
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'signup' ? 'tab-active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); }}
              >
                [ 02 // SIGN UP ]
              </button>
            </div>

            <div className="auth-mode-meta">
              <h3 className="auth-mode-heading">
                {mode === 'login' ? 'ACCESS YOUR CRATE' : 'INITIALIZE ACCOUNT'}
              </h3>
              <span className="auth-mode-sub mono">
                {mode === 'login'
                  ? 'Enter credentials to resume lossless stream & saved playlists.'
                  : 'Join the next-gen lossless audio streaming collective.'}
              </span>
            </div>

            {error && (
              <div className="auth-error-box mono">
                <span className="error-prefix">[ ERROR ]</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-inputs-form">
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label mono">// FULL NAME</label>
                  <div className="input-wrap">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Daksh Srivastava"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label mono">// EMAIL ADDRESS</label>
                <div className="input-wrap">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="listener@tunewave.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label mono">// PASSWORD</label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="•••••••• (min. 6 characters)"
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
                className="btn-auth-submit mono"
              >
                <span>
                  {loading
                    ? '[ CONNECTING TO TUNESERVER... ]'
                    : mode === 'login'
                    ? 'AUTHENTICATE & LOG IN →'
                    : 'CONFIRM REGISTRATION →'}
                </span>
              </button>
            </form>

            <div className="auth-footer-toggle mono">
              {mode === 'login' ? (
                <span>
                  Need an account?{' '}
                  <button
                    type="button"
                    className="toggle-link"
                    onClick={() => { setMode('signup'); setError(''); }}
                  >
                    [ CREATE ONE ↗ ]
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    className="toggle-link"
                    onClick={() => { setMode('login'); setError(''); }}
                  >
                    [ LOG IN HERE ↗ ]
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
