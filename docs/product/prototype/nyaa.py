#!/usr/bin/env python3
"""Recherche Nyaa "intelligente".

- Trouve les vrais titres de l'anime via AniList ("saga tanya" -> "Youjo Senki", "Saga of Tanya the Evil").
- Interroge Nyaa avec chacun de ces titres et fusionne les résultats.
- Filtre par langue (VF / MULTi / VOSTFR), qualité, type, seeders.
- Affiche : films, packs (saisons complètes) à part, puis épisodes triés par saison/épisode.

Exemples :
    python nyaa.py "saga tanya"
    python nyaa.py "saga tanya" --vf -q 1080
    python nyaa.py "frieren" --multi --type serie --all
    python nyaa.py "your name" --type film
"""
import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

NYAA = "https://nyaa.si"
NS = "{https://nyaa.si/xmlns/nyaa}"
UA = "nyaa-search/1.0"
FR_QUERY = "(multi|vf|vff|french|truefrench|vostfr)"


# ---------------------------------------------------------------- réseau

def http(url, payload=None):
    headers = {"User-Agent": UA}
    if payload is not None:
        headers["Content-Type"] = "application/json"
        payload = json.dumps(payload).encode()
    with urllib.request.urlopen(urllib.request.Request(url, payload, headers), timeout=20) as r:
        return r.read()


def alt_titles(query):
    """Le texte tapé + les titres qu'AniList connaît (romaji, anglais, synonymes en alphabet latin)."""
    gql = ("query($s:String){Page(perPage:5){media(search:$s,type:ANIME,sort:SEARCH_MATCH)"
           "{title{romaji english} popularity}}}")
    try:
        found = json.loads(http("https://graphql.anilist.co", {"query": gql, "variables": {"s": query}}))
        # parmi les 5 meilleurs résultats, le plus populaire ("your name" -> Kimi no Na wa, pas une pub Suntory)
        m = max(found["data"]["Page"]["media"], key=lambda x: x["popularity"])
    except Exception as e:
        print(f"(AniList indisponible, recherche brute : {e})", file=sys.stderr)
        return [query]
    out = []
    for name in [query, m["title"]["romaji"], m["title"]["english"]]:
        name = re.sub(r"[^\w\s-]", " ", name or "").strip()  # ":" "!" "’" etc. gênent la recherche Nyaa
        if not name or any(ord(c) > 0x24F for c in name):  # ignore japonais, cyrillique...
            continue
        if name.lower() not in (o.lower() for o in out):
            out.append(name)
    return out


def nyaa_rss(q, cat):
    url = f"{NYAA}/?" + urllib.parse.urlencode({"page": "rss", "q": q, "c": cat, "f": 0})
    for attempt in range(4):
        try:
            root = ET.fromstring(http(url))
            break
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 3:
                print(f"(Nyaa : échec pour « {q} » : {e})", file=sys.stderr)
                return []
            time.sleep(2 * (attempt + 1))  # Nyaa limite le débit : on attend et on réessaie
        except Exception as e:
            print(f"(Nyaa : échec pour « {q} » : {e})", file=sys.stderr)
            return []
    return [{
        "title": it.findtext("title"),
        "url": it.findtext("guid"),
        "size": it.findtext(NS + "size"),
        "seeders": int(it.findtext(NS + "seeders") or 0),
        "trusted": it.findtext(NS + "trusted") == "Yes",
    } for it in root.iter("item")]


# ---------------------------------------------------------------- analyse des noms

UNITS = {"B": 1, "KiB": 2**10, "MiB": 2**20, "GiB": 2**30, "TiB": 2**40}


def size_bytes(s):
    n, unit = s.split()
    return float(n) * UNITS.get(unit, 1)


def lang_of(t):
    if re.search(r"\bmulti\b(?![-\s]?subs?)", t):  # "Multi-Subs" = sous-titres seulement
        return "MULTI"
    if re.search(r"\b(vf[fqi2]?|truefrench|french|fr)\b", t):
        return "VF"
    if re.search(r"\b(vostfr|subfrench)\b", t):
        return "VOSTFR"
    return ""


