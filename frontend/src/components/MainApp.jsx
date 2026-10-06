import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Compass,
  Search,
  Library,
  Radio,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Plus,
  ArrowLeft,
  LogOut,
  Users,
  Music2,
  Disc3,
  Check,
  X,
  Sparkles,
  ListMusic,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import MaximizedPlayer from './MaximizedPlayer';
import PlaylistCollage from './PlaylistCollage';
import PlaylistDetailView from './PlaylistDetailView';
import { DEFAULT_THEME } from '../data/themes';
import { API_BASE } from '../config/api';

export default function MainApp({ currentUser, onBackToLanding, onLogout, activeTheme, onSelectTheme }) {
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('tab=search') || hash.includes('/search')) return 'search';
      if (hash.includes('tab=library') || hash.includes('/library')) return 'library';
      if (hash.includes('tab=sync') || hash.includes('/sync')) return 'sync';
    }
    return 'discover';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      history.pushState(null, '', `#app?tab=${tab}`);
    }
  };

  // Backend state
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [activeQueue, setActiveQueue] = useState(null);
  const [activeQueueName, setActiveQueueName] = useState(null);
  const [likedSongIds, setLikedSongIds] = useState(() => {
    const list = currentUser?.likedSongs || [];
    return new Set(list.map((id) => (typeof id === 'object' && id?._id ? id._id.toString() : id.toString())));
  });
  const [followedArtistIds, setFollowedArtistIds] = useState(() => {
    const list = currentUser?.followedArtists || [];
    return new Set(list.map((id) => (typeof id === 'object' && id?._id ? id._id.toString() : id.toString())));
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.likedSongs) {
      setLikedSongIds(new Set(currentUser.likedSongs.map((id) => (typeof id === 'object' && id?._id ? id._id.toString() : id.toString()))));
    }
    if (currentUser?.followedArtists) {
      setFollowedArtistIds(new Set(currentUser.followedArtists.map((id) => (typeof id === 'object' && id?._id ? id._id.toString() : id.toString()))));
    }
  }, [currentUser]);

  // Search state
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const match = hash.match(/[?&]q=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return '';
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Audio Player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Active Atmospheric Theme State
  const [themeState, setThemeState] = useState(() => {
    if (activeTheme) return activeTheme;
    try {
      const saved = localStorage.getItem('tunewave_theme');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_THEME;
  });

  useEffect(() => {
    if (activeTheme && activeTheme.id !== themeState.id) {
      setThemeState(activeTheme);
    }
  }, [activeTheme]);

  // Maximized Now Playing Screen state
  const [isMaximized, setIsMaximized] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.includes('player=maximized');
    }
    return false;
  });
  const [isPillExpanding, setIsPillExpanding] = useState(false);

  const openMaximized = () => {
    if (isMaximized || isPillExpanding) return;
    setIsPillExpanding(true);
    initWebAudio();
    setTimeout(() => {
      setIsMaximized(true);
      setIsPillExpanding(false);
    }, 40);
    if (typeof window !== 'undefined') {
      history.pushState(null, '', `#app?tab=${activeTab}&player=maximized`);
    }
  };

  const closeMaximized = () => {
    setIsMaximized(false);
    if (typeof window !== 'undefined') {
      history.pushState(null, '', `#app?tab=${activeTab}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (!window.location.hash.includes('player=maximized')) {
        setIsMaximized(false);
      } else {
        setIsMaximized(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Authentic Web Audio API Nodes for Real-time Spectrum and Beat Reactivity
  const audioContextRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const initWebAudio = () => {
    if (!audioRef.current) return null;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        analyserNodeRef.current = analyser;
        sourceNodeRef.current = source;
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      return analyserNodeRef.current;
    } catch (err) {
      // Browsers restrict connecting media element source more than once
      return analyserNodeRef.current;
    }
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedSongIdsForPlaylist, setSelectedSongIdsForPlaylist] = useState([]);
  const [createPlaylistError, setCreatePlaylistError] = useState('');

  // Socket.io Real-Time Synchronized Listening
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [roomListeners, setRoomListeners] = useState(1);
  const [syncStatus, setSyncStatus] = useState('offline');
  const [roomNowPlaying, setRoomNowPlaying] = useState(null);
  const [broadcastFeedback, setBroadcastFeedback] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);

  // Sync refs to avoid stale closures in socket handlers
  const songsRef = useRef(songs);
  const currentSongRef = useRef(currentSong);
  const currentRoomRef = useRef(currentRoom);
  const isPlayingRef = useRef(isPlaying);
  const activeQueueRef = useRef(activeQueue);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    activeQueueRef.current = activeQueue;
  }, [activeQueue]);

  const fetchRecommendationsAndHistory = async () => {
    try {
      const token = localStorage.getItem('tunewave_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Recommendations API
      const recRes = await fetch(`${API_BASE}/api/songs/recommendations`, { headers });
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }

      // 2. Listening History API
      if (token) {
        const histRes = await fetch(`${API_BASE}/api/songs/history`, { headers });
        if (histRes.ok) {
          const histData = await histRes.json();
          setListeningHistory(histData);
        }
      }
    } catch (err) {
      console.error('Error fetching recommendations or history:', err);
    }
  };

  const recordPlay = async (songId) => {
    try {
      const token = localStorage.getItem('tunewave_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`${API_BASE}/api/songs/${songId}/play`, {
        method: 'POST',
        headers
      });
      fetchRecommendationsAndHistory();
    } catch {
      // quiet fail
    }
  };

  // Fetch initial backend catalogue
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('tunewave_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // 0. Refresh current user profile if token exists to get fresh likedSongs & followedArtists
        let effectiveUserId = currentUser?._id || currentUser?.id;
        if (token) {
          try {
            const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData.user) {
                effectiveUserId = meData.user._id || meData.user.id;
                setLikedSongIds(new Set((meData.user.likedSongs || []).map((id) => id.toString())));
                setFollowedArtistIds(new Set((meData.user.followedArtists || []).map((id) => id.toString())));
                localStorage.setItem('tunewave_user', JSON.stringify(meData.user));
              }
            }
          } catch (e) {
            console.error('Fetch me error:', e);
          }
        }

        // 1. Fetch Songs
        const songsRes = await fetch(`${API_BASE}/api/songs`);
        if (songsRes.ok) {
          const songsData = await songsRes.json();
          setSongs(songsData);
          if (songsData.length > 0 && !currentSong) {
            setCurrentSong(songsData[0]);
          }
        }

        // 2. Fetch Artists
        const artistsRes = await fetch(`${API_BASE}/api/artists`);
        if (artistsRes.ok) {
          const artistsData = await artistsRes.json();
          setArtists(artistsData);
        }

        // 3. Fetch User Playlists if logged in
        if (effectiveUserId) {
          const playlistsRes = await fetch(`${API_BASE}/api/playlists/user/${effectiveUserId}`, { headers });
          if (playlistsRes.ok) {
            const playlistsData = await playlistsRes.json();
            setPlaylists(playlistsData);
          }
        }

        // 4. Fetch Recommendations and Listening History
        fetchRecommendationsAndHistory();
      } catch (err) {
        console.error('Error fetching backend data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Connect Socket.io for Real-Time Sync Rooms ONCE on mount
  useEffect(() => {
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setSyncStatus('connected');
      if (currentRoomRef.current) {
        newSocket.emit('joinRoom', currentRoomRef.current);
      }
    });

    newSocket.on('disconnect', () => {
      setSyncStatus('offline');
    });

    newSocket.on('roomMembers', ({ count }) => {
      if (typeof count === 'number') {
        setRoomListeners(count);
      }
    });

    const handleIncomingSync = (data) => {
      if (!data) return;
      setRoomNowPlaying(data);

      // Avoid self-echo loop for the sender
      if (data.senderId && data.senderId === newSocket.id) {
        return;
      }

      const applyAudioSync = () => {
        if (audioRef.current && typeof data.currentTime === 'number') {
          if (Math.abs(audioRef.current.currentTime - data.currentTime) > 1.2) {
            audioRef.current.currentTime = data.currentTime;
          }
        }
        if (data.isPlaying) {
          audioRef.current?.play().then(() => setIsPlaying(true)).catch((e) => {
            console.log('Autoplay deferred until user interaction:', e);
          });
        } else {
          audioRef.current?.pause();
          setIsPlaying(false);
        }
      };

      if (data.songId) {
        const curSong = currentSongRef.current;
        if (!curSong || curSong._id !== data.songId) {
          const target = songsRef.current.find((s) => s._id === data.songId);
          if (target) {
            setCurrentSong(target);
            currentSongRef.current = target;
            if (audioRef.current) {
              const src = target.audioUrl.startsWith('http') ? target.audioUrl : `${API_BASE}${target.audioUrl}`;
              if (audioRef.current.src !== src) {
                audioRef.current.src = src;
                const onCanPlay = () => {
                  audioRef.current?.removeEventListener('canplay', onCanPlay);
                  applyAudioSync();
                };
                audioRef.current.addEventListener('canplay', onCanPlay);
                audioRef.current.load();
                return;
              }
            }
          }
        }
      }

      applyAudioSync();
    };

    newSocket.on('roomState', handleIncomingSync);
    newSocket.on('nowPlaying', handleIncomingSync);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Live backend song search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/songs/search?keyword=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Playback handlers
  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    initWebAudio();
    const src = currentSong.audioUrl?.startsWith('http') ? currentSong.audioUrl : `${API_BASE}${currentSong.audioUrl}`;
    if (!audioRef.current.src || !audioRef.current.src.includes(currentSong.audioUrl)) {
      audioRef.current.src = src;
      audioRef.current.load();
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      broadcastState(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        broadcastState(true);
      }).catch((e) => console.error('Playback error:', e));
    }
  };

  const playSong = (song, keepQueue = false) => {
    if (!keepQueue) {
      setActiveQueue(null);
      activeQueueRef.current = null;
      setActiveQueueName(null);
    }
    setCurrentSong(song);
    recordPlay(song._id);
    initWebAudio();
    if (!audioRef.current) {
      setIsPlaying(true);
      return;
    }
    const src = song.audioUrl.startsWith('http') ? song.audioUrl : `${API_BASE}${song.audioUrl}`;
    const audio = audioRef.current;

    const doPlay = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          broadcastState(true, song, 0);
        })
        .catch((err) => console.error('Play error:', err));
    };

    if (audio.src !== src) {
      // New track: must wait for canplay before playing
      audio.src = src;
      const handleCanPlay = () => {
        audio.removeEventListener('canplay', handleCanPlay);
        doPlay();
      };
      audio.addEventListener('canplay', handleCanPlay);
      audio.load();
    } else {
      // Same track: just play directly
      doPlay();
    }
  };

  const playPlaylistSong = (playlist, startIndex = 0, shuffle = false) => {
    const rawSongs = playlist.songs || [];
    let pSongs = rawSongs.map((s) => {
      if (typeof s === 'object' && s !== null) return s;
      return songs.find((x) => x._id === s) || null;
    }).filter(Boolean);

    if (pSongs.length === 0) return;

    if (shuffle) {
      pSongs = [...pSongs].sort(() => Math.random() - 0.5);
    }

    setActiveQueue(pSongs);
    activeQueueRef.current = pSongs;
    setActiveQueueName(playlist.name);
    playSong(pSongs[startIndex] || pSongs[0], true);
  };

  const playNext = () => {
    const q = activeQueueRef.current;
    const activeList = (q && q.length > 0) ? q : songs;
    if (!activeList.length || !currentSong) return;
    const curIdx = activeList.findIndex((s) => s._id === currentSong._id);
    const nextIdx = (curIdx + 1) % activeList.length;
    playSong(activeList[nextIdx], true);
  };

  const playPrev = () => {
    const q = activeQueueRef.current;
    const activeList = (q && q.length > 0) ? q : songs;
    if (!activeList.length || !currentSong) return;
    const curIdx = activeList.findIndex((s) => s._id === currentSong._id);
    const prevIdx = (curIdx - 1 + activeList.length) % activeList.length;
    playSong(activeList[prevIdx], true);
  };

  const broadcastState = (playingState, songOverride, seekTime, roomOverride) => {
    const room = roomOverride || currentRoomRef.current;
    const song = songOverride || currentSongRef.current;
    if (socket && room && song) {
      const payload = {
        roomId: room,
        songId: song._id,
        title: song.title,
        artist: song.artist?.name || 'Artist',
        albumArtUrl: song.albumArtUrl,
        currentTime: typeof seekTime === 'number' ? seekTime : (audioRef.current?.currentTime || 0),
        isPlaying: Boolean(playingState)
      };
      setRoomNowPlaying(payload);
      socket.emit('nowPlaying', payload);
    }
  };

  const handleJoinRoom = (roomId) => {
    if (!socket || !roomId.trim()) return;
    const cleanId = roomId.trim().toLowerCase();
    socket.emit('joinRoom', cleanId);
    setCurrentRoom(cleanId);
    currentRoomRef.current = cleanId;
    setRoomListeners(1);
    broadcastState(isPlaying, null, null, cleanId);
  };

  const handleLeaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leaveRoom', currentRoom);
    }
    setCurrentRoom('');
    setRoomNowPlaying(null);
    setRoomListeners(1);
  };

  const handleToggleLike = async (songId) => {
    const token = localStorage.getItem('tunewave_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/songs/${songId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLikedSongIds((prev) => {
          const next = new Set(prev);
          if (data.isLiked) {
            next.add(songId);
          } else {
            next.delete(songId);
          }
          return next;
        });

        setSongs((prev) =>
          prev.map((s) => (s._id === songId ? { ...s, likes: data.likes } : s))
        );
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  const handleFollowArtist = async (artistId) => {
    const token = localStorage.getItem('tunewave_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/artists/${artistId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowedArtistIds((prev) => {
          const next = new Set(prev);
          if (data.isFollowing) {
            next.add(artistId);
          } else {
            next.delete(artistId);
          }
          return next;
        });
        setArtists((prev) =>
          prev.map((a) => (a._id === artistId ? { ...a, followers: data.artist?.followers ?? a.followers } : a))
        );
      }
    } catch (err) {
      console.error('Follow artist error:', err);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    const token = localStorage.getItem('tunewave_token');
    if (!token) return;

    if (playlists.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setCreatePlaylistError(`A playlist named "${trimmed}" already exists.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmed,
          songs: selectedSongIdsForPlaylist
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPlaylists((prev) => [data.playlist, ...prev]);
        setNewPlaylistName('');
        setSelectedSongIdsForPlaylist([]);
        setCreatePlaylistError('');
        setShowCreateModal(false);
      } else {
        setCreatePlaylistError(data.message || 'Failed to create playlist');
      }
    } catch (err) {
      console.error('Create playlist error:', err);
      setCreatePlaylistError(err.message || 'Network error');
    }
  };

  const handleUpdatePlaylistSongs = async (playlistId, songIds) => {
    try {
      const token = localStorage.getItem('tunewave_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ songs: songIds })
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists((prev) =>
          prev.map((pl) => (pl._id === playlistId ? data.playlist : pl))
        );
        setSelectedPlaylist((prev) =>
          prev && prev._id === playlistId ? data.playlist : prev
        );
        if (activeQueueName === selectedPlaylist?.name) {
          setActiveQueue(data.playlist.songs);
          activeQueueRef.current = data.playlist.songs;
        }
      }
    } catch (err) {
      console.error('Update playlist songs error:', err);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const token = localStorage.getItem('tunewave_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((pl) => pl._id !== playlistId));
        if (selectedPlaylist && selectedPlaylist._id === playlistId) {
          setSelectedPlaylist(null);
        }
        if (activeQueueName === selectedPlaylist?.name) {
          setActiveQueue(null);
          activeQueueRef.current = null;
          setActiveQueueName(null);
        }
      }
    } catch (err) {
      console.error('Delete playlist error:', err);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      broadcastState(isPlaying, null, newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentAudioSrc = currentSong?.audioUrl
    ? (currentSong.audioUrl.startsWith('http') ? currentSong.audioUrl : `${API_BASE}${currentSong.audioUrl}`)
    : '';

  return (
    <div className="main-player-app">
      {/* Hidden Audio Engine */}
      <audio
        ref={audioRef}
        src={currentAudioSrc}
        crossOrigin="anonymous"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Main Catalog View (Smooth backdrop transition when player expands) */}
      <div className={`catalog-view-root ${isMaximized ? 'catalog-view-dimmed' : ''}`}>
        {/* ====================================================
            1. TOP NAVIGATION BAR (NO SIDEBAR)
            ==================================================== */}
        <header className="app-top-nav">
        {/* Left: Brand */}
        <div className="app-nav-left">
          <div className="brand-lockup" onClick={onBackToLanding} style={{ cursor: 'pointer' }} title="TuneWave Home">
            <span className="brand-star">✳</span>
            <span className="brand-title">TUNEWAVE</span>
          </div>
        </div>

        {/* Center: Main View Switcher Pills */}
        <nav className="app-nav-center">
          <button
            type="button"
            className={`nav-pill-item ${activeTab === 'discover' ? 'pill-active' : ''}`}
            onClick={() => switchTab('discover')}
          >
            <Compass size={16} />
            <span>Discover</span>
          </button>
          <button
            type="button"
            className={`nav-pill-item ${activeTab === 'search' ? 'pill-active' : ''}`}
            onClick={() => switchTab('search')}
          >
            <Search size={16} />
            <span>Search</span>
          </button>
          <button
            type="button"
            className={`nav-pill-item ${activeTab === 'library' ? 'pill-active' : ''}`}
            onClick={() => switchTab('library')}
          >
            <Library size={16} />
            <span>My Library</span>
            {playlists.length > 0 && <span className="pill-badge-num">{playlists.length}</span>}
          </button>
          <button
            type="button"
            className={`nav-pill-item ${activeTab === 'sync' ? 'pill-active' : ''}`}
            onClick={() => switchTab('sync')}
          >
            <Radio size={16} />
            <span>Live Sync</span>
            {currentRoom && <span className="pill-badge-live">LIVE</span>}
          </button>
        </nav>

        {/* Right: Actions, Room Badge, User & Logout */}
        <div className="app-nav-right">
          <button
            type="button"
            className="btn-create-playlist-pill"
            onClick={() => setShowCreateModal(true)}
            title="Create Playlist"
          >
            <Plus size={15} />
            <span>New Playlist</span>
          </button>

          {currentRoom && (
            <div className="active-sync-pill" title={`Synced in room #${currentRoom}`}>
              <span className="sync-dot-pulse"></span>
              <span className="sync-room-text">#{currentRoom}</span>
              <span className="sync-count">({roomListeners})</span>
            </div>
          )}

          <div className="user-session-pill">
            <span className="user-dot-status">●</span>
            <span className="user-name-text">{currentUser?.name || 'Listener'}</span>
          </div>

          <button
            type="button"
            className="btn-icon-logout"
            onClick={onLogout}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ====================================================
          2. MAIN CONTENT STAGE (FULL WIDTH, OVERLAPPING)
          ==================================================== */}
      <main className="app-full-stage">

        {/* Shimmer Skeleton Loading State */}
        {loading && (
          <div className="skeleton-stage animate-fade-in">
            {/* Shimmer Hero */}
            <div className="skeleton-hero">
              <div className="skeleton-shimmer skeleton-sleeve-box" />
              <div className="skeleton-hero-info">
                <div className="skeleton-shimmer skeleton-tag-pill" />
                <div className="skeleton-shimmer skeleton-title-bar" />
                <div className="skeleton-shimmer skeleton-artist-sub" />
                <div className="skeleton-btn-row">
                  <div className="skeleton-shimmer skeleton-btn" />
                  <div className="skeleton-shimmer skeleton-btn" />
                </div>
              </div>
            </div>

            {/* Shimmer Crates Grid */}
            <div className="skeleton-shimmer skeleton-section-header" />
            <div className="skeleton-crate-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-crate-card">
                  <div className="skeleton-shimmer skeleton-crate-cover" />
                  <div className="skeleton-shimmer skeleton-crate-title" />
                  <div className="skeleton-shimmer skeleton-crate-sub" />
                </div>
              ))}
            </div>

            {/* Shimmer Tracklist Table */}
            <div className="skeleton-shimmer skeleton-section-header" />
            <div className="skeleton-table-rows">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-track-row">
                  <div className="skeleton-shimmer skeleton-row-idx" />
                  <div className="skeleton-shimmer skeleton-row-art" />
                  <div className="skeleton-shimmer skeleton-row-title-box" />
                  <div className="skeleton-shimmer skeleton-row-album-box" />
                  <div className="skeleton-shimmer skeleton-row-time-box" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- VIEW 1: DISCOVER ----------------- */}
        {!loading && activeTab === 'discover' && (
          <div className="view-stage animate-fade-in">
            {/* Editorial Centerpiece: Physical LP Sleeve with Sliding Vinyl Disc */}
            {currentSong && (
              <section className="editorial-hero-banner">
                <div className="hero-banner-inner">
                  {/* Left: Overlapping LP Jacket & Spinning Disc */}
                  <div className="vinyl-overlap-stage" onClick={togglePlay}>
                    {/* The Cardboard LP Jacket */}
                    <div className="lp-jacket-box">
                      <img
                        src={currentSong.albumArtUrl ? (currentSong.albumArtUrl.startsWith('http') ? currentSong.albumArtUrl : `${API_BASE}${currentSong.albumArtUrl}`) : `${API_BASE}/uploads/album-art/blinding-lights.jpg`}
                        alt={currentSong.title}
                        className="lp-artwork-img"
                      />
                      <div className="jacket-edge-shadow"></div>
                    </div>

                    {/* The Vinyl Disc (Sliding out and spinning if playing) */}
                    <div className={`sliding-vinyl-disc ${isPlaying ? 'spin-record' : ''}`}>
                      <div className="vinyl-ring r-1"></div>
                      <div className="vinyl-ring r-2"></div>
                      <div className="vinyl-ring r-3"></div>
                      <div className="vinyl-center-sticker">
                        <img
                          src={currentSong.albumArtUrl ? (currentSong.albumArtUrl.startsWith('http') ? currentSong.albumArtUrl : `${API_BASE}${currentSong.albumArtUrl}`) : `${API_BASE}/uploads/album-art/blinding-lights.jpg`}
                          alt={currentSong.title}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Typography & Quick Actions */}
                  <div className="hero-banner-meta">
                    <div className="banner-badge-row">
                      <span className="banner-pill-tag">NOW SPINNING</span>
                      <span className="banner-pill-audio">24-BIT / 96kHz LOSSLESS</span>
                    </div>

                    <h1 className="hero-song-title">
                      {currentSong.title}
                    </h1>

                    <p className="hero-artist-line">
                      <span className="hero-artist-name">{currentSong.artist?.name || 'Artist'}</span>
                      <span className="dot-divider">•</span>
                      <span className="hero-album-name">{currentSong.album || 'Master Release'}</span>
                      <span className="dot-divider">•</span>
                      <span className="hero-genre-tag">{currentSong.genre}</span>
                    </p>

                    <div className="hero-actions-deck">
                      <button
                        type="button"
                        className="btn-editorial-play"
                        onClick={togglePlay}
                      >
                        {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" />}
                        <span>{isPlaying ? 'Pause Track' : 'Play Track'}</span>
                      </button>

                      <button
                        type="button"
                        className={`btn-editorial-like ${likedSongIds.has(currentSong._id) ? 'is-liked' : ''}`}
                        onClick={() => handleToggleLike(currentSong._id)}
                      >
                        <Heart size={18} fill={likedSongIds.has(currentSong._id) ? '#ff3b30' : 'none'} />
                        <span>{currentSong.likes || 0} Likes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* AI & Genre Recommendations Shelf */}
            {recommendations.length > 0 && (
              <section className="catalog-shelf-section">
                <div className="shelf-header-row">
                  <div>
                    <span className="shelf-eyebrow-tag">
                      <Sparkles size={12} /> PERSONALIZED RECOMMENDATIONS
                    </span>
                    <h2 className="shelf-title">
                      Curated For <span className="serif-italic title-accent">Your Taste</span>
                    </h2>
                  </div>
                  <span className="shelf-counter-badge">{recommendations.length} Recommended</span>
                </div>

                <div className="overlapping-bento-grid">
                  {recommendations.slice(0, 4).map((song) => {
                    const isCurrent = currentSong?._id === song._id;
                    const isLiked = likedSongIds.has(song._id);
                    const artSrc = song.albumArtUrl
                      ? (song.albumArtUrl.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl}`)
                      : `${API_BASE}/uploads/album-art/blinding-lights.jpg`;

                    return (
                      <div
                        key={`rec-${song._id}`}
                        className={`bento-track-card ${isCurrent ? 'track-active-border' : ''}`}
                      >
                        <div className="bento-cover-deck" onClick={() => playSong(song)}>
                          <img src={artSrc} alt={song.title} className="bento-cover-image" />
                          <div className="cover-hover-action">
                            {isCurrent && isPlaying ? (
                              <Pause size={24} fill="#000" />
                            ) : (
                              <Play size={24} fill="#000" />
                            )}
                          </div>
                          <span className="card-corner-genre">{song.genre}</span>
                        </div>

                        <div className="bento-meta-bar">
                          <div className="bento-titles-wrap" onClick={() => playSong(song)}>
                            <span className="bento-title-text">{song.title}</span>
                            <span className="bento-artist-text">{song.artist?.name || 'Artist'}</span>
                          </div>

                          <div className="bento-card-actions">
                            <button
                              type="button"
                              className={`btn-bento-like ${isLiked ? 'liked' : ''}`}
                              onClick={() => handleToggleLike(song._id)}
                              title="Like track"
                            >
                              <Heart size={15} fill={isLiked ? '#ff3b30' : 'none'} color={isLiked ? '#ff3b30' : '#888'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Overlapping Bento Catalog Section ("The Vault") */}
            <section className="catalog-shelf-section">
              <div className="shelf-header-row">
                <div>
                  <h2 className="shelf-title">
                    The Vault <span className="serif-italic title-accent">High-Fidelity</span>
                  </h2>
                </div>
                <span className="shelf-counter-badge">{songs.length} Tracks</span>
              </div>

              <div className="overlapping-bento-grid">
                {songs.map((song, idx) => {
                  const isCurrent = currentSong?._id === song._id;
                  const isLiked = likedSongIds.has(song._id);
                  const artSrc = song.albumArtUrl
                    ? (song.albumArtUrl.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl}`)
                    : `${API_BASE}/uploads/album-art/blinding-lights.jpg`;

                  return (
                    <div
                      key={song._id}
                      className={`bento-track-card ${isCurrent ? 'track-active-border' : ''}`}
                    >
                      {/* Overlapping Album Art with Vinyl Peek */}
                      <div className="bento-cover-deck" onClick={() => playSong(song)}>
                        <img src={artSrc} alt={song.title} className="bento-cover-image" />


                        {/* Hover Overlay Play Icon */}
                        <div className="cover-hover-action">
                          {isCurrent && isPlaying ? (
                            <Pause size={24} fill="#000" />
                          ) : (
                            <Play size={24} fill="#000" />
                          )}
                        </div>

                        {/* Corner Genre Badge */}
                        <span className="card-corner-genre">{song.genre}</span>
                      </div>

                      {/* Track Details */}
                      <div className="bento-meta-bar">
                        <div className="bento-titles-wrap" onClick={() => playSong(song)}>
                          <span className="bento-title-text">{song.title}</span>
                          <span className="bento-artist-text">{song.artist?.name || 'Artist'}</span>
                        </div>

                        <div className="bento-card-actions">
                          <button
                            type="button"
                            className={`btn-bento-like ${isLiked ? 'liked' : ''}`}
                            onClick={() => handleToggleLike(song._id)}
                            title="Like track"
                          >
                            <Heart size={16} fill={isLiked ? '#ff3b30' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Verified Artists Strip ("The Roster") */}
            <section className="roster-strip-section">
              <div className="shelf-header-row">
                <h2 className="shelf-title">
                  Featured Artists <span className="serif-italic title-accent">Roster</span>
                </h2>
                <span className="shelf-counter-badge">{artists.length} Verified</span>
              </div>

              <div className="artists-polaroid-row">
                {artists.map((artist) => {
                  const isFollowed = followedArtistIds.has(artist._id);
                  const imgSrc = artist.imageUrl
                    ? (artist.imageUrl.startsWith('http') ? artist.imageUrl : `${API_BASE}${artist.imageUrl}`)
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

                  return (
                    <div key={artist._id} className="artist-polaroid-plate">
                      <div className="artist-disk-wrap">
                        <img src={imgSrc} alt={artist.name} className="artist-photo-round" />
                      </div>
                      <span className="artist-plate-name">{artist.name}</span>
                      <span className="artist-plate-subs">
                        {(artist.followers || 0).toLocaleString()} listeners
                      </span>
                      <button
                        type="button"
                        className={`btn-follow-plate ${isFollowed ? 'is-following' : ''}`}
                        onClick={() => handleFollowArtist(artist._id)}
                      >
                        {isFollowed ? (
                          <>
                            <Check size={13} />
                            <span>Following</span>
                          </>
                        ) : (
                          <span>+ Follow</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ----------------- VIEW 2: SEARCH ----------------- */}
        {!loading && activeTab === 'search' && (
          <div className="view-stage animate-fade-in">
            {/* Search Input Bar */}
            <div className="search-deck-hero">
              <div className="search-input-pill-wrapper">
                <Search size={22} className="search-glass-icon" />
                <input
                  type="text"
                  className="search-large-input"
                  placeholder="Search tracks, artists, albums, or genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-clear-pill"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Instant Genre Chips */}
              <div className="search-genre-chips-row">
                {['Pop', 'Bollywood', 'Lo-Fi', 'Sufi', 'Punjabi', 'Rock', 'Electronic'].map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    className={`genre-chip-pill ${searchQuery === genre ? 'chip-active' : ''}`}
                    onClick={() => setSearchQuery(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="search-output-container">
              {isSearching ? (
                <div className="search-status-box">
                  <div className="pulse-loader-dot"></div>
                  <span>Searching catalog...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="overlapping-bento-grid">
                  {searchResults.map((song) => {
                    const isCurrent = currentSong?._id === song._id;
                    const isLiked = likedSongIds.has(song._id);
                    const artSrc = song.albumArtUrl
                      ? (song.albumArtUrl.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl}`)
                      : `${API_BASE}/uploads/album-art/blinding-lights.jpg`;

                    return (
                      <div
                        key={song._id}
                        className={`bento-track-card ${isCurrent ? 'track-active-border' : ''}`}
                      >
                        <div className="bento-cover-deck" onClick={() => playSong(song)}>
                          <img src={artSrc} alt={song.title} className="bento-cover-image" />
                          <div className="cover-hover-action">
                            {isCurrent && isPlaying ? <Pause size={24} fill="#000" /> : <Play size={24} fill="#000" />}
                          </div>
                          <span className="card-corner-genre">{song.genre}</span>
                        </div>

                        <div className="bento-meta-bar">
                          <div className="bento-titles-wrap" onClick={() => playSong(song)}>
                            <span className="bento-title-text">{song.title}</span>
                            <span className="bento-artist-text">{song.artist?.name || 'Artist'}</span>
                          </div>
                          <div className="bento-card-actions">
                            <button
                              type="button"
                              className={`btn-bento-like ${isLiked ? 'liked' : ''}`}
                              onClick={() => handleToggleLike(song._id)}
                            >
                              <Heart size={16} fill={isLiked ? '#ff3b30' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery && hasSearched ? (
                <div className="search-status-box">
                  <Music2 size={36} />
                  <span>No tracks found for "{searchQuery}"</span>
                </div>
              ) : (
                <div className="search-status-box">
                  <Search size={32} />
                  <span>Explore music by typing an artist, song, or selecting a genre chip above.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- VIEW 3: LIBRARY ----------------- */}
        {!loading && activeTab === 'library' && (
          selectedPlaylist ? (
            <PlaylistDetailView
              playlist={selectedPlaylist}
              onBack={() => setSelectedPlaylist(null)}
              allSongs={songs}
              currentSong={currentSong}
              isPlaying={isPlaying}
              likedSongIds={likedSongIds}
              onToggleLike={handleToggleLike}
              onPlayPlaylistSong={playPlaylistSong}
              onDeletePlaylist={handleDeletePlaylist}
              onUpdatePlaylistSongs={handleUpdatePlaylistSongs}
              activeQueueName={activeQueueName}
            />
          ) : (
          <div className="view-stage animate-fade-in">
            {/* Playlists Section */}
            <section className="library-shelf-block">
              <div className="shelf-header-row">
                <h2 className="shelf-title">
                  Your Playlists <span className="serif-italic title-accent">Crates</span>
                </h2>
                <button
                  type="button"
                  className="btn-create-playlist-pill"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={15} />
                  <span>Create Playlist</span>
                </button>
              </div>

              {playlists.length > 0 ? (
                <div className="overlapping-bento-grid">
                  {playlists.map((pl) => (
                    <div
                      key={pl._id}
                      className="playlist-bento-box"
                      onClick={() => setSelectedPlaylist(pl)}
                    >
                      <div className="playlist-bento-cover-wrap">
                        <PlaylistCollage playlist={pl} size="sm" allSongs={songs} />
                        <span className="playlist-badge-count">{pl.songs?.length || 0} Tracks</span>
                        {pl.songs && pl.songs.length > 0 && (
                          <button
                            type="button"
                            className="playlist-card-play-hover"
                            onClick={(e) => {
                              e.stopPropagation();
                              playPlaylistSong(pl, 0);
                            }}
                            title={`Play ${pl.name}`}
                          >
                            <Play size={18} fill="#000" />
                          </button>
                        )}
                      </div>
                      <div className="playlist-meta-info">
                        <span className="playlist-title-label">{pl.name}</span>
                        <span className="playlist-creator-label">By {pl.user?.name || currentUser?.name || 'You'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-crate-card">
                  <ListMusic size={36} />
                  <span>No custom playlists yet.</span>
                  <button
                    type="button"
                    className="btn-create-playlist-pill mt-3"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={14} />
                    <span>Create Your First Playlist</span>
                  </button>
                </div>
              )}
            </section>

            {/* Liked Songs Table */}
            <section className="library-shelf-block">
              <div className="shelf-header-row">
                <h2 className="shelf-title">
                  Liked Tracks <span className="serif-italic title-accent">Favorites</span>
                </h2>
                <span className="shelf-counter-badge">{likedSongIds.size} Saved</span>
              </div>

              <div className="clean-tracks-table">
                {songs.filter((s) => likedSongIds.has(s._id)).length > 0 ? (
                  songs
                    .filter((s) => likedSongIds.has(s._id))
                    .map((song, idx) => (
                      <div key={song._id} className="table-row-track">
                        <span className="table-col-num">{idx + 1}</span>
                        <img
                          src={song.albumArtUrl ? (song.albumArtUrl.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl}`) : `${API_BASE}/uploads/album-art/blinding-lights.jpg`}
                          alt={song.title}
                          className="table-track-artwork"
                        />
                        <div className="table-col-meta" onClick={() => playSong(song)}>
                          <span className="table-track-heading">{song.title}</span>
                          <span className="table-track-sub">{song.artist?.name || 'Artist'}</span>
                        </div>
                        <span className="table-col-album">{song.album}</span>
                        <button
                          type="button"
                          className="btn-table-heart-active"
                          onClick={() => handleToggleLike(song._id)}
                        >
                          <Heart size={16} fill="#ff3b30" />
                        </button>
                        <button
                          type="button"
                          className="btn-table-play-round"
                          onClick={() => playSong(song)}
                        >
                          <Play size={14} fill="#000" />
                        </button>
                      </div>
                    ))
                ) : (
                  <div className="empty-crate-card">
                    <Heart size={32} />
                    <span>Songs you like will appear here.</span>
                  </div>
                )}
              </div>
            </section>

            {/* Recently Played Listening History */}
            {listeningHistory.length > 0 && (
              <section className="library-shelf-block mt-8">
                <div className="shelf-header-row">
                  <h2 className="shelf-title">
                    Recently Played <span className="serif-italic title-accent">History</span>
                  </h2>
                  <span className="shelf-counter-badge">{listeningHistory.length} Played</span>
                </div>

                <div className="clean-tracks-table">
                  {listeningHistory.map((item, idx) => {
                    const song = item.song;
                    if (!song) return null;
                    const isLiked = likedSongIds.has(song._id);
                    return (
                      <div key={`hist-${item._id || idx}`} className="table-row-track">
                        <span className="table-col-num">{idx + 1}</span>
                        <img
                          src={song.albumArtUrl ? (song.albumArtUrl.startsWith('http') ? song.albumArtUrl : `${API_BASE}${song.albumArtUrl}`) : `${API_BASE}/uploads/album-art/blinding-lights.jpg`}
                          alt={song.title}
                          className="table-track-artwork"
                        />
                        <div className="table-col-meta" onClick={() => playSong(song)}>
                          <span className="table-track-heading">{song.title}</span>
                          <span className="table-track-sub">{song.artist?.name || 'Artist'}</span>
                        </div>
                        <span className="table-col-album">{song.album || song.genre}</span>
                        <button
                          type="button"
                          className="btn-table-heart-active"
                          onClick={() => handleToggleLike(song._id)}
                        >
                          <Heart size={16} fill={isLiked ? '#ff3b30' : 'none'} color={isLiked ? '#ff3b30' : '#888'} />
                        </button>
                        <button
                          type="button"
                          className="btn-table-play-round"
                          onClick={() => playSong(song)}
                        >
                          <Play size={14} fill="#000" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
          )
        )}

        {/* ----------------- VIEW 4: LIVE SYNC ROOM ----------------- */}
        {!loading && activeTab === 'sync' && (
          <div className="view-stage animate-fade-in">
            <div className="sync-room-hub">
              {/* Top Banner */}
              <div className="sync-hero-card">
                <span className="sync-badge-live">SOCKET.IO LOCKSTEP</span>
                <h1 className="sync-hero-heading">
                  Synchronized <span className="serif-italic title-accent">Listening</span>
                </h1>
                <p className="sync-hero-desc">
                  Join a room to sync play, pause, and seek actions across all connected devices in real time.
                </p>
              </div>

              {/* Real-Time Now Playing Broadcast in Room */}
              {currentRoom && (
                <div className="room-now-playing-banner">
                  <div className="rnp-badge-row">
                    <span className="rnp-live-tag">
                      <span className="live-pulsing-dot" /> LIVE BROADCAST • #{currentRoom.toUpperCase()}
                    </span>
                    <span className="rnp-listeners-tag">
                      <Users size={14} /> {roomListeners} Listener{roomListeners > 1 ? 's' : ''} in room
                    </span>
                  </div>

                  <div className="rnp-content-layout">
                    {/* Vinyl spinning artwork */}
                    <div className={`rnp-art-wrapper ${isPlaying ? 'spin-record' : ''}`}>
                      <img
                        src={
                          (roomNowPlaying?.albumArtUrl || currentSong?.albumArtUrl)
                            ? (
                                (roomNowPlaying?.albumArtUrl || currentSong?.albumArtUrl).startsWith('http')
                                  ? (roomNowPlaying?.albumArtUrl || currentSong?.albumArtUrl)
                                  : `${API_BASE}${roomNowPlaying?.albumArtUrl || currentSong?.albumArtUrl}`
                              )
                            : `${API_BASE}/uploads/album-art/blinding-lights.jpg`
                        }
                        alt={roomNowPlaying?.title || currentSong?.title || 'Track'}
                        className="rnp-art-image"
                      />
                    </div>

                    {/* Track info and real-time wave */}
                    <div className="rnp-track-details">
                      <span className="rnp-eyebrow">NOW PLAYING IN ROOM</span>
                      <h2 className="rnp-title">{roomNowPlaying?.title || currentSong?.title || 'No song selected'}</h2>
                      <h3 className="rnp-artist">{roomNowPlaying?.artist || currentSong?.artist?.name || 'Artist'}</h3>

                      {/* Equalizer animation bar */}
                      <div className="rnp-equalizer">
                        <span className={`eq-bar eq-1 ${isPlaying ? 'eq-anim' : ''}`} />
                        <span className={`eq-bar eq-2 ${isPlaying ? 'eq-anim' : ''}`} />
                        <span className={`eq-bar eq-3 ${isPlaying ? 'eq-anim' : ''}`} />
                        <span className={`eq-bar eq-4 ${isPlaying ? 'eq-anim' : ''}`} />
                        <span className={`eq-bar eq-5 ${isPlaying ? 'eq-anim' : ''}`} />
                        <span className="eq-label">{isPlaying ? 'Synchronized In Lockstep' : 'Room Paused'}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="rnp-actions-col">
                      <button
                        type="button"
                        className={`btn-rnp-broadcast ${broadcastFeedback ? 'broadcast-active' : ''}`}
                        onClick={() => {
                          if (currentSong) {
                            broadcastState(isPlaying, currentSong, audioRef.current?.currentTime || 0);
                            setBroadcastFeedback(true);
                            setTimeout(() => setBroadcastFeedback(false), 2500);
                          }
                        }}
                        title="Broadcast your current track to all room listeners"
                      >
                        <Radio size={14} />
                        <span>{broadcastFeedback ? 'Track Broadcasted!' : 'Broadcast My Track'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-rnp-leave"
                        onClick={handleLeaveRoom}
                        title="Leave this listening room"
                      >
                        <span>Leave Room</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="sync-panels-grid">
                {/* Custom Room Join/Create */}
                <div className="sync-control-box">
                  <h3 className="sync-box-heading">Enter Room Name</h3>
                  <div className="room-action-row">
                    <input
                      type="text"
                      className="room-name-input"
                      placeholder="e.g. after-hours"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-connect-room-pill"
                      onClick={() => handleJoinRoom(roomInput)}
                    >
                      Connect
                    </button>
                  </div>

                  {currentRoom && (
                    <div className="room-live-pill-status">
                      <div className="status-row">
                        <span className="status-label">Active Channel:</span>
                        <span className="status-value text-lime">#{currentRoom}</span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Synced Listeners:</span>
                        <span className="status-value">{roomListeners} Listener{roomListeners > 1 ? 's' : ''}</span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Engine:</span>
                        <span className="status-value text-lime">● Real-Time Sync</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preset Channels */}
                <div className="sync-control-box">
                  <h3 className="sync-box-heading">Public Listening Rooms</h3>
                  <div className="preset-rooms-stack">
                    {['after-hours', 'lofi-study', 'hyperpop-club', 'deep-space'].map((preset) => (
                      <div key={preset} className="preset-row-item">
                        <div className="preset-info">
                          <span className="preset-tag-name">#{preset}</span>
                          <span className="preset-tag-sub">Public Channel</span>
                        </div>
                        <button
                          type="button"
                          className="btn-join-preset-pill"
                          onClick={() => {
                            setRoomInput(preset);
                            handleJoinRoom(preset);
                          }}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ====================================================
          3. FLOATING PILL PLAYER (CENTERED AT BOTTOM)
          ==================================================== */}
      <footer
        className={`floating-player-pill ${isPillExpanding ? 'pill-expanding' : ''} ${isMaximized ? 'pill-hidden' : ''}`}
        onClick={() => {
          if (currentSong && !isMaximized && !isPillExpanding) {
            openMaximized();
          }
        }}
        title="Click to expand player"
        style={{
          '--pill-accent': themeState?.color || '#8ace00',
          '--pill-glow': themeState?.glowColor || 'rgba(138, 206, 0, 0.2)'
        }}
      >
          {/* Left: Track Artwork & Title */}
          <div className="pill-left-meta">
            {currentSong ? (
              <>
                <div className={`pill-thumb-wrap ${isPlaying ? 'spin-record' : ''}`}>
                  <img
                    src={currentSong.albumArtUrl ? (currentSong.albumArtUrl.startsWith('http') ? currentSong.albumArtUrl : `${API_BASE}${currentSong.albumArtUrl}`) : `${API_BASE}/uploads/album-art/blinding-lights.jpg`}
                    alt={currentSong.title}
                    className="pill-art-img"
                  />
                </div>
                <div className="pill-track-text">
                  <span className="pill-track-title">{currentSong.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pill-track-artist">{currentSong.artist?.name || 'Artist'}</span>
                    {activeQueueName && (
                      <span className="pill-playlist-source-tag" title={`Playing from playlist "${activeQueueName}"`}>
                        <ListMusic size={11} />
                        <span>{activeQueueName}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-pill-like ${likedSongIds.has(currentSong._id) ? 'is-liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(currentSong._id);
                  }}
                  title="Like track"
                >
                  <Heart size={16} fill={likedSongIds.has(currentSong._id) ? '#ff3b30' : 'none'} color={likedSongIds.has(currentSong._id) ? '#ff3b30' : '#888'} />
                </button>
              </>
            ) : (
              <span className="pill-empty-hint">Choose a track</span>
            )}
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="pill-center-controls" onClick={(e) => e.stopPropagation()}>
            <div className="pill-buttons-row">
              <button
                type="button"
                className="pill-step-btn"
                onClick={playPrev}
                title="Previous"
              >
                <SkipBack size={16} />
              </button>
              <button
                type="button"
                className="pill-main-play-btn"
                onClick={togglePlay}
                style={{ backgroundColor: themeState?.color || '#8ace00' }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} fill="#000" color="#000" /> : <Play size={18} fill="#000" color="#000" style={{ marginLeft: 2 }} />}
              </button>
              <button
                type="button"
                className="pill-step-btn"
                onClick={playNext}
                title="Next"
              >
                <SkipForward size={16} />
              </button>
            </div>

            <div className="pill-scrub-row">
              <span className="pill-time">{formatTime(currentTime)}</span>
              <div className="pill-slider-track-wrap">
                <div
                  className="pill-slider-track-fill"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    backgroundColor: themeState?.color || '#8ace00'
                  }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="pill-progress-slider"
                />
              </div>
              <span className="pill-time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Expand Action */}
          <div className="pill-right-volume" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pill-vol-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="pill-volume-slider"
              style={{
                accentColor: themeState?.color || '#8ace00'
              }}
            />

            <button
              type="button"
              className="btn-pill-maximize"
              onClick={(e) => {
                e.stopPropagation();
                if (currentSong && !isMaximized && !isPillExpanding) {
                  openMaximized();
                }
              }}
              title="Expand Full-Screen Player"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </footer>

      {/* ====================================================
          4. CREATE PLAYLIST MODAL
          ==================================================== */}
      {showCreateModal && (
        <div className="modal-backdrop-overlay animate-fade-in">
          <div className="create-playlist-modal">
            <div className="modal-top-bar">
              <h3 className="modal-title">Create New Playlist</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="modal-form">
              <div className="modal-input-group">
                <label className="modal-label">Playlist Name</label>
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder="e.g. Midnight Waves"
                  value={newPlaylistName}
                  onChange={(e) => {
                    setNewPlaylistName(e.target.value);
                    setCreatePlaylistError('');
                  }}
                  required
                  autoFocus
                />
                {(createPlaylistError || (newPlaylistName.trim() && playlists.some((p) => p.name.toLowerCase() === newPlaylistName.trim().toLowerCase()))) && (
                  <span style={{ color: '#ff4d4f', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                    {createPlaylistError || 'A playlist with this name already exists.'}
                  </span>
                )}
              </div>

              <div className="modal-songs-selection">
                <span className="modal-sub-label">Select Tracks</span>
                <div className="modal-songs-scroll">
                  {songs.map((song) => {
                    const isSelected = selectedSongIdsForPlaylist.includes(song._id);
                    return (
                      <div
                        key={song._id}
                        className={`modal-song-row ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => {
                          setSelectedSongIdsForPlaylist((prev) =>
                            isSelected ? prev.filter((id) => id !== song._id) : [...prev, song._id]
                          );
                        }}
                      >
                        <span className="song-checkbox-icon">
                          {isSelected ? <Check size={14} /> : null}
                        </span>
                        <span className="modal-row-title">{song.title}</span>
                        <span className="modal-row-artist">{song.artist?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatePlaylistError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={!newPlaylistName.trim() || playlists.some((p) => p.name.toLowerCase() === newPlaylistName.trim().toLowerCase())}
                >
                  Save Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ====================================================
          5. MAXIMIZED FULLSCREEN VINYL DISC PLAYER
          ==================================================== */}
      {isMaximized && (
        <MaximizedPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          playNext={playNext}
          playPrev={playPrev}
          currentTime={currentTime}
          duration={duration}
          handleSeek={handleSeek}
          volume={volume}
          handleVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          toggleMute={toggleMute}
          likedSongIds={likedSongIds}
          handleToggleLike={handleToggleLike}
          onClose={closeMaximized}
          activeTheme={themeState}
          onSelectTheme={(t) => {
            setThemeState(t);
            onSelectTheme?.(t);
          }}
          analyserNode={analyserNodeRef.current}
          API_BASE={API_BASE}
          activeQueueName={activeQueueName}
        />
      )}
    </div>
  );
}
