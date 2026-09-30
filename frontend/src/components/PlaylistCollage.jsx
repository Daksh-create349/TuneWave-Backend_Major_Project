import React from 'react';
import { Disc3 } from 'lucide-react';
import { API_BASE } from '../config/api';

const resolveArtUrl = (url) => {
  if (!url) return `${API_BASE}/uploads/album-art/blinding-lights.jpg`;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};

export default function PlaylistCollage({
  playlist,
  size = 'md',
  className = '',
  allSongs = []
}) {
  if (!playlist) return null;

  // Extract song objects
  const rawSongs = playlist.songs || [];
  const songsList = rawSongs.map((s) => {
    if (typeof s === 'object' && s !== null) return s;
    return allSongs.find((x) => x._id === s) || null;
  }).filter(Boolean);

  const arts = songsList
    .map((s) => s.albumArtUrl)
    .filter(Boolean);

  let displayArts = [];
  let isGrid = false;

  if (arts.length === 0) {
    // Empty playlist
  } else if (arts.length === 1) {
    displayArts = [arts[0]];
  } else if (arts.length === 2) {
    // 2 songs -> fill 4 quadrants [0, 1, 0, 1]
    displayArts = [arts[0], arts[1], arts[0], arts[1]];
    isGrid = true;
  } else if (arts.length === 3) {
    // 3 songs -> fill 4 quadrants [0, 1, 2, 0]
    displayArts = [arts[0], arts[1], arts[2], arts[0]];
    isGrid = true;
  } else {
    // 4 or more songs -> first 4
    displayArts = arts.slice(0, 4);
    isGrid = true;
  }

  const sizeClass = size === 'lg' ? 'collage-lg' : size === 'sm' ? 'collage-sm' : 'collage-md';

  return (
    <div className={`playlist-collage-wrapper ${sizeClass} ${className}`}>
      {arts.length === 0 ? (
        <div className="playlist-collage-empty">
          <div className="vinyl-groove-ring ring-1" />
          <div className="vinyl-groove-ring ring-2" />
          <Disc3 size={size === 'lg' ? 64 : 38} className="playlist-empty-disc-icon" />
          <span className="playlist-empty-initial">
            {playlist.name ? playlist.name.charAt(0).toUpperCase() : 'P'}
          </span>
        </div>
      ) : isGrid ? (
        <div className="playlist-collage-grid">
          {displayArts.map((artUrl, idx) => (
            <div key={idx} className="playlist-collage-quadrant">
              <img
                src={resolveArtUrl(artUrl)}
                alt={`${playlist.name} art ${idx + 1}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = `${API_BASE}/uploads/album-art/blinding-lights.jpg`;
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="playlist-collage-single">
          <img
            src={resolveArtUrl(displayArts[0])}
            alt={playlist.name}
            onError={(e) => {
              e.currentTarget.src = `${API_BASE}/uploads/album-art/blinding-lights.jpg`;
            }}
          />
        </div>
      )}
      <div className="playlist-collage-gloss" />
    </div>
  );
}
