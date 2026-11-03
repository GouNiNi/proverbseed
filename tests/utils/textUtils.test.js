import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeText, filterAndSortTagSuggestions, resolveTagWithExisting, getThemeFirstLetter, groupThemesByLetter } from '../../src/utils/textUtils.js';

describe('textUtils — normalizeText', () => {
    it('gère les entrées vides, null ou undefined', () => {
        assert.strictEqual(normalizeText(''), '');
        assert.strictEqual(normalizeText(null), '');
        assert.strictEqual(normalizeText(undefined), '');
    });

    it('supprime les accents et diacritiques minuscules et majuscules', () => {
        assert.strictEqual(normalizeText('Écôle'), 'ecole');
        assert.strictEqual(normalizeText('À bientôt !'), 'a bientot !');
        assert.strictEqual(normalizeText('Ça va être l\'été'), 'ca va etre l\'ete');
        assert.strictEqual(normalizeText('Où sont les cœurs ?'), 'ou sont les cœurs ?');
    });

    it('convertit tout en minuscules', () => {
        assert.strictEqual(normalizeText('PROVERBE'), 'proverbe');
        assert.strictEqual(normalizeText('SaGeSsE'), 'sagesse');
    });

    it('préserve les chiffres, espaces et la ponctuation', () => {
        assert.strictEqual(normalizeText('Chapitre 10:1-5'), 'chapitre 10:1-5');
    });
});

describe('textUtils — filterAndSortTagSuggestions', () => {
    const allThemes = [
        'Éducation',
        'École',
        'Famille',
        'Grande École',
        'Travail',
        'Paresse',
        'Sagesse',
        'Amour'
    ];

    it('retourne une liste vide si la requête est vide ou ne contient que des espaces', () => {
        assert.deepStrictEqual(filterAndSortTagSuggestions(allThemes, ''), []);
        assert.deepStrictEqual(filterAndSortTagSuggestions(allThemes, '   '), []);
        assert.deepStrictEqual(filterAndSortTagSuggestions(allThemes, null), []);
    });

    it('exclut les thèmes déjà sélectionnés dans currentThemes', () => {
        const results = filterAndSortTagSuggestions(allThemes, 'ecole', ['École']);
        assert.ok(!results.includes('École'));
        assert.ok(results.includes('Grande École'));
    });

    it('filtre indépendamment des accents et de la casse', () => {
        const results = filterAndSortTagSuggestions(allThemes, 'education');
        assert.deepStrictEqual(results, ['Éducation']);

        const results2 = filterAndSortTagSuggestions(allThemes, 'ecole');
        assert.ok(results2.includes('École'));
        assert.ok(results2.includes('Grande École'));
    });

    it('place les correspondances début de mot (startsWith) en premier', () => {
        const results = filterAndSortTagSuggestions(allThemes, 'ecole');
        assert.strictEqual(results[0], 'École');
        assert.strictEqual(results[1], 'Grande École');
    });

    it('respecte le paramètre maxResults', () => {
        const suggestions = ['Amour 1', 'Amour 2', 'Amour 3', 'Amour 4', 'Amour 5', 'Amour 6'];
        const limited = filterAndSortTagSuggestions(suggestions, 'amour', [], 3);
        assert.strictEqual(limited.length, 3);

        const unlimited = filterAndSortTagSuggestions(suggestions, 'amour', [], 0);
        assert.strictEqual(unlimited.length, 6);
    });

    it('retourne une liste vide si aucune étiquette ne correspond', () => {
        const results = filterAndSortTagSuggestions(allThemes, 'introuvable');
        assert.deepStrictEqual(results, []);
    });
});

describe('textUtils — resolveTagWithExisting', () => {
    const allThemes = ['École', 'Éducation', 'Sagesse', 'Paresse'];

    it('résout vers la version existante avec ses accents et sa casse si équivalent', () => {
        assert.strictEqual(resolveTagWithExisting('ecole', allThemes), 'École');
        assert.strictEqual(resolveTagWithExisting('ÉCOLE', allThemes), 'École');
        assert.strictEqual(resolveTagWithExisting('education', allThemes), 'Éducation');
        assert.strictEqual(resolveTagWithExisting('sagesse', allThemes), 'Sagesse');
    });

    it('retourne la valeur saisie nettoyée (trimmed) si pas de correspondance exacte', () => {
        assert.strictEqual(resolveTagWithExisting('eco', allThemes), 'eco');
        assert.strictEqual(resolveTagWithExisting('Nouveau Thème', allThemes), 'Nouveau Thème');
    });

    it('gère les espaces en début et fin de saisie', () => {
        assert.strictEqual(resolveTagWithExisting('  ecole  ', allThemes), 'École');
        assert.strictEqual(resolveTagWithExisting('   nouveau  ', allThemes), 'nouveau');
    });

    it('gère les chaînes vides', () => {
        assert.strictEqual(resolveTagWithExisting('', allThemes), '');
        assert.strictEqual(resolveTagWithExisting('   ', allThemes), '');
    });
});

describe('textUtils — getThemeFirstLetter', () => {
    it('détermine la lettre majuscule de section insensible aux accents', () => {
        assert.strictEqual(getThemeFirstLetter('École'), 'E');
        assert.strictEqual(getThemeFirstLetter('école'), 'E');
        assert.strictEqual(getThemeFirstLetter('Éducation'), 'E');
        assert.strictEqual(getThemeFirstLetter('Âme'), 'A');
        assert.strictEqual(getThemeFirstLetter('amour'), 'A');
        assert.strictEqual(getThemeFirstLetter('Île'), 'I');
        assert.strictEqual(getThemeFirstLetter('Vérité'), 'V');
        assert.strictEqual(getThemeFirstLetter('zèbre'), 'Z');
    });

    it('gère les espaces et caractères spéciaux en début de chaîne', () => {
        assert.strictEqual(getThemeFirstLetter('   Sagesse'), 'S');
        assert.strictEqual(getThemeFirstLetter('123 Thème'), '#');
        assert.strictEqual(getThemeFirstLetter(''), '#');
        assert.strictEqual(getThemeFirstLetter(null), '#');
    });
});

describe('textUtils — groupThemesByLetter', () => {
    it('regroupe les thèmes triés sous leur lettre de base respective', () => {
        const sortedThemes = [
            'action',
            'Âme',
            'amour',
            'eau',
            'École',
            'Éducation',
            'effort',
            'Vérité',
            'zèbre'
        ];

        const grouped = groupThemesByLetter(sortedThemes);

        assert.strictEqual(grouped.length, 4);

        assert.strictEqual(grouped[0].letter, 'A');
        assert.deepStrictEqual(grouped[0].themes, ['action', 'Âme', 'amour']);

        assert.strictEqual(grouped[1].letter, 'E');
        assert.deepStrictEqual(grouped[1].themes, ['eau', 'École', 'Éducation', 'effort']);

        assert.strictEqual(grouped[2].letter, 'V');
        assert.deepStrictEqual(grouped[2].themes, ['Vérité']);

        assert.strictEqual(grouped[3].letter, 'Z');
        assert.deepStrictEqual(grouped[3].themes, ['zèbre']);
    });

    it('gère les entrées vides ou invalides', () => {
        assert.deepStrictEqual(groupThemesByLetter([]), []);
        assert.deepStrictEqual(groupThemesByLetter(null), []);
        assert.deepStrictEqual(groupThemesByLetter(undefined), []);
    });
});
