import React, { useState, useEffect, useContext } from 'react';
import { getRandomUncategorizedProverb, getAllProverbs, dbOptions, dbStore, getProverbById } from '../data/db';
import { Heart, Check, Edit3, ArrowRight, Plus, X } from 'lucide-react';
import { LanguageContext } from '../i18n/LanguageContext';
import { useT } from '../i18n/LanguageContext';

// Returns font size based on character length of the proverb text
function getProverbFontSize(textLength) {
    if (textLength < 120) return '1.87rem';
    if (textLength < 200) return '1.53rem';
    if (textLength < 320) return '1.27rem';
    if (textLength < 480) return '1.06rem';
    return '0.94rem';
}

export default function HomeView({ pendingEditId = null, onClearPendingEdit = null }) {
    const language = useContext(LanguageContext);
    const t = useT();

    const [proverb, setProverb] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [settings, setSettings] = useState({ categorizationAid: false, singleVerseOnly: false, sequentialMode: false, revisionMode: false });
    const [progressStats, setProgressStats] = useState({ done: 0, total: 0 });

    const [isFavorite, setIsFavorite] = useState(false);
    const [currentThemes, setCurrentThemes] = useState([]);
    const [themeInput, setThemeInput] = useState('');
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);

    const [allUserThemes, setAllUserThemes] = useState([]);
    const [isInputFocused, setIsInputFocused] = useState(false);

    useEffect(() => {
        if (isInputFocused) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
        return () => document.body.classList.remove('keyboard-open');
    }, [isInputFocused]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempModalThemes, setTempModalThemes] = useState([]);

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Swipe handlers
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) handleNext();
        if (distance < -minSwipeDistance) handlePrev();
    };

    useEffect(() => {
        const init = async () => {
            const s = await dbStore.getItem(dbOptions.SETTINGS);
            if (s) setSettings(s);
            const themes = await dbStore.getItem(dbOptions.USER_THEMES) || [];
            setAllUserThemes(themes);
            // Reset navigation history when language changes
            setHistory([]);
            setHistoryIndex(-1);
            if (pendingEditId) {
                const p = await getProverbById(pendingEditId, language);
                if (onClearPendingEdit) onClearPendingEdit();
                await applyProverbState(p);
            } else {
                await fetchNewProverb(s);
            }
        };
        init();
    }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

    const applyProverbState = async (p) => {
        if (!p) { setProverb(null); setLoading(false); return; }
        const favStore = await dbStore.getItem(dbOptions.FAVORITES) || [];
        const catStore = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
        const noteStore = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
        const allData = await getAllProverbs(language);
        setProgressStats({ done: Object.keys(catStore).length, total: allData.length });
        setProverb(p);
        setIsFavorite(favStore.includes(p.id));
        setCurrentThemes(catStore[p.id] || []);
        setNote(noteStore[p.id] || '');
        setThemeInput('');
        setShowNote(!!noteStore[p.id]);
        setLoading(false);
        setIsFading(false);
        setTimeout(() => setShowContent(true), 50);
    };

    const persistThemes = async (themes) => {
        if (!proverb) return;
        try {
            const catStore = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
            if (themes.length > 0) {
                catStore[proverb.id] = themes;
            } else {
                delete catStore[proverb.id];
            }
            await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, catStore);

            const allThm = await dbStore.getItem(dbOptions.USER_THEMES) || [];
            const newAllThm = [...new Set([...allThm, ...themes])];
            await dbStore.setItem(dbOptions.USER_THEMES, newAllThm);
            setAllUserThemes(newAllThm);

            const allData = await getAllProverbs(language);
            setProgressStats({ done: Object.keys(catStore).length, total: allData.length });
        } catch (err) {
            console.error("Error persisting themes:", err);
        }
    };

    const toggleFavorite = async () => {
        if (!proverb) return;
        const newFav = !isFavorite;
        setIsFavorite(newFav);
        try {
            let favStore = await dbStore.getItem(dbOptions.FAVORITES) || [];
            if (newFav && !favStore.includes(proverb.id)) {
                favStore.push(proverb.id);
            } else if (!newFav) {
                favStore = favStore.filter(id => id !== proverb.id);
            }
            await dbStore.setItem(dbOptions.FAVORITES, favStore);
        } catch (err) {
            console.error("Error persisting favorite:", err);
        }
    };

    const fetchNewProverb = async (settingsOverride) => {
        setIsFading(true);
        const s = settingsOverride || settings;
        setTimeout(async () => {
            try {
                const p = await getRandomUncategorizedProverb({
                    language,
                    singleVerseOnly: s?.singleVerseOnly || false,
                    randomMode: s?.randomMode || false,
                });
                if (p) {
                    setHistory(prev => [...prev, p]);
                    setHistoryIndex(prev => prev + 1);
                }
                await applyProverbState(p);
            } catch (err) {
                console.error("Error fetching proverb:", err);
                setLoading(false);
                setIsFading(false);
            }
        }, 500);
    };

    const handleNext = () => {
        if (isFading || loading) return;
        setShowContent(false);
        setIsFading(true);
        if (historyIndex < history.length - 1) {
            setTimeout(() => {
                const nextIndex = historyIndex + 1;
                setHistoryIndex(nextIndex);
                applyProverbState(history[nextIndex]);
            }, 500);
        } else {
            fetchNewProverb();
        }
    };

    const handlePrev = () => {
        if (isFading || loading || historyIndex <= 0) return;
        setShowContent(false);
        setIsFading(true);
        setTimeout(() => {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            applyProverbState(history[prevIndex]);
        }, 500);
    };

    const handleAddThemeLocal = async (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const val = themeInput.trim();
            if (val && !currentThemes.includes(val)) {
                const newThemes = [...currentThemes, val];
                setCurrentThemes(newThemes);
                await persistThemes(newThemes);
            }
            setThemeInput('');
        }
    };

    const handleRemoveTheme = async (theme) => {
        const newThemes = currentThemes.filter(t => t !== theme);
        setCurrentThemes(newThemes);
        await persistThemes(newThemes);
    };

    const handleSave = async () => {
        if (!proverb) return;
        const pendingInput = themeInput.trim();
        let finalThemes = [...currentThemes];
        if (pendingInput && !finalThemes.includes(pendingInput)) {
            finalThemes.push(pendingInput);
            setCurrentThemes(finalThemes);
            setThemeInput('');
            await persistThemes(finalThemes);
        }
        try {
            // Favorite is already handled by toggleFavorite, but we ensure it's synced if needed
            // Actually handleSave is the "final validation" for the note and moving forward
            const noteStore = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
            if (note.trim()) { noteStore[proverb.id] = note.trim(); }
            else { delete noteStore[proverb.id]; }
            await dbStore.setItem(dbOptions.MEDITATION_NOTES, noteStore);
            handleNext();
        } catch (err) {
            console.error("Save error:", err);
            alert(language === 'en' ? "Save error." : "Erreur lors de la sauvegarde.");
        }
    };

    const openModal = () => {
        setTempModalThemes([...currentThemes]);
        setIsModalOpen(true);
    };

    const toggleModalTheme = (theme) => {
        if (tempModalThemes.includes(theme)) {
            setTempModalThemes(tempModalThemes.filter(t => t !== theme));
        } else {
            setTempModalThemes([...tempModalThemes, theme]);
        }
    };

    const saveModalThemes = async () => {
        setCurrentThemes(tempModalThemes);
        await persistThemes(tempModalThemes);
        setIsModalOpen(false);
    };

    if (loading) return null;

    const isMultiVerse = (proverb?.verses?.length ?? 1) > 1;
    const fontSize = getProverbFontSize(proverb?.text?.length ?? 0);

    if (!proverb) return (
        <div style={{ textAlign: 'center', marginTop: '50px', opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
            <h2 className="title-font" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>{t('home', 'accompli')}</h2>
            <p style={{ color: 'var(--color-supporting)', marginTop: '20px' }}>{t('home', 'tousMediates')}</p>
        </div>
    );

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: isInputFocused ? 'auto' : '85vh', 
                position: 'relative',
                paddingBottom: isInputFocused ? '40px' : '0'
            }}
        >
            {/* Stable Header */}
            {!isInputFocused && (
                <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '10px' }}>
                    <h2 className="title-font" style={{ fontSize: '2rem', color: 'var(--color-supporting)', opacity: 0.6, letterSpacing: '2px' }}>
                        {t('home', 'graineDuJour')}
                    </h2>
                </div>
            )}

            {/* Proverb Content Area */}
            <div style={{
                display: 'flex', flexDirection: 'column', 
                flex: isInputFocused ? 'none' : 1,
                justifyContent: isInputFocused ? 'flex-start' : 'center', 
                alignItems: 'center',
                paddingTop: isInputFocused ? '20px' : '80px',
                paddingBottom: isInputFocused ? '40px' : '220px'
            }}>
                <div style={{
                    position: 'relative', width: '100%', textAlign: 'center',
                    opacity: showContent && !isFading ? 1 : 0,
                    transition: 'opacity 0.5s ease'
                }}>
                    <p style={{
                        fontSize: fontSize,
                        margin: '0 0 24px',
                        fontStyle: 'italic',
                        fontWeight: '400',
                        lineHeight: isMultiVerse ? '1.6' : '1.5',
                        color: 'var(--color-text)',
                        whiteSpace: 'pre-line',
                    }}>
                        "{proverb.text}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', position: 'relative' }}>
                        <span style={{ color: 'var(--color-supporting)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {proverb.reference}
                        </span>
                        <button
                            onClick={toggleFavorite}
                            style={{ color: isFavorite ? '#d32f2f' : 'var(--color-supporting)', padding: '5px' }}
                            aria-label="Toggle Favorite"
                        >
                            <Heart size={22} fill={isFavorite ? '#d32f2f' : 'none'} color={isFavorite ? '#d32f2f' : 'currentColor'} strokeWidth={1.5} />
                        </button>

                        <button
                            onClick={handleNext}
                            style={{ position: 'absolute', right: '0', color: 'var(--color-supporting)', opacity: 0.5, transition: 'opacity 0.5s' }}
                            aria-label={t('home', 'passer')}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                        >
                            <ArrowRight size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Anchored Bottom Blocks */}
            <div style={{ 
                position: isInputFocused ? 'relative' : 'fixed', 
                bottom: 0, left: 0, right: 0, 
                paddingBottom: '24px', 
                zIndex: 10 
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 24px', marginBottom: '10px' }}>
                    {/* Progress Counter */}
                    {progressStats.total > 0 && !isInputFocused && (
                        <div style={{
                            textAlign: 'right', fontSize: '0.7rem',
                            color: 'var(--color-supporting)', opacity: 0.75, letterSpacing: '1px'
                        }}>
                            {progressStats.done} / {progressStats.total}
                        </div>
                    )}
                    {/* Current Tags */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '8px',
                        opacity: showContent && !isFading ? 1 : 0,
                        transition: 'opacity 0.5s ease'
                    }}>
                        {currentThemes.map(theme => (
                            <span key={theme} style={{
                                backgroundColor: 'rgba(163, 177, 138, 0.2)', color: 'var(--color-secondary)', padding: '4px 12px',
                                borderRadius: '99px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                                border: '1px solid rgba(163, 177, 138, 0.3)'
                            }}>
                                {theme} <button onClick={() => handleRemoveTheme(theme)} style={{ color: 'var(--color-secondary)', marginLeft: '4px', fontSize: '10px' }}>✕</button>
                            </span>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '8px', opacity: 0.8 }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={openModal}
                                style={{ position: 'absolute', left: '12px', color: 'var(--color-supporting)', padding: '4px' }}
                            >
                                <Plus size={16} />
                            </button>
                            <input
                                type="text"
                                placeholder={t('home', 'etiqueter')}
                                value={themeInput}
                                onChange={e => setThemeInput(e.target.value)}
                                onKeyDown={handleAddThemeLocal}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                style={{
                                    paddingLeft: '40px', paddingRight: '40px', background: 'transparent',
                                    border: 'none', borderBottom: '1px solid var(--color-supporting)',
                                    borderRadius: 0, fontSize: '0.9rem', color: 'var(--color-secondary)'
                                }}
                            />
                            <button
                                onMouseDown={(e) => { 
                                    if (currentThemes.length > 0 || themeInput.trim() !== '' || note.trim() !== '') {
                                        e.preventDefault(); 
                                        handleSave(); 
                                    }
                                }}
                                disabled={currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === ''}
                                style={{ 
                                    position: 'absolute', right: '12px', padding: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%',
                                    backgroundColor: (currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === '') ? 'transparent' : 'var(--color-primary)',
                                    color: (currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === '') ? 'var(--color-supporting)' : '#fff',
                                    opacity: (currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === '') ? 0.3 : 1,
                                    transition: 'all 0.5s ease',
                                    boxShadow: (currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === '') ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Check size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Autocomplete / Suggestions */}
                    <div style={{
                        opacity: showContent && !isFading ? 1 : 0,
                        transition: 'opacity 0.5s ease',
                        minHeight: (themeInput.trim().length > 1 || (settings.categorizationAid && proverb.suggestions?.length > 0)) ? 'auto' : '0'
                    }}>
                        {themeInput.trim().length > 1 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {allUserThemes
                                    .filter(th => th.toLowerCase().includes(themeInput.trim().toLowerCase()) && !currentThemes.includes(th))
                                    .slice(0, 5)
                                    .map((th, i) => (
                                        <span key={`auto-${i}`} onClick={() => {
                                            const newThemes = [...currentThemes, th];
                                            setCurrentThemes(newThemes);
                                            setThemeInput('');
                                            persistThemes(newThemes);
                                        }}
                                            style={{ cursor: 'pointer', border: '1px dotted var(--color-supporting)', padding: '2px 8px', borderRadius: '12px' }}>
                                            + {th}
                                        </span>
                                    ))}
                            </div>
                        )}

                        {settings.categorizationAid && proverb.suggestions?.length > 0 && themeInput.trim().length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-supporting)', display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: 0.8 }}>
                                {t('home', 'suggestions')}
                                {proverb.suggestions.map((sugg, i) => (
                                    <span key={i} onClick={() => {
                                        if (!currentThemes.includes(sugg)) {
                                            const newThemes = [...currentThemes, sugg];
                                            setCurrentThemes(newThemes);
                                            persistThemes(newThemes);
                                        }
                                    }}
                                        style={{ cursor: 'pointer', borderBottom: '1px dotted var(--color-supporting)', paddingBottom: '1px' }}>
                                        + {sugg}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Note Area */}
                    <div style={{ marginTop: '0px' }}>
                        {showNote ? (
                            <div style={{ opacity: showContent && !isFading ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                                <textarea
                                    rows="2"
                                    placeholder={t('home', 'notePlaceholder')}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--color-supporting)',
                                        borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--color-secondary)',
                                        width: '100%'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <button className="btn-ghost" onClick={() => setShowNote(true)} style={{ fontSize: '0.8rem', opacity: 0.7, padding: '4px 8px' }}>
                                    <Edit3 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                    {t('home', 'ajouterNote')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Themes Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="title-font" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>Étiquettes</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--color-supporting)', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {allUserThemes.length === 0 ? (
                                <p style={{ color: 'var(--color-supporting)', fontSize: '0.9rem', textAlign: 'center', width: '100%' }}>
                                    Aucune étiquette créée pour le moment.
                                </p>
                            ) : (
                                allUserThemes.map(theme => {
                                    const isSelected = tempModalThemes.includes(theme);
                                    return (
                                        <button
                                            key={theme}
                                            onClick={() => toggleModalTheme(theme)}
                                            style={{
                                                backgroundColor: isSelected ? 'rgba(163, 177, 138, 0.4)' : 'transparent',
                                                color: isSelected ? 'var(--color-secondary)' : 'var(--color-text)',
                                                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-supporting)'}`,
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            {theme} {isSelected && <Check size={14} />}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <button className="btn-primary" onClick={saveModalThemes} style={{ width: '100%', justifyContent: 'center' }}>
                            Valider
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
