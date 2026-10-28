# Narration script (French)

`fr.json` follows `lab-kit/docs/narration.md`: 72 segments (`intro`, 4 worlds, 67 parts), no lesson segments.
Check cost without spending anything: `node <lab-kit>/tools/narration/generate.mjs --src narration/fr.json --out /tmp/pelton-audio --dry-run`.

## Budget

- **23 758 spoken characters** in total (hard cap 24 000; 30 000 is the owner's ceiling, so about 6 240 remain for retakes).
- intro 2 096, worlds 2 374 (site 620, intake 578, turbine 690, techroom 486), parts 19 329.
- Biggest: injector-top 437, buckets 436, deflector 428, battery 425, stator 415, penstock 406, turbine 403 (the nine "heroes", 357 to 437).
- Smallest: bearing-1 224, cover 230, in-overflow 236, controller-box 237, injector-quick 238. Ordinary parts average 270.
- The suggested split (280 to 330 per part) did not fit under 24 000, so ordinary parts are shorter than suggested.

## Register

Names removed on the owner's request: no person, channel, company or brand is named in the script or its titles (credits live in the Sources panel).
A warm storyteller who addresses the listener ("vous", "on", "nous"; never "tu"): short sentences, one image or one wonder per part,
questions to the listener, rare exclamations, no joke repeated. No copy, citation or name from any existing series.
Most parts close on one concrete detail taken from the lab's own fields (`design`, `tip`, `maintenance`, specs).
Spoken text only: numbers and units in words, estimates marked "environ", video claims attributed ("la vidéo", "le constructeur") only
where `parts.ts` says so. Acronyms are replaced by words (plexiglas, polyéthylène, système de gestion, "trois D").
Honesty: the intro and the turbine world say it is an educational reconstruction, not an official plan or a maker product.
Safety and law: water rights (site, weir, in-weir), never run unloaded (techroom, diversion, dc-protect), slow valves (valve-main,
bypass), deflector test, terminals live while turning, magnets crush fingers.

## Cues (79 in total, all validated by the kit, `npm run build` and a browser probe)

- Intro (23): `home`, `frame` on site parts, `scene` hops turbine, techroom, site, `xray` on the generator, then `mode:assembly`,
  `install`, `sim`, `lessons`, back to `mode:explore`, `scene:site`, `select:none`.
- Worlds (9 to 11 each): `home`, one `frame` per element named, `flows`, `cutaway` (intake only), `xray` and `explode` (turbine).
- Parts (8 only: coanda, in-screen, in-box, buckets, stator, injector-top, deflector, battery): `flows`, `cutaway`, `xray`, `explode`; each is switched back off.
- Spacing: camera cues (`scene`, `home`, `frame`, `select`) are at least 35 spoken characters apart (about 2.5 s); other cues may coincide.
- No `lab:` cue: `lab.ts` defines no `narration.onCue` hook (a hook for `preset:siteB` or `scenario:dumpFailure` would help).
- Only `frame` ids of the current world are used; `xray` is never used in the site (it needs a selection there); `cutaway` never in the site.

## Checked in the browser (kit 0.3.0)

- The manifest passes the kit's `readManifest` and `validateManifest` against the lab's scenes and parts; all 72 audio files load.
- `flows` and the `mode:` hops of the intro work; the closing `mode:explore` + `scene:site` brings the visitor back to the site.
- Pronunciation (Pelton, Coanda, silentblocs, "trois D", "kilowattheures") approved by the owner on the first render.

## Left out for budget

- Preset text of the site world, the 2,6 N.m shaft torque, the "purge at every visit" part of the `in-sandtrap` maintenance note, cold-start
  lithium warning (kept in the lab data).
- `part-cabin` and `part-pv` speak of site B because the lab describes them that way; `part-turbine` quotes site A (499 W, Ø6, 76 m).
