/**
 * Utilitaires d'exportation, d'importation et de validation de schéma de sauvegarde ProverbSeed (PRO-001).
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
