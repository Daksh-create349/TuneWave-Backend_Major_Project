import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Shuffle, 
  Trash2, 
  Plus, 
  Heart, 
  ArrowLeft, 
  Clock, 
  Music2, 
  Check,
  Disc3
} from 'lucide-react';
import PlaylistCollage from './PlaylistCollage';

const API_BASE = 'http://localhost:8000';

const formatSeconds = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const formatTotalDuration = (songs = []) => {
  const totalSec = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  if (m === 0) return `${s} sec`;
  return `${m} min ${s} sec`;
};

export default function PlaylistDetailView({
  playlist,
  onBack,
  allSongs = [],
  currentSong,
  isPlaying,
  likedSongIds,
  onToggleLike,
  onPlayPlaylistSong,
  onDeletePlaylist,
  onUpdatePlaylistSongs,
  activeQueueName
}) {
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!playlist) return null;

  // Resolve song objects
  const rawSongs = playlist.songs || [];
  const songsList = rawSongs.map((s) => {
    if (typeof s === 'object' && s !== null) return s;
    return allSongs.find((x) => x._id === s) || null;
  }).filter(Boolean);

  const playlistSongIds = new Set(songsList.map((s) => s._id));

  // Available songs to add
  const availableSongs = allSongs.filter((s) => !playlistSongIds.has(s._id));
  const filteredAvailable = availableSongs.filter((s) => 
    s.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.artist?.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.album?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const isCurrentPlaylistActive = activeQueueName === playlist.name;

  const handlePlayAll = () => {
    if (songsList.length > 0) {
      onPlayPlaylistSong(playlist, 0);
    }
  };

  const handleShuffle = () => {
    if (songsList.length > 0) {
      const randomIndex = Math.floor(Math.random() * songsList.length);
      onPlayPlaylistSong(playlist, randomIndex, true);
    }
  };

  const handleRemoveTrack = (songId) => {
    const updatedSongIds = songsList
      .filter((s) => s._id !== songId)
      .map((s) => s._id);
    onUpdatePlaylistSongs(playlist._id, updatedSongIds);
  };

  const handleAddTrack = (songId) => {
    const updatedSongIds = [...songsList.map((s) => s._id), songId];
    onUpdatePlaylistSongs(playlist._id, updatedSongIds);
  };

  return (
    <div className="playlist-detail-stage animate-fade-in">
      {/* Top back navigation */}
      <div className="playlist-detail-nav">
        <button type="button" className="btn-back-pill" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Crates</span>
        </button>

        {isCurrentPlaylistActive && (
          <div className="playlist-active-badge">
            <span className="pulse-dot-lime" />
            <span>Currently Playing Queue</span>
          </div>
        )}
      </div>

      {/* Hero Header Banner */}
      <div className="playlist-hero-banner">
        <div className="playlist-hero-cover-container">
          <PlaylistCollage playlist={playlist} size="lg" allSongs={allSongs} />
        </div>

        <div className="playlist-hero-meta">
          <span className="playlist-type-pill">PLAYLIST</span>
          <h1 className="playlist-hero-title">{playlist.name}</h1>
          
          <div className="playlist-hero-subline">
            <span className="playlist-author-badge">
              By {playlist.user?.name || 'You'}
            </span>
            <span className="meta-bullet">•</span>
            <span>{songsList.length} {songsList.length === 1 ? 'track' : 'tracks'}</span>
            <span className="meta-bullet">•</span>
            <span className="meta-duration">{formatTotalDuration(songsList)}</span>
          </div>

          <div className="playlist-hero-actions">
            {songsList.length > 0 && (
              <button
                type="button"
                className="btn-playlist-play-hero"
                onClick={handlePlayAll}
              >
                {isCurrentPlaylistActive && isPlaying ? (
                  <>
                    <Pause size={18} fill="#000" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={18} fill="#000" />
                    <span>Play All</span>
                  </>
                )}
              </button>
            )}

            {songsList.length > 1 && (
              <button
                type="button"
                className="btn-playlist-shuffle-hero"
                onClick={handleShuffle}
                title="Shuffle playlist"
              >
                <Shuffle size={18} />
                <span>Shuffle</span>
              </button>
            )}

            <button
              type="button"
              className={`btn-playlist-add-toggle ${showAddTracks ? 'is-active' : ''}`}
              onClick={() => setShowAddTracks(!showAddTracks)}
            >
              <Plus size={16} />
              <span>{showAddTracks ? 'Close Track Selector' : 'Add Tracks'}</span>
            </button>

            {onDeletePlaylist && (
              <button
                type="button"
                className="btn-playlist-delete-hero"
                onClick={() => onDeletePlaylist(playlist._id)}
                title="Delete Playlist"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optional: Add Tracks Inline Drawer */}
      {showAddTracks && (
        <div className="playlist-add-tracks-drawer animate-fade-in">
          <div className="drawer-header">
            <div className="drawer-title-group">
              <h3>Add Songs to "{playlist.name}"</h3>
              <span className="drawer-subtitle">{availableSongs.length} available to add</span>
            </div>
            <input
              type="text"
              placeholder="Search songs or artists to add..."
              className="drawer-search-input"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              autoFocus
            />
          </div>

          <div className="drawer-songs-list">
            {filteredAvailable.length > 0 ? (
              filteredAvailable.map((song) => (
                <div key={song._id} className="drawer-song-row">
                  <img
                    src={song.albumArtUrl?.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl || '/uploads/album-art/blinding-lights.jpg'}`}
                    alt={song.title}
                    className="drawer-song-art"
                  />
                  <div className="drawer-song-info">
                    <span className="drawer-song-title">{song.title}</span>
                    <span className="drawer-song-artist">{song.artist?.name || 'Artist'}</span>
                  </div>
                  <span className="drawer-song-album">{song.album}</span>
                  <span className="drawer-song-dur">{formatSeconds(song.duration)}</span>
                  <button
                    type="button"
                    className="btn-drawer-add"
                    onClick={() => handleAddTrack(song._id)}
                  >
                    <Plus size={15} />
                    <span>Add</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="drawer-empty-msg">
                <span>All available songs are already in this playlist, or none matched your search.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracklist Table */}
      <div className="playlist-tracklist-section">
        {songsList.length > 0 ? (
          <div className="playlist-table-container">
            <div className="playlist-table-head">
              <span className="col-idx">#</span>
              <span className="col-art"></span>
              <span className="col-title">TITLE</span>
              <span className="col-album">ALBUM</span>
              <span className="col-time">
                <Clock size={14} />
              </span>
              <span className="col-actions"></span>
            </div>

            <div className="playlist-table-body">
              {songsList.map((song, idx) => {
                const isThisPlaying = currentSong?._id === song._id && isPlaying;
                const isThisCurrent = currentSong?._id === song._id;
                const isLiked = likedSongIds.has(song._id);

                return (
                  <div
                    key={song._id}
                    className={`playlist-track-row ${isThisCurrent ? 'is-current-track' : ''}`}
                  >
                    <div className="col-idx">
                      {isThisPlaying ? (
                        <div className="equalizer-bars">
                          <span className="eq-bar bar-1"></span>
                          <span className="eq-bar bar-2"></span>
                          <span className="eq-bar bar-3"></span>
                        </div>
                      ) : (
                        <span className="row-num">{idx + 1}</span>
                      )}
                      <button
                        type="button"
                        className="btn-row-hover-play"
                        onClick={() => onPlayPlaylistSong(playlist, idx)}
                        title={`Play ${song.title}`}
                      >
                        <Play size={13} fill="#000" />
                      </button>
                    </div>

                    <div className="col-art">
                      <img
                        src={song.albumArtUrl?.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl || '/uploads/album-art/blinding-lights.jpg'}`}
                        alt={song.title}
                        className="track-art-thumb"
                      />
                    </div>

                    <div
                      className="col-title track-title-group"
                      onClick={() => onPlayPlaylistSong(playlist, idx)}
                    >
                      <span className={`track-title-text ${isThisCurrent ? 'text-lime-active' : ''}`}>
                        {song.title}
                      </span>
                      <span className="track-artist-text">
                        {song.artist?.name || 'Artist'}
                      </span>
                    </div>

                    <div className="col-album">
                      <span>{song.album || '—'}</span>
                    </div>

                    <div className="col-time">
                      <span>{formatSeconds(song.duration)}</span>
                    </div>

                    <div className="col-actions">
                      <button
                        type="button"
                        className={`btn-row-heart ${isLiked ? 'is-liked' : ''}`}
                        onClick={() => onToggleLike(song._id)}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart
                          size={15}
                          fill={isLiked ? '#ff3b30' : 'none'}
                          color={isLiked ? '#ff3b30' : '#888'}
                        />
                      </button>

                      <button
                        type="button"
                        className="btn-row-remove"
                        onClick={() => handleRemoveTrack(song._id)}
                        title="Remove from playlist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="playlist-empty-state">
            <div className="empty-vinyl-graphic">
              <Disc3 size={48} />
            </div>
            <h3>This playlist is currently empty</h3>
            <p>Click "Add Tracks" above to add your favorite songs to "{playlist.name}".</p>
            <button
              type="button"
              className="btn-create-playlist-pill mt-3"
              onClick={() => setShowAddTracks(true)}
            >
              <Plus size={15} />
              <span>Add Songs Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
