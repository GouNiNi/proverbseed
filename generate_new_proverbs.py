#!/usr/bin/env python3
"""
Generate new proverbs_fr.json with:
1. Multi-verse unit support (verses array instead of verse scalar)
2. New chapters 22:17-29, 23, 24 with proper multi-verse groupings
3. Merged multi-verse units in chapters 25-29
"""
import json

# ──────────────────────────────────────────────────────────────────────────────
# Raw verse texts for chapters 22:17-29 (Louis Segond 1910, public domain)
# ──────────────────────────────────────────────────────────────────────────────
CH22_17_29 = {
    17: "Prête l'oreille, écoute les paroles des sages, Et applique ton cœur à ma science.",
    18: "Car il est agréable de les garder en toi, Et qu'elles soient toutes prêtes sur tes lèvres.",
    19: "Afin que ta confiance soit en l'Éternel, Je te les fais connaître aujourd'hui, à toi aussi.",
    20: "Ne t'ai-je pas écrit des choses excellentes, Des conseils et de la science,",
    21: "Pour te faire connaître la certitude des paroles vraies, Afin que tu puisses rapporter des paroles vraies à ceux qui t'envoient ?",
    22: "Ne dépouille pas le malheureux, parce qu'il est malheureux, Et n'écrase pas le pauvre dans la porte ;",
    23: "Car l'Éternel défend leur cause, Et perce d'outre en outre ceux qui les ont percés.",
    24: "Ne te lie pas d'amitié avec l'homme colère, Et ne fréquente pas l'homme emporté,",
    25: "De peur que tu n'apprennes ses voies, Et que tu ne trouves un piège pour ton âme.",
    26: "Ne sois pas de ceux qui donnent des poignées de main, De ceux qui se portent garants pour des dettes.",
    27: "Si tu n'as pas de quoi payer, Pourquoi laisserait-on enlever ton lit de dessous toi ?",
    28: "Ne déplace pas la borne ancienne Que tes pères ont établie.",
    29: "Vois-tu un homme habile dans son travail ? Il se présentera devant les rois, Et ne se présentera pas devant les gens obscurs.",
}

# ──────────────────────────────────────────────────────────────────────────────
# Raw verse texts for chapter 23 (Louis Segond 1910, public domain)
# ──────────────────────────────────────────────────────────────────────────────
CH23 = {
    1:  "Quand tu te mets à table avec un grand, considère bien ce qui est devant toi ;",
    2:  "Et mets un couteau à ta gorge, si tu es homme à te laisser emporter par la gourmandise.",
    3:  "Ne convoite pas ses friandises, car c'est un pain trompeur.",
    4:  "Ne te fatigue pas à vouloir t'enrichir, renonce à tes projets intéressés.",
    5:  "Portes-tu tes regards sur ce qui n'est rien ? Car la richesse se fait certainement des ailes, et comme l'aigle elle s'envole vers le ciel.",
    6:  "Ne mange pas le pain de celui qui a l'œil mauvais, et ne convoite pas ses friandises ;",
    7:  "Car il est comme quelqu'un qui calcule en lui-même. Mange et bois, te dira-t-il ; mais son cœur n'est pas avec toi.",
    8:  "Tu vomiras le peu que tu auras mangé, et tu auras perdu tes aimables paroles.",
    9:  "Ne parle pas aux oreilles de l'insensé, car il méprisera la sagesse de tes discours.",
    10: "Ne déplace pas les anciennes bornes, et n'empiète pas sur le champ des orphelins ;",
    11: "Car leur défenseur est puissant, il plaidera leur cause contre toi.",
    12: "Applique ton cœur à l'instruction, et tes oreilles aux paroles de la science.",
    13: "Ne refuse pas la correction à l'enfant ; si tu le frappes de la verge, il ne mourra pas.",
    14: "Tu le frapperas de la verge, et tu délivreras son âme du séjour des morts.",
    15: "Mon fils, si ton cœur est sage, mon cœur à moi se réjouira ;",
    16: "Mes entrailles tressailliront d'allégresse, quand tes lèvres diront des choses droites.",
    17: "Que ton cœur n'envie pas les pécheurs, mais qu'il soit toujours dans la crainte de l'Éternel ;",
    18: "Car il y a un avenir, et ton espérance ne sera pas anéantie.",
    19: "Écoute, mon fils, sois sage, et dirige ton cœur dans la voie droite.",
    20: "Ne sois pas parmi ceux qui s'enivrent de vin, parmi ceux qui font des excès dans la chair ;",
    21: "Car l'ivrogne et le débauché s'appauvrissent, et la somnolence fait porter des haillons.",
    22: "Écoute ton père, lui qui t'a engendré, et ne méprise pas ta mère quand elle est devenue vieille.",
    23: "Achète la vérité, et ne la vends pas ; achète la sagesse, l'instruction et l'intelligence.",
    24: "Le père d'un juste est dans une grande allégresse, et celui qui engendre un sage se réjouit en lui.",
    25: "Que ton père et ta mère se réjouissent, que celle qui t'a enfanté soit dans l'allégresse !",
    26: "Mon fils, donne-moi ton cœur, et que tes yeux se plaisent dans mes voies.",
    27: "Car la prostituée est une fosse profonde, et l'étrangère est un puits étroit.",
    28: "Elle aussi guette comme un voleur, et elle multiplie parmi les hommes les perfides.",
    29: "À qui sont les malheurs ? À qui les chagrins ? À qui les querelles ? À qui les plaintes ? À qui les blessures sans sujet ? À qui la rougeur des yeux ?",
    30: "À ceux qui s'attardent auprès du vin, à ceux qui vont cherchant du vin mêlé.",
    31: "Ne regarde pas le vin quand il est rouge, quand il brille dans le verre, quand il coule avec douceur.",
    32: "Sa fin est de mordre comme un serpent, et de piquer comme un basilic.",
    33: "Tes yeux verront des choses étranges, et ton cœur parlera avec perversité.",
    34: "Tu seras comme celui qui est couché au milieu de la mer, comme celui qui est couché au sommet d'un mât.",
    35: "On m'a frappé, diras-tu, et je n'ai pas été malade ; on m'a battu, et je ne l'ai pas senti. Quand me réveillerai-je ? J'en veux encore !",
}

