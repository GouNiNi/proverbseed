import React, { useState, useEffect, useContext } from 'react';
import { dbStore, dbOptions, getAllProverbs } from '../data/db';
import { ChevronRight, Trash2, Heart } from 'lucide-react';
import { LanguageContext } from '../i18n/LanguageContext';
import { useT } from '../i18n/LanguageContext';

export default function LibraryView() {
    const language = useContext(LanguageContext);
    const t = useT();

    const [themes, setThemes] = useState([]);
    const [categorized, setCategorized] = useState({});
    const [favorites, setFavorites] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [themeProverbs, setThemeProverbs] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    const loadLibrary = async () => {
        const th = await dbStore.getItem(dbOptions.USER_THEMES) || [];
        const cat = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
        const fav = await dbStore.getItem(dbOptions.FAVORITES) || [];
        setThemes(th.sort());
        setCategorized(cat);
        setFavorites(fav);
        setTimeout(() => setIsVisible(true), 50);
    };

    useEffect(() => { loadLibrary(); }, [language]);

    const selectTheme = (theme) => {
        setIsVisible(false);
        setTimeout(async () => {
            setSelectedTheme(theme);
            const allProverbsData = await getAllProverbs(language);
            let provs = [];
            if (theme === '__favoris__') {
                provs = allProverbsData.filter(p => favorites.includes(p.id));
            } else {
                const relatedIds = Object.keys(categorized).filter(id => categorized[id].includes(theme));
                provs = allProverbsData.filter(p => relatedIds.includes(p.id));
            }
            setThemeProverbs(provs);
            setIsVisible(true);
        }, 500);
    };

    const backToThemes = () => {
        setIsVisible(false);
        setTimeout(() => { setSelectedTheme(null); setIsVisible(true); }, 500);
    };

    const deleteTheme = async (theme) => {
        const msg = t('library', 'supprimerConfirm').replace('{theme}', theme);
        if (!window.confirm(msg)) return;

        const newCat = { ...categorized };
        for (const id in newCat) {
            newCat[id] = newCat[id].filter(th => th !== theme);
            if (newCat[id].length === 0) delete newCat[id];
        }
        const newThemes = themes.filter(th => th !== theme);
        await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, newCat);
        await dbStore.setItem(dbOptions.USER_THEMES, newThemes);
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
                <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>
                    {t('library', 'title')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="card" onClick={() => selectTheme('__favoris__')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px', borderLeft: '4px solid #d32f2f' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Heart size={18} fill="#d32f2f" color="#d32f2f" />
                                {t('library', 'favoris')} <span style={{ fontSize: '0.8rem', color: 'var(--color-supporting)', fontWeight: 'normal' }}>({favorites.length})</span>
                            </h3>
                        </div>
                        <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={20} />
                        </div>
                    </div>

                    {themes.map(th => {
                        const count = Object.keys(categorized).filter(id => categorized[id].includes(th)).length;
                        return (
                            <div key={th} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px' }}>
                                <div onClick={() => selectTheme(th)} style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'var(--color-text)' }}>{th} <span style={{ fontSize: '0.8rem', color: 'var(--color-supporting)', fontWeight: 'normal' }}>({count})</span></h3>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                                    <button onClick={() => deleteTheme(th)} style={{ color: 'var(--color-supporting)', padding: '5px' }} aria-label="Delete"><Trash2 size={18} /></button>
                                    <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }} onClick={() => selectTheme(th)}>
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {themes.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--color-supporting)', marginTop: '10px', fontSize: '0.9rem' }}>
                            {t('library', 'aucunTheme')}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const displayTitle = selectedTheme === '__favoris__' ? t('library', 'favoris') : selectedTheme;

    return (
        <div className={`fade-enter ${isVisible ? 'fade-enter-active' : ''}`} style={{ paddingBottom: '40px' }}>
            <button className="btn-ghost" onClick={backToThemes} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', color: 'var(--color-secondary)' }}>
                {t('library', 'retourThemes')}
            </button>

            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>{displayTitle}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {themeProverbs.map(p => {
                    const isFav = favorites.includes(p.id);
                    return (
                        <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', lineHeight: '1.6' }}>"{p.text}"</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>{p.reference}</span>
                                <button onClick={() => toggleFavorite(p.id)} style={{ color: isFav ? '#d32f2f' : 'var(--color-supporting)' }} aria-label="Toggle Favorite">
                                    <Heart size={20} fill={isFav ? '#d32f2f' : 'none'} color={isFav ? '#d32f2f' : 'currentColor'} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {themeProverbs.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-supporting)' }}>{t('library', 'aucunProverbe')}</p>
                )}
            </div>
        </div>
    );
}
