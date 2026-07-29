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

function parseHash(hash) {
    const cleanHash = (hash || window.location.hash).replace(/^#\/?/, '');
    if (!cleanHash || cleanHash === 'home') {
        return { view: 'home', theme: null };
    }
    if (cleanHash === 'settings') {
        return { view: 'settings', theme: null };
    }
    if (cleanHash === 'library') {
        return { view: 'library', theme: null };
    }
    if (cleanHash.startsWith('library/')) {
        const rawTheme = cleanHash.substring('library/'.length);
        const theme = decodeURIComponent(rawTheme);
        return { view: 'library', theme: theme === 'favoris' ? '__favoris__' : theme };
    }
    return { view: 'home', theme: null };
}

function getHashForState(view, theme = null) {
    if (view === 'settings') return '#settings';
    if (view === 'library') {
        if (theme) {
            const themeSlug = theme === '__favoris__' ? 'favoris' : encodeURIComponent(theme);
            return `#library/${themeSlug}`;
        }
        return '#library';
    }
    return '#home';
}

function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [hidingSplash, setHidingSplash] = useState(false);
    const initialRoute = parseHash();
    const [currentView, setCurrentView] = useState(initialRoute.view); // home, library, settings
    const [showTutorial, setShowTutorial] = useState(false);
    const [language, setLanguage] = useState('fr');
    const [pendingEditId, setPendingEditId] = useState(null);
    const [selectedLibraryTheme, setSelectedLibraryTheme] = useState(initialRoute.theme);
    const [fromValidation, setFromValidation] = useState(false);

    useEffect(() => {
        // Synchroniser l'état initial dans l'historique
        const initialHash = getHashForState(initialRoute.view, initialRoute.theme);
        window.history.replaceState(
            { view: initialRoute.view, theme: initialRoute.theme, fromValidation: false },
            '',
            initialHash
        );

        const handlePopState = (event) => {
            const route = event.state ? event.state : parseHash();
            setCurrentView(route.view || 'home');
            setSelectedLibraryTheme(route.theme || null);
            setFromValidation(!!event.state?.fromValidation);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        dbStore.getItem(dbOptions.SETTINGS).then(settings => {
            if (settings) {
                if (settings.hasSeenTutorial === false) setShowTutorial(true);
                if (settings.language) setLanguage(settings.language);
                if (settings.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
                if (settings.notificationsEnabled) checkDailyNotification(settings);
            }
        });

        // Vérification toutes les minutes quand l'app est au premier plan
        const interval = setInterval(async () => {
            const settings = await dbStore.getItem(dbOptions.SETTINGS);
            if (settings?.notificationsEnabled) checkDailyNotification(settings);
        }, 60 * 1000);

        // Vérification quand l'utilisateur revient sur l'app (après avoir switché)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                const settings = await dbStore.getItem(dbOptions.SETTINGS);
                if (settings?.notificationsEnabled) checkDailyNotification(settings);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

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
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    const navigateTo = (view, theme = null, isFromValidation = false) => {
        const newHash = getHashForState(view, theme);
        const newState = { view, theme, fromValidation: isFromValidation };
        if (window.location.hash !== newHash) {
            window.history.pushState(newState, '', newHash);
        } else {
            window.history.replaceState(newState, '', newHash);
        }
        setCurrentView(view);
        setSelectedLibraryTheme(theme);
        setFromValidation(isFromValidation);
    };

    const handleEditProverb = (id) => {
        setPendingEditId(id);
        navigateTo('home', null, false);
    };

    const handleNavigateToTheme = (themeName) => {
        navigateTo('library', themeName, true);
    };

    const handleBackToHome = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            navigateTo('home', null, false);
        }
    };

    const handleSelectThemeInLibrary = (themeName) => {
        if (themeName) {
            navigateTo('library', themeName, false);
        } else {
            navigateTo('library', null, false);
        }
    };

    const handleViewChange = (view) => {
        navigateTo(view, null, false);
    };

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <HomeView pendingEditId={pendingEditId} onClearPendingEdit={() => setPendingEditId(null)} onNavigateToTheme={handleNavigateToTheme} />;
            case 'library':
                return (
                    <LibraryView
                        initialTheme={selectedLibraryTheme}
                        fromValidation={fromValidation}
                        onBackToHome={handleBackToHome}
                        onSelectTheme={handleSelectThemeInLibrary}
                        onEditProverb={handleEditProverb}
                    />
                );
            case 'settings':
                return <SettingsView />;
            default:
                return <HomeView pendingEditId={pendingEditId} onClearPendingEdit={() => setPendingEditId(null)} onNavigateToTheme={handleNavigateToTheme} />;
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
                <Navigation currentView={currentView} onViewChange={handleViewChange} />

                {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
            </div>
        </LanguageContext.Provider>
    );
}

export default App;
