/**
 * Utilitaires d'exportation, d'importation et de validation de schéma de sauvegarde ProverbSeed (PRO-001 & PRO-012).
 */

/**
 * Construit le payload JSON standardisé d'export de sauvegarde.
 */
export function createBackupPayload({
    user_themes = [],
    categorized_proverbs = {},
    favorites = [],
    meditation_notes = {},
    user_stats = {},
    settings = {}
} = {}) {
    return {
        version: "1.1",
        date: new Date().toISOString(),
        proverbseed_backup: {
            user_themes: Array.isArray(user_themes) ? user_themes : [],
            categorized_proverbs: (categorized_proverbs && typeof categorized_proverbs === 'object' && !Array.isArray(categorized_proverbs)) ? categorized_proverbs : {},
            favorites: Array.isArray(favorites) ? favorites : [],
            meditation_notes: (meditation_notes && typeof meditation_notes === 'object' && !Array.isArray(meditation_notes)) ? meditation_notes : {},
            user_stats: (user_stats && typeof user_stats === 'object' && !Array.isArray(user_stats)) ? user_stats : {},
            settings: (settings && typeof settings === 'object' && !Array.isArray(settings)) ? settings : {}
        }
    };
}

/**
 * Valide et assainit le contenu d'un fichier de sauvegarde JSON.
 * Lève une erreur explicite si la structure de base n'est pas respectée.
 * 
 * @param {any} json Objet désérialisé depuis le fichier JSON
 * @returns {{ user_themes: string[], categorized_proverbs: Record<string, string[]>, favorites: any[], meditation_notes: Record<string, string>, user_stats: object, settings: object }}
 */
export function validateBackup(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
        throw new Error('Format de fichier invalide : le contenu doit être un objet JSON');
    }

    const backup = json.proverbseed_backup;
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
        throw new Error("Format de sauvegarde invalide : propriété 'proverbseed_backup' manquante");
    }

    const user_themes = Array.isArray(backup.user_themes)
        ? backup.user_themes.filter(t => typeof t === 'string' && t.trim().length > 0)
        : [];

    const categorized_proverbs = {};
    if (backup.categorized_proverbs && typeof backup.categorized_proverbs === 'object' && !Array.isArray(backup.categorized_proverbs)) {
        for (const [id, thList] of Object.entries(backup.categorized_proverbs)) {
            if (Array.isArray(thList)) {
                categorized_proverbs[id] = thList.filter(t => typeof t === 'string');
            }
        }
    }

    const favorites = Array.isArray(backup.favorites) ? backup.favorites : [];

    const meditation_notes = {};
    if (backup.meditation_notes && typeof backup.meditation_notes === 'object' && !Array.isArray(backup.meditation_notes)) {
        for (const [id, note] of Object.entries(backup.meditation_notes)) {
            if (typeof note === 'string') {
                meditation_notes[id] = note;
            }
        }
    }

    const user_stats = (backup.user_stats && typeof backup.user_stats === 'object' && !Array.isArray(backup.user_stats))
        ? backup.user_stats
        : {};

    const settings = (backup.settings && typeof backup.settings === 'object' && !Array.isArray(backup.settings))
        ? backup.settings
        : {};

    return {
        user_themes,
        categorized_proverbs,
        favorites,
        meditation_notes,
        user_stats,
        settings
    };
}

/**
 * Vérifie si l'API File System Access (showSaveFilePicker) est disponible.
 * Permet à l'utilisateur de choisir l'emplacement de destination exact (Google Drive monté, etc.).
 */
export function isSaveFilePickerSupported() {
    return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
}

/**
 * Vérifie si la Web Share API est supportée pour le partage de fichiers JSON.
 */
export function isShareSupported() {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
    if (typeof File === 'undefined') return false;
    try {
        const testFile = new File(['{}'], 'test.json', { type: 'application/json' });
        return Boolean(navigator.canShare && navigator.canShare({ files: [testFile] }));
    } catch {
        return false;
    }
}

/**
 * Détermine si au moins un moyen de sauvegarde interactif (sélecteur de fichier ou partage OS) est disponible.
 */
export function isCloudOrSystemSaveSupported() {
    return isSaveFilePickerSupported() || isShareSupported();
}

/**
 * Exporte la sauvegarde :
 * 1. En priorité via showSaveFilePicker (si supporté) pour choisir l'emplacement exact (Drive, dossier, etc.).
 * 2. En relais via navigator.share (Web Share API) pour ouvrir la feuille de partage OS ("Enregistrer dans Drive").
 * 3. En téléchargement direct si forceDownload est vrai ou si aucune API interactive n'est supportée.
 * 
 * @param {object} backupPayload 
 * @param {{ forceDownload?: boolean }} options 
 * @returns {Promise<{ method: 'picker' | 'share' | 'download', success: boolean, cancelled?: boolean, error?: string }>}
 */
