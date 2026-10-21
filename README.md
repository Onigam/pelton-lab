# Pelton Lab

**FR** · Laboratoire 3D interactif d'une **micro-turbine hydroélectrique Pelton** et de son installation autonome : du ruisseau à la batterie.
**EN** · Interactive 3D lab of a **Pelton micro-hydro turbine** and its off-grid installation: from the stream to the battery.

> Reconstitution pédagogique indépendante d'après le reportage
> [« Son invention permet d'être autonome en électricité avec un simple ruisseau ! »](https://www.youtube.com/watch?v=0MixMbSYJ0g)
> (L'ArchiPelle, 2026) consacré aux turbines de Sylvain — [Hydronome](http://www.hydronome.fr), Ariège.
> Ce n'est ni un plan officiel ni un produit Hydronome : les dimensions internes sont des estimations.
>
> Independent educational reconstruction based on the video report above. It is not an official drawing nor a
> Hydronome product: internal dimensions are estimates.

---

## Français

### Ce que contient le lab

| Vue                 | Contenu                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Site**            | Vallée pyrénéenne procédurale : ruisseau, retenue et **prise d'eau Coanda** (grille inox 1 mm), **conduite forcée PEHD Ø63** qui suit le dénivelé, turbine sur la berge, canal de fuite, câble vers le **local technique**, maison et **panneaux solaires 4,5 kWc**. La prise d'eau se déplace le long du ruisseau quand on change la hauteur de chute. Soleil selon l'heure, saisons (neige, feuillage, ruisseau à sec en été).                         |
| **Turbine**         | Modèle détaillé pièce par pièce : capot alu marin plié, hublot et cloison PMMA, roue Pelton à 22 augets imprimés (double cuillère, arête centrale, échancrure), arbre inox, 3 roulements 6204-2RS (billes visibles en coupe), joint à lèvre, génératrice à rotor extérieur (stator feuilleté 12 dents bobiné, 14 aimants N52), redresseur, injecteur à pointeau et buse fixe, col de cygne, vannes, manomètre animé. Jets d'eau et gerbes en particules. |
| **Local technique** | 4 batteries LiFePO4 48 V, onduleur-chargeur, régulateur solaire MPPT, régulateur hydro à tension fixe, délesteur et résistances qui rougeoient, protections DC/AC, écran de supervision en direct, câblage.                                                                                                                                                                                                                                              |

### Modes

- **Explorer** — **vue d'ensemble** de tout le dispositif, puis cliquer une pièce ou une étiquette : fiche (aperçu, caractéristiques, entretien, version pro, lien horodaté vers la vidéo), **isoler** (ou double-clic), **centrer**, **éclaté** progressif, **transparence**, **coupe** (section du carter, des roulements et des injecteurs), flux animés, panneau repliable pour une 3D pleine largeur.
- **Montage** — guide pas à pas en 19 étapes : les pièces arrivent en place une à une, fantôme filaire de la machine finie, outils, couples de serrage, mises en garde, et pour chaque étape la variante **V2 pro**.
- **Installation** — 10 étapes sur le site, du relevé de chute et de débit à la mise en service.
- **Simulation** — modèle physique temps réel : conduite (Darcy–Weisbach), **coup de bélier** (colonne d'eau + Joukowsky), injecteurs, couple Pelton, génératrice, régulation (tension fixe / MPPT classique / direct batterie), câble, batteries, solaire, consommation, **délestage**. Scénarios : prise d'eau à sec, grille colmatée, coup de bélier, MPPT qui pompe, délesteur en panne (emballement), câble de 400 m (48 V vs 200 V), nuit d'hiver, été à sec. Graphiques : dynamique 60 s, courbe de puissance de la roue, puissances 24 h, état de charge, bilan des pertes. Tous les paramètres se modifient **en direct** (chute, longueur et Ø de conduite, débit du ruisseau, Ø de chaque buse, pointeau, augets, bobinage, câble, régulation…).
- **Dimensionnement** — tableau « buse → débit → chute nette → puissance de sortie (W) → le ruisseau suffit-il ? » (clic sur une ligne = monter cette buse) et courbes de puissance de sortie (W) selon le débit pour chaque conduite PE Ø50 à Ø110.
- **Leçons** — 14 leçons courtes avec chiffres clés, formules, quiz et scénario associé.
- **Pièces** — catalogue filtrable de toutes les pièces (turbine, site, local).
- **Version pro** — comparatif **V1 prototype ↔ V2 industrialisable mais toujours DIY** : châssis en profilés, cartouche de palier, buses interchangeables, **déflecteur de jet de sécurité**, grenouillères, capteurs et télémétrie, coffret IP65, ventouse et vanne lente…
- Interface **FR / EN**, utilisable sur mobile.

La simulation reproduit les chiffres du reportage : site A (76 m, Ø55, 350 m, buse 6 mm) ≈ 1,05 L/s et ≈ 500 W ; buse 8 mm ≈ 1,8 L/s ; site B (21 m) ≈ 250 W en hiver et ≈ 100 W à 0,75 L/s.

### Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée par Vite. `npm run build` produit un site statique dans `dist/` (déployé automatiquement sur GitHub Pages par `.github/workflows/deploy.yml`).

### Réglementation

En France, installer une micro-turbine ou prélever l'eau d'un cours d'eau est encadré (droit d'eau, continuité écologique). Renseignez-vous auprès de la **DDT** et de l'**OFB** avant tout projet.

---

## English

### What's inside

- **Site**: procedural Pyrenean valley with the stream, weir and **Coanda intake**, the **HDPE penstock** following the slope, the turbine on the bank, tailrace, cable run, **power room**, house and **4.5 kWp PV**. The intake moves along the stream when you change the head; sun follows the hour; seasons change foliage, snow and stream flow.
- **Turbine**: every part modelled — folded marine-aluminium cover, PMMA window and partition, 22-bucket printed Pelton runner, stainless shaft, three 6204-2RS bearings, lip seal, outer-rotor PM generator (laminated 12-tooth wound stator, 14 N52 magnets), rectifier, spear and fixed injectors, gooseneck manifold, valves and a live pressure gauge, particle water jets.
- **Power room**: LiFePO4 48 V bank, inverter/charger, solar MPPT, fixed-voltage hydro controller, glowing dump-load resistors, protections, live monitoring display, wiring.

**Modes**: Explore (overview, part sheets, isolate / double-click, explode, x-ray, section view, animated flows, collapsible panel) · Assembly (19 animated steps with ghost, tools, torques, warnings and a V2 variant per step) · Installation (10 site steps) · Simulation (real-time physics: penstock friction, water hammer, Pelton torque, generator, controllers, batteries, PV, loads, dump load; 8 scenarios; charts; every parameter editable live; sizing table and output-power-vs-flow curves in W per nozzle and per pipe size) · Lessons (14 lessons with quizzes) · Parts catalogue · Pro version (V1 prototype vs V2 industrialisable-yet-DIY comparison).

### Run locally

```bash
npm install
npm run dev
```

`npm run build` outputs a static site in `dist/`; pushes to `main` deploy it to GitHub Pages.

### Credits

Source video: L'ArchiPelle with Sylvain (Hydronome). UI inspired by [Learn Arduino](https://learn-arduino-red.vercel.app) and [sael.net](https://sael.net/) explainers. Built with Three.js, TypeScript and Vite. Code under the MIT licence.
