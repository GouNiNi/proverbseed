import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const proverbsFr = require('../../src/data/proverbs_fr.json');
const proverbsEn = require('../../src/data/proverbs_en.json');

describe('Data — Intégrité des proverbes FR et EN', () => {
    it('les fichiers de proverbes ne sont pas vides et contiennent au moins 500 entrées', () => {
        assert.ok(Array.isArray(proverbsFr) && proverbsFr.length >= 500, `Proverbes FR invalides : ${proverbsFr.length}`);
        assert.ok(Array.isArray(proverbsEn) && proverbsEn.length >= 500, `Proverbes EN invalides : ${proverbsEn.length}`);
    });

    it('le même nombre de proverbes existe en français et en anglais', () => {
        assert.strictEqual(
            proverbsFr.length,
            proverbsEn.length,
            `Nombre différent de proverbes: FR=${proverbsFr.length} vs EN=${proverbsEn.length}`
        );
    });

    it('chaque proverbe possède une structure valide (id, reference, text, verses)', () => {
        for (const [index, p] of proverbsFr.entries()) {
            assert.ok(p.id !== undefined && p.id !== null, `ID manquant à l'index ${index} (FR)`);
            assert.ok(typeof p.reference === 'string' && p.reference.length > 0, `Référence invalide pour id ${p.id}`);
            assert.ok(typeof p.text === 'string' && p.text.trim().length > 0, `Texte vide pour id ${p.id}`);
            assert.ok(Array.isArray(p.verses) && p.verses.length > 0, `Versets invalides pour id ${p.id}`);
            assert.ok(p.verses.every(v => typeof v === 'number' && Number.isInteger(v)), `Versets non entiers pour id ${p.id}`);
        }

        for (const [index, p] of proverbsEn.entries()) {
            assert.ok(p.id !== undefined && p.id !== null, `ID manquant à l'index ${index} (EN)`);
            assert.ok(typeof p.reference === 'string' && p.reference.length > 0, `Référence invalide pour id ${p.id}`);
            assert.ok(typeof p.text === 'string' && p.text.trim().length > 0, `Texte vide pour id ${p.id}`);
            assert.ok(Array.isArray(p.verses) && p.verses.length > 0, `Versets invalides pour id ${p.id}`);
        }
    });

    it('tous les identifiants de proverbes sont uniques', () => {
        const frIds = new Set();
        for (const p of proverbsFr) {
            assert.ok(!frIds.has(p.id), `ID dupliqué détecté dans proverbs_fr : ${p.id}`);
            frIds.add(p.id);
        }

        const enIds = new Set();
        for (const p of proverbsEn) {
            assert.ok(!enIds.has(p.id), `ID dupliqué détecté dans proverbs_en : ${p.id}`);
            enIds.add(p.id);
        }
    });

    it('les identifiants correspondent exactement entre FR et EN dans le même ordre', () => {
        for (let i = 0; i < proverbsFr.length; i++) {
            assert.strictEqual(
                proverbsFr[i].id,
                proverbsEn[i].id,
                `Désalignement d'ID à l'index ${i}: FR=${proverbsFr[i].id} vs EN=${proverbsEn[i].id}`
            );
        }
    });

    it('les références bibliques suivent le schéma attendu', () => {
        const refPatternFr = /^Proverbes\s+\d+:\d+(?:-\d+)?$/;
        const refPatternEn = /^Proverbs\s+\d+:\d+(?:-\d+)?$/;

        for (const p of proverbsFr) {
            assert.match(
                p.reference,
                refPatternFr,
                `Référence FR mal formatée : "${p.reference}" (id: ${p.id})`
            );
        }

        for (const p of proverbsEn) {
            assert.match(
                p.reference,
                refPatternEn,
                `Référence EN mal formatée : "${p.reference}" (id: ${p.id})`
            );
        }
    });
});
