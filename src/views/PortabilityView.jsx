import React, { useRef } from 'react';
import { dbStore, dbOptions } from '../data/db';
import { Download, Upload } from 'lucide-react';

export default function PortabilityView() {
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const themes = await dbStore.getItem(dbOptions.USER_THEMES) || [];
            const cat = await dbStore.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
            const fav = await dbStore.getItem(dbOptions.FAVORITES) || [];
            const notes = await dbStore.getItem(dbOptions.MEDITATION_NOTES) || {};
            const stats = await dbStore.getItem(dbOptions.USER_STATS) || {};
            const settings = await dbStore.getItem(dbOptions.SETTINGS) || {};

            const exportData = {
                version: "1.0",
                date: new Date().toISOString(),
                proverbseed_backup: {
                    user_themes: themes,
                    categorized_proverbs: cat,
                    favorites: fav,
                    meditation_notes: notes,
                    user_stats: stats,
                    settings: settings
                }
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `proverbseed_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
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

    return (
        <div className="fade-enter fade-enter-active">
            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px' }}>Sauvegardes</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-supporting)', marginBottom: '30px', fontSize: '0.9rem' }}>
                Exportez et importez vos données personnelles. Le texte biblique n'est pas inclus dans la sauvegarde pour protéger votre vie privée et alléger le fichier.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <button className="btn-primary" onClick={handleExport} style={{ width: '80%', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Download size={20} /> Exporter mes données
                </button>

                <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{ width: '80%', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Upload size={20} /> Importer une sauvegarde
                </button>
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