# ──────────────────────────────────────────────────────────────────────────────
# Raw verse texts for chapter 24 (Louis Segond 1910, public domain)
# ──────────────────────────────────────────────────────────────────────────────
CH24 = {
    1:  "Ne porte pas envie aux hommes méchants, et ne désire pas être avec eux ;",
    2:  "Car leur cœur médite la violence, et leurs lèvres parlent de faire le mal.",
    3:  "C'est par la sagesse que la maison s'édifie, et c'est par l'intelligence qu'elle s'affermit ;",
    4:  "C'est par la science que les chambres se remplissent de toutes sortes de biens précieux et agréables.",
    5:  "L'homme sage est fort, et l'homme instruit affermit sa vigueur.",
    6:  "Car c'est par des conseils que tu pourras faire la guerre, et avec une multitude de conseillers est le salut.",
    7:  "La sagesse est trop haute pour l'insensé ; il n'ouvre pas la bouche à la porte.",
    8:  "Celui qui médite de faire le mal, on l'appellera homme de mauvais desseins.",
    9:  "La pensée de la folie est péché, et la moquerie est une abomination pour les hommes.",
    10: "Si tu te montres faible au jour de la détresse, ta force est bien petite !",
    11: "Délivre ceux qu'on entraîne à la mort, et ceux qui chancellent vers le supplice, retiens-les.",
    12: "Si tu dis : Nous ne savions pas cela ! celui qui pèse les cœurs ne le verra-t-il pas ? Celui qui surveille ton âme ne le saura-t-il pas ? Et ne rendra-t-il pas à chacun selon ses œuvres ?",
    13: "Mon fils, mange du miel, car il est bon ; le miel de rayons est doux pour ton palais :",
    14: "Ainsi en est-il de la connaissance de la sagesse pour ton âme ; si tu l'as trouvée, il y a un avenir, et ton espérance ne sera pas anéantie.",
    15: "Ne dresse pas de piège contre la demeure du juste, ne dévaste pas le lieu de son repos ;",
    16: "Car le juste tombe sept fois et se relève, mais les méchants s'abîment dans le malheur.",
    17: "Ne te réjouis pas de la chute de ton ennemi, et que ton cœur ne soit pas dans l'allégresse quand il trébuche ;",
    18: "De peur que l'Éternel ne voie et ne le trouve mauvais, et ne détourne de lui sa colère.",
    19: "Ne t'irrite pas à cause des méchants, ne porte pas envie aux impies ;",
    20: "Car il n'y a pas d'avenir pour le méchant ; la lampe des impies s'éteindra.",
    21: "Mon fils, crains l'Éternel et le roi ; ne te joins pas à ceux qui cherchent des changements ;",
    22: "Car leur ruine se lèvera tout à coup, et qui sait le malheur que peuvent causer l'un et l'autre ?",
    23: "Voici encore des sentences des sages : Il n'est pas bien d'avoir égard aux personnes dans les jugements.",
    24: "Celui qui dit au coupable : Tu es innocent ! les peuples le maudiront, les nations l'exécreront ;",
    25: "Mais ceux qui font des réprimandes auront de l'agrément, et sur eux descendra une heureuse bénédiction.",
    26: "On baise les lèvres de celui qui donne une réponse franche.",
    27: "Prépare au dehors ton travail, dispose-le dans ton champ, puis bâtis ta maison.",
    28: "Ne sois pas un témoin sans cause contre ton prochain, et ne le trompe pas de tes lèvres.",
    29: "Ne dis pas : Je lui ferai comme il m'a fait ; je rendrai à chacun selon ses œuvres.",
    30: "Je passai près du champ de l'homme paresseux, et près de la vigne de l'homme dépourvu de sens ;",
    31: "Et voici, les chardons y croissaient partout, les ronces couvraient la superficie, et le mur de pierres était démoli.",
    32: "Je regardai, et j'y appliquai mon cœur ; je vis, et je tirai la leçon.",
    33: "Encore un peu de sommeil, encore un peu d'assoupissement, encore un peu croiser les mains pour dormir !",
    34: "Et la pauvreté viendra comme un vagabond, et la disette comme un homme armé.",
}

