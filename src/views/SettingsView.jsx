import React, { useState, useEffect, useRef, useContext } from 'react';
import { dbStore, dbOptions } from '../data/db';
import { Download, Upload, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import { LanguageContext } from '../i18n/LanguageContext';
import { useT } from '../i18n/LanguageContext';
import { createBackupPayload, validateBackup, exportBackup, isCloudOrSystemSaveSupported, isBackupRecommended, formatLastBackupDate } from '../utils/backupUtils';

export default function SettingsView() {
    const language = useContext(LanguageContext);
    const t = useT();

    const fileInputRef = useRef(null);
    const backupPayloadRef = useRef(null);
    const [settings, setSettings] = useState({
        language: 'fr',
        categorizationAid: false,
        singleVerseOnly: false,
        randomMode: false,
        darkMode: false,
        notificationsEnabled: false,
        notificationTime: '08:00',
        notificationDays: [1, 2, 3, 4, 5, 6, 0],
    });
    const [loading, setLoading] = useState(true);
    const [totalDataItems, setTotalDataItems] = useState(0);

    const DAYS_VALUES = [1, 2, 3, 4, 5, 6, 0];

    const refreshBackupData = async () => {
        try {
            const [themes, cat, fav, notes, stats, set] = await Promise.all([
                dbStore.getItem(dbOptions.USER_THEMES) || [],
                dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {},
                dbStore.getItem(dbOptions.FAVORITES) || [],
                dbStore.getItem(dbOptions.MEDITATION_NOTES) || {},
                dbStore.getItem(dbOptions.USER_STATS) || {},
                dbStore.getItem(dbOptions.SETTINGS) || {}
            ]);
            const payload = createBackupPayload({
                user_themes: themes,
                categorized_proverbs: cat,
                favorites: fav,
                meditation_notes: notes,
                user_stats: stats,
                settings: set
            });
            backupPayloadRef.current = payload;
            return payload;
        } catch (err) {
            console.error('Erreur refresh backup:', err);
            return null;
        }
    };

    useEffect(() => {
        Promise.all([
            dbStore.getItem(dbOptions.SETTINGS),
            dbStore.getItem(dbOptions.USER_THEMES),
            dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS),
            dbStore.getItem(dbOptions.FAVORITES),
            dbStore.getItem(dbOptions.MEDITATION_NOTES),
            dbStore.getItem(dbOptions.USER_STATS),
        ]).then(([dbSettings, themes, cat, fav, notes, stats]) => {
            if (dbSettings) setSettings(dbSettings);
            const total = (themes || []).length + Object.keys(cat || {}).length + (fav || []).length + Object.keys(notes || {}).length;
            setTotalDataItems(total);
            backupPayloadRef.current = createBackupPayload({
                user_themes: themes || [],
                categorized_proverbs: cat || {},
                favorites: fav || [],
                meditation_notes: notes || {},
                user_stats: stats || {},
                settings: dbSettings || {}
            });
            setLoading(false);
        });
    }, []);

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (backupPayloadRef.current?.proverbseed_backup) {
            backupPayloadRef.current.proverbseed_backup.settings = newSettings;
        }
        await dbStore.setItem(dbOptions.SETTINGS, newSettings);
        if (key === 'language') {
            window.dispatchEvent(new CustomEvent('languageChange', { detail: value }));
        }
        if (key === 'darkMode') {
            window.dispatchEvent(new CustomEvent('themeChange', { detail: value }));
        }
        if (key === 'notificationsEnabled') {
            if (value) {
                await enableNotifications(newSettings);
            } else {
                await disableNotifications();
            }
        }
        if ((key === 'notificationTime' || key === 'notificationDays') && newSettings.notificationsEnabled) {
            await updateSubscription(newSettings);
        }
    };

    const updateSubscription = async (currentSettings) => {
        try {
            const pushId = await dbStore.getItem('push_subscription_id');
            if (!pushId) return;
            await fetch(`${WORKER_URL}/update-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: pushId,
                    notificationTime: localTimeToUTC(currentSettings.notificationTime),
                    notificationDays: currentSettings.notificationDays,
                    language: currentSettings.language,
                }),
            });
        } catch (err) {
            console.error('Update subscription error:', err);
        }
    };

    const WORKER_URL = 'https://proverbseed-push.jean-daniel-b33.workers.dev';
    const VAPID_PUBLIC_KEY = 'BHivnUd7F8CRAIPzkfUxtWeAjqiaj12YsuPb-DoSf2UYimFAbJaM0QpyIJ_Awnec2nq-ndRhdM_AWuCeQu-GRJE';

    const enableNotifications = async (currentSettings) => {
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert(language === 'en' ? 'Push notifications are not supported by your browser.' : 'Les notifications push ne sont pas supportées par votre navigateur.');
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert(language === 'en' ? 'Notification permission denied. Please enable it in your browser settings.' : 'Permission refusée. Activez les notifications dans les paramètres de votre navigateur.');
            const reverted = { ...currentSettings, notificationsEnabled: false };
            setSettings(reverted);
            await dbStore.setItem(dbOptions.SETTINGS, reverted);
            return;
        }
        await subscribePush(currentSettings);
    };

    const disableNotifications = async () => {
        try {
            const pushId = await dbStore.getItem('push_subscription_id');
            if (pushId) {
                await fetch(`${WORKER_URL}/unsubscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: pushId }),
                });
                await dbStore.removeItem('push_subscription_id');
            }
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();
        } catch { /* ignore */ }
    };

    function localTimeToUTC(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.getUTCHours().toString().padStart(2, '0') + ':' + d.getUTCMinutes().toString().padStart(2, '0');
    }

    const subscribePush = async (currentSettings) => {
        try {
            const reg = await navigator.serviceWorker.ready;
            // Désabonner l'ancien abonnement si existant
            const existing = await reg.pushManager.getSubscription();
            if (existing) await existing.unsubscribe();

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const res = await fetch(`${WORKER_URL}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    notificationTime: localTimeToUTC(currentSettings.notificationTime),
                    notificationDays: currentSettings.notificationDays,
                    language: currentSettings.language,
                }),
            });
            const { id } = await res.json();
            await dbStore.setItem('push_subscription_id', id);
        } catch (err) {
            console.error('Push subscription error:', err);
        }
    };

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
    };

    const toggleDay = async (dayValue) => {
        const currentDays = settings.notificationDays || [];
        const newDays = currentDays.includes(dayValue)
            ? currentDays.filter(d => d !== dayValue)
            : [...currentDays, dayValue];
        updateSetting('notificationDays', newDays);
    };

    const handleExport = async (forceDownload = false) => {
        try {
            // Utiliser immédiatement les données en mémoire si disponibles pour préserver le geste utilisateur
            const exportData = backupPayloadRef.current || await refreshBackupData();
            if (!exportData) {
                alert(t('settings', 'exportError'));
                return;
            }

            const result = await exportBackup(exportData, { forceDownload });
            if (result.cancelled) {
                return;
            }

            if (result.success) {
                const now = new Date().toISOString();
                await updateSetting('lastBackupDate', now);
                alert(t('settings', 'exportSuccess'));
            } else {
                alert(t('settings', 'exportError'));
            }
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
            const backup = validateBackup(json);
            if (!window.confirm(t('settings', 'importConfirm'))) return;

            await dbStore.setItem(dbOptions.USER_THEMES, backup.user_themes);
            await dbStore.setItem(dbOptions.CATEGORIZED_PROVERBS, backup.categorized_proverbs);
            await dbStore.setItem(dbOptions.FAVORITES, backup.favorites);
            await dbStore.setItem(dbOptions.MEDITATION_NOTES, backup.meditation_notes);
            await dbStore.setItem(dbOptions.USER_STATS, backup.user_stats);
            await dbStore.setItem(dbOptions.SETTINGS, backup.settings);
            alert(t('settings', 'importSuccess'));
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(t('settings', 'importError') + err.message);
        }
    };

    if (loading) return <div></div>;

    const days = t('settings', 'days');
    const shareAvailable = isCloudOrSystemSaveSupported();
    const backupRecommended = isBackupRecommended({
        lastBackupDate: settings.lastBackupDate,
        totalItems: totalDataItems,
        thresholdDays: 14
    });
    const lastBackupFormatted = formatLastBackupDate(settings.lastBackupDate, t);

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

                {/* Random Mode */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>{t('settings', 'randomMode')}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-supporting)' }}>{t('settings', 'randomModeDesc')}</span>
                    </div>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.randomMode}
                        onChange={(e) => updateSetting('randomMode', e.target.checked)}
                    />
                </div>

                {/* Continuous Reading On Save */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>{t('settings', 'continuousReadingOnSave')}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-supporting)' }}>{t('settings', 'continuousReadingOnSaveDesc')}</span>
                    </div>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.continuousReadingOnSave ?? true}
                        onChange={(e) => updateSetting('continuousReadingOnSave', e.target.checked)}
                    />
                </div>

                {/* Dark Mode */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('settings', 'darkMode')}</span>
                    <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={settings.darkMode}
                        onChange={(e) => updateSetting('darkMode', e.target.checked)}
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
                                step={300}
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

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
                <p style={{ color: 'var(--color-supporting)', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>
                    {t('settings', 'sauvegardeDesc')}
                </p>

                {/* Statut de dernière sauvegarde & rappel contextuel */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: backupRecommended ? 'rgba(217, 119, 6, 0.08)' : 'var(--color-bg, rgba(0,0,0,0.03))',
                    border: backupRecommended ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid var(--color-border, rgba(0,0,0,0.06))',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {backupRecommended ? (
                            <AlertCircle size={16} color="#d97706" />
                        ) : (
                            <CheckCircle2 size={16} color="var(--color-primary)" />
                        )}
                        <span style={{ color: 'var(--color-text)' }}>
                            <strong>{t('settings', 'derniereSauvegarde')}</strong>{' '}
                            {lastBackupFormatted || t('settings', 'jamaisSauvegarde')}
                        </span>
                    </div>
                    {backupRecommended && (
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#d97706',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {t('settings', 'sauvegardeRecommandee')}
                        </span>
                    )}
                </div>

                {/* Boutons d'action : Partage natif cloud / Télécharger / Importer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    {shareAvailable ? (
                        <>
                            <button
                                className="btn-primary"
                                onClick={() => handleExport(false)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', padding: '12px', fontSize: '0.95rem' }}
                            >
                                <Share2 size={18} /> {t('settings', 'partagerCloud')}
                            </button>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleExport(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                >
                                    <Download size={16} /> {t('settings', 'telecharger')}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                >
                                    <Upload size={16} /> {t('settings', 'importer')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => handleExport(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
                            >
                                <Download size={18} /> {t('settings', 'exporter')}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => fileInputRef.current.click()}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
                            >
                                <Upload size={18} /> {t('settings', 'importer')}
                            </button>
                        </div>
                    )}
                </div>
                <input type="file" accept=".json,application/json,application/*,text/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
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
