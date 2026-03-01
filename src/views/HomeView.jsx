import React, { useState, useEffect } from 'react';
import { getRandomUncategorizedProverb, dbOptions, dbStore } from '../data/db';
import { Heart, FastForward, Check, Save, Hash } from 'lucide-react';

export default function HomeView() {
    const [proverb, setProverb] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isFavorite, setIsFavorite] = useState(false);
    const [currentThemes, setCurrentThemes] = useState([]);
    const [themeInput, setThemeInput] = useState('');
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);

    // Load from DB
    const loadProverb = async () => {
        setLoading(true);
        const p = await getRandomUncategorizedProverb();
        setProverb(p);
        setIsFavorite(false);
        setCurrentThemes([]);
        setThemeInput('');
        setNote('');
        setShowNote(false);
        setLoading(false);
    };

    useEffect(() => {
        loadProverb();
    }, []);

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

        // Save themes map
        if (currentThemes.length > 0) {
            const catStore = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS);
            catStore[proverb.id] = currentThemes;
            await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, catStore);

            // Save user_themes globally
            const allThm = await dbStore.getItem(dbOptions.USER_THEMES) || [];
            const newThm = [...new Set([...allThm, ...currentThemes])];
            await dbStore.setItem(dbOptions.USER_THEMES, newThm);
        } else {
            // Must have at least one theme? If not, skip maybe? Or force user to add theme.
            // Assuming specs: we require at least one theme to validate.
            return;
        }

        // Save Favorite
        if (isFavorite) {
            const favStore = await dbStore.getItem(dbOptions.FAVORITES) || [];
            if (!favStore.includes(proverb.id)) {
                favStore.push(proverb.id);
                await dbStore.setItem(dbOptions.FAVORITES, favStore);
            }
        }

        // Save notes
        if (note.trim()) {
            const noteStore = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
            noteStore[proverb.id] = note.trim();
            await dbStore.setItem(dbOptions.MEDITATION_NOTES, noteStore);
        }

        // Load next one
        await loadProverb();
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--color-primary)' }}>Recherche d'une graine...</div>;
    if (!proverb) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Vous avez lu tous les proverbes ! 🎉</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>Graine du Jour</h2>

            <div className="card" style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    style={{ position: 'absolute', top: '16px', right: '16px', color: isFavorite ? '#e57373' : 'var(--color-supporting)' }}>
                    <Heart fill={isFavorite ? '#e57373' : 'none'} />
                </button>

                <p style={{ fontSize: '1.2rem', margin: '24px 0 16px', fontStyle: 'italic', fontWeight: '500' }}>
                    "{proverb.text}"
                </p>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{proverb.reference}</span>
            </div>

            {/* Categorization Input */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentThemes.map(t => (
                        <span key={t} style={{
                            backgroundColor: 'var(--color-primary)', color: 'white', padding: '4px 12px',
                            borderRadius: '99px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            {t} <button onClick={() => handleRemoveTheme(t)} style={{ color: 'white', marginLeft: '4px', fontSize: '12px' }}>✕</button>
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Hash size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-supporting)' }} />
                        <input
                            type="text"
                            placeholder="Ajouter un thème..."
                            value={themeInput}
                            onChange={e => setThemeInput(e.target.value)}
                            onKeyDown={handleAddThemeLocal}
                            style={{ paddingLeft: '34px' }}
                        />
                    </div>
                    <button className="btn-secondary" onClick={handleAddThemeLocal}>+</button>
                </div>

                {/* Suggested themes simply displayed if there is a suggestion system, right now just map them */}
                <div style={{ fontSize: '0.85rem', color: 'var(--color-supporting)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    Suggestions:
                    {proverb.suggestions?.map((sugg, i) => (
                        <span key={i} onClick={() => { if (!currentThemes.includes(sugg)) setCurrentThemes([...currentThemes, sugg]) }}
                            style={{ textDecoration: 'underline', cursor: 'pointer' }}>
                            {sugg}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <button className="btn-ghost" onClick={() => setShowNote(!showNote)}>
                    {showNote ? 'Masquer le journal' : '+ Ajouter une note de méditation'}
                </button>
            </div>

            {showNote && (
                <textarea
                    rows="3"
                    placeholder="Qu'est-ce que ce proverbe vous inspire aujourd'hui ?"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="fade-enter fade-enter-active"
                />
            )}

            {/* Primary Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' }}>
                <button className="btn-ghost" onClick={loadProverb} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FastForward size={18} /> Passer
                </button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={currentThemes.length === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: currentThemes.length === 0 ? 0.5 : 1 }}
                >
                    <Check size={18} /> Valider
                </button>
            </div>
        </div>
    );
}
