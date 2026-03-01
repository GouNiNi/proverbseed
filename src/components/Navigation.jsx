import React from 'react';
import { Home, Default, BookOpen, Settings, Save } from 'lucide-react';

export default function Navigation({ currentView, onViewChange }) {
    const navItems = [
        { id: 'home', icon: Home, label: 'Accueil' },
        { id: 'library', icon: BookOpen, label: 'Bibliothèque' },
        { id: 'portability', icon: Save, label: 'Sauvegardes' },
        { id: 'settings', icon: Settings, label: 'Réglages' }
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-card-bg)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0 calc(12px + env(safe-area-inset-bottom)) 0',
            zIndex: 100
        }}>
            {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-supporting)',
                            transition: 'var(--transition-fast)'
                        }}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span style={{
                            fontSize: '0.7rem',
                            marginTop: '4px',
                            fontWeight: isActive ? 600 : 400
                        }}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    );
}
