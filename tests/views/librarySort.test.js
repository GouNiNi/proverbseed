import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('LibraryView — Tri alphabétique des thèmes', () => {
    const sortThemes = (themes, language = 'fr') => {
        return [...themes].sort((a, b) => a.localeCompare(b, language === 'fr' ? 'fr' : 'en'));
    };

    it('intercale les mots accentués avec leurs lettres de base correspondantes', () => {
        const input = [
            'Zèbre',
            'Éducation',
            'école',
            'eau',
            'Effort',
            'enfant',
            'arbre',
            'amour'
        ];

        const sorted = sortThemes(input, 'fr');

        // 'arbre' et 'amour' doivent être au début
        assert.ok(sorted.indexOf('amour') < sorted.indexOf('eau'));
        assert.ok(sorted.indexOf('arbre') < sorted.indexOf('eau'));

        // 'eau', 'école', 'Éducation', 'Effort', 'enfant' doivent être groupés sous 'e'
        assert.ok(sorted.indexOf('eau') < sorted.indexOf('école'));
        assert.ok(sorted.indexOf('école') < sorted.indexOf('Éducation'));
        assert.ok(sorted.indexOf('Éducation') < sorted.indexOf('Effort'));
        assert.ok(sorted.indexOf('Effort') < sorted.indexOf('enfant'));

        // 'Zèbre' doit être en fin de liste, et les accents NE DOIVENT PAS être après 'Zèbre'
        assert.strictEqual(sorted[sorted.length - 1], 'Zèbre');
        assert.ok(sorted.indexOf('Éducation') < sorted.indexOf('Zèbre'));
        assert.ok(sorted.indexOf('école') < sorted.indexOf('Zèbre'));
    });

    it('gère correctement les accents variés de la langue française', () => {
        const input = [
            'Vérité',
            'Âme',
            'action',
            'Cœur',
            'courage',
            'Île',
            'image',
            'Épreuve'
        ];

        const sorted = sortThemes(input, 'fr');

        // Âme avec action
        assert.ok(Math.abs(sorted.indexOf('action') - sorted.indexOf('Âme')) === 1);
        // Île avec image
        assert.ok(Math.abs(sorted.indexOf('Île') - sorted.indexOf('image')) === 1);
        // Vérité est vers la fin mais pas après des mots en Z
        assert.strictEqual(sorted[sorted.length - 1], 'Vérité');
    });

    it('trie également correctement en anglais', () => {
        const input = ['Zebra', 'Education', 'apple', 'Bread'];
        const sorted = sortThemes(input, 'en');
        assert.deepStrictEqual(sorted, ['apple', 'Bread', 'Education', 'Zebra']);
    });
});
