import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useTranslation, translations } from '../../src/i18n/translations.js';

describe('i18n — useTranslation', () => {
    it('traduit correctement une clé existante en français', () => {
        const t = useTranslation('fr');
        assert.strictEqual(t('home', 'valider'), 'Valider');
        assert.strictEqual(t('library', 'title'), 'Bibliothèque');
        assert.strictEqual(t('settings', 'title'), 'Réglages');
    });

    it('traduit correctement une clé existante en anglais', () => {
        const t = useTranslation('en');
        assert.strictEqual(t('home', 'valider'), 'Save');
        assert.strictEqual(t('library', 'title'), 'Library');
        assert.strictEqual(t('settings', 'title'), 'Settings');
    });

    it('utilise le français comme fallback si la langue demandée est inconnue', () => {
        const t = useTranslation('es');
        assert.strictEqual(t('home', 'valider'), 'Valider');
    });

    it('retourne section.key si la clé est absente des deux langues', () => {
        const t = useTranslation('fr');
        assert.strictEqual(t('home', 'cleInexistante'), 'home.cleInexistante');
        assert.strictEqual(t('sectionInexistante', 'key'), 'sectionInexistante.key');
    });
});

describe('i18n — Cohérence et parité fr / en', () => {
    it('possède les mêmes sections de premier niveau en fr et en en', () => {
        const frSections = Object.keys(translations.fr).sort();
        const enSections = Object.keys(translations.en).sort();
        assert.deepStrictEqual(frSections, enSections);
    });

    it('possède les mêmes clés sous chaque section pour fr et en', () => {
        const sections = Object.keys(translations.fr);
        for (const section of sections) {
            const frKeys = Object.keys(translations.fr[section]).sort();
            const enKeys = Object.keys(translations.en[section]).sort();
            assert.deepStrictEqual(
                enKeys,
                frKeys,
                `La section '${section}' n'a pas les mêmes clés entre fr et en`
            );
        }
    });

    it('vérifie que settings.days contient exactement 7 jours dans chaque langue', () => {
        assert.strictEqual(translations.fr.settings.days.length, 7);
        assert.strictEqual(translations.en.settings.days.length, 7);
    });

    it('vérifie qu\'aucune valeur de traduction n\'est vide ou indéfinie', () => {
        for (const lang of ['fr', 'en']) {
            for (const section of Object.keys(translations[lang])) {
                for (const [key, value] of Object.entries(translations[lang][section])) {
                    if (Array.isArray(value)) {
                        assert.ok(value.length > 0, `Tableau vide dans ${lang}.${section}.${key}`);
                    } else {
                        assert.ok(
                            typeof value === 'string' && value.trim().length > 0,
                            `Valeur vide ou non-string dans ${lang}.${section}.${key}`
                        );
                    }
                }
            }
        }
    });
});
