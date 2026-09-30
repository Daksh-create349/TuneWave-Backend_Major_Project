import React from 'react';
import { ArrowUpRight, Disc3 } from 'lucide-react';

export default function BrutalistNav({ currentUser, onOpenAuth, onOpenApp, onLogout }) {
  return (
    <header className="brutalist-nav">
      <div className="nav-col-left">
        <a href="#hero" className="brand-lockup">
          <span className="brand-star">✳</span>
          <span className="brand-title">TUNEWAVE</span>
        </a>
      </div>

      <nav className="nav-col-center">
        <a href="#vault" className="nav-link-clean">Tracks</a>
        <a href="#roster" className="nav-link-clean">Artists</a>
        <a href="#atmospheres" className="nav-link-clean">Moods</a>
      </nav>

      <div className="nav-col-right">
        {currentUser ? (
          <div className="user-nav-group">
            <button
              type="button"
              className="btn-brutalist-lime"
              onClick={onOpenApp}
              title="Open TuneWave Player App"
            >
              <span>Launch Player</span>
              <ArrowUpRight size={16} />
            </button>
            <button
              type="button"
              className="btn-user-badge"
              onClick={onOpenApp}
              title="View session"
            >
              <span className="user-dot">●</span>
              <span>{currentUser.name}</span>
            </button>
            <button
              type="button"
              className="btn-nav-logout"
              onClick={onLogout}
              title="Log out"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="nav-auth-buttons">
            <button
              type="button"
              className="btn-nav-text"
              onClick={() => onOpenAuth && onOpenAuth('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className="btn-brutalist-lime"
              onClick={() => onOpenAuth && onOpenAuth('signup')}
            >
              <span>Get Started</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
