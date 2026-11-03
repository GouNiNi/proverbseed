import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    createBackupPayload,
    validateBackup,
    isSaveFilePickerSupported,
    isShareSupported,
    isCloudOrSystemSaveSupported,
    exportBackup,
    isBackupRecommended,
    isBackupUrgent,
    formatLastBackupDate
} from '../../src/utils/backupUtils.js';

describe('backupUtils — Validation et création de sauvegarde', () => {
    it('génère un payload de sauvegarde valide avec les métadonnées', () => {
        const payload = createBackupPayload({
            user_themes: ['Sagesse', 'Justice'],
            categorized_proverbs: { '1': ['Sagesse'] },
            favorites: [1, 2],
            meditation_notes: { '1': 'Ma note' },
            user_stats: { streak: 5 },
            settings: { language: 'fr' }
        });

        assert.strictEqual(payload.version, '1.1');
        assert.ok(typeof payload.date === 'string');
        assert.deepStrictEqual(payload.proverbseed_backup.user_themes, ['Sagesse', 'Justice']);
        assert.deepStrictEqual(payload.proverbseed_backup.categorized_proverbs, { '1': ['Sagesse'] });
        assert.deepStrictEqual(payload.proverbseed_backup.favorites, [1, 2]);
        assert.deepStrictEqual(payload.proverbseed_backup.meditation_notes, { '1': 'Ma note' });
        assert.strictEqual(payload.proverbseed_backup.user_stats.streak, 5);
        assert.strictEqual(payload.proverbseed_backup.settings.language, 'fr');
    });

    it('génère des valeurs par défaut sûres si les données passées sont nulles ou corrompues', () => {
        const payload = createBackupPayload({
            user_themes: null,
            categorized_proverbs: 'not an object',
            favorites: undefined,
            meditation_notes: 123
        });

        assert.deepStrictEqual(payload.proverbseed_backup.user_themes, []);
        assert.deepStrictEqual(payload.proverbseed_backup.categorized_proverbs, {});
        assert.deepStrictEqual(payload.proverbseed_backup.favorites, []);
        assert.deepStrictEqual(payload.proverbseed_backup.meditation_notes, {});
    });

    it('valide et assainit une sauvegarde correcte', () => {
        const rawJson = {
            version: '1.1',
            date: '2026-11-02T10:00:00Z',
            proverbseed_backup: {
                user_themes: ['Paix', '  ', 'Vérité', 123],
                categorized_proverbs: {
                    '10': ['Paix'],
                    '20': 'invalide'
                },
                favorites: [10, 20],
                meditation_notes: {
                    '10': 'Très beau verset',
                    '20': 456
                },
                user_stats: { total: 42 },
                settings: { darkMode: true }
            }
        };

        const validated = validateBackup(rawJson);

        // Seuls les strings non vides sont gardés dans user_themes
        assert.deepStrictEqual(validated.user_themes, ['Paix', 'Vérité']);
        // '20' n'était pas un tableau donc ignoré
        assert.deepStrictEqual(validated.categorized_proverbs, { '10': ['Paix'] });
        assert.deepStrictEqual(validated.favorites, [10, 20]);
        // Note '20' n'était pas un string donc ignorée
        assert.deepStrictEqual(validated.meditation_notes, { '10': 'Très beau verset' });
        assert.strictEqual(validated.user_stats.total, 42);
        assert.strictEqual(validated.settings.darkMode, true);
    });

    it('rejette les fichiers non JSON ou sans proverbseed_backup', () => {
        assert.throws(() => validateBackup(null), /Format de fichier invalide/);
        assert.throws(() => validateBackup([]), /Format de fichier invalide/);
        assert.throws(() => validateBackup('chaine'), /Format de fichier invalide/);
        assert.throws(() => validateBackup({ autre_chose: true }), /propriété 'proverbseed_backup' manquante/);
        assert.throws(() => validateBackup({ proverbseed_backup: 'pas un objet' }), /propriété 'proverbseed_backup' manquante/);
    });
});

