import React, { useState } from 'react';
import { ArrowUpRight, Flame, Disc3, Radio, Plus, Check } from 'lucide-react';

export default function PosterGrid() {
  const [activeTab, setActiveTab] = useState('for-you');

  const artists = [
    { name: 'Billie Eilish', genre: 'Dark Pop', img: '/uploads/artist-images/billie-eilish.jpg' },
    { name: 'The Weeknd', genre: 'Synthwave', img: '/uploads/artist-images/the-weeknd.jpg' },
    { name: 'Diljit Dosanjh', genre: 'Punjabi', img: '/uploads/artist-images/diljit-dosanjh.jpg' },
    { name: 'Arijit Singh', genre: 'Soulful', img: '/uploads/artist-images/arijit-singh.jpg' },
    { name: 'Anuv Jain', genre: 'Lo-Fi', img: '/uploads/artist-images/anuv-jain.jpg' }
  ];

  const crateTracks = [
    { title: 'Tum Hi Ho', artist: 'Arijit Singh', album: 'Aashiqui 2', time: '04:22', art: '/uploads/album-art/tum-hi-ho.jpg' },
    { title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', time: '03:20', art: '/uploads/album-art/anti-hero.jpg' },
    { title: 'Husn', artist: 'Anuv Jain', album: 'Independent', time: '03:38', art: '/uploads/album-art/husn.jpg' },
    { title: 'Yellow', artist: 'Coldplay', album: 'Parachutes', time: '04:26', art: '/uploads/album-art/yellow.jpg' }
  ];

  return (
    <section id="roster" className="poster-grid-section">
      <div className="section-header-clean">
        <span className="section-eyebrow">CURATED DISCOVERY</span>
        <h2 className="section-title-clean">Featured Artists & Top Tracks</h2>
      </div>

      <div className="brutalist-bento-grid">
        {/* Card 1: Sunshine Yellow Brutalist Poster */}
        <div className="bento-box bento-yellow">
          <div className="box-top-bar">
            <span className="box-tag">Artists</span>
          </div>

          <div className="yellow-poster-content">
            <div className="poster-titles">
              <h3 className="poster-title-active">Trending</h3>
            </div>

            {/* Artist Polaroid Strip */}
            <div className="artist-polaroid-strip">
              {artists.map((artist, i) => (
                <div key={i} className="artist-polaroid-card">
                  <div className="polaroid-img-wrapper">
                    <img
                      src={artist.img}
                      alt={artist.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80';
                      }}
                    />
                  </div>
                  <span className="polaroid-name">{artist.name}</span>
                  <span className="polaroid-genre">{artist.genre}</span>
                </div>
              ))}
            </div>

            {/* Clean Genre Chips */}
            <div className="genre-pills-row">
              <button
                type="button"
                className={`genre-btn ${activeTab === 'for-you' ? 'btn-selected' : ''}`}
                onClick={() => setActiveTab('for-you')}
              >
                For You
              </button>
              <button
                type="button"
                className={`genre-btn ${activeTab === 'lo-fi' ? 'btn-selected' : ''}`}
                onClick={() => setActiveTab('lo-fi')}
              >
                Lo-Fi
              </button>
              <button
                type="button"
                className={`genre-btn ${activeTab === 'synth' ? 'btn-selected' : ''}`}
                onClick={() => setActiveTab('synth')}
              >
                Synthwave
              </button>
              <button
                type="button"
                className={`genre-btn ${activeTab === 'indie' ? 'btn-selected' : ''}`}
                onClick={() => setActiveTab('indie')}
              >
                Indie
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Fresh Release Card */}
        <div className="bento-box bento-lime">
          <div className="box-top-bar">
            <span className="box-tag">Trending Release</span>
          </div>

          <div className="brat-showcase">
            <div className="brat-type-hero">
              <span className="brat-title-lower">brat</span>
              <span className="brat-badge-sub">Charli XCX — 360</span>
            </div>

            <p className="brat-clean-desc">
              The defining hyperpop club record. Now streaming in high-fidelity stereo.
            </p>

            <a href="#hero" className="btn-brat-play">
              <span>Listen Now</span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

        {/* Card 3: Pitch Obsidian Tracklist */}
        <div id="vault" className="bento-box bento-dark">
          <div className="box-top-bar">
            <span className="box-tag">Top Tracks</span>
          </div>

          <div className="crate-tracks-list">
            {crateTracks.map((track, idx) => (
              <div key={idx} className="crate-track-item">
                <span className="track-number-clean">0{idx + 1}</span>
                <img src={track.art} alt={track.title} className="crate-thumb" />
                <div className="crate-meta">
                  <span className="crate-track-name">{track.title}</span>
                  <span className="crate-artist-dim">{track.artist} • {track.album}</span>
                </div>
                <span className="crate-duration">{track.time}</span>
              </div>
            ))}
          </div>

          <div className="crate-bottom-bar">
            <span>4 Featured Tracks</span>
            <a href="#hero" className="clean-playall-btn">Play All</a>
          </div>
        </div>
      </div>
    </section>
  );
}
