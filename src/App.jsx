import { useState, useEffect } from 'react';
import HomeView from './views/HomeView';
import LibraryView from './views/LibraryView';
import SettingsView from './views/SettingsView';
import Navigation from './components/Navigation';
import TutorialOverlay from './components/TutorialOverlay';
import { LanguageContext } from './i18n/LanguageContext';
import { dbStore, dbOptions } from './data/db';

// Fallback : envoie une notification si l'heure est passée et qu'elle n'a pas encore été envoyée aujourd'hui
async function checkDailyNotification(settings) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const days = settings.notificationDays ?? [0, 1, 2, 3, 4, 5, 6];
    if (!days.includes(now.getDay())) return;
    const [h, m] = (settings.notificationTime ?? '08:00').split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (now < target) return; // Pas encore l'heure
    const today = now.toDateString();
    const lastNotif = await dbStore.getItem('last_notification_date');
    if (lastNotif === today) return; // Déjà envoyée aujourd'hui
    await dbStore.setItem('last_notification_date', today);
    const lang = settings.language ?? 'fr';
    const body = lang === 'en'
        ? 'Your daily seed of wisdom awaits you.'
        : 'Votre graine de sagesse du jour vous attend.';
    new Notification('🌱 ProverbSeed', { body, icon: '/pwa-192x192.png' });
}

function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [hidingSplash, setHidingSplash] = useState(false);
    const [currentView, setCurrentView] = useState('home'); // home, library, settings
    const [showTutorial, setShowTutorial] = useState(false);
    const [language, setLanguage] = useState('fr');
    const [pendingEditId, setPendingEditId] = useState(null);

    useEffect(() => {
        dbStore.getItem(dbOptions.SETTINGS).then(settings => {
            if (settings) {
                if (settings.hasSeenTutorial === false) setShowTutorial(true);
                if (settings.language) setLanguage(settings.language);
                if (settings.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
                if (settings.notificationsEnabled) checkDailyNotification(settings);
            }
        });

        const handleShowTutorial = () => setShowTutorial(true);
        window.addEventListener('showTutorial', handleShowTutorial);

        const handleLanguageChange = (e) => setLanguage(e.detail);
        window.addEventListener('languageChange', handleLanguageChange);

        const handleThemeChange = (e) => {
            if (e.detail) document.documentElement.setAttribute('data-theme', 'dark');
            else document.documentElement.removeAttribute('data-theme');
        };
        window.addEventListener('themeChange', handleThemeChange);

        return () => {
            window.removeEventListener('showTutorial', handleShowTutorial);
            window.removeEventListener('languageChange', handleLanguageChange);
            window.removeEventListener('themeChange', handleThemeChange);
        };
    }, []);

    useEffect(() => {
        const hideTimer = setTimeout(() => {
            setHidingSplash(true);
            setTimeout(() => setShowSplash(false), 500);
        }, 500);
        return () => clearTimeout(hideTimer);
    }, []);

    const handleEditProverb = (id) => {
        setPendingEditId(id);
        setCurrentView('home');
    };

    const renderView = () => {
        switch (currentView) {
            case 'home':     return <HomeView pendingEditId={pendingEditId} onClearPendingEdit={() => setPendingEditId(null)} />;
            case 'library':  return <LibraryView onEditProverb={handleEditProverb} />;
            case 'settings': return <SettingsView />;
            default:         return <HomeView pendingEditId={pendingEditId} onClearPendingEdit={() => setPendingEditId(null)} />;
        }
    };

    return (
        <LanguageContext.Provider value={language}>
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
        </LanguageContext.Provider>
    );
}

export default App;
