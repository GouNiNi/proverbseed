import localforage from 'localforage';
import proverbsFr from './proverbs_fr.json';

let proverbsEn = null;
const loadEnglish = async () => {
    if (!proverbsEn) {
        try {
            proverbsEn = (await import('./proverbs_en.json')).default;
        } catch {
            proverbsEn = proverbsFr; // fallback
        }
    }
    return proverbsEn;
};

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
    language: 'fr',
    categorizationAid: false,
    singleVerseOnly: false,
    sequentialMode: false,
    revisionMode: false,
    darkMode: false,
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
    try {
        if (!await store.getItem(dbOptions.USER_THEMES))
            await store.setItem(dbOptions.USER_THEMES, []);

        const currentSettings = await store.getItem(dbOptions.SETTINGS);
        if (!currentSettings) {
            await store.setItem(dbOptions.SETTINGS, defaultSettings);
        } else {
            // Migrate older settings: ensure new keys exist
            const merged = { ...defaultSettings, ...currentSettings };
            await store.setItem(dbOptions.SETTINGS, merged);
        }

        if (!await store.getItem(dbOptions.USER_STATS))
            await store.setItem(dbOptions.USER_STATS, defaultStats);
        if (!await store.getItem(dbOptions.CATEGORIZED_PROVERBS))
            await store.setItem(dbOptions.CATEGORIZED_PROVERBS, {});
        if (!await store.getItem(dbOptions.FAVORITES))
            await store.setItem(dbOptions.FAVORITES, []);
        if (!await store.getItem(dbOptions.MEDITATION_NOTES))
            await store.setItem(dbOptions.MEDITATION_NOTES, {});
    } catch (error) {
        console.error("[db.js] error inside initDB:", error);
        throw error;
    }
};

export const getAllProverbs = async (language = 'fr') => {
    if (language === 'en') return await loadEnglish();
    return proverbsFr;
};

export const getProverbById = async (id, language = 'fr') => {
    const data = await getAllProverbs(language);
    return data.find(p => p.id === id) || null;
};

export const getRandomUncategorizedProverb = async ({ language = 'fr', singleVerseOnly = false, sequential = false, revisionMode = false } = {}) => {
    const data = await getAllProverbs(language);
    const categorized = await store.getItem(dbOptions.CATEGORIZED_PROVERBS) || {};
    const categorizedIds = Object.keys(categorized);

    let pool = revisionMode ? [...data] : data.filter(p => !categorizedIds.includes(p.id));

    if (singleVerseOnly) {
        pool = pool.filter(p => p.verses && p.verses.length === 1);
    }

    if (pool.length === 0) return null;

    if (sequential) return pool[0];
    return pool[Math.floor(Math.random() * pool.length)];
};

export const dbStore = store;
