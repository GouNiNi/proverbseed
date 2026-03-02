import { useState, useEffect } from 'react';
import HomeView from './views/HomeView';
import LibraryView from './views/LibraryView';
import SettingsView from './views/SettingsView';
import Navigation from './components/Navigation';
import TutorialOverlay from './components/TutorialOverlay';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [hidingSplash, setHidingSplash] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, library, settings
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    import('./data/db').then(({ dbStore, dbOptions }) => {
      dbStore.getItem(dbOptions.SETTINGS).then(settings => {
        if (settings && settings.hasSeenTutorial === false) {
          setShowTutorial(true);
        }
      });
    });

    const handleShowTutorial = () => setShowTutorial(true);
    window.addEventListener('showTutorial', handleShowTutorial);
    return () => window.removeEventListener('showTutorial', handleShowTutorial);
  }, []);

  useEffect(() => {
    // Start hiding after 500ms
    const hideTimer = setTimeout(() => {
      setHidingSplash(true);
      // Remove from DOM after fade completes (500ms)
      setTimeout(() => setShowSplash(false), 500);
    }, 500);
    return () => clearTimeout(hideTimer);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'library':
        return <LibraryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app-container fade-enter fade-enter-active" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {showSplash && (
        <div className={`splash-screen ${hidingSplash ? 'hiding' : ''}`}>
          <h1 className="splash-title title-font">ProverbSeed</h1>
        </div>
      )}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {renderView()}
      </main>
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

export default App;
