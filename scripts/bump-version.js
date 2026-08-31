const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const versionFilePath = path.join(rootDir, '.version');
const packageJsonPath = path.join(rootDir, 'package.json');

let currentVersion = '0.0.0';

if (fs.existsSync(versionFilePath)) {
    currentVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
} else if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    currentVersion = packageJson.version || '0.0.0';
}

let newVersion = process.argv[2];

if (!newVersion) {
    console.error('Usage: node scripts/bump-version.js <new_version | patch | minor | major>');
    process.exit(1);
}

// Semver logic
if (['patch', 'minor', 'major'].includes(newVersion)) {
    const parts = currentVersion.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        console.error(`Error: Current version '${currentVersion}' is not valid semver (x.y.z)`);
        process.exit(1);
    }

    if (newVersion === 'patch') {
        parts[2]++;
    } else if (newVersion === 'minor') {
        parts[1]++;
        parts[2] = 0;
    } else if (newVersion === 'major') {
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
    }
    newVersion = parts.join('.');
    console.log(`Auto-incrementing ${newVersion} (${currentVersion} -> ${newVersion})`);
}

// 1. Update .version (Single Source of Truth)
fs.writeFileSync(versionFilePath, newVersion + '\n');
console.log(`✅ .version updated to ${newVersion}`);

// 2. Update GEMINI.md / CLAUDE.md (History)
const geminiPath = path.join(rootDir, 'GEMINI.md');
if (fs.existsSync(geminiPath)) {
    console.log(`⚠️  N'oubliez pas de mettre à jour l'historique dans GEMINI.md`);
}

console.log(`\n🎉 Version bump to ${newVersion} complete!`);
