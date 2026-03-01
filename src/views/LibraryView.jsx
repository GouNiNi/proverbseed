import React, { useState, useEffect } from 'react';
import { dbStore, dbOptions, allProverbs } from '../data/db';
import { ChevronRight, Trash2, Heart } from 'lucide-react';

export default function LibraryView() {
    const [themes, setThemes] = useState([]);
    const [categorized, setCategorized] = useState({});
    const [favorites, setFavorites] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [themeProverbs, setThemeProverbs] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    const loadLibrary = async () => {
        const t = await dbStore.getItem(dbOptions.USER_THEMES) || [];
        const c = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
        const f = await dbStore.getItem(dbOptions.FAVORITES) || [];
        setThemes(t.sort());
        setCategorized(c);
        setFavorites(f);
        // Short delay for the fade-in effect to trigger reliably
        setTimeout(() => setIsVisible(true), 50);
    };

    useEffect(() => {
        loadLibrary();
    }, []);

    const selectTheme = (theme) => {
        setIsVisible(false);
        setTimeout(() => {
            setSelectedTheme(theme);
            let provs = [];
            if (theme === 'Favoris') {
                provs = allProverbs.filter(p => favorites.includes(p.id));
            } else {
                const relatedIds = Object.keys(categorized).filter(id => categorized[id].includes(theme));
                provs = allProverbs.filter(p => relatedIds.includes(p.id));
            }
            setThemeProverbs(provs);
            setIsVisible(true);
        }, 500); // Wait for fade out
    };

    const backToThemes = () => {
        setIsVisible(false);
        setTimeout(() => {
            setSelectedTheme(null);
            setIsVisible(true);
        }, 500);
    };

    const deleteTheme = async (theme) => {
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${theme}" ? Tous les proverbes associés seront dissociés, mais ne seront pas effacés de la base.`);
        if (!confirmDelete) return;

        const newCat = { ...categorized };
        for (const id in newCat) {
            newCat[id] = newCat[id].filter(t => t !== theme);
            if (newCat[id].length === 0) {
                delete newCat[id];
            }
        }

        const newThemes = themes.filter(t => t !== theme);

        await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, newCat);
        await dbStore.setItem(dbOptions.USER_THEMES, newThemes);

        // Immediate state update here without transition because it's a structural change
        setThemes(newThemes);
        setCategorized(newCat);
    };

    const toggleFavorite = async (proverbId) => {
        const isFav = favorites.includes(proverbId);
        const newFavs = isFav ? favorites.filter(id => id !== proverbId) : [...favorites, proverbId];

        await dbStore.setItem(dbOptions.FAVORITES, newFavs);
        setFavorites(newFavs);
    };

    if (!selectedTheme) {
        return (
            <div className={`fade-enter ${isVisible ? 'fade-enter-active' : ''}`} style={{ paddingBottom: '40px' }}>
                <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>Bibliothèque</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Always persistent Favorites category */}
                    <div className="card" onClick={() => selectTheme('Favoris')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px', borderLeft: '4px solid #d32f2f' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Heart size={18} fill="#d32f2f" color="#d32f2f" />
                                Favoris <span style={{ fontSize: '0.8rem', color: 'var(--color-supporting)', fontWeight: 'normal' }}>({favorites.length})</span>
                            </h3>
                        </div>
                        <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={20} />
                        </div>
                    </div>

                    {themes.map(t => {
                        const count = Object.keys(categorized).filter(id => categorized[id].includes(t)).length;
                        return (
                            <div key={t} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px' }}>
                                <div onClick={() => selectTheme(t)} style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'var(--color-text)' }}>{t} <span style={{ fontSize: '0.8rem', color: 'var(--color-supporting)', fontWeight: 'normal' }}>({count})</span></h3>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                                    <button onClick={() => deleteTheme(t)} style={{ color: 'var(--color-supporting)', padding: '5px' }} aria-label="Delete Category"><Trash2 size={18} /></button>
                                    <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }} onClick={() => selectTheme(t)}>
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {themes.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--color-supporting)', marginTop: '10px', fontSize: '0.9rem' }}>Aucun autre thème créé pour le moment.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`fade-enter ${isVisible ? 'fade-enter-active' : ''}`} style={{ paddingBottom: '40px' }}>
            <button className="btn-ghost" onClick={backToThemes} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', color: 'var(--color-secondary)' }}>
                ← Retour aux thèmes
            </button>

            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>{selectedTheme}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {themeProverbs.map(p => {
                    const isFav = favorites.includes(p.id);
                    return (
                        <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', lineHeight: '1.6' }}>"{p.text}"</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>{p.reference}</span>
                                <button
                                    onClick={() => toggleFavorite(p.id)}
                                    style={{ color: isFav ? '#d32f2f' : 'var(--color-supporting)' }}
                                    aria-label="Toggle Favorite"
                                >
                                    <Heart size={20} fill={isFav ? '#d32f2f' : 'none'} color={isFav ? '#d32f2f' : 'currentColor'} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {themeProverbs.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-supporting)' }}>Aucun proverbe pour ce thème.</p>
                )}
            </div>
        </div>
    );
}

