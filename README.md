# Pelton Lab

**▶ https://pelton-lab.vercel.app** · mirror: https://onigam.github.io/pelton-lab/

Interactive 3D lab of a **Pelton micro-hydro turbine** and its off-grid installation, from the stream to the battery.
Explore every part, take the machine apart and put it back together, run a live physics simulation, and read the
design drawings. The app is bilingual (English / French) and works on mobile.

🇫🇷 [Version française plus bas](#français)

> Independent educational reconstruction based on the video report
> [“Son invention permet d'être autonome en électricité avec un simple ruisseau !”](https://www.youtube.com/watch?v=0MixMbSYJ0g)
> (L'ArchiPelle, 2026) about Sylvain's turbines — [Hydronome](https://www.hydronome.fr), Ariège, France.
> It is not an official drawing nor a Hydronome product. The housing (574 × 328 × 402 mm), the 26-bucket Ø244 runner
> and the Ø14 maximum nozzle follow the maker's published data; internal parts and dimensions are estimates.

---

## What's inside

### Four 3D worlds

- **Site**: procedural Pyrenean valley with the stream, the weir and its **Coanda intake** (1 mm stainless screen), the
  **Ø63 HDPE penstock** following the slope, the turbine on the bank, the tailrace, the cable run to the **power room**,
  the house and **4.5 kWp of PV**. The intake moves along the stream when you change the head; the sun follows the hour
  and the seasons change foliage, snow and stream flow (dry stream in summer).
- **Water intake**: close-up of the Coanda intake:
  - dry-stone weir and acceleration plate;
  - wedge-wire screen and collection trough;
  - overflow and debris chute;
  - sand trap with its flush valve;
  - strainer at the penstock start and the air vent.

  X-ray shows how the water is caught.

- **Turbine**: every part modelled:
  - folded marine-aluminium cover, PMMA window and partition;
  - 26-bucket Pelton runner (double cup, central splitter, notch) and stainless shaft;
  - 6204-2RS bearings (balls visible in section) and lip seal;
  - outer-rotor PM generator (laminated 12-tooth wound stator, 14 N52 magnets) and rectifier;
  - spear injector and quick-change side injector, gooseneck manifold, valves, bypass valve and a live pressure gauge.

  Water jets and spray are particles. The fail-safe **jet deflectors** are driven by a real linkage behind the rear
  panel: levers, link rod, tension spring and 12 V latch.

- **Power room**: 48 V LiFePO4 bank, inverter/charger, solar MPPT, fixed-voltage hydro controller, dump load with
  glowing resistors, DC/AC protections, live monitoring display, wiring.

### Modes

- **Explore**: overview of the whole device, then click a part or a label to open its sheet (overview, specs,
  maintenance, design notes, timestamped link to the video). **Isolate** it (or double-click), **frame** it, progressive
  **exploded view**, **x-ray**, **section view** (housing, bearings and injectors cut open) and animated flows. The side
  panel can be hidden for a full-width 3D view, widened by dragging its edge, or switched to a full-width reading mode.
- **Assembly**: 19 step-by-step stages. Parts fly into place one by one over a wireframe ghost of the finished machine,
  with tools, tightening torques and warnings.
- **Installation**: 10 steps on site, from measuring head and flow to commissioning.
- **Simulation**: real-time physics model covering:
  - the penstock (Darcy–Weisbach) and **water hammer** (rigid water column + Joukowsky);
  - injectors, Pelton torque, generator and cable;
  - control: fixed voltage, classic MPPT or battery-direct;
  - batteries, PV, household loads, **dump load** and the jet deflector.

  It comes with 8 scenarios: dry intake, clogged screen, water hammer, hunting MPPT, failed dump load (runaway), 400 m
  cable (48 V vs 200 V), winter night and dry summer. Charts show 60 s dynamics, the runner power curve, 24 h power, state
  of charge and a loss breakdown. **Every parameter is editable live**: head, pipe length and diameter, stream flow,
  each nozzle diameter, spear opening, bucket set, winding, cable, control mode…

- **Sizing**: a “nozzle → flow → net head → output power (W) → is the stream enough?” table (click a row to fit that
  nozzle), plus output-power-vs-flow curves (W) for every PE pipe from Ø50 to Ø110.
- **Drawings**: 10 A3 design sheets generated from the 3D model's dimensions. You can zoom them, download them as SVG and
  print them:
  - dimensioned general arrangement;
  - shaft-line section (fits, torques);
  - runner and buckets;
  - injectors, nozzles and deflector kinematics;
  - hydraulic diagram (with bypass);
  - penstock long profile;
  - Coanda intake section;
  - single-line diagram (cross-sections, ratings, colours);
  - generator wiring (12N14P winding, bridge rectifier, tests);
  - bill of materials and tightening torques.

  Hydronome's published data is shown alongside the reconstruction.

- **Lessons**: 14 short lessons with key figures, formulas, a quiz and a matching scenario.
- **Parts**: filterable catalogue of every part (turbine, site, power room).

The simulation reproduces the figures from the video: site A (76 m head, Ø55 pipe, 350 m, 6 mm nozzle) ≈ 1.05 L/s and
≈ 500 W at ≈ 1 700 rpm; 8 mm nozzle ≈ 1.8 L/s; site B (21 m) ≈ 250 W in winter and ≈ 100 W at 0.75 L/s.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed by Vite. `npm run build` outputs a static site in `dist/`. Every push to `main` deploys to
production on Vercel, and `.github/workflows/deploy.yml` publishes the GitHub Pages mirror.

## Project layout

Pelton Lab is a **lab** built on the shared shell [`@onigam/lab-kit`](https://github.com/Onigam/lab-kit) (3D stage, application
frame, panels, SVG drawing kit, FR/EN strings), pinned in `package.json` to a release tag. This repository holds what is
specific to the Pelton turbine:

- `src/lab.ts`: the lab definition handed to the kit (simulation, 3D worlds, content, bottom-strip values, hooks);
  `src/main.ts` mounts it.
- `src/three/`: the 3D worlds (`site`, `intake`, `turbine`, `techroom`). `src/three/turbine/dims.ts` is the single
  source of truth for the turbine geometry.
- `src/sim/`: simulation engine, presets and scenarios; `src/panels/sim.ts` is the simulation side panel.
- `src/drawings/`: the 10 sheets, built from the same dimensions as the 3D model.
- `src/data/`: bilingual content (parts, assembly and installation guides, lessons). Lab-specific UI strings live in
  `src/i18n/ui.ts`.

## Regulations

In France, installing a micro-turbine or diverting water from a stream is regulated (water rights, ecological
continuity). Check with the **DDT** and the **OFB** before any project; other countries have similar rules.

## Credits

Source video: L'ArchiPelle with Sylvain (Hydronome). UI inspired by [Learn Arduino](https://learn-arduino-red.vercel.app)
and the [sael.net](https://sael.net/) explainers. Built with Three.js, TypeScript and Vite. Code under the MIT licence.

---

## Français

Laboratoire 3D interactif d'une **micro-turbine hydroélectrique Pelton** et de son installation autonome, du ruisseau
à la batterie. On y explore chaque pièce, on démonte et remonte la machine, on lance une simulation physique en direct
et on consulte les plans de conception. L'interface est bilingue (français / anglais) et fonctionne sur mobile.

> Reconstitution pédagogique indépendante d'après le reportage
> [« Son invention permet d'être autonome en électricité avec un simple ruisseau ! »](https://www.youtube.com/watch?v=0MixMbSYJ0g)
> (L'ArchiPelle, 2026) consacré aux turbines de Sylvain — [Hydronome](https://www.hydronome.fr), Ariège.
> Ce n'est ni un plan officiel ni un produit Hydronome. Le boîtier (574 × 328 × 402 mm), la roue de 26 augets Ø244 et la
> buse Ø14 maximum suivent les données publiées par le constructeur ; les pièces et cotes internes sont des estimations.

### Ce que contient le lab

#### Quatre mondes 3D

- **Site** : vallée pyrénéenne procédurale avec le ruisseau, la retenue et sa **prise d'eau Coanda** (grille inox
  1 mm), la **conduite forcée PEHD Ø63** qui suit le dénivelé, la turbine sur la berge, le canal de fuite, le câble vers
  le **local technique**, la maison et **4,5 kWc de panneaux solaires**. La prise d'eau se déplace le long du ruisseau
  quand on change la hauteur de chute ; le soleil suit l'heure et les saisons changent le feuillage, la neige et le
  débit (ruisseau à sec en été).
- **Prise d'eau** : gros plan sur la prise Coanda :
  - seuil en pierre sèche et plaque d'accélération ;
  - grille à fil profilé et bac de collecte ;
  - surverse et goulotte à débris ;
  - dessableur et sa vanne de chasse ;
  - crépine au départ de la conduite et évent.

  La transparence montre comment l'eau est captée.

- **Turbine** : chaque pièce est modélisée :
  - capot alu marin plié, hublot et cloison PMMA ;
  - roue Pelton à 26 augets (double cuillère, arête centrale, échancrure) et arbre inox ;
  - roulements 6204-2RS (billes visibles en coupe) et joint à lèvre ;
  - génératrice à rotor extérieur (stator feuilleté 12 dents bobiné, 14 aimants N52) et redresseur ;
  - injecteur à pointeau et injecteur latéral à buses interchangeables, col de cygne, vannes, vanne de dérivation et manomètre animé.

  Les jets et les gerbes d'eau sont en particules. Les **déflecteurs de jet** de sécurité sont actionnés par une
  vraie tringlerie derrière le flasque arrière : leviers, biellette, ressort de traction et gâche 12 V.

- **Local technique** : batteries LiFePO4 48 V, onduleur-chargeur, régulateur solaire MPPT, régulateur hydro à tension
  fixe, délesteur et résistances qui rougeoient, protections DC/AC, écran de supervision en direct, câblage.

#### Modes

- **Explorer** : vue d'ensemble de tout le dispositif, puis clic sur une pièce ou une étiquette pour ouvrir sa fiche
  (aperçu, caractéristiques, entretien, notes de conception, lien horodaté vers la vidéo). On peut **isoler** (ou double-clic),
  **centrer**, **éclater** progressivement, passer en **transparence**, en **coupe** (carter, roulements et injecteurs
  ouverts) et afficher les flux animés. Le panneau latéral se masque pour une 3D pleine largeur, s'élargit en glissant
  son bord ou passe en mode lecture pleine largeur.
- **Montage** : guide pas à pas en 19 étapes. Les pièces arrivent en place une à une sur le fantôme filaire de la
  machine finie, avec outils, couples de serrage et mises en garde.
- **Installation** : 10 étapes sur le site, du relevé de chute et de débit à la mise en service.
- **Simulation** : modèle physique temps réel qui couvre :
  - la conduite (Darcy–Weisbach) et le **coup de bélier** (colonne d'eau + Joukowsky) ;
  - les injecteurs, le couple Pelton, la génératrice et le câble ;
  - la régulation : tension fixe, MPPT classique ou direct batterie ;
  - les batteries, le solaire, la consommation, le **délestage** et le déflecteur de jet.

  Huit scénarios : prise d'eau à sec, grille colmatée, coup de bélier, MPPT qui pompe, délesteur en panne (emballement),
  câble de 400 m (48 V contre 200 V), nuit d'hiver et été à sec. Les graphiques montrent la dynamique sur 60 s, la courbe
  de puissance de la roue, les puissances sur 24 h, l'état de charge et le bilan des pertes. **Tous les paramètres se
  modifient en direct** : chute, longueur et Ø de conduite, débit du ruisseau, Ø de chaque buse, pointeau, jeu
  d'augets, bobinage, câble, mode de régulation…

- **Dimensionnement** : tableau « buse → débit → chute nette → puissance de sortie (W) → le ruisseau suffit-il ? » (un
  clic sur une ligne monte cette buse) et courbes de puissance de sortie (W) selon le débit pour chaque conduite PE de
  Ø50 à Ø110.
- **Plans** : 10 planches A3 de conception générées depuis les cotes du modèle 3D. On peut les zoomer, les télécharger
  en SVG et les imprimer :
  - plan d'ensemble coté ;
  - coupe de la ligne d'arbre (ajustements, couples) ;
  - roue Pelton et augets ;
  - injecteurs, buses et cinématique des déflecteurs ;
  - schéma hydraulique (avec vanne de dérivation) ;
  - profil en long de la conduite ;
  - coupe de la prise Coanda ;
  - schéma unifilaire (sections, calibres, couleurs) ;
  - câblage de la génératrice (bobinage 12N14P, pont redresseur, essais) ;
  - nomenclature et couples de serrage.

  Les données publiées par Hydronome figurent en regard de la reconstitution.

- **Leçons** : 14 leçons courtes avec chiffres clés, formules, quiz et scénario associé.
- **Pièces** : catalogue filtrable de toutes les pièces (turbine, site, local technique).

La simulation reproduit les chiffres du reportage : site A (76 m de chute, conduite Ø55 de 350 m, buse de 6 mm)
≈ 1,05 L/s et ≈ 500 W à ≈ 1 700 tr/min ; buse de 8 mm ≈ 1,8 L/s ; site B (21 m) ≈ 250 W en hiver et ≈ 100 W à
0,75 L/s.

### Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée par Vite. `npm run build` produit un site statique dans `dist/`. Chaque push sur `main` est
déployé en production sur Vercel, et `.github/workflows/deploy.yml` publie le miroir GitHub Pages.

### Organisation du code

Pelton Lab est un **lab** construit sur le socle commun [`@onigam/lab-kit`](https://github.com/Onigam/lab-kit) (scène 3D,
cadre de l'application, panneaux, kit de dessin SVG, textes FR/EN), épinglé dans `package.json` sur un tag de version. Ce
dépôt contient ce qui est propre à la turbine Pelton :

- `src/lab.ts` : la définition du lab remise au kit (simulation, mondes 3D, contenu, valeurs du bandeau, hooks) ;
  `src/main.ts` la monte.
- `src/three/` : les mondes 3D (`site`, `intake`, `turbine`, `techroom`). `src/three/turbine/dims.ts` est la source
  unique des cotes de la turbine.
- `src/sim/` : moteur de simulation, préréglages et scénarios ; `src/panels/sim.ts` est le panneau de simulation.
- `src/drawings/` : les 10 planches, construites à partir des mêmes cotes que le modèle 3D.
- `src/data/` : contenus bilingues (pièces, guides de montage et d'installation, leçons). Les textes d'interface propres
  au lab sont dans `src/i18n/ui.ts`.

### Réglementation

En France, installer une micro-turbine ou prélever l'eau d'un cours d'eau est encadré (droit d'eau, continuité
écologique). Renseignez-vous auprès de la **DDT** et de l'**OFB** avant tout projet.

### Crédits

Vidéo source : L'ArchiPelle avec Sylvain (Hydronome). Interface inspirée de [Learn Arduino](https://learn-arduino-red.vercel.app)
et des explications de [sael.net](https://sael.net/). Réalisé avec Three.js, TypeScript et Vite. Code sous licence MIT.
