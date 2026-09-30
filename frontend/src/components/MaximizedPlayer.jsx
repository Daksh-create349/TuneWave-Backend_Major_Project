import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Shuffle,
  Repeat,
  Sliders,
  Activity,
  Disc3
} from 'lucide-react';
import { SOUNDSCAPES } from '../data/themes';

export default function MaximizedPlayer({
  currentSong,
  isPlaying,
  togglePlay,
  playNext,
  playPrev,
  currentTime,
  duration,
  handleSeek,
  volume,
  handleVolumeChange,
  isMuted,
  toggleMute,
  likedSongIds,
  handleToggleLike,
  onClose,
  activeTheme,
  onSelectTheme,
  analyserNode,
  API_BASE,
  activeQueueName
}) {
  const graphCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const theme = activeTheme || SOUNDSCAPES[0];
  const isLiked = currentSong ? likedSongIds.has(currentSong._id) : false;

  const artSrc = currentSong?.albumArtUrl
    ? (currentSong.albumArtUrl.startsWith('http') ? currentSong.albumArtUrl : `${API_BASE}${currentSong.albumArtUrl}`)
    : `${API_BASE}/uploads/album-art/blinding-lights.jpg`;

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 320);
  };

  // Lock body scroll while maximized
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Sync canvas pixel dims with CSS dims
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (canvas.offsetWidth && canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    });
    ro.observe(canvas);
    resizeObserverRef.current = ro;
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isClosing]);

  // Real-time Web Audio graph — full canvas height
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;

      const graphCanvas = graphCanvasRef.current;
      let freqData = null;
      let timeData = null;

      if (analyserNode && isPlaying) {
        const binCount = analyserNode.frequencyBinCount;
        freqData = new Uint8Array(binCount);
        timeData = new Uint8Array(binCount);
        analyserNode.getByteFrequencyData(freqData);
        analyserNode.getByteTimeDomainData(timeData);
      }

      if (graphCanvas) {
        const ctx = graphCanvas.getContext('2d');
        // Use actual canvas element dimensions
        const w = graphCanvas.offsetWidth || graphCanvas.width;
        const h = graphCanvas.offsetHeight || graphCanvas.height;
        // Set canvas internal resolution to match display size
        if (graphCanvas.width !== w || graphCanvas.height !== h) {
          graphCanvas.width = w;
          graphCanvas.height = h;
        }
        ctx.clearRect(0, 0, w, h);

        if (freqData && timeData && isPlaying) {
          const barCount = 64;
          const barWidth = (w / barCount) - 1.5;

          // Frequency bars
          for (let i = 0; i < barCount; i++) {
            const dataIdx = Math.floor((i / barCount) * (freqData.length * 0.85));
            const normVal = (freqData[dataIdx] || 0) / 255;
            const bHeight = Math.max(4, normVal * (h * 0.85));

            const x = i * (barWidth + 1.5);
            const y = h - bHeight;

            const grad = ctx.createLinearGradient(0, y, 0, h);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, theme.color);
            grad.addColorStop(0.7, `${theme.color}88`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, bHeight, 2);
            ctx.fill();
          }

          // Waveform overlay
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = theme.color;

          const sliceWidth = w / timeData.length;
          let lx = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const ly = (v * (h * 0.28)) + (h * 0.22);
            if (i === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
            lx += sliceWidth;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // Flat resting baseline
          ctx.beginPath();
          ctx.moveTo(0, h - 3);
          ctx.lineTo(w, h - 3);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isPlaying, theme]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`maximized-player-stage stage-opening ${isClosing ? 'stage-closing' : ''}`}
      style={{
        '--theme-accent': theme.color,
        '--theme-glow': theme.glowColor
      }}
    >
      {/* Top Nav */}
      <header className="maximized-top-nav">
        <button type="button" className="btn-collapse-player" onClick={handleClose} title="Minimize (Esc)">
          <ChevronDown size={20} />
          <span>MINIMIZE</span>
        </button>


        <div className="maximized-theme-selector-wrap">
          <button
            type="button"
            className="btn-theme-active-pill"
            onClick={() => setShowThemePicker(!showThemePicker)}
            style={{ borderColor: `${theme.color}66` }}
          >
            <span className="theme-color-indicator" style={{ backgroundColor: theme.color }} />
            <span className="theme-name-text">{theme.title}</span>
            <Sliders size={13} className="theme-icon-slider" />
          </button>

          {showThemePicker && (
            <div className="maximized-theme-dropdown">
              <span className="dropdown-label">CHOOSE ATMOSPHERE</span>
              {SOUNDSCAPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-option-btn ${theme.id === t.id ? 'option-selected' : ''}`}
                  onClick={() => { onSelectTheme?.(t); setShowThemePicker(false); }}
                >
                  <span className="dot-theme-color" style={{ backgroundColor: t.color }} />
                  <div className="theme-option-info">
                    <span className="to-title">{t.title}</span>
                    <span className="to-genre">{t.genre}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Split: Left controls + Right art + graph */}
      <main className="mxp-split-main">

        {/* LEFT: Track info + controls */}
        <section className="mxp-left">
          <div className="track-hero-eyebrow">
            <span className="badge-lossless-tag">
              {activeQueueName ? `PLAYLIST • ${activeQueueName.toUpperCase()}` : 'NOW PLAYING'}
            </span>
            <span className="genre-pill-subtle">{currentSong?.genre || 'TuneWave Hi-Fi'}</span>
          </div>

          <div className="track-hero-title-group">
            <h1 className="editorial-song-title">{currentSong?.title || 'No Song'}</h1>
            <h2 className="editorial-artist-name">
              <span>{currentSong?.artist?.name || 'Artist'}</span>
              {currentSong?.album && (
                <>
                  <span className="editorial-meta-dot">•</span>
                  <span className="editorial-album-name">{currentSong.album}</span>
                </>
              )}
            </h2>
          </div>

          {/* Scrubber */}
          <div className="editorial-scrub-block">
            <div className="scrub-time-row">
              <span className="scrub-time-live">{formatTime(currentTime)}</span>
              <span className="scrub-time-total">{formatTime(duration)}</span>
            </div>
            <div className="editorial-slider-wrap">
              <div
                className="editorial-slider-fill"
                style={{ width: `${progressPercent}%`, backgroundColor: theme.color }}
              />
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="editorial-range-slider"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="editorial-controls-block">
            <div className="ctrl-buttons-cluster">
              <button
                type="button"
                className={`btn-ctrl-subtle ${isShuffle ? 'is-active' : ''}`}
                onClick={() => setIsShuffle(!isShuffle)}
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>

              <button type="button" className="btn-ctrl-skip" onClick={playPrev} title="Previous">
                <SkipBack size={22} />
              </button>

              <button
                type="button"
                className="btn-play-hero-split"
                onClick={togglePlay}
                style={{ backgroundColor: theme.color }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying
                  ? <Pause size={28} fill="#000" color="#000" />
                  : <Play size={28} fill="#000" color="#000" style={{ marginLeft: 3 }} />
                }
              </button>

              <button type="button" className="btn-ctrl-skip" onClick={playNext} title="Next">
                <SkipForward size={22} />
              </button>

              <button
                type="button"
                className={`btn-ctrl-subtle ${isRepeat ? 'is-active' : ''}`}
                onClick={() => setIsRepeat(!isRepeat)}
                title="Repeat"
              >
                <Repeat size={18} />
              </button>
            </div>

            <div className="ctrl-side-tools">
              <button
                type="button"
                className={`btn-editorial-heart ${isLiked ? 'liked' : ''}`}
                onClick={() => currentSong && handleToggleLike(currentSong._id)}
                title="Like"
              >
                <Heart size={20} fill={isLiked ? '#ff3b30' : 'none'} color={isLiked ? '#ff3b30' : '#888'} />
              </button>

              <div className="editorial-volume-wrap">
                <button type="button" className="btn-ctrl-subtle" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="editorial-vol-slider"
                  style={{ accentColor: theme.color }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry chips */}
          <div className="editorial-telemetry-box">
            <div className="telemetry-chip">
              <Activity size={14} style={{ color: theme.color }} />
              <span>FLAC Lossless 24-Bit / 96kHz</span>
            </div>
            <div className="telemetry-chip">
              <Disc3 size={14} style={{ color: theme.color }} />
              <span>Vinyl 33⅓ RPM</span>
            </div>
          </div>
        </section>

        {/* RIGHT: Album art top + live graph filling rest */}
        <section className="mxp-right">
          {/* Album Art — large square */}
          <div className="mxp-album-art-wrap">
            <img
              src={artSrc}
              alt={currentSong?.title || 'Album'}
              className="mxp-album-art-img"
            />
            <div
              className="mxp-art-glow"
              style={{ background: `radial-gradient(circle at center, ${theme.color}33 0%, transparent 70%)` }}
            />
          </div>

          {/* Real-time spectrum — RIGHT column bottom gone, moved to full-width footer */}
        </section>
      </main>

      {/* FULL-WIDTH BOTTOM GRAPH PANEL */}
      <div className="mxp-fullwidth-graph">
        <canvas
          ref={graphCanvasRef}
          className="mxp-graph-canvas"
        />
      </div>
    </div>
  );
}