describe('backupUtils — Partage natif et rappel contextuel', () => {
    it('isSaveFilePickerSupported retourne false en environnement Node / sans window.showSaveFilePicker', () => {
        assert.strictEqual(isSaveFilePickerSupported(), false);
    });

    it('isShareSupported retourne false en environnement Node / sans navigator.share', () => {
        assert.strictEqual(isShareSupported(), false);
    });

    it('isCloudOrSystemSaveSupported détecte la présence de picker ou share', () => {
        assert.strictEqual(isCloudOrSystemSaveSupported(), false);
    });

    it('exportBackup sauvegarde avec showSaveFilePicker lorsque supporté', async () => {
        let writtenContent = null;
        let closed = false;

        global.window = {
            showSaveFilePicker: async (options) => {
                assert.ok(options.suggestedName.startsWith('proverbseed_backup_'));
                return {
                    createWritable: async () => ({
                        write: async (content) => { writtenContent = content; },
                        close: async () => { closed = true; }
                    })
                };
            }
        };

        try {
            const payload = createBackupPayload({ user_themes: ['Test'] });
            const result = await exportBackup(payload);

            assert.strictEqual(result.method, 'picker');
            assert.strictEqual(result.success, true);
            assert.ok(writtenContent && writtenContent.includes('Test'));
            assert.strictEqual(closed, true);
        } finally {
            delete global.window;
        }
    });

    it('exportBackup gère l\'annulation utilisateur dans showSaveFilePicker', async () => {
        global.window = {
            showSaveFilePicker: async () => {
                const err = new Error('The user aborted a request.');
                err.name = 'AbortError';
                throw err;
            }
        };

        try {
            const payload = createBackupPayload();
            const result = await exportBackup(payload);

            assert.strictEqual(result.method, 'picker');
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.cancelled, true);
        } finally {
            delete global.window;
        }
    });

    it('exportBackup bascule sur navigator.share si showSaveFilePicker n\'est pas disponible', async () => {
        let sharedData = null;

        global.navigator = {
            share: async (data) => {
                sharedData = data;
            },
            canShare: () => true
        };
        global.File = class MockFile {
            constructor(parts, name, opts) {
                this.parts = parts;
                this.name = name;
                this.opts = opts;
            }
        };

        try {
            const payload = createBackupPayload({ user_themes: ['Partage'] });
            const result = await exportBackup(payload);

            assert.strictEqual(result.method, 'share');
            assert.strictEqual(result.success, true);
            assert.ok(sharedData.files && sharedData.files.length === 1);
            assert.strictEqual(sharedData.title, 'ProverbSeed Backup');
        } finally {
            delete global.navigator;
            delete global.File;
        }
    });

    it('isBackupRecommended évalue la nécessité d\'une sauvegarde selon l\'ancienneté et les données', () => {
        // Aucune donnée créée -> pas de recommandation
        assert.strictEqual(isBackupRecommended({ lastBackupDate: null, totalItems: 0 }), false);

        // Des données créées mais jamais sauvegardé -> recommandation
        assert.strictEqual(isBackupRecommended({ lastBackupDate: null, totalItems: 5 }), true);

        // Sauvegarde récente (< 14 jours) -> pas de recommandation
        const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(isBackupRecommended({ lastBackupDate: recentDate, totalItems: 5, thresholdDays: 14 }), false);

        // Sauvegarde ancienne (> 14 jours) -> recommandation
        const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(isBackupRecommended({ lastBackupDate: oldDate, totalItems: 5, thresholdDays: 14 }), true);

        // Date invalide -> recommandation de sécurité
        assert.strictEqual(isBackupRecommended({ lastBackupDate: 'date_invalide', totalItems: 2 }), true);

        // Désactivé (thresholdDays = 0) -> pas de recommandation
        assert.strictEqual(isBackupRecommended({ lastBackupDate: null, totalItems: 5, thresholdDays: 0 }), false);
    });

    it('isBackupUrgent détecte le doublement du délai réglé pour la notification in-app', () => {
        // Aucune donnée -> jamais urgent
        assert.strictEqual(isBackupUrgent({ lastBackupDate: null, totalItems: 0 }), false);

        // Seuil désactivé (0) -> jamais urgent
        assert.strictEqual(isBackupUrgent({ lastBackupDate: null, totalItems: 5, thresholdDays: 0 }), false);

        // Sauvegarde il y a 15 jours (recommandé si seuil=14, mais pas urgent car < 28 jours)
        const date15j = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(isBackupUrgent({ lastBackupDate: date15j, totalItems: 5, thresholdDays: 14 }), false);

        // Sauvegarde il y a 29 jours (urgent car >= 28 jours)
        const date29j = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(isBackupUrgent({ lastBackupDate: date29j, totalItems: 5, thresholdDays: 14 }), true);

        // Sans sauvegarde, mais première activité récente (< 28 jours) -> pas encore urgent
        const activity10j = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(isBackupUrgent({ lastBackupDate: null, firstActivityDate: activity10j, totalItems: 5, thresholdDays: 14 }), false);

        // Sans sauvegarde, mais première activité ancienne (>= 28 jours) -> urgent
        const activity30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(isBackupUrgent({ lastBackupDate: null, firstActivityDate: activity30j, totalItems: 5, thresholdDays: 14 }), true);
    });

    it('formatLastBackupDate formate correctement l\'ancienneté en texte lisible', () => {
        const mockT = (sec, key) => {
            const dict = {
                aujourdhui: "Aujourd'hui",
                hier: 'Hier',
                ilYA: 'Il y a {days} jours'
            };
            return dict[key] || key;
        };

        assert.strictEqual(formatLastBackupDate(null, mockT), null);
        assert.strictEqual(formatLastBackupDate('invalide', mockT), null);

        const now = new Date().toISOString();
        assert.strictEqual(formatLastBackupDate(now, mockT), "Aujourd'hui");

        const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(formatLastBackupDate(yesterday, mockT), 'Hier');

        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(formatLastBackupDate(fiveDaysAgo, mockT), 'Il y a 5 jours');
    });
});
