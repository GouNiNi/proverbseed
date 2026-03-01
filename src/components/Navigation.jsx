import React, { useState } from 'react';
import { Home, BookOpen, Settings, Menu, X } from 'lucide-react';

export default function Navigation({ currentView, onViewChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleNavigate = (view) => {
        onViewChange(view);
        setIsOpen(false);
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="nav-overlay fade-enter fade-enter-active"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Home (left) */}
            <button
                className={`floating-nav-btn nav-home ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNavigate('home')}
                aria-label="Accueil"
            >
                <Home size={24} strokeWidth={1.5} />
            </button>

            {/* Expanded items */}
            {isOpen && (
                <div className="nav-expanded-controls fade-enter fade-enter-active">
                    <button
                        className={`nav-expanded-btn ${currentView === 'library' ? 'active' : ''}`}
                        onClick={() => handleNavigate('library')}
                    >
                        <span>Bibliothèque</span>
                        <div className="nav-icon-bg">
                            <BookOpen size={20} strokeWidth={1.5} />
                        </div>
                    </button>
                    <button
                        className={`nav-expanded-btn ${currentView === 'settings' ? 'active' : ''}`}
                        onClick={() => handleNavigate('settings')}
                    >
                        <span>Réglages</span>
                        <div className="nav-icon-bg">
                            <Settings size={20} strokeWidth={1.5} />
                        </div>
                    </button>
                </div>
            )}

            {/* Menu Toggle (right) */}
            <button
                className="floating-nav-btn nav-menu"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menu"
            >
                {isOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
        </>
    );
}