# ──────────────────────────────────────────────────────────────────────────────
# Unit definitions: (chapter, [verse_numbers], suggestions)
# Covers new chapters 22:17-29, 23, 24
# ──────────────────────────────────────────────────────────────────────────────
NEW_UNITS = [
    # 22:17-29 — "Paroles des sages" prologue + sayings 1-5
    (22, [17, 18, 19, 20, 21], ["Sagesse", "Instruction"]),
    (22, [22, 23],              ["Justice", "Pauvreté"]),
    (22, [24, 25],              ["Colère", "Amitié"]),
    (22, [26, 27],              ["Prudence", "Richesse"]),
    (22, [28],                  ["Justice", "Honnêteté"]),
    (22, [29],                  ["Travail", "Excellence"]),
    # Chapter 23 — sayings 6-18
    (23, [1, 2, 3],             ["Pouvoir", "Convoitise", "Prudence"]),
    (23, [4, 5],                ["Richesse", "Travail"]),
    (23, [6, 7, 8],             ["Générosité", "Tromperie"]),
    (23, [9],                   ["Sagesse", "Parole"]),
    (23, [10, 11],              ["Justice", "Protection"]),
    (23, [12],                  ["Sagesse", "Instruction"]),
    (23, [13, 14],              ["Famille", "Discipline"]),
    (23, [15, 16],              ["Famille", "Sagesse"]),
    (23, [17, 18],              ["Espérance", "Crainte de Dieu"]),
    (23, [19, 20, 21],          ["Sobriété", "Pauvreté"]),
    (23, [22, 23, 24, 25],      ["Famille", "Sagesse", "Vérité"]),
    (23, [26, 27, 28],          ["Fidélité", "Tentation"]),
    (23, [29, 30, 31, 32, 33, 34, 35], ["Sobriété", "Piège"]),
    # Chapter 24 — sayings 19-30 + "More sayings" appendix
    (24, [1, 2],                ["Justice", "Envie"]),
    (24, [3, 4],                ["Sagesse", "Famille"]),
    (24, [5, 6],                ["Sagesse", "Conseil"]),
    (24, [7],                   ["Sagesse", "Folie"]),
    (24, [8, 9],                ["Péché", "Folie"]),
    (24, [10],                  ["Force", "Courage"]),
    (24, [11, 12],              ["Justice", "Responsabilité"]),
    (24, [13, 14],              ["Sagesse", "Espérance"]),
    (24, [15, 16],              ["Justice", "Persévérance"]),
    (24, [17, 18],              ["Miséricorde", "Humilité"]),
    (24, [19, 20],              ["Justice", "Espérance"]),
    (24, [21, 22],              ["Autorité", "Crainte de Dieu"]),
    # 24:23-34 — "More sayings of the wise"
    (24, [23, 24, 25],          ["Justice", "Jugement"]),
    (24, [26],                  ["Vérité", "Parole"]),
    (24, [27],                  ["Travail", "Sagesse"]),
    (24, [28, 29],              ["Vérité", "Vengeance"]),
    (24, [30, 31, 32, 33, 34],  ["Travail", "Paresse"]),
]

# Multi-verse units in chapters 25-29 to merge from existing single-verse entries
MERGE_UNITS_25_29 = [
    (25, [6, 7]),
    (25, [8, 9, 10]),
    (25, [21, 22]),
    (26, [20, 21, 22]),
    (26, [23, 24, 25, 26]),
    (27, [15, 16]),
    (27, [23, 24, 25, 26, 27]),
]

