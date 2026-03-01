import React, { useState, useEffect, useRef } from 'react';
import { getRandomUncategorizedProverb, dbOptions, dbStore, getProverbById } from '../data/db';
import { Heart, Check, Hash, Edit3, ArrowRight } from 'lucide-react';

export default function HomeView() {
    const [proverb, setProverb] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [settings, setSettings] = useState({ categorizationAid: false });

    const [isFavorite, setIsFavorite] = useState(false);
    const [currentThemes, setCurrentThemes] = useState([]);
    const [themeInput, setThemeInput] = useState('');
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);

    // Auto-complete
    const [allUserThemes, setAllUserThemes] = useState([]);

    // Navigation History for Swipe
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Swipe handlers
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) handleNext(); // swipe left -> next
        if (isRightSwipe) handlePrev(); // swipe right -> prev
    };

    useEffect(() => {
        const init = async () => {
            const s = await dbStore.getItem(dbOptions.SETTINGS);
            if (s) setSettings(s);

            const themes = await dbStore.getItem(dbOptions.USER_THEMES) || [];
            setAllUserThemes(themes);

            await fetchNewProverb();
        };
        init();
    }, []);

    // Fetch and sync UI state for a given proverb object
    const applyProverbState = async (p) => {
        if (!p) {
            setProverb(null);
            setLoading(false);
            return;
        }

        const favStore = await dbStore.getItem(dbOptions.FAVORITES) || [];
        const catStore = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
        const noteStore = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};

        setProverb(p);
        setIsFavorite(favStore.includes(p.id));
        setCurrentThemes(catStore[p.id] || []);
        setNote(noteStore[p.id] || '');
        setThemeInput('');
        setShowNote(noteStore[p.id] ? true : false);
        setLoading(false);
        setIsFading(false);
        setTimeout(() => setShowContent(true), 50);
    };

    const fetchNewProverb = async () => {
        setIsFading(true);
        setTimeout(async () => {
            try {
                const p = await getRandomUncategorizedProverb();
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
            // we have next in history
            setTimeout(() => {
                const nextIndex = historyIndex + 1;
                setHistoryIndex(nextIndex);
                applyProverbState(history[nextIndex]);
            }, 500);
        } else {
            // need to fetch new
            fetchNewProverb();
        }
    };

    const handlePrev = () => {
        if (isFading || loading) return;
        if (historyIndex > 0) {
            setShowContent(false);
            setIsFading(true);
            setTimeout(() => {
                const prevIndex = historyIndex - 1;
                setHistoryIndex(prevIndex);
                applyProverbState(history[prevIndex]);
            }, 500);
        }
    };

    const handleAddThemeLocal = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const val = themeInput.trim();
            if (val && !currentThemes.includes(val)) {
                setCurrentThemes([...currentThemes, val]);
            }
            setThemeInput('');
        }
    };

    const handleRemoveTheme = (theme) => {
        setCurrentThemes(currentThemes.filter(t => t !== theme));
    };

    const handleSave = async () => {
        if (!proverb) return;

        // Auto-add text input if they forgot to press enter
        const pendingInput = themeInput.trim();
        let finalThemes = [...currentThemes];
        if (pendingInput && !finalThemes.includes(pendingInput)) {
            finalThemes.push(pendingInput);
            setCurrentThemes(finalThemes);
            setThemeInput('');
        }

        try {
            // Save logic runs parallel to fade transition
            const saveLogic = async () => {
                // Save categories
                if (finalThemes.length > 0) {
                    const catStore = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
                    catStore[proverb.id] = finalThemes;
                    await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, catStore);

                    const allThm = await dbStore.getItem(dbOptions.USER_THEMES) || [];
                    const newThm = [...new Set([...allThm, ...finalThemes])];
                    await dbStore.setItem(dbOptions.USER_THEMES, newThm);
                    setAllUserThemes(newThm); // Update auto-complete cache
                }

                // Save favorite
                let favStore = await dbStore.getItem(dbOptions.FAVORITES) || [];
                if (isFavorite && !favStore.includes(proverb.id)) {
                    favStore.push(proverb.id);
                } else if (!isFavorite && favStore.includes(proverb.id)) {
                    favStore = favStore.filter(id => id !== proverb.id);
                }
                await dbStore.setItem(dbOptions.FAVORITES, favStore);

                // Save notes
                const noteStore = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
                if (note.trim()) {
                    noteStore[proverb.id] = note.trim();
                } else {
                    delete noteStore[proverb.id];
                }
                await dbStore.setItem(dbOptions.MEDITATION_NOTES, noteStore);
            };

            await saveLogic();

            // Go to next
            handleNext();

        } catch (err) {
            console.error("Save error:", err);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    if (loading) return null;

    if (!proverb) return (
        <div style={{ textAlign: 'center', marginTop: '50px', opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
            <h2 className="title-font" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>Accompli !</h2>
            <p style={{ color: 'var(--color-supporting)', marginTop: '20px' }}>Vous avez médité sur tous les proverbes.</p>
        </div>
    );

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
                display: 'flex', flexDirection: 'column',
                minHeight: '85vh', position: 'relative'
            }}
        >

            {/* Stable Header (Does not fade) */}
            <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '10px' }}>
                <h2 className="title-font" style={{ fontSize: '2rem', color: 'var(--color-supporting)', opacity: 0.6, letterSpacing: '2px' }}>Graine du Jour</h2>
            </div>

            {/* Proverb Content Area (Centered) */}
            <div style={{
                display: 'flex', flexDirection: 'column', flex: 1,
                justifyContent: 'center', alignItems: 'center',
                paddingBottom: '220px' // Space for fixed bottom blocks
            }}>
                {/* Central Verse Presentation (Fading) */}
                <div style={{
                    position: 'relative', width: '100%', textAlign: 'center',
                    opacity: showContent && !isFading ? 1 : 0,
                    transition: 'opacity 0.5s ease'
                }}>
                    <p style={{
                        fontSize: '1.9rem',
                        margin: '0 0 24px',
                        fontStyle: 'italic',
                        fontWeight: '400',
                        lineHeight: '1.5',
                        color: 'var(--color-text)'
                    }}>
                        "{proverb.text}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', position: 'relative' }}>
                        <span style={{ color: 'var(--color-supporting)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {proverb.reference}
                        </span>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            style={{ color: isFavorite ? '#d32f2f' : 'var(--color-supporting)', padding: '5px' }}
                            aria-label="Toggle Favorite"
                        >
                            <Heart size={22} fill={isFavorite ? '#d32f2f' : 'none'} color={isFavorite ? '#d32f2f' : 'currentColor'} strokeWidth={1.5} />
                        </button>

                        {/* Discreet Arrow to skip/next */}
                        <button
                            onClick={handleNext}
                            style={{ position: 'absolute', right: '0', color: 'var(--color-supporting)', opacity: 0.5, transition: 'opacity 0.5s' }}
                            aria-label="Passer"
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                        >
                            <ArrowRight size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Anchored Bottom Blocks (Fixed) */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, paddingBottom: '24px', zIndex: 10 }}>
                {/* Discrete Categorization Area (Stable structure) */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    padding: '0 24px',
                    marginBottom: '10px'
                }}>
                    {/* Current Tags (Fading) */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '8px',
                        opacity: showContent && !isFading ? 1 : 0,
                        transition: 'opacity 0.5s ease'
                    }}>
                        {currentThemes.map(t => (
                            <span key={t} style={{
                                backgroundColor: 'rgba(163, 177, 138, 0.2)', color: 'var(--color-secondary)', padding: '4px 12px',
                                borderRadius: '99px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                                border: '1px solid rgba(163, 177, 138, 0.3)'
                            }}>
                                {t} <button onClick={() => handleRemoveTheme(t)} style={{ color: 'var(--color-secondary)', marginLeft: '4px', fontSize: '10px' }}>✕</button>
                            </span>
                        ))}
                    </div>

                    {/* Input field (Stable) */}
                    <div style={{ display: 'flex', gap: '8px', opacity: 0.8 }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Hash size={14} style={{ position: 'absolute', left: '12px', color: 'var(--color-supporting)' }} />
                            <input
                                type="text"
                                placeholder="Étiqueter ce proverbe..."
                                value={themeInput}
                                onChange={e => setThemeInput(e.target.value)}
                                onKeyDown={handleAddThemeLocal}
                                style={{
                                    paddingLeft: '34px', background: 'transparent',
                                    border: 'none', borderBottom: '1px solid var(--color-supporting)',
                                    borderRadius: 0, fontSize: '0.9rem', color: 'var(--color-secondary)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Autocomplete / Suggestions (Fading) */}
                    <div style={{
                        opacity: showContent && !isFading ? 1 : 0,
                        transition: 'opacity 0.5s ease',
                        minHeight: (themeInput.trim().length > 1 || (settings.categorizationAid && proverb.suggestions?.length > 0)) ? 'auto' : '0'
                    }}>
                        {themeInput.trim().length > 1 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {allUserThemes
                                    .filter(t => t.toLowerCase().includes(themeInput.trim().toLowerCase()) && !currentThemes.includes(t))
                                    .slice(0, 5)
                                    .map((t, i) => (
                                        <span key={`auto-${i}`} onClick={() => { setCurrentThemes([...currentThemes, t]); setThemeInput(''); }}
                                            style={{ cursor: 'pointer', border: '1px dotted var(--color-supporting)', padding: '2px 8px', borderRadius: '12px' }}>
                                            + {t}
                                        </span>
                                    ))}
                            </div>
                        )}

                        {settings.categorizationAid && proverb.suggestions && proverb.suggestions.length > 0 && themeInput.trim().length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-supporting)', display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: 0.8 }}>
                                Suggestions :
                                {proverb.suggestions.map((sugg, i) => (
                                    <span key={i} onClick={() => { if (!currentThemes.includes(sugg)) setCurrentThemes([...currentThemes, sugg]) }}
                                        style={{ cursor: 'pointer', borderBottom: '1px dotted var(--color-supporting)', paddingBottom: '1px' }}>
                                        + {sugg}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Note Area (Stable structure) */}
                    <div style={{ marginTop: '0px' }}>
                        {showNote ? (
                            <div style={{
                                opacity: showContent && !isFading ? 1 : 0,
                                transition: 'opacity 0.5s ease'
                            }}>
                                <textarea
                                    rows="2"
                                    placeholder="Qu'est-ce que ce proverbe vous inspire ?"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--color-supporting)',
                                        borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--color-secondary)',
                                        width: '100%'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '0px' }}>
                                <button className="btn-ghost" onClick={() => setShowNote(true)} style={{ fontSize: '0.8rem', opacity: 0.7, padding: '4px 8px' }}>
                                    <Edit3 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                    Ajouter une note
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Actions (Still Fixed at bottom but part of this group) */}
                <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === ''}
                        style={{
                            pointerEvents: 'auto',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: (currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === '') ? 0.3 : 1,
                            backgroundColor: (currentThemes.length === 0 && themeInput.trim() === '' && note.trim() === '') ? 'var(--color-supporting)' : 'var(--color-primary)',
                            transition: 'all 0.5s ease',
                            padding: '12px 32px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Check size={18} /> Valider
                    </button>
                </div>
            </div>
        </div>
    );
}
