import json
import re
import os

input_file = '/tmp/data-bible/db/seed_data/louis-segond-formatted.json'
output_dir = '/Users/gounini/Documents/proverbseed/src/data'
output_file = os.path.join(output_dir, 'proverbs.json')

os.makedirs(output_dir, exist_ok=True)

with open(input_file, 'r', encoding='utf-8') as f:
    bible = json.load(f)

proverbs_book = None
for testament in bible.get('Testaments', []):
    for book in testament.get('Books', []):
        if 'Proverbes' in book.get('Text', ''):
            proverbs_book = book
            break
    if proverbs_book:
        break

if not proverbs_book:
    print("Could not find Proverbs book")
    exit(1)

themes_keywords = {
    "Sagesse": ["sage", "sagesse", "intelligent", "intelligence", "raison", "sens", "prudent", "prudence"],
    "Parole": ["lèvre", "bouche", "parole", "langue", "mots", "dire", "mensonge", "vérité", "témoin", "répondre"],
    "Travail": ["paresseux", "main", "travail", "agir", "diligent", "ouvrier", "champ", "ouvrage", "moisson"],
    "Richesse": ["riche", "pauvre", "richesse", "argent", "trésor", "indigence", "pauvreté", "or", "cadeau"],
    "Justice": ["juste", "méchant", "justice", "iniquité", "droit", "équité", "pervers", "mal", "bien", "juge"],
    "Famille": ["fils", "père", "mère", "femme", "maison", "enfants", "frère", "parents", "foyer"],
    "Humilité": ["orgueil", "humble", "hautain", "abaissement", "gloire", "fierté", "modestie", "ruine"],
    "Colère": ["colère", "fureur", "lent à", "emportement", "querelle", "fougueux", "insensé", "moqueur", "vengeance"],
    "Amitié": ["ami", "compagnon", "prochain", "voisin"],
    "Dieu": ["éternel", "dieu", "crainte", "seigneur", "tout-puissant"],
    "Discipline": ["instruction", "réprimande", "correction", "verge", "châtiment", "discipline", "conseil", "avertissement"],
    "Coeur": ["coeur", "âme", "esprit", "pensée", "désir", "sentiment"]
}

def categorize_proverb(text):
    text_lower = text.lower()
    suggestions = []
    import unicodedata
    def strip_accents(s):
        return ''.join(c for c in unicodedata.normalize('NFD', s)
                  if unicodedata.category(c) != 'Mn')
    text_stripped = strip_accents(text_lower)
    
    for theme, keywords in themes_keywords.items():
        for keyword in keywords:
            kw = strip_accents(keyword.lower())
            if re.search(r'\b' + kw + r'[a-z]*\b', text_stripped):
                suggestions.append(theme)
                break
    
    if not suggestions:
        suggestions.append("Sagesse") # fallback
    return suggestions

output_data = []

chapters_to_include = list(range(10, 23)) + list(range(25, 30))

for c_idx, chapter in enumerate(proverbs_book.get('Chapters', [])):
    chap_num = c_idx + 1
    if chap_num in chapters_to_include:
        for v_idx, verse in enumerate(chapter.get('Verses', [])):
            v_num = v_idx + 1
            
            # Exclusion condition: 22:17 onwards
            if chap_num == 22 and v_num > 16:
                continue

            text = verse.get('Text', '').strip()
            # Clean verse numbers from text if any, e.g. "1. Mots..."
            text = re.sub(r'^\d+[\s\.]*', '', text)
            
            ref_id = f"PROV_{chap_num}_{v_num}"
            sugg = categorize_proverb(text)
            
            output_data.append({
                "id": ref_id,
                "chapter": int(chap_num),
                "verse": int(v_num),
                "text": text,
                "reference": f"Proverbes {chap_num}:{v_num}",
                "suggestions": sugg
            })

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"Generated {len(output_data)} proverbs and saved to {output_file}")