def make_id(chapter, first_verse):
    return f"PROV_{chapter}_{first_verse}"

def make_reference_fr(chapter, verses):
    if len(verses) == 1:
        return f"Proverbes {chapter}:{verses[0]}"
    return f"Proverbes {chapter}:{verses[0]}-{verses[-1]}"

def make_text(verse_texts):
    """Concatenate verse texts. For multi-verse: prefix each verse number."""
    if len(verse_texts) == 1:
        return verse_texts[0][1]
    return " ".join(f"{v} {t}" for v, t in verse_texts)

def get_verse_source(chapter):
    """Return the dict of verse_num -> text for a chapter."""
    if chapter == 22:
        return CH22_17_29
    if chapter == 23:
        return CH23
    if chapter == 24:
        return CH24
    return {}

def main():
    with open("src/data/proverbs.json", "r", encoding="utf-8") as f:
        existing = json.load(f)

    # Index existing data by (chapter, verse)
    by_ch_v = {}
    for p in existing:
        by_ch_v[(p["chapter"], p["verse"])] = p

    # ── Step 1: Determine merge groups for 25-29 ──────────────────────────────
    # Build a set of verse-keys that will be absorbed into a unit
    merge_primary = set()    # (ch, first_verse) → this becomes the unit
    merge_absorbed = set()   # (ch, v) → these get removed

    for (ch, vs) in MERGE_UNITS_25_29:
        merge_primary.add((ch, vs[0]))
        for v in vs[1:]:
            merge_absorbed.add((ch, v))

    # ── Step 2: Build the new list ─────────────────────────────────────────────
    new_proverbs = []

    # 2a. Process existing entries (chapters 10-22:16 and 25-29)
    for p in existing:
        ch = p["chapter"]
        v  = p["verse"]

        # Skip absorbed verses in 25-29
        if (ch, v) in merge_absorbed:
            continue

        if (ch, v) in merge_primary:
            # Find which merge unit this is
            unit_verses = next(vs for (c, vs) in MERGE_UNITS_25_29 if c == ch and vs[0] == v)
            # Collect verse texts in order
            vtexts = []
            combined_sugg = []
            for uv in unit_verses:
                ep = by_ch_v.get((ch, uv))
                if ep:
                    vtexts.append((uv, ep["text"]))
                    for s in ep.get("suggestions", []):
                        if s not in combined_sugg:
                            combined_sugg.append(s)

            new_proverbs.append({
                "id":         make_id(ch, unit_verses[0]),
                "chapter":    ch,
                "verses":     unit_verses,
                "text":       make_text(vtexts),
                "reference":  make_reference_fr(ch, unit_verses),
                "suggestions": combined_sugg,
            })
        else:
            # Plain single-verse entry: keep id, add verses array
            new_proverbs.append({
                "id":         p["id"],
                "chapter":    ch,
                "verses":     [v],
                "text":       p["text"],
                "reference":  p["reference"],
                "suggestions": p.get("suggestions", []),
            })

    # 2b. Add new entries for chapters 22:17-29, 23, 24
    for (ch, vs, sugg) in NEW_UNITS:
        src = get_verse_source(ch)
        vtexts = [(v, src[v]) for v in vs if v in src]
        if not vtexts:
            print(f"WARNING: no text found for chapter {ch} verses {vs}")
            continue
        new_proverbs.append({
            "id":         make_id(ch, vs[0]),
            "chapter":    ch,
            "verses":     vs,
            "text":       make_text(vtexts),
            "reference":  make_reference_fr(ch, vs),
            "suggestions": sugg,
        })

    # ── Step 3: Sort by chapter, then by first verse ──────────────────────────
    new_proverbs.sort(key=lambda p: (p["chapter"], p["verses"][0]))

    # ── Step 4: Write output ──────────────────────────────────────────────────
    out_path = "src/data/proverbs_fr.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(new_proverbs, f, ensure_ascii=False, indent=2)

    print(f"Written {len(new_proverbs)} units to {out_path}")

    # Stats
    single = sum(1 for p in new_proverbs if len(p["verses"]) == 1)
    multi  = sum(1 for p in new_proverbs if len(p["verses"]) > 1)
    chapters = sorted(set(p["chapter"] for p in new_proverbs))
    print(f"Single-verse units: {single}")
    print(f"Multi-verse units:  {multi}")
    print(f"Chapters covered: {chapters}")
    print(f"Longest unit: {max(len(p['verses']) for p in new_proverbs)} verses")

if __name__ == "__main__":
    main()
