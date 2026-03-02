import React, { useState } from 'react';
import { Home, BookOpen, Settings, Menu, X } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';

export default function Navigation({ currentView, onViewChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const t = useT();

    const handleNavigate = (view) => {
        onViewChange(view);
        setIsOpen(false);
    };

    return (
        <>
            {isOpen && (
                <div className="nav-overlay fade-enter fade-enter-active" onClick={() => setIsOpen(false)} />
            )}

            <button
                className={`floating-nav-btn nav-home ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNavigate('home')}
                aria-label={t('navigation', 'accueil')}
            >
                <Home size={24} strokeWidth={1.5} />
            </button>

            {isOpen && (
                <div className="nav-expanded-controls fade-enter fade-enter-active">
                    <button
                        className={`nav-expanded-btn ${currentView === 'library' ? 'active' : ''}`}
                        onClick={() => handleNavigate('library')}
                    >
                        <span>{t('navigation', 'bibliotheque')}</span>
                        <div className="nav-icon-bg">
                            <BookOpen size={20} strokeWidth={1.5} />
                        </div>
                    </button>
                    <button
                        className={`nav-expanded-btn ${currentView === 'settings' ? 'active' : ''}`}
                        onClick={() => handleNavigate('settings')}
                    >
                        <span>{t('navigation', 'reglages')}</span>
                        <div className="nav-icon-bg">
                            <Settings size={20} strokeWidth={1.5} />
                        </div>
                    </button>
                </div>
            )}

            <button
                className="floating-nav-btn nav-menu"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('navigation', 'menu')}
            >
                {isOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
        </>
    );
}
