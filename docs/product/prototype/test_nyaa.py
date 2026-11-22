"""python test_nyaa.py — vérifie l'analyse des noms de torrents (sans réseau)."""
from nyaa import parse

CASES = [
    ("[ToonsHub] Saga of Tanya the Evil S02E11 1080p CR WEB-DL MULTi AAC2.0 H.264", "episode", 2, 11, "MULTI", "1080p"),
    ("[ToonsHub] Saga of Tanya the Evil S02E11 1080p DUAL (Multi-Subs)", "episode", 2, 11, "", "1080p"),
    ("[SubsPlease] Youjo Senki II - 05 (720p) [ABCD1234]", "episode", 2, 5, "", "720p"),
    ("[Tsundere-Raws] Youjo Senki - 01-12 VOSTFR 1080p", "pack", 1, 1, "VOSTFR", "1080p"),
    ("Youjo Senki S01 MULTi 1080p BluRay x265 10bit", "pack", 1, None, "MULTI", "1080p"),
    ("[Group] Youjo Senki Movie (2019) VF 1080p", "film", 1, None, "VF", "1080p"),
    ("Youjo Senki E07 VOSTFR 720p", "episode", 1, 7, "VOSTFR", "720p"),
    ("Saga of Tanya the Evil S02E07 Purgatory 1080p MULTi (Youjo Senki Movie, Multi-Audio)", "episode", 2, 7, "MULTI", "1080p"),
]

for title, kind, season, ep, lang, res in CASES:
    got = parse(title)
    assert (got["kind"], got["season"], got["ep"], got["lang"], got["res"]) == (kind, season, ep, lang, res), (title, got)
print(f"OK ({len(CASES)} cas)")
