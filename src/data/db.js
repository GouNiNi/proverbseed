import localforage from 'localforage';
import proverbsData from './proverbs.json';

// Initialize the stores
const store = localforage.createInstance({
    name: 'ProverbSeed'
});

export const dbOptions = {
    USER_THEMES: 'user_themes',
    CATEGORIZED_PROVERBS: 'categorized_proverbs',
    FAVORITES: 'favorites',
    MEDITATION_NOTES: 'meditation_notes',
    USER_STATS: 'user_stats',
    SETTINGS: 'settings'
};

const defaultSettings = {
    categorizationAid: false,
    notificationsEnabled: false,
    notificationTime: '08:00',
    notificationDays: [1, 2, 3, 4, 5, 6, 0], // 0 is Sunday
    hasSeenTutorial: false
};

const defaultStats = {
    streak: 0,
    lastPlayedDate: null,
    totalCategorized: 0
};

// Seed or initialize default values if they don't exist
export const initDB = async () => {
    console.log("[db.js] initDB start...");
    try {
        const currentThemes = await store.getItem(dbOptions.USER_THEMES);
        console.log("[db.js] item fetched: USER_THEMES", currentThemes);
        if (!currentThemes) {
            await store.setItem(dbOptions.USER_THEMES, []);
        }

        const currentSettings = await store.getItem(dbOptions.SETTINGS);
        console.log("[db.js] item fetched: SETTINGS", currentSettings);
        if (!currentSettings) {
            await store.setItem(dbOptions.SETTINGS, defaultSettings);
        }

        const currentStats = await store.getItem(dbOptions.USER_STATS);
        console.log("[db.js] item fetched: USER_STATS", currentStats);
        if (!currentStats) {
            await store.setItem(dbOptions.USER_STATS, defaultStats);
        }

        // Ensure arrays/objects exist
        console.log("[db.js] checking CATEGORIZED_PROVERBS...");
        if (!await store.getItem(dbOptions.CATEGORIZED_PROVERBS)) await store.setItem(dbOptions.CATEGORIZED_PROVERBS, {});
        console.log("[db.js] checking FAVORITES...");
        if (!await store.getItem(dbOptions.FAVORITES)) await store.setItem(dbOptions.FAVORITES, []);
        console.log("[db.js] checking MEDITATION_NOTES...");
        if (!await store.getItem(dbOptions.MEDITATION_NOTES)) await store.setItem(dbOptions.MEDITATION_NOTES, {});

        console.log("[db.js] initDB complete!");
    } catch (error) {
        console.error("[db.js] error inside initDB:", error);
        throw error;
    }
};

export const getProverbById = (id) => {
    return proverbsData.find(p => p.id === id);
};

export const getRandomUncategorizedProverb = async () => {
    const categorized = await store.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
    const categorizedIds = Object.keys(categorized);

    const uncategorized = proverbsData.filter(p => !categorizedIds.includes(p.id));

    if (uncategorized.length === 0) {
        return null; // All done!
    }

    const randomIndex = Math.floor(Math.random() * uncategorized.length);
    return uncategorized[randomIndex];
};

export const dbStore = store;
export const allProverbs = proverbsData;
