import React, { useState, useEffect, useRef, useContext } from 'react';
import { dbStore, dbOptions } from '../data/db';
import { Download, Upload } from 'lucide-react';
import { LanguageContext } from '../i18n/LanguageContext';
import { useT } from '../i18n/LanguageContext';

export default function SettingsView() {
    const language = useContext(LanguageContext);
    const t = useT();

    const fileInputRef = useRef(null);
    const [settings, setSettings] = useState({
        language: 'fr',
        categorizationAid: false,
        singleVerseOnly: false,
        notificationsEnabled: false,
        notificationTime: '08:00',
        notificationDays: [1, 2, 3, 4, 5, 6, 0],
    });
    const [loading, setLoading] = useState(true);

    const DAYS_VALUES = [1, 2, 3, 4, 5, 6, 0];

    useEffect(() => {
        dbStore.getItem(dbOptions.SETTINGS).then((dbSettings) => {
            if (dbSettings) setSettings(dbSettings);
            setLoading(false);
        });
    }, []);

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await dbStore.setItem(dbOptions.SETTINGS, newSettings);
        if (key === 'language') {
            window.dispatchEvent(new CustomEvent('languageChange', { detail: value }));
        }
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
            const cat    = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
            const fav    = await dbStore.getItem(dbOptions.FAVORITES) || [];
            const notes  = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
            const stats  = await dbStore.getItem(dbOptions.USER_STATS) || {};
            const set    = await dbStore.getItem(dbOptions.SETTINGS) || {};

            const exportData = {
                version: "1.1",
                date: new Date().toISOString(),
                proverbseed_backup: { user_themes: themes, categorized_proverbs: cat, favorites: fav, meditation_notes: notes, user_stats: stats, settings: set }
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `proverbseed_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            alert(t('settings', 'exportSuccess'));
        } catch (err) {
            console.error(err);
            alert(t('settings', 'exportError'));
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (!json.proverbseed_backup) throw new Error('Invalid file format');
            if (!window.confirm(t('settings', 'importConfirm'))) return;

            const backup = json.proverbseed_backup;
            await dbStore.setItem(dbOptions.USER_THEMES, backup.user_themes || []);
            await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, backup.categorized_proverbs || {});
            await dbStore.setItem(dbOptions.FAVORITES, backup.favorites || []);
            await dbStore.setItem(dbOptions.MEDITATION_NOTES, backup.meditation_notes || {});
            await dbStore.setItem(dbOptions.USER_STATS, backup.user_stats || {});
            await dbStore.setItem(dbOptions.SETTINGS, backup.settings || {});
            alert(t('settings', 'importSuccess'));
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(t('settings', 'importError') + err.message);
        }
    };

    if (loading) return <div></div>;

    const days = t('settings', 'days');

    return (
        <div className="fade-enter fade-enter-active" style={{ paddingBottom: '40px' }}>
            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '30px' }}>
                {t('settings', 'title')}
            </h2>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                {/* Language */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('settings', 'langue')}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['fr', 'en'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => updateSetting('language', lang)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    border: `1px solid ${settings.language === lang ? 'var(--color-primary)' : 'var(--color-supporting)'}`,
                                    backgroundColor: settings.language === lang ? 'var(--color-primary)' : 'transparent',
                                    color: settings.language === lang ? 'white' : 'var(--color-supporting)',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {lang === 'fr' ? t('settings', 'francais') : t('settings', 'anglais')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categorization Aid */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('settings', 'aideCatego')}</span>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.categorizationAid}
                        onChange={(e) => updateSetting('categorizationAid', e.target.checked)}
                    />
                </div>

                {/* Single Verse Only */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>{t('settings', 'versetUnique')}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-supporting)' }}>{t('settings', 'versetUniqueDesc')}</span>
                    </div>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.singleVerseOnly}
                        onChange={(e) => updateSetting('singleVerseOnly', e.target.checked)}
                    />
                </div>

                {/* Notifications */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('settings', 'notifications')}</span>
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
                            <span>{t('settings', 'heureRappel')}</span>
                            <input
                                type="time"
                                value={settings.notificationTime}
                                onChange={(e) => updateSetting('notificationTime', e.target.value)}
                                style={{ width: 'auto', padding: '6px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-supporting)' }}>{t('settings', 'joursRappel')}</span>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                                {DAYS_VALUES.map((dayValue, i) => {
                                    const isSelected = (settings.notificationDays || []).includes(dayValue);
                                    return (
                                        <button
                                            key={dayValue}
                                            onClick={() => toggleDay(dayValue)}
                                            style={{
                                                width: '32px', height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                                color: isSelected ? 'white' : 'var(--color-supporting)',
                                                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-supporting)'}`
                                            }}
                                        >
                                            {days[i]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <h3 className="title-font" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '20px' }}>
                {t('settings', 'sauvegarde')}
            </h3>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-supporting)', fontSize: '0.9rem' }}>
                    {t('settings', 'sauvegardeDesc')}
                </p>
                <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                    <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                        <Download size={18} /> {t('settings', 'exporter')}
                    </button>
                    <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                        <Upload size={18} /> {t('settings', 'importer')}
                    </button>
                </div>
                <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                <button className="btn-ghost" onClick={() => window.dispatchEvent(new Event('showTutorial'))} style={{ fontSize: '0.9rem' }}>
                    {t('settings', 'revoir')}
                </button>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                {t('settings', 'version')} {__APP_VERSION__}
            </div>
        </div>
    );
}
