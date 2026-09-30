import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { SOUNDSCAPES } from '../data/themes';

export default function MoodMatrix({ activeTheme, onSelectTheme }) {
  const [selected, setSelected] = useState(() => {
    if (activeTheme) return activeTheme;
    try {
      const saved = localStorage.getItem('tunewave_theme');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SOUNDSCAPES[0];
  });

  useEffect(() => {
    if (activeTheme && activeTheme.id !== selected.id) {
      setSelected(activeTheme);
    }
  }, [activeTheme]);

  const handleSelect = (item) => {
    setSelected(item);
    try {
      localStorage.setItem('tunewave_theme', JSON.stringify(item));
    } catch {}
    if (onSelectTheme) {
      onSelectTheme(item);
    }
  };

  return (
    <section id="atmospheres" className="mood-matrix-section">
      <div className="section-header-clean">
        <span className="section-eyebrow">CURATED SOUNDSCAPES</span>
        <h2 className="section-title-clean">Explore Music by Mood</h2>
      </div>

      <div className="matrix-terminal-container">
        {/* Left: Soundscape Selection Cards */}
        <div className="matrix-slots-column">
          {SOUNDSCAPES.map((item) => {
            const isCur = selected.id === item.id;
            return (
              <div
                key={item.id}
                className={`matrix-slot-card ${isCur ? 'slot-active' : ''}`}
                onClick={() => handleSelect(item)}
                style={{ '--slot-accent': item.color }}
              >
                <div className="slot-title-group">
                  <span className="slot-name">{item.title}</span>
                  <span className="slot-genre">{item.genre}</span>
                </div>
                <div className="slot-right">
                  <span className="slot-bpm">{item.bpm}</span>
                  <span className={`slot-indicator ${isCur ? 'active-dot' : ''}`}></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Soundscape Showcase Card */}
        <div className="matrix-telemetry-deck" style={{ '--telemetry-color': selected.color }}>
          <div className="telemetry-top">
            <span className="terminal-live-tag">
              <span className="live-indicator-dot" style={{ background: selected.color }}></span>
              Now Previewing
            </span>
            <span className="stereo-tag">Lossless Stereo</span>
          </div>

          <div className="telemetry-display-hero">
            <h2 className="telemetry-title" style={{ color: selected.color }}>
              {selected.title}
            </h2>
            <span className="telemetry-sub">{selected.genre} • {selected.bpm}</span>
            <p className="soundscape-description">
              {selected.description}
            </p>
          </div>

          {/* Clean Visualizer Waveform */}
          <div className="telemetry-waveform-bars">
            {[35, 60, 85, 45, 95, 75, 55, 90, 40, 70, 85, 50, 100, 65, 40, 80, 55, 90, 70, 30].map((h, i) => (
              <span
                key={i}
                className="telemetry-bar"
                style={{
                  height: `${h}%`,
                  backgroundColor: selected.color,
                  animationDelay: `${i * 0.05}s`
                }}
              ></span>
            ))}
          </div>

          {/* Clean Characteristic Tags */}
          <div className="soundscape-tags-strip">
            <span className="soundscape-pill">High Fidelity</span>
            <span className="soundscape-pill">Dynamic Mix</span>
            <span className="soundscape-pill">Spatial Sound</span>
          </div>

          <a href="#hero" className="btn-soundscape-listen" style={{ background: selected.color }}>
            <Play size={16} fill="#000" />
            <span>Listen to Soundscape</span>
          </a>
        </div>
      </div>
    </section>
  );
}
