import React, { useState, useRef } from 'react';
import { Play, Pause, Disc, Volume2, VolumeX, Sparkles, ArrowDownRight } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function BrutalistHero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <section id="hero" className="brutalist-hero">
      {/* Hidden Audio Player for real audio */}
      <audio
        ref={audioRef}
        src={`${API_BASE}/uploads/audio/blinding-lights.mp3`}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />

      <div className="hero-typography-block">
        <h1 className="hero-title-massive">
          PURE SOUND.<br />
          <span className="title-italic-accent serif-italic">Next Wave.</span>
        </h1>
        <p className="hero-punchy-sub">
          Lossless audio streaming. Explore curated artist catalogues, live synchronized listening, and physical warmth.
        </p>
      </div>

      {/* Centerpiece: Real LP Sleeve with Sliding Vinyl Record */}
      <div className="physical-vinyl-stage">
        {/* The Cardboard LP Jacket */}
        <div className="lp-sleeve-jacket">
          <div className="sleeve-artwork">
            <img
              src={`${API_BASE}/uploads/album-art/blinding-lights.jpg`}
              alt="The Weeknd After Hours Sleeve"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80';
              }}
            />
          </div>
        </div>

        {/* The Vinyl Disc (Peeking / Sliding out) */}
        <div className={`sliding-vinyl-disc ${isPlaying ? 'animate-spin-record' : 'animate-spin-paused'}`}>
          <div className="groove-line g-1"></div>
          <div className="groove-line g-2"></div>
          <div className="groove-line g-3"></div>
          <div className="groove-line g-4"></div>
          <div className="vinyl-sheen-layer"></div>

          <div className="vinyl-center-sticker">
            <img
              src={`${API_BASE}/uploads/album-art/blinding-lights.jpg`}
              alt="Center Sticker"
            />
            <div className="center-hole"></div>
          </div>
        </div>

        {/* Interactive Play Bar Card Attached to Stage */}
        <div className="tactile-player-pill">
          <button
            type="button"
            className="btn-vinyl-trigger"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause Track' : 'Play Track'}
          >
            {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" />}
          </button>

          <div className="pill-track-info">
            <span className="track-title-bold">Blinding Lights</span>
            <span className="track-artist-dim">The Weeknd • After Hours</span>
          </div>

          <div className="pill-equalizer">
            <span className={`pill-bar ${isPlaying ? 'eq-bar-jump' : ''}`} style={{ animationDelay: '0.1s' }}></span>
            <span className={`pill-bar ${isPlaying ? 'eq-bar-jump' : ''}`} style={{ animationDelay: '0.35s' }}></span>
            <span className={`pill-bar ${isPlaying ? 'eq-bar-jump' : ''}`} style={{ animationDelay: '0.2s' }}></span>
            <span className={`pill-bar ${isPlaying ? 'eq-bar-jump' : ''}`} style={{ animationDelay: '0.45s' }}></span>
          </div>
        </div>
      </div>
    </section>
  );
}
