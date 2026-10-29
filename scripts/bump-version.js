import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const versionFilePath = path.join(rootDir, '.version');
const packageJsonPath = path.join(rootDir, 'package.json');

let currentVersion = '0.0.0';

if (fs.existsSync(versionFilePath)) {
    currentVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
} else if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    currentVersion = packageJson.version || '0.0.0';
}

let arg = process.argv[2];

if (!arg) {
    console.error('Usage: npm run bump-version <micro|mineur|majeur|patch|minor|major|x.y.z>');
    process.exit(1);
}

export function calculateNextVersion(currentVersion, bumpTypeOrVersion) {
    const norm = (bumpTypeOrVersion || '').toLowerCase();
    const parts = currentVersion.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`Current version '${currentVersion}' is not valid semver (x.y.z)`);
    }

    if (['patch', 'micro'].includes(norm)) {
        parts[2]++;
        return parts.join('.');
    } else if (['minor', 'mineur'].includes(norm)) {
        parts[1]++;
        parts[2] = 0;
        return parts.join('.');
    } else if (['major', 'majeur', 'majeure'].includes(norm)) {
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        return parts.join('.');
    }

    if (!/^\d+\.\d+\.\d+$/.test(bumpTypeOrVersion)) {
        throw new Error(`Invalid version or bump type: '${bumpTypeOrVersion}'. Expected micro|patch, mineur|minor, majeur|major, or x.y.z`);
    }
    return bumpTypeOrVersion;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
    try {
        const newVersion = calculateNextVersion(currentVersion, arg);
        console.log(`Auto-incrementing: ${currentVersion} -> ${newVersion}`);

        // 1. Update .version (Single Source of Truth)
        fs.writeFileSync(versionFilePath, newVersion + '\n');
        console.log(`✅ .version updated to ${newVersion}`);

        // 2. Reminder for GEMINI.md / CLAUDE.md
        const geminiPath = path.join(rootDir, 'GEMINI.md');
        if (fs.existsSync(geminiPath)) {
            console.log(`⚠️  N'oubliez pas de mettre à jour l'historique dans GEMINI.md si nécessaire.`);
        }

        console.log(`\n🎉 Version bump to ${newVersion} complete!`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}
