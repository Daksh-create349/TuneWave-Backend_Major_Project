import React, { useState, useEffect } from 'react';
import MarqueeTicker from './components/MarqueeTicker';
import BrutalistNav from './components/BrutalistNav';
import BrutalistHero from './components/BrutalistHero';
import PosterGrid from './components/PosterGrid';
import MoodMatrix from './components/MoodMatrix';
import BrutalistFooter from './components/BrutalistFooter';
import AuthPage from './components/AuthPage';
import MainApp from './components/MainApp';
import { DEFAULT_THEME } from './data/themes';
import './App.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#app')) return 'app';
      if (hash.startsWith('#login') || hash.startsWith('#signup')) return 'auth';
    }
    return 'home';
  });
  const [authMode, setAuthMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#signup')) return 'signup';
    return 'login';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tunewave_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('tunewave_theme');
      return saved ? JSON.parse(saved) : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    try {
      localStorage.setItem('tunewave_theme', JSON.stringify(theme));
    } catch {}
  };

  // Support #login, #signup, #app in URL
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#login')) {
        setAuthMode('login');
        setCurrentScreen('auth');
      } else if (hash.startsWith('#signup')) {
        setAuthMode('signup');
        setCurrentScreen('auth');
      } else if (hash.startsWith('#app')) {
        setCurrentScreen('app');
      } else {
        setCurrentScreen('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Restore / validate user session from server on mount
  useEffect(() => {
    const token = localStorage.getItem('tunewave_token');
    if (token) {
      fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Token invalid');
        })
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('tunewave_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          localStorage.removeItem('tunewave_token');
          localStorage.removeItem('tunewave_user');
          setCurrentUser(null);
        });
    }
  }, []);

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setCurrentScreen('auth');
    history.pushState(null, '', `#${mode}`);
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    if (window.location.hash === '#login' || window.location.hash === '#signup' || window.location.hash === '#app') {
      history.pushState(null, '', window.location.pathname);
    }
  };

  const handleOpenApp = () => {
    setCurrentScreen('app');
    history.pushState(null, '', '#app');
  };

  const handleLogout = () => {
    localStorage.removeItem('tunewave_token');
    localStorage.removeItem('tunewave_user');
    setCurrentUser(null);
    setCurrentScreen('home');
    history.pushState(null, '', window.location.pathname);
  };

  // If user is in the full streaming app
  if (currentScreen === 'app') {
    return (
      <MainApp
        currentUser={currentUser}
        onBackToLanding={handleBackToHome}
        onLogout={handleLogout}
        activeTheme={activeTheme}
        onSelectTheme={handleThemeChange}
      />
    );
  }

  return (
    <div className="app-root">
      {/* Clean Navigation with Auth Buttons */}
      <BrutalistNav
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenApp={handleOpenApp}
        onLogout={handleLogout}
      />

      {/* Editorial Hero with Physical Vinyl Sleeve */}
      <BrutalistHero />

      {/* Subtle Ticker Separator */}
      <MarqueeTicker theme="dark" />

      {/* Bento Collage: Featured Artists + Brat Lime + Tracklist */}
      <PosterGrid />

      {/* Curated Soundscapes / Mood Explorer */}
      <MoodMatrix activeTheme={activeTheme} onSelectTheme={handleThemeChange} />

      {/* Clean Modern Footer */}
      <BrutalistFooter onOpenAuth={handleOpenAuth} />

      {/* Dedicated Split-Screen Auth Page (Smooth Entrance & Exit Over Landing Page) */}
      {currentScreen === 'auth' && (
        <AuthPage
          initialMode={authMode}
          onBack={handleBackToHome}
          currentUser={currentUser}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            handleOpenApp();
          }}
          onContinueToApp={handleOpenApp}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