def res_of(t):
    if re.search(r"\b(2160p|4k|uhd)\b", t):
        return "2160p"
    m = re.search(r"\b(1080|720|576|480)p\b", t)
    return m.group(1) + "p" if m else ""


ROMAN = {"ii": 2, "iii": 3, "iv": 4, "v": 5}


def season_of(t):
    m = (re.search(r"\bs(\d{1,2})(?=e\d|\b)", t) or re.search(r"\b(?:season|saison)\s*(\d{1,2})\b", t)
         or re.search(r"\b(\d{1,2})(?:st|nd|rd|th)\s+season\b", t))
    if m:
        return int(m.group(1))
    m = re.search(r"\b(ii|iii|iv)\b", t)
    return ROMAN[m.group(1)] if m else 1


def parse(title):
    """-> dict(kind=film|pack|episode|autre, season, ep, ep_end, res, lang)."""
    t = title.lower()
    info = {"kind": "autre", "season": season_of(t), "ep": None, "ep_end": None,
            "res": res_of(t), "lang": lang_of(t)}
    # retire ce qui ressemble à des numéros d'épisode sans en être
    c = re.sub(r"\[[0-9a-f]{8}\]", " ", t)  # CRC
    c = re.sub(r"\b(\d{3,4}p|[xh]\.?26[45]|10.?bits?|8.?bits?|(?:19|20)\d\d|\d\.\d|aac\d?\.?\d?|ddp?\d?\.?\d?)\b", " ", c)

    m = re.search(r"\bs\d{1,2}e(\d{1,4})\s*[-~]\s*(?:s\d{1,2})?e?(\d{1,4})\b", c) \
        or re.search(r"\b(?:e|ep|episodes?|épisodes?)?\s*(\d{2,4})\s*[-~à]\s*(?:e|ep)?(\d{2,4})\b", c)
    if m and int(m.group(2)) > int(m.group(1)):
        info.update(kind="pack", ep=int(m.group(1)), ep_end=int(m.group(2)))
        return info
    # SxxEyy passe avant "movie" : certains uploaders écrivent "Youjo Senki Movie" sur des épisodes
    m = re.search(r"\bs\d{1,2}e(\d{1,4})\b", c)
    film = re.search(r"\b(movie|film|gekijouban)\b", c)
    if not m and not film:
        m = (re.search(r"\b(?:e|ep|episode|épisode)\s?(\d{1,4})(?:v\d)?\b", c)
             or re.search(r"\s[-–]\s(\d{1,4})(?:v\d)?\b", c))
    if m:
        info.update(kind="episode", ep=int(m.group(1)))
    elif film:
        info["kind"] = "film"
    elif re.search(r"\b(batch|complete|complet|int[ée]grale|bd ?box)\b", c) \
            or re.search(r"\b(?:s\d{1,2}|season\s*\d+|saison\s*\d+)\b", c):
        info["kind"] = "pack"
    return info


# ---------------------------------------------------------------- recherche

def words(s):
    return re.findall(r"[a-z0-9]+", s.lower())


def search(args):
    titles = [args.query] if args.raw else alt_titles(args.query)
    print("Titres recherchés : " + " | ".join(titles), file=sys.stderr)
    queries = list(titles)
    if args.vf or args.multi or args.vostfr:
        queries += [f"{t} {FR_QUERY}" for t in titles]  # sinon les sorties FR sont noyées sous les 75 résultats max
    with ThreadPoolExecutor(2) as pool:  # plus de 2 en parallèle -> HTTP 429
        batches = pool.map(lambda q: nyaa_rss(q, args.cat), queries)
    wanted = [set(words(t)) for t in titles]
    seen, items = set(), []
    for batch in batches:
        for it in batch:
            # Nyaa est laxiste ; on exige tous les mots d'au moins un des titres
            if it["url"] not in seen and any(w <= set(words(it["title"])) for w in wanted):
                seen.add(it["url"])
                it.update(parse(it["title"]))
                items.append(it)
    return [it for it in items if keep(it, args)]


