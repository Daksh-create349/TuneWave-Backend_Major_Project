import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function BrutalistFooter({ onOpenAuth }) {
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="brutalist-footer">
      <div className="footer-content-block">
        <div className="footer-meta-row">
          <div className="meta-left">
            <span className="footer-brand-heading">TUNEWAVE SOUND SYSTEM</span>
            <span className="dim-sub">High-fidelity lossless streaming. Pure sound, zero noise.</span>
          </div>
          <div className="meta-right">
            <a href="#hero" onClick={scrollToTop} className="footer-back-to-top">
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </a>
          </div>
        </div>

        {/* Massive Screen-Filling Typography */}
        <div className="footer-huge-wordmark">
          <span>TUNEWAVE</span>
        </div>

        <div className="footer-bottom-line">
          <span>© {new Date().getFullYear()} TuneWave Inc. All rights reserved.</span>
          <div className="footer-tags-links">
            <a href="#vault">Tracks</a>
            <a href="#roster">Artists</a>
            <a href="#atmospheres">Soundscapes</a>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => onOpenAuth && onOpenAuth('login')}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
