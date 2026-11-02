import React, { useState, useEffect, useContext } from 'react';
import { dbStore, dbOptions, getAllProverbs } from '../data/db';
import { ChevronRight, Trash2, Heart, Edit3, Search } from 'lucide-react';
import { LanguageContext } from '../i18n/LanguageContext';
import { useT } from '../i18n/LanguageContext';
import { normalizeText, groupThemesByLetter } from '../utils/textUtils';

export default function LibraryView({ initialTheme = null, fromValidation = false, onBackToHome = null, onSelectTheme = null, onEditProverb }) {
    const language = useContext(LanguageContext);
    const t = useT();

    const [themes, setThemes] = useState([]);
    const [categorized, setCategorized] = useState({});
    const [favorites, setFavorites] = useState([]);
    const [notes, setNotes] = useState({});
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [themeProverbs, setThemeProverbs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const loadLibrary = async () => {
        const th = await dbStore.getItem(dbOptions.USER_THEMES) || [];
        const cat = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
        const fav = await dbStore.getItem(dbOptions.FAVORITES) || [];
        setThemes(th.sort((a, b) => a.localeCompare(b, language === 'fr' ? 'fr' : 'en')));
        setCategorized(cat);
        setFavorites(fav);
        setTimeout(() => setIsVisible(true), 50);
    };

    useEffect(() => {
        loadLibrary();
        if (initialTheme && initialTheme !== selectedTheme) {
            selectTheme(initialTheme, false);
        } else if (!initialTheme && selectedTheme !== null) {
            setSelectedTheme(null);
            setIsVisible(true);
        }
    }, [initialTheme, language]);

    const selectTheme = (theme, updateHistory = true) => {
        setIsVisible(false);
        setSearchQuery('');
        if (updateHistory && onSelectTheme) {
            onSelectTheme(theme);
        }
        setTimeout(async () => {
            setSelectedTheme(theme);
            const allProverbsData = await getAllProverbs(language);
            const notesData = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
            const catData = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
            const favData = await dbStore.getItem(dbOptions.FAVORITES) || [];
            setNotes(notesData);
            let provs = [];
            if (theme === '__favoris__') {
                provs = allProverbsData.filter(p => favData.includes(p.id));
            } else {
                const relatedIds = Object.keys(catData).filter(id => catData[id].includes(theme));
                provs = allProverbsData.filter(p => relatedIds.includes(p.id));
            }
            setThemeProverbs(provs);
            setIsVisible(true);
        }, 500);
    };

    const backToThemes = () => {
        if (onSelectTheme) onSelectTheme(null);
        setIsVisible(false);
        setTimeout(() => { setSelectedTheme(null); setIsVisible(true); }, 500);
    };

    const handleBack = () => {
        if (fromValidation && onBackToHome) {
            onBackToHome();
        } else {
            backToThemes();
        }
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
        backToThemes();
    };

    const toggleFavorite = async (proverbId) => {
        const isFav = favorites.includes(proverbId);
        const newFavs = isFav ? favorites.filter(id => id !== proverbId) : [...favorites, proverbId];
        await dbStore.setItem(dbOptions.FAVORITES, newFavs);
        setFavorites(newFavs);
    };

    if (!selectedTheme) {
        const groupedThemes = groupThemesByLetter(themes);

        return (
            <div className={`fade-enter ${isVisible ? 'fade-enter-active' : ''}`} style={{ paddingBottom: '40px' }}>
                <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>
                    {t('library', 'title')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Carte des Favoris */}
                    <div
                        className="card"
                        onClick={() => selectTheme('__favoris__')}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '12px 14px',
                            borderLeft: '4px solid #d32f2f',
                            marginBottom: '16px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Heart size={18} fill="#d32f2f" color="#d32f2f" />
                            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                {t('library', 'favoris')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-supporting)', background: 'var(--color-bg, rgba(0,0,0,0.05))', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                                {favorites.length}
                            </span>
                            <ChevronRight size={18} style={{ color: 'var(--color-supporting)' }} />
                        </div>
                    </div>

                    {/* Liste groupée par lettre alphabétique */}
                    {groupedThemes.map(({ letter, themes: themeList }) => (
                        <div key={letter} style={{ marginBottom: '16px' }}>
                            <div style={{
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                color: 'var(--color-primary)',
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                                padding: '4px 6px',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>{letter}</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--color-border, rgba(0,0,0,0.08))', opacity: 0.5 }} />
                            </div>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {themeList.map((th, idx) => {
                                    const count = Object.keys(categorized).filter(id => categorized[id].includes(th)).length;
                                    return (
                                        <div
                                            key={th}
                                            onClick={() => selectTheme(th)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                padding: '11px 14px',
                                                borderBottom: idx < themeList.length - 1 ? '1px solid var(--color-border, rgba(0,0,0,0.06))' : 'none',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.95rem', color: 'var(--color-text)', fontWeight: 500 }}>
                                                {th}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-supporting)', background: 'var(--color-bg, rgba(0,0,0,0.05))', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                                                    {count}
                                                </span>
                                                <ChevronRight size={16} style={{ color: 'var(--color-supporting)' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {themes.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--color-supporting)', marginTop: '20px', fontSize: '0.9rem' }}>
                            {t('library', 'aucunTheme')}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const displayTitle = selectedTheme === '__favoris__' ? t('library', 'favoris') : selectedTheme;

    const filteredProverbs = searchQuery.trim()
        ? themeProverbs.filter(p => {
            const normQ = normalizeText(searchQuery.trim());
            return normalizeText(p.text).includes(normQ) || normalizeText(notes[p.id] || '').includes(normQ);
        })
        : themeProverbs;

    return (
        <div className={`fade-enter ${isVisible ? 'fade-enter-active' : ''}`} style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button className="btn-ghost" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', color: 'var(--color-secondary)', padding: '6px 0' }}>
                    {fromValidation ? t('library', 'retourAccueil') : t('library', 'retourThemes')}
                </button>
                {selectedTheme !== '__favoris__' && (
                    <button
                        className="btn-ghost"
                        onClick={() => deleteTheme(selectedTheme)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--color-supporting)',
                            fontSize: '0.85rem',
                            padding: '6px 8px'
                        }}
                        aria-label={t('library', 'supprimer')}
                        title={t('library', 'supprimer')}
                    >
                        <Trash2 size={16} />
                        <span>{t('library', 'supprimer')}</span>
                    </button>
                )}
            </div>

            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px' }}>{displayTitle}</h2>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-supporting)' }} />
                <input
                    type="search"
                    name="no_autofill_search"
                    id="no_autofill_search"
                    autoComplete="one-time-code"
                    aria-autocomplete="none"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    onBlur={(e) => e.target.setAttribute('readonly', 'readonly')}
                    placeholder={t('library', 'rechercherPlaceholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '34px', fontSize: '0.9rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredProverbs.map(p => {
                    const isFav = favorites.includes(p.id);
                    const note = notes[p.id];
                    return (
                        <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', lineHeight: '1.6' }}>"{p.text}"</p>
                            {note && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--color-supporting)', borderLeft: '2px solid var(--color-supporting)', paddingLeft: '10px', fontStyle: 'normal' }}>
                                    {note}
                                </p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>{p.reference}</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {onEditProverb && (
                                        <button
                                            onClick={() => onEditProverb(p.id)}
                                            style={{ color: 'var(--color-supporting)', padding: '4px' }}
                                            aria-label={t('library', 'editer')}
                                        >
                                            <Edit3 size={17} />
                                        </button>
                                    )}
                                    <button onClick={() => toggleFavorite(p.id)} style={{ color: isFav ? '#d32f2f' : 'var(--color-supporting)' }} aria-label="Toggle Favorite">
                                        <Heart size={20} fill={isFav ? '#d32f2f' : 'none'} color={isFav ? '#d32f2f' : 'currentColor'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredProverbs.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-supporting)' }}>
                        {searchQuery.trim() ? t('library', 'aucunResultat') : t('library', 'aucunProverbe')}
                    </p>
                )}
            </div>
        </div>
    );
}
