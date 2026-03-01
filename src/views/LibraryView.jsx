import React, { useState, useEffect } from 'react';
import { dbStore, dbOptions, allProverbs } from '../data/db';
import { ChevronRight, Trash2 } from 'lucide-react';

export default function LibraryView() {
    const [themes, setThemes] = useState([]);
    const [categorized, setCategorized] = useState({});
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [themeProverbs, setThemeProverbs] = useState([]);

    const loadLibrary = async () => {
        const t = await dbStore.getItem(dbOptions.USER_THEMES) || [];
        const c = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
        setThemes(t.sort());
        setCategorized(c);
    };

    useEffect(() => {
        loadLibrary();
    }, []);

    const selectTheme = (theme) => {
        setSelectedTheme(theme);
        const relatedIds = Object.keys(categorized).filter(id => categorized[id].includes(theme));
        const provs = allProverbs.filter(p => relatedIds.includes(p.id));
        setThemeProverbs(provs);
    };

    const deleteTheme = async (theme) => {
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${theme}" ? Tous les proverbes associés seront dissociés, mais ne seront pas effacés de la base.`);
        if (!confirmDelete) return;

        // Update categorizations
        const newCat = { ...categorized };
        for (const id in newCat) {
            newCat[id] = newCat[id].filter(t => t !== theme);
            if (newCat[id].length === 0) {
                // Optionnel: On pourrait supprimer complètement la clé, ou la laisser vide. Les specs disent "dissocié".
                // S'ils n'ont plus de thème, ils repartent dans le pool aléatoire !
                delete newCat[id];
            }
        }

        // Update themes list
        const newThemes = themes.filter(t => t !== theme);

        await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, newCat);
        await dbStore.setItem(dbOptions.USER_THEMES, newThemes);

        setThemes(newThemes);
        setCategorized(newCat);
        setSelectedTheme(null);
    };

    if (!selectedTheme) {
        return (
            <div className="fade-enter fade-enter-active">
                <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px' }}>Bibliothèque</h2>
                {themes.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-supporting)' }}>Vous n'avez pas encore créé de thèmes.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {themes.map(t => {
                            const count = Object.values(categorized).filter(arr => arr.includes(t)).length;
                            return (
                                <div key={t} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px' }}>
                                    <div onClick={() => selectTheme(t)} style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0 }}>{t} <span style={{ fontSize: '0.8rem', color: 'var(--color-supporting)', fontWeight: 'normal' }}>({count})</span></h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => deleteTheme(t)} style={{ color: 'var(--color-secondary)' }}><Trash2 size={18} /></button>
                                        <ChevronRight size={20} color="var(--color-primary)" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fade-enter fade-enter-active">
            <button className="btn-ghost" onClick={() => setSelectedTheme(null)} style={{ marginBottom: '16px' }}>
                ← Retour aux thèmes
            </button>

            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '20px' }}>{selectedTheme}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {themeProverbs.map(p => (
                    <div key={p.id} className="card" style={{ position: 'relative' }}>
                        <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>"{p.text}"</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>{p.reference}</span>
                        {/* Notes et favoris pourraient être ajoutés en option ici */}
                    </div>
                ))}
            </div>
        </div>
    );
}
