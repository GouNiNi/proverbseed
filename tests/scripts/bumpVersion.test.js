import { describe, it } from 'node:test';
import assert from 'node:assert';

function calculateNewVersion(currentVersion, bumpType) {
    if (['patch', 'minor', 'major'].includes(bumpType)) {
        const parts = currentVersion.split('.').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) {
            throw new Error(`Invalid semver: ${currentVersion}`);
        }
        if (bumpType === 'patch') parts[2]++;
        else if (bumpType === 'minor') { parts[1]++; parts[2] = 0; }
        else if (bumpType === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
        return parts.join('.');
    }
    // Explicit version provided
    const parts = bumpType.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`Invalid semver: ${bumpType}`);
    }
    return bumpType;
}

describe('scripts — bump-version semver logic', () => {
    it('calcule correctement un bump patch', () => {
        assert.strictEqual(calculateNewVersion('1.7.0', 'patch'), '1.7.1');
        assert.strictEqual(calculateNewVersion('1.7.9', 'patch'), '1.7.10');
        assert.strictEqual(calculateNewVersion('0.0.1', 'patch'), '0.0.2');
    });

    it('calcule correctement un bump minor', () => {
        assert.strictEqual(calculateNewVersion('1.7.1', 'minor'), '1.8.0');
        assert.strictEqual(calculateNewVersion('1.9.5', 'minor'), '1.10.0');
    });

    it('calcule correctement un bump major', () => {
        assert.strictEqual(calculateNewVersion('1.7.1', 'major'), '2.0.0');
        assert.strictEqual(calculateNewVersion('2.3.4', 'major'), '3.0.0');
    });

    it('accepte une version explicite valide', () => {
        assert.strictEqual(calculateNewVersion('1.7.0', '2.5.0'), '2.5.0');
    });

    it('lève une erreur sur une version invalide', () => {
        assert.throws(() => calculateNewVersion('invalid', 'patch'));
        assert.throws(() => calculateNewVersion('1.0', 'patch'));
        assert.throws(() => calculateNewVersion('1.0.0', 'invalid-version'));
    });
});
