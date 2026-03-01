import React, { useState, useEffect, useRef } from 'react';
import { dbStore, dbOptions } from '../data/db';
import { Download, Upload } from 'lucide-react';

export default function SettingsView() {
    const fileInputRef = useRef(null);
    const [settings, setSettings] = useState({
        categorizationAid: false,
        notificationsEnabled: false,
        notificationTime: '08:00',
        notificationDays: [1, 2, 3, 4, 5, 6, 0] // 0 is Sunday
    });
    const [loading, setLoading] = useState(true);

    const DAYS = [
        { label: 'L', value: 1 },
        { label: 'M', value: 2 },
        { label: 'M', value: 3 },
        { label: 'J', value: 4 },
        { label: 'V', value: 5 },
        { label: 'S', value: 6 },
        { label: 'D', value: 0 }
    ];

    useEffect(() => {
        dbStore.getItem(dbOptions.SETTINGS).then((dbSettings) => {
            if (dbSettings) {
                setSettings(dbSettings);
            }
            setLoading(false);
        });
    }, []);

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await dbStore.setItem(dbOptions.SETTINGS, newSettings);
    };

    const toggleDay = async (dayValue) => {
        const currentDays = settings.notificationDays || [];
        const newDays = currentDays.includes(dayValue)
            ? currentDays.filter(d => d !== dayValue)
            : [...currentDays, dayValue];

        updateSetting('notificationDays', newDays);
    };

    const handleExport = async () => {
        try {
            const themes = await dbStore.getItem(dbOptions.USER_THEMES) || [];
            const cat = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
            const fav = await dbStore.getItem(dbOptions.FAVORITES) || [];
            const notes = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
            const stats = await dbStore.getItem(dbOptions.USER_STATS) || {};
            const set = await dbStore.getItem(dbOptions.SETTINGS) || {};

            const exportData = {
                version: "1.0",
                date: new Date().toISOString(),
                proverbseed_backup: {
                    user_themes: themes,
                    categorized_proverbs: cat,
                    favorites: fav,
                    meditation_notes: notes,
                    user_stats: stats,
                    settings: set
                }
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `proverbseed_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            alert('Export réussi !');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'export');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const json = JSON.parse(text);

            if (!json.proverbseed_backup) {
                throw new Error('Format de fichier invalide');
            }

            const backup = json.proverbseed_backup;

            const confirmImport = window.confirm("Attention : l'import écrasera toutes vos données actuelles. Continuer ?");
            if (!confirmImport) return;

            await dbStore.setItem(dbOptions.USER_THEMES, backup.user_themes || []);
            await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, backup.categorized_proverbs || {});
            await dbStore.setItem(dbOptions.FAVORITES, backup.favorites || []);
            await dbStore.setItem(dbOptions.MEDITATION_NOTES, backup.meditation_notes || {});
            await dbStore.setItem(dbOptions.USER_STATS, backup.user_stats || {});
            await dbStore.setItem(dbOptions.SETTINGS, backup.settings || {});

            alert('Import réussi ! L\'application va redémarrer.');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'import : ' + err.message);
        }
    };

    if (loading) return <div></div>;

    return (
        <div className="fade-enter fade-enter-active" style={{ paddingBottom: '40px' }}>
            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>Réglages</h2>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Aide à la catégorisation (Suggestions)</span>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.categorizationAid}
                        onChange={(e) => updateSetting('categorizationAid', e.target.checked)}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notifications Quotidiennes (Android)</span>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.notificationsEnabled}
                        onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                    />
                </div>

                {settings.notificationsEnabled && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Heure du rappel</span>
                            <input
                                type="time"
                                value={settings.notificationTime}
                                onChange={(e) => updateSetting('notificationTime', e.target.value)}
                                style={{ width: 'auto', padding: '6px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-supporting)' }}>Jours de rappel</span>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                                {DAYS.map(day => {
                                    const isSelected = (settings.notificationDays || []).includes(day.value);
                                    return (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(day.value)}
                                            style={{
                                                width: '32px', height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                                color: isSelected ? 'white' : 'var(--color-supporting)',
                                                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-supporting)'}`
                                            }}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <h3 className="title-font" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '20px' }}>Sauvegarde</h3>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-supporting)', fontSize: '0.9rem' }}>
                    Exportez et importez vos données personnelles. Le texte biblique n'est pas inclus.
                </p>
                <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                    <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                        <Download size={18} /> Exporter
                    </button>
                    <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                        <Upload size={18} /> Importer
                    </button>
                </div>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImport}
                />
            </div>
        </div>
    );
}
