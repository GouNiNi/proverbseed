import { useState, useEffect } from 'react';
import HomeView from './views/HomeView';
import LibraryView from './views/LibraryView';
import SettingsView from './views/SettingsView';
import PortabilityView from './views/PortabilityView';
import Navigation from './components/Navigation';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // home, library, portability, settings

  useEffect(() => {
    // Show splash screen for 500ms
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'library':
        return <LibraryView />;
      case 'portability':
        return <PortabilityView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  if (showSplash) {
    return (
      <div className="splash-screen fade-enter fade-enter-active">
        <h1 className="splash-title title-font">ProverbSeed</h1>
      </div>
    );
  }

  return (
    <div className="app-container fade-enter fade-enter-active" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto', paddingBottom: '90px' }}>
        {renderView()}
      </main>
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

export default App;
