import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, filterAndSortTagSuggestions } from '../src/utils/textUtils.js';
import { translations } from '../src/i18n/translations.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

test('normalizeText - Supprime les diacritiques et passe en minuscules', () => {
    assert.equal(normalizeText('Écôle'), 'ecole');
    assert.equal(normalizeText('Sagesse & Vérité'), 'sagesse & verite');
    assert.equal(normalizeText(''), '');
    assert.equal(normalizeText(null), '');
});

test('filterAndSortTagSuggestions - Filtre et trie les étiquettes avec pertinence', () => {
    const allThemes = ['Sagesse', 'Sanctification', 'Vérité', 'Patience', 'Foi'];
    
    // Correspondance par préfixe prioritaire
    const suggestions = filterAndSortTagSuggestions(allThemes, 'sa', [], 5);
    assert.equal(suggestions.length, 2);
    assert.equal(suggestions[0], 'Sagesse');
    assert.equal(suggestions[1], 'Sanctification');

    // Exclusion des thèmes déjà sélectionnés
    const filtered = filterAndSortTagSuggestions(allThemes, 'sa', ['Sagesse'], 5);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0], 'Sanctification');

    // Insensibilité aux accents
    const withAccent = filterAndSortTagSuggestions(allThemes, 'verite', [], 5);
    assert.equal(withAccent.length, 1);
    assert.equal(withAccent[0], 'Vérité');
});

test('i18n - Les traductions fr et en contiennent les mêmes clés principales', () => {
    assert.ok(translations.fr);
    assert.ok(translations.en);

    const frKeys = Object.keys(translations.fr).sort();
    const enKeys = Object.keys(translations.en).sort();
    assert.deepEqual(frKeys, enKeys, 'Les fichiers de traduction doivent avoir des clés parfaitement synchronisées');
});

test('.version - Respect du format SemVer SSOT', () => {
    const versionPath = path.join(ROOT_DIR, '.version');
    assert.ok(fs.existsSync(versionPath));
    const version = fs.readFileSync(versionPath, 'utf8').trim();
    assert.match(version, /^\d+\.\d+\.\d+$/);
});