def keep(it, a):
    if a.vf and it["lang"] not in ("VF", "MULTI"):
        return False
    if a.multi and it["lang"] != "MULTI":
        return False
    if a.vostfr and it["lang"] != "VOSTFR":
        return False
    if a.quality and not it["res"].startswith(a.quality):
        return False
    if a.season and it["season"] != a.season and it["kind"] != "film":
        return False
    if a.type == "film" and it["kind"] != "film":
        return False
    if a.type == "serie" and it["kind"] == "film":
        return False
    return it["seeders"] >= a.min_seeders


# ---------------------------------------------------------------- affichage

def label(it):
    if it["kind"] == "episode":
        return f"S{it['season']:02d}E{it['ep']:02d}"
    if it["kind"] == "pack":
        return f"S{it['season']:02d} " + (f"E{it['ep']:02d}-{it['ep_end']:02d}" if it["ep"] else "complet")
    return "Film" if it["kind"] == "film" else "?"


def table(title, rows, width):
    if not rows:
        return
    print(f"\n=== {title} ({len(rows)}) ===")
    print(f"{'Ép.':<12} {'Nom':<{width}} {'Taille':>10} {'Seed':>5} {'Lang':<6} {'Qualité':<7} Lien")
    for it in rows:
        name = it["title"] if len(it["title"]) <= width else it["title"][:width - 1] + "…"
        print(f"{label(it):<12} {name:<{width}} {it['size']:>10} {it['seeders']:>5} {it['lang']:<6} {it['res']:<7} {it['url']}")


def main(argv=None):
    p = argparse.ArgumentParser(description="Recherche Nyaa avec titres alternatifs et filtres.")
    p.add_argument("query", help='ex : "saga tanya"')
    p.add_argument("--vf", action="store_true", help="voix française (VF ou MULTi)")
    p.add_argument("--multi", action="store_true", help="MULTi uniquement")
    p.add_argument("--vostfr", action="store_true", help="VOSTFR uniquement")
    p.add_argument("-q", "--quality", choices=["480", "720", "1080", "2160"], help="résolution")
    p.add_argument("--type", choices=["serie", "film"], help="séries ou films seulement")
    p.add_argument("-s", "--season", type=int, help="numéro de saison")
    p.add_argument("--min-seeders", type=int, default=1, help="défaut : 1 (masque les torrents morts)")
    p.add_argument("--all", action="store_true", help="toutes les sorties par épisode (défaut : la plus seedée)")
    p.add_argument("--raw", action="store_true", help="ne pas chercher les titres alternatifs sur AniList")
    p.add_argument("--cat", default="1_0", help="catégorie Nyaa (1_0 anime, 1_3 non-anglais...)")
    p.add_argument("--width", type=int, default=70, help="largeur de la colonne Nom")
    args = p.parse_args(argv)

    items = search(args)
    if not items:
        print("Aucun résultat avec ces filtres.")
        return

    by_seed = lambda it: -it["seeders"]
    films = sorted((i for i in items if i["kind"] == "film"), key=by_seed)
    packs = sorted((i for i in items if i["kind"] == "pack"), key=lambda i: (i["season"], i["ep"] or 0, by_seed(i)))
    eps = sorted((i for i in items if i["kind"] == "episode"), key=lambda i: (i["season"], i["ep"], by_seed(i)))
    other = sorted((i for i in items if i["kind"] == "autre"), key=by_seed)
    if not args.all:  # garde la sortie la plus seedée de chaque épisode
        best = {}
        for i in eps:
            best.setdefault((i["season"], i["ep"]), i)
        eps = list(best.values())

    table("FILMS", films, args.width)
    table("PACKS / SAISONS COMPLÈTES", packs, args.width)
    table("ÉPISODES" + ("" if args.all else " (meilleure sortie par épisode, --all pour tout voir)"), eps, args.width)
    table("NON CLASSÉS", other, args.width)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