export async function exportBackup(backupPayload, { forceDownload = false } = {}) {
    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `proverbseed_backup_${dateStr}.json`;

    // 1. Sauvegarde interactive (Picker de fichiers OS ou Partage natif Cloud)
    if (!forceDownload) {
        // A. File System Access API (permet de choisir l'emplacement exact dans Google Drive ou sur le disque)
        if (isSaveFilePickerSupported()) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'Sauvegarde ProverbSeed (JSON)',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(jsonStr);
                await writable.close();
                return { method: 'picker', success: true };
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    return { method: 'picker', success: false, cancelled: true };
                }
                // Si showSaveFilePicker échoue (ex: non supporté sur ce contexte), tenter le partage natif ci-dessous
                console.warn('showSaveFilePicker a échoué, essai avec le partage natif:', err);
            }
        }

        // B. Web Share API (ouvre la feuille de partage OS avec l'option "Enregistrer dans Drive", "Fichiers", etc.)
        if (isShareSupported()) {
            try {
                const file = new File([jsonStr], fileName, { type: 'application/json' });
                await navigator.share({
                    title: 'ProverbSeed Backup',
                    text: `Sauvegarde ProverbSeed du ${dateStr}`,
                    files: [file]
                });
                return { method: 'share', success: true };
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    return { method: 'share', success: false, cancelled: true };
                }
                console.error('Erreur lors du partage système:', err);
                return { method: 'share', success: false, error: err?.message || 'Erreur inconnue' };
            }
        }
    }

    // 2. Téléchargement direct (choisi explicitement via Télécharger ou si aucune API moderne n'est disponible)
    if (typeof document !== 'undefined') {
        try {
            const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute("href", url);
            a.setAttribute("download", fileName);
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return { method: 'download', success: true };
        } catch (err) {
            // Repli sur data: URI si createObjectURL échoue
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", fileName);
            document.body.appendChild(a);
            a.click();
            a.remove();
            return { method: 'download', success: true };
        }
    }

    return { method: 'download', success: false };
}

/**
 * Calcule l'ancienneté en jours depuis une date donnée.
 */
export function getElapsedDays(dateString) {
    if (!dateString) return null;
    const time = new Date(dateString).getTime();
    if (isNaN(time)) return null;
    return (Date.now() - time) / (1000 * 60 * 60 * 24);
}

/**
 * Évalue si une sauvegarde est recommandée (pastille orange sur les réglages) :
 * - Vrai si l'utilisateur possède au moins un élément (totalItems > 0)
 *   et que le délai réglé (thresholdDays) est dépassé ou qu'aucune sauvegarde n'a été faite.
 */
export function isBackupRecommended({ lastBackupDate = null, firstActivityDate = null, totalItems = 0, thresholdDays = 14 } = {}) {
    if (!totalItems || totalItems <= 0) return false;
    if (!thresholdDays || thresholdDays <= 0) return false;
    const refDate = lastBackupDate || firstActivityDate;
    if (!refDate) return true;
    const days = getElapsedDays(refDate);
    if (days === null) return true;
    return days >= thresholdDays;
}

/**
 * Évalue si une sauvegarde est urgente (notification in-app déclenchée à 2x le délai réglé) :
 * - Vrai si l'utilisateur possède des données (totalItems > 0)
 *   et qu'aucune sauvegarde n'a été faite depuis au moins 2 * thresholdDays.
 */
export function isBackupUrgent({ lastBackupDate = null, firstActivityDate = null, totalItems = 0, thresholdDays = 14 } = {}) {
    if (!totalItems || totalItems <= 0) return false;
    if (!thresholdDays || thresholdDays <= 0) return false;
    const refDate = lastBackupDate || firstActivityDate;
    if (!refDate) return false;
    const days = getElapsedDays(refDate);
    if (days === null) return false;
    return days >= (2 * thresholdDays);
}

/**
 * Formate l'ancienneté de la dernière sauvegarde en texte lisible.
 */
export function formatLastBackupDate(lastBackupDate, t) {
    if (!lastBackupDate) return null;
    const time = new Date(lastBackupDate).getTime();
    if (isNaN(time)) return null;
    const diffDays = Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
        return t ? t('settings', 'aujourdhui') : "Aujourd'hui";
    }
    if (diffDays === 1) {
        return t ? t('settings', 'hier') : 'Hier';
    }
    return t ? t('settings', 'ilYA').replace('{days}', diffDays.toString()) : `Il y a ${diffDays} jours`;
}
