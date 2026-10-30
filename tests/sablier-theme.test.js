import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('docker-compose - Page d\'attente Sablier : thème geekarea avec nom affiché', () => {
    const compose = fs.readFileSync(path.join(process.cwd(), 'docker-compose.yml'), 'utf8');
    assert.match(compose, /sablier\.dynamic\.theme=geekarea/);
    // sans displayName, Sablier affiche le nom du middleware (ex. proverbseed-sablier@docker)
    assert.match(compose, /sablier\.dynamic\.displayName=ProverbSeed/);
});
