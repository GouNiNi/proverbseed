/**
 * Normalise une chaîne de caractères en retirant les diacritiques (accents) et en la passant en minuscules.
 * Exemple: "Écôle" -> "ecole"
 * @param {string} str 
 * @returns {string}
 */
export function normalizeText(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Filtre et trie les étiquettes suggérées selon la saisie utilisateur.
 * Le filtre est insensible aux accents et à la casse.
 * Les correspondances par début de mot (startsWith) sont triées en premier.
 * 
 * @param {Array<string>} allThemes Liste complète des étiquettes créées
 * @param {string} query Saisie utilisateur
 * @param {Array<string>} currentThemes Étiquettes déjà sélectionnées
 * @param {number} maxResults Nombre maximal de suggestions (5 par défaut)
 * @returns {Array<string>}
 */
export function filterAndSortTagSuggestions(allThemes = [], query = '', currentThemes = [], maxResults = 5) {
    const normQuery = normalizeText(query.trim());
    if (!normQuery) return [];

    // Exclure les thèmes déjà appliqués
    const candidates = allThemes.filter(th => !currentThemes.includes(th));

    // Filtrer par sous-chaîne (includes) insensible aux accents et majuscules
    const matches = candidates.filter(th => normalizeText(th).includes(normQuery));

    // Trier : début de mot (startsWith) d'abord
    matches.sort((a, b) => {
        const normA = normalizeText(a);
        const normB = normalizeText(b);
        const aStartsWith = normA.startsWith(normQuery);
        const bStartsWith = normB.startsWith(normQuery);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    return maxResults ? matches.slice(0, maxResults) : matches;
}

/**
 * Résout une étiquette saisie par rapport aux étiquettes existantes.
 * Si la saisie correspond à 100% (hors accents et casse) à une étiquette existante,
 * on réutilise la version existante (avec sa casse et ses accents d'origine).
 * Sinon, on conserve la saisie exacte.
 * 
 * Exemple:
 * input "ecole", existing ["École"] -> retourne "École"
 * input "eco", existing ["École"] -> retourne "eco"
 * 
 * @param {string} inputVal 
 * @param {Array<string>} allThemes 
 * @returns {string}
 */
export function resolveTagWithExisting(inputVal = '', allThemes = []) {
    const trimmed = inputVal.trim();
    if (!trimmed) return '';

    const normInput = normalizeText(trimmed);
    const exactMatch = allThemes.find(th => normalizeText(th) === normInput);

    return exactMatch || trimmed;
}
