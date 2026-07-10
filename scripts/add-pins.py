#!/usr/bin/env python3
"""Pop N entries from scripts/pin-queue.json, fetch a CC-licensed photo for
each from Wikimedia Commons, append them to public/img/pins.json, and
regenerate the archive table in CREDITS.md.

Usage: python3 scripts/add-pins.py [count]   (default 5)

Photos still need a human visual check before committing — the search picks
the top hit, which is occasionally a locator map or the wrong landmark.
"""
import json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUEUE = f"{ROOT}/scripts/pin-queue.json"
PINS = f"{ROOT}/public/img/pins.json"
CARDS = f"{ROOT}/public/img/cards"
CREDITS = f"{ROOT}/CREDITS.md"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "SeichiJunrei/1.0 (personal fan project; contact: carlob24r@gmail.com)"}


def api(params):
    time.sleep(4)  # stay well under Wikimedia rate limits
    req = urllib.request.Request(f"{API}?{urllib.parse.urlencode(params)}", headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def clean(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()


def search_file(query):
    data = api({"action": "query", "format": "json", "list": "search",
                "srnamespace": 6, "srlimit": 3, "srsearch": query})
    for h in data["query"]["search"]:
        if h["title"].lower().endswith((".jpg", ".jpeg")):
            return h["title"]
    return None


def grab(title, dest, width=1200):
    data = api({"action": "query", "format": "json", "titles": title,
                "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": width})
    page = next(iter(data["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    md = ii.get("extmetadata", {})
    lic = clean(md.get("LicenseShortName", {}).get("value", "?"))
    artist = clean(md.get("Artist", {}).get("value", "unknown"))[:80]
    if not re.match(r"^(CC|Public domain|CC0|FAL)", lic, re.I):
        return None
    req = urllib.request.Request(ii["thumburl"], headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())
    return {"file": title, "artist": artist, "license": lic, "source": ii["descriptionurl"]}


def regenerate_credits(pins):
    head = open(CREDITS).read().split("## Archive pins")[0]
    rows = "\n".join(
        f"| {p['title']} — {p['blurb'].split('↔')[-1].strip()} | "
        f"[{p['credit']['file'][5:]}]({p['credit']['source']}) | "
        f"{p['credit']['artist']} | {p['credit']['license']} |"
        for p in pins)
    tail = """
## Anime frames

The “frame” side of each featured scene is **original SVG artwork interpreting
the shot** — actual film stills are copyrighted and are not distributed with
this repository. If you own screenshots you're comfortable using, drop them in
as `public/img/frames/<slug>.jpg` (`your-name`, `slam-dunk`, `garden-of-words`,
`spirited-away`, `steins-gate`, `silent-voice`) and the site will use them
automatically.
"""
    open(CREDITS, "w").write(
        head + "## Archive pins (`public/img/cards/`, data in `public/img/pins.json`)\n\n"
        "| Pin | Photograph | Author | License |\n|---|---|---|---|\n" + rows + "\n" + tail)


def main(count=5):
    queue = json.load(open(QUEUE))
    pins = json.load(open(PINS))
    have = {p["slug"] for p in pins}
    added, kept = [], []

    for entry in queue:
        if len(added) >= count:
            kept.append(entry)
            continue
        if entry["slug"] in have:
            print(f"skip {entry['slug']} (already pinned)")
            continue
        credit = None
        for q in entry["queries"]:
            try:
                title = search_file(q)
                if not title:
                    continue
                credit = grab(title, f"{CARDS}/{entry['slug']}.jpg")
                if credit:
                    break
            except Exception as e:
                print(f"ERR {entry['slug']}: {q}: {e}")
        if credit:
            pin = {k: entry[k] for k in ("slug", "title", "jp", "blurb", "coords")}
            pin["credit"] = credit
            pins.append(pin)
            added.append(entry["slug"])
            print(f"OK  {entry['slug']:20s} {credit['license']:12s} {credit['artist'][:36]:36s} {credit['file'][:60]}")
        else:
            kept.append(entry)
            print(f"MISS {entry['slug']} — left in queue")

    json.dump(pins, open(PINS, "w"), ensure_ascii=False, indent=2)
    json.dump(kept, open(QUEUE, "w"), ensure_ascii=False, indent=2)
    regenerate_credits(pins)
    print(f"\nadded {len(added)}: {added}")
    print(f"pins total: {len(pins)} | queue remaining: {len(kept)}")
    print("REMINDER: visually verify the new card images before committing.")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 5)
