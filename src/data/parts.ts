// Parts catalogue: every selectable 3D object of the turbine, site and technical-room scenes.
// Figures are kept consistent with the lessons and guides (site A: 76 m, 1.1 L/s, 499 W).
// Anything tagged version 'v2' is OUR industrialisation proposal, not a Hydronome product.

import type { L } from '../i18n';
import type { PartInfo, Spec } from './types';
import { l } from '../i18n';

/** Numeric value written the French way: derive the English form (7,4 -> 7.4 ; 1 500 -> 1,500 ; 3 % -> 3%). */
function num(fr: string): L | string {
  const en = fr
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d) (\d{3})(?!\d)/g, '$1,$2')
    .replace(/(\d) %/g, '$1%');
  return en === fr ? fr : l(fr, en);
}

/** Spec row with a bilingual label and a plain (auto-localised) or bilingual value. */
function sp(fr: string, en: string, value: string | L): Spec {
  return { label: l(fr, en), value: typeof value === 'string' ? num(value) : value };
}

// ---------------------------------------------------------------------------
// Turbine — housing and structure (shared V1/V2)
// ---------------------------------------------------------------------------

const TURBINE_STRUCTURE: PartInfo[] = [
  {
    id: 'base',
    scene: 'turbine',
    category: 'structure',
    name: l('Socle', 'Base plate'),
    short: l(
      'Plaque de fond qui porte tout le carter et laisse tomber l’eau turbinée dans le canal de fuite.',
      'Bottom plate that carries the whole housing and drops the spent water into the tailrace.',
    ),
    description: l(
      'Le socle est la référence de tout l’assemblage : la cloison, le palier principal, la vitre et le capot viennent s’y aligner. Sous la roue, une large lumière d’environ 300 × 140 mm laisse l’eau tomber directement : une Pelton travaille à l’air libre, l’eau doit quitter les augets sans jamais remonter vers la roue. Sur le prototype de la vidéo, il repose sur deux madriers à environ 1 m du sol, bien au-delà des 30 à 40 cm de chute libre minimum qu’indique Sylvain.',
      'The base plate is the datum of the whole assembly: partition, main bearing housing, window and cover all line up on it. Under the runner, a wide opening of about 300 × 140 mm lets the water drop straight out: a Pelton works at atmospheric pressure, so the water must leave the buckets and never splash back onto the wheel. On the prototype in the video it sits on two wooden beams about 1 m above the ground, well above the 30–40 cm minimum free fall Sylvain mentions.',
    ),
    material: l('PMMA noir coulé 10 mm', 'Black cast PMMA, 10 mm'),
    specs: [
      sp('Empreinte', 'Footprint', '580 × 360 mm'),
      sp('Épaisseur', 'Thickness', '10 mm'),
      sp('Lumière d’évacuation', 'Water outlet', '≈ 300 × 140 mm'),
      sp(
        'Garde sous le socle',
        'Clearance below',
        l('≥ 30–40 cm (≈ 1 m sur le prototype)', '≥ 30–40 cm (≈ 1 m on the prototype)'),
      ),
      sp('Fixation', 'Fastening', l('4 brides imprimées sur les madriers', '4 printed cleats onto the beams')),
    ],
    tip: l(
      'Mettez le socle de niveau dans les deux sens avant de serrer quoi que ce soit : un socle vrillé se transmet au palier et à l’alignement des trois roulements.',
      'Level the base in both directions before tightening anything: a twisted base is passed on to the bearing housing and to the alignment of the three bearings.',
    ),
    video: ['00:12', '02:54', '03:00'],
    upgrade: l(
      'En V2, le socle devient un bac en aluminium 5083 de 3 mm découpé laser et plié, à languettes et encoches auto-positionnantes et écrous sertis PEM. Il se boulonne sur le châssis et intègre un entonnoir qui guide l’eau vers le canal de fuite.',
      'In V2 the base becomes a laser-cut, folded 3 mm aluminium 5083 tray with self-locating tabs and slots and PEM self-clinching nuts. It bolts onto the skid and includes a funnel that guides the water into the tailrace.',
    ),
  },
  {
    id: 'partition',
    scene: 'turbine',
    category: 'structure',
    name: l('Cloison étanche', 'Watertight partition'),
    short: l(
      'Mur en PMMA qui sépare la chambre humide (roue) de la chambre sèche (générateur).',
      'PMMA wall that separates the wet chamber (runner) from the dry chamber (generator).',
    ),
    description: l(
      'À plus de 35 m/s, le jet se pulvérise en brouillard dans toute la chambre de la roue. La cloison isole ce brouillard du générateur, de ses bobines et du redresseur : sans elle, l’humidité finirait par attaquer l’isolant des fils et les contacts. Comme le montre la vidéo, ce sont des plaques de plexiglas découpées sur mesure, assemblées puis jointées ; seul l’arbre la traverse, à travers le palier principal et son joint à lèvre.',
      'At more than 35 m/s the jet turns into a fine mist that fills the runner chamber. The partition keeps this mist away from the generator, its coils and the rectifier: without it, moisture would eventually attack the wire insulation and the contacts. As shown in the video, it is made of custom-cut plexiglass plates, assembled and sealed; only the shaft goes through it, via the main bearing housing and its lip seal.',
    ),
    material: l('PMMA coulé (GS) 8 mm, joints MS-polymère', 'Cast PMMA (GS) 8 mm, MS-polymer sealant'),
    specs: [
      sp('Épaisseur', 'Thickness', '8 mm'),
      sp('Profil', 'Outline', l('Hexagonal « maison », 580 × 460 mm', 'Hexagonal “house” outline, 580 × 460 mm')),
      sp('Étanchéité', 'Sealing', l('Cordon MS-polymère sur tout le pourtour', 'MS-polymer bead all around')),
      sp(
        'Traversée',
        'Pass-through',
        l('Palier principal + joint à lèvre 20 × 35 × 7', 'Main bearing housing + 20 × 35 × 7 lip seal'),
      ),
    ],
    maintenance: l(
      'Une fois par an, ouvrez le capot et cherchez des traces d’eau ou de calcaire côté générateur : c’est le premier signe d’un joint à lèvre fatigué.',
      'Once a year, open the cover and look for water or lime traces on the generator side: it is the first sign of a worn lip seal.',
    ),
    tip: l(
      'Prenez du PMMA coulé (GS) plutôt qu’extrudé (XT) : il fissure beaucoup moins au contact des solvants et autour des perçages. Percez avec un foret à affûtage neutre et sans forcer.',
      'Use cast PMMA (GS) rather than extruded (XT): it is far less prone to crazing with solvents and around holes. Drill with a zero-rake bit and a light feed.',
    ),
    video: ['05:10', '08:36'],
    upgrade: l(
      'En V2, la cloison est découpée en CNC avec des tenons qui s’emboîtent dans le socle et le capot, et elle est serrée sur un joint EPDM au lieu d’être collée : on peut la démonter sans rien casser.',
      'In V2 the partition is CNC-cut with tabs that key into the base and cover, and it is clamped on an EPDM gasket instead of being glued: it can be removed without breaking anything.',
    ),
  },
  {
    id: 'window',
    scene: 'turbine',
    category: 'structure',
    name: l('Vitre avant', 'Front window'),
    short: l(
      'Façade transparente côté roue : on voit le jet frapper les augets.',
      'Clear front panel on the runner side: you can watch the jet hit the buckets.',
    ),
    description: l(
      'La façade en PMMA ferme la chambre humide tout en laissant voir la roue, le jet et le brouillard. C’est un vrai outil de diagnostic : un jet qui s’ouvre en gerbe, qui tape à côté de l’arête centrale ou des projections qui reviennent sur la roue se voient immédiatement. Dans la vidéo, on se tient à une longueur de bras de la turbine en marche sans recevoir une goutte, preuve que la chambre est bien close.',
      'The PMMA front panel closes the wet chamber while keeping the runner, the jet and the spray visible. It is a real diagnostic tool: a jet that fans out, a jet that misses the splitter ridge or water bouncing back onto the wheel show up at once. In the video the presenter stands at arm’s length from the running turbine without getting a drop on him, proof that the chamber is properly closed.',
    ),
    material: l('PMMA coulé incolore 8 mm', 'Clear cast PMMA, 8 mm'),
    specs: [
      sp('Épaisseur', 'Thickness', '8 mm'),
      sp('Profil', 'Outline', l('Hexagonal « maison », 580 × 460 mm', 'Hexagonal “house” outline, 580 × 460 mm')),
      sp('Fixation', 'Fastening', l('Vis inox A4 M5 + rondelles larges', 'A4 stainless M5 screws + large washers')),
      sp('Dilatation', 'Thermal expansion', '≈ 0,07 mm/m/°C'),
    ],
    maintenance: l(
      'Nettoyez à l’eau savonneuse avec un chiffon doux. Jamais d’alcool, d’acétone ni de nettoyant vitres ammoniaqué : le PMMA se fendille.',
      'Clean with soapy water and a soft cloth. Never use alcohol, acetone or ammonia glass cleaner: PMMA crazes.',
    ),
    tip: l(
      'Percez les trous de fixation 1 mm plus grands que la vis : le PMMA se dilate environ sept fois plus que l’acier et fissure autour d’une vis trop serrée.',
      'Drill the fixing holes 1 mm oversize: PMMA expands about seven times more than steel and cracks around an overtightened screw.',
    ),
    video: ['00:12', '02:12', '02:36'],
  },
  {
    id: 'gasket',
    scene: 'turbine',
    category: 'structure',
    name: l('Joint de carter', 'Housing gasket'),
    short: l(
      'Cordon EPDM entre les plaques et le capot : garde l’eau dedans.',
      'EPDM strip between the plates and the cover: keeps the water inside.',
    ),
    description: l(
      'Les plaques de PMMA ne sont jamais parfaitement planes et le capot plié a ses tolérances : le joint rattrape ces écarts et absorbe les vibrations de la roue. L’EPDM est choisi parce qu’il résiste à l’eau, aux UV et à l’ozone pendant des années, là où un néoprène ou une mousse PU se dégradent. Il est comprimé d’environ un quart de son épaisseur : trop peu, ça fuit ; trop, il flue et ne revient plus.',
      'PMMA plates are never perfectly flat and the folded cover has its own tolerances: the gasket takes up these gaps and damps the runner vibration. EPDM is chosen because it withstands water, UV and ozone for years, where neoprene or PU foam degrade. It is compressed by about a quarter of its thickness: too little and it leaks, too much and it takes a permanent set.',
    ),
    material: l('EPDM cellulaire à cellules fermées', 'Closed-cell EPDM'),
    specs: [
      sp('Section', 'Section', '10 × 4 mm'),
      sp('Compression visée', 'Target compression', '25–30 %'),
      sp('Température', 'Temperature range', '−40 … +100 °C'),
      sp('Longueur totale', 'Total length', '≈ 4 m'),
    ],
    maintenance: l(
      'À remplacer s’il reste écrasé ou craquelé après ouverture du capot, typiquement en même temps que les roulements.',
      'Replace it if it stays flattened or cracked after the cover is removed, typically together with the bearings.',
    ),
    tip: l(
      'Faites le raccord du cordon en haut du carter, jamais en bas : une coupe mal jointive en partie basse est une fuite assurée.',
      'Put the strip joint at the top of the housing, never at the bottom: a poorly butted joint low down is a guaranteed leak.',
    ),
    video: ['05:10'],
    upgrade: l(
      'En V2, un profilé EPDM à bourrelet se clipse sur le chant du capot : il est captif, ne se décolle pas et se remonte sans colle à chaque ouverture par les grenouillères.',
      'In V2 a bulb-type EPDM edge trim clips onto the cover edge: it is captive, never peels off and goes back on without glue every time the toggle latches are opened.',
    ),
  },
  {
    id: 'rear-panel',
    scene: 'turbine',
    category: 'structure',
    name: l('Panneau arrière ventilé', 'Vented rear panel'),
    short: l(
      'Ferme la chambre sèche, porte le roulement 3 et laisse respirer le générateur.',
      'Closes the dry chamber, holds bearing 3 and lets the generator breathe.',
    ),
    description: l(
      'Le panneau noir ferme le carter côté générateur. Il porte le troisième roulement, qui tient le bout de l’arbre derrière le rotor, et une grille ronde par laquelle la face ventilateur du rotor aspire l’air frais. Le générateur chauffe en permanence (pertes cuivre et fer) : sans renouvellement d’air, l’intérieur du carter monterait vite en température au détriment des bobines et des aimants.',
      'The black panel closes the housing on the generator side. It holds the third bearing, which supports the end of the shaft behind the rotor, and a round grille through which the rotor’s fan face draws cool air. The generator heats up continuously (copper and iron losses): without air exchange, the inside of the housing would quickly get hot, at the expense of the coils and magnets.',
    ),
    material: l(
      'PMMA noir 8 mm, grille et flasque imprimés en ASA',
      'Black PMMA 8 mm, printed ASA grille and bearing flange',
    ),
    specs: [
      sp(
        'Modèle commercial Hydronome',
        'Hydronome commercial model',
        l(
          'Filtres à air démontables sans outil, à laver 1 à 2 fois par an',
          'Tool-less removable air filters, wash 1–2 times a year',
        ),
      ),
      sp('Épaisseur', 'Thickness', '8 mm'),
      sp('Grille d’aération', 'Vent grille', 'Ø 100 mm'),
      sp('Roulement porté', 'Bearing held', '6204-2RS (n° 3)'),
      sp('Sortie câble', 'Cable exit', l('Presse-étoupe M20 IP68', 'M20 IP68 cable gland')),
    ],
    maintenance: l(
      'Dépoussiérez la grille à chaque visite : toiles d’araignée et feuilles réduisent vite le débit d’air.',
      'Dust the grille at every visit: cobwebs and leaves quickly choke the airflow.',
    ),
    tip: l(
      'Orientez la sortie d’air vers le bas ou sur le côté, jamais vers le haut : une grille tournée vers le ciel devient une entrée de pluie.',
      'Point the air outlet down or sideways, never upwards: a grille facing the sky becomes a rain inlet.',
    ),
    video: ['02:18', '03:36'],
  },
  {
    id: 'cover',
    scene: 'turbine',
    category: 'structure',
    name: l('Capot aluminium', 'Aluminium cover'),
    short: l(
      'Tôle d’aluminium marin pliée en profil de « maison » qui enveloppe toute la turbine.',
      'Marine aluminium sheet folded into a “house” profile that wraps the whole turbine.',
    ),
    description: l(
      'Le capot est découpé et plié à la demande par une entreprise toulousaine, en aluminium marin. L’alliage 5083 résiste à l’eau et à l’humidité sans peinture, se plie sans fissurer et reste léger. Son profil hexagonal fait ruisseler l’eau sur les pans et donne de la raideur à une tôle de seulement 2 mm.',
      'The cover is cut and folded to order by a company in Toulouse, from marine-grade aluminium. Alloy 5083 withstands water and humidity without paint, bends without cracking and stays light. Its hexagonal profile sheds water down the slopes and stiffens a sheet only 2 mm thick.',
    ),
    material: l('Aluminium 5083 H111, 2 mm', 'Aluminium 5083 H111, 2 mm'),
    specs: [
      sp('Encombrement carter', 'Housing envelope', '580 × 360 × 460 mm'),
      sp('Épaisseur', 'Thickness', '2 mm'),
      sp('Fabrication', 'Process', l('Découpe laser + pliage presse', 'Laser cutting + press-brake bending')),
      sp('Masse', 'Mass', '≈ 2,5 kg'),
    ],
    tip: l(
      'Ne vissez jamais de l’inox directement dans l’aluminium mouillé : interposez une rondelle nylon ou une graisse anti-grippage, sinon la corrosion galvanique bloque les vis en un hiver.',
      'Never screw stainless steel straight into wet aluminium: add a nylon washer or anti-seize grease, otherwise galvanic corrosion seizes the screws within one winter.',
    ),
    video: ['05:00', '08:30'],
    upgrade: l(
      'En V2, la tôle reçoit des languettes et encoches qui positionnent les plaques sans gabarit, des écrous sertis PEM à la place des vis à tôle et quatre grenouillères : le capot s’enlève sans outil pour l’entretien.',
      'In V2 the sheet gets tabs and slots that locate the plates without a jig, PEM self-clinching nuts instead of self-tapping screws, and four toggle latches: the cover comes off without tools for maintenance.',
    ),
  },
];

// ---------------------------------------------------------------------------
// Turbine — rotating assembly (shared V1/V2)
// ---------------------------------------------------------------------------

const BEARING_SPECS: Spec[] = [
  sp('Référence', 'Part number', '6204-2RS C3'),
  sp('Dimensions', 'Dimensions', '20 × 47 × 14 mm'),
  sp('Charge dynamique C', 'Dynamic load rating C', '12,7 kN'),
  sp('Durée de vie constatée', 'Field life', l('3 à 5 ans à ≈ 1 500 tr/min', '3–5 years at ≈ 1,500 rpm')),
  sp('Prix', 'Price', '≈ 10 €'),
];

const BEARING_MAINT = l(
  'Changez les trois roulements et les joints ensemble tous les 3 à 5 ans (50 à 60 € de pièces selon la vidéo), ou plus tôt si l’arbre grogne, chauffe ou prend du jeu.',
  'Replace all three bearings and the seals together every 3 to 5 years (50–60 € of parts according to the video), or sooner if the shaft growls, runs hot or develops play.',
);

const TURBINE_ROTATING: PartInfo[] = [
  {
    id: 'bearing-1',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Roulement 1 (côté roue)', 'Bearing 1 (runner side)'),
    short: l(
      'Roulement à billes étanche le plus proche de la roue Pelton : il encaisse l’effort du jet.',
      'Sealed ball bearing closest to the Pelton runner: it takes the jet load.',
    ),
    description: l(
      'Le jet pousse la roue d’un seul côté : le roulement 1, placé juste derrière le joint à lèvre, reprend l’essentiel de cette charge radiale. C’est un 6204-2RS, un roulement standard que l’on trouve partout pour une dizaine d’euros, avec deux flasques caoutchouc qui gardent la graisse dedans et l’humidité dehors. Comme il travaille au plus près de la chambre humide, c’est lui qui s’use en premier.',
      'The jet pushes the runner on one side only: bearing 1, fitted right behind the lip seal, takes most of this radial load. It is a 6204-2RS, a standard bearing available everywhere for about ten euros, with two rubber shields that keep the grease in and the moisture out. Because it works closest to the wet chamber, it is the first to wear.',
    ),
    material: l('Acier à roulement 100Cr6, flasques NBR', '100Cr6 bearing steel, NBR shields'),
    specs: BEARING_SPECS,
    maintenance: BEARING_MAINT,
    tip: l(
      'Au montage sur l’arbre, poussez uniquement sur la bague intérieure, avec un tube à la bonne dimension. Ne tapez jamais sur la bague extérieure : les billes marquent les pistes et le roulement est condamné.',
      'When fitting it on the shaft, push on the inner ring only, with a tube of the right size. Never hammer on the outer ring: the balls dent the raceways and the bearing is finished.',
    ),
    video: ['04:05'],
    upgrade: l(
      'En V2, les roulements 1 et 2 sont prémontés dans une cartouche usinée avec joint double lèvre et graisseur : on remplace le tout d’un bloc en dix minutes.',
      'In V2, bearings 1 and 2 are pre-assembled in a machined cartridge with a double lip seal and a grease nipple: the whole unit is swapped in ten minutes.',
    ),
  },
  {
    id: 'bearing-2',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Roulement 2 (côté générateur)', 'Bearing 2 (generator side)'),
    short: l(
      'Second roulement du palier principal : avec le premier, il tient l’arbre bien droit.',
      'Second bearing of the main housing: together with the first, it keeps the shaft straight.',
    ),
    description: l(
      'Deux roulements écartés dans le même palier forment un couple qui empêche l’arbre de basculer sous l’effort du jet. Plus l’écart est grand, plus la roue tourne droit et moins les augets battent. Le roulement 2 voit moins de charge que le premier, mais il est changé en même temps : on ne mélange pas un roulement neuf et un roulement usé sur le même arbre.',
      'Two bearings spaced apart in the same housing form a couple that stops the shaft from tilting under the jet load. The wider the spacing, the truer the runner spins and the less the buckets wobble. Bearing 2 carries less load than the first one, but it is replaced at the same time: never mix a new and a worn bearing on the same shaft.',
    ),
    material: l('Acier à roulement 100Cr6, flasques NBR', '100Cr6 bearing steel, NBR shields'),
    specs: BEARING_SPECS,
    maintenance: BEARING_MAINT,
    tip: l(
      'Montez une entretoise entre les deux bagues intérieures : le serrage axial passe par elle et non par les billes.',
      'Fit a spacer between the two inner rings: the axial clamping force goes through it, not through the balls.',
    ),
    video: ['04:05'],
    upgrade: l(
      'En V2, il fait partie de la cartouche de palier interchangeable, prémontée et graissée à l’atelier.',
      'In V2 it is part of the swappable bearing cartridge, pre-assembled and greased on the bench.',
    ),
  },
  {
    id: 'bearing-3',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Roulement 3 (panneau arrière)', 'Bearing 3 (rear panel)'),
    short: l(
      'Soutient le bout de l’arbre derrière le rotor du générateur.',
      'Supports the end of the shaft behind the generator rotor.',
    ),
    description: l(
      'Le rotor à aimants est lourd et l’attraction magnétique tire sur lui dès qu’il n’est pas parfaitement centré dans le stator. Le roulement 3, logé dans le panneau arrière, tient l’arbre de ce côté pour garder un entrefer régulier. Avec trois appuis, l’arbre est hyperstatique : l’alignement des trois roulements devient le point le plus délicat du montage.',
      'The magnet rotor is heavy and magnetic attraction pulls on it as soon as it is not perfectly centred on the stator. Bearing 3, held in the rear panel, supports the shaft on that side to keep an even air gap. With three supports, the shaft is statically indeterminate: aligning the three bearings becomes the trickiest part of the build.',
    ),
    material: l('Acier à roulement 100Cr6, flasques NBR', '100Cr6 bearing steel, NBR shields'),
    specs: BEARING_SPECS,
    maintenance: BEARING_MAINT,
    tip: l(
      'Serrez le panneau arrière en dernier, en faisant tourner l’arbre à la main : il doit rester libre. S’il durcit pendant le serrage, le roulement 3 n’est pas dans l’axe.',
      'Tighten the rear panel last while turning the shaft by hand: it must stay free. If it stiffens as you tighten, bearing 3 is off-axis.',
    ),
    video: ['04:05'],
  },
  {
    id: 'seal',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Joint à lèvre', 'Lip seal'),
    short: l(
      'Empêche le brouillard de la chambre humide de suivre l’arbre vers les roulements.',
      'Stops the wet-chamber mist from following the shaft into the bearings.',
    ),
    description: l(
      'Là où l’arbre traverse la cloison, une lèvre en caoutchouc frotte en permanence sur l’acier poli. Le ressort intérieur plaque la lèvre principale côté eau, et une seconde lèvre arrête la poussière côté roulements. C’est la pièce d’usure n° 1 avec les roulements : Sylvain parle de « changer les joints » à chaque entretien.',
      'Where the shaft passes through the partition, a rubber lip rubs continuously on the polished steel. An internal garter spring presses the main lip on the water side, and a second lip keeps dirt away from the bearings. Together with the bearings, it is the main wear part: Sylvain mentions “changing the seals” at every service.',
    ),
    material: l('NBR, ressort inox, armature acier', 'NBR, stainless garter spring, steel case'),
    specs: [
      sp(
        'Modèle commercial Hydronome',
        'Hydronome commercial model',
        l(
          '3 roulements SKF en opposition, sans entretien, ≥ 4 ans',
          '3 SKF bearings in opposed mounting, maintenance-free, ≥ 4 years',
        ),
      ),
      sp('Dimensions', 'Dimensions', '20 × 35 × 7 mm'),
      sp('Type', 'Type', l('TC, double lèvre', 'TC, double lip')),
      sp('Vitesse périphérique max', 'Max surface speed', '≈ 10 m/s'),
      sp('Vitesse à 1 500 tr/min', 'Speed at 1,500 rpm', '1,6 m/s'),
    ],
    maintenance: l(
      'À changer avec les roulements. Un arbre rayé à l’endroit de la lèvre doit être repoli ou remplacé, sinon le joint neuf fuira.',
      'Replace with the bearings. A shaft scored where the lip runs must be polished or replaced, otherwise the new seal will leak.',
    ),
    tip: l(
      'Lèvre principale tournée vers l’eau, lèvre graissée avant d’enfiler l’arbre, et un chanfrein sur l’arbre pour ne pas la retourner au passage.',
      'Main lip facing the water, lip greased before the shaft goes in, and a chamfer on the shaft so the lip does not fold back on the way.',
    ),
    video: ['04:20'],
    upgrade: l(
      'En V2, un V-ring déflecteur et une chicane labyrinthe arrêtent l’essentiel de l’eau avant le joint, monté en double lèvre dans la cartouche graissable.',
      'In V2 a V-ring slinger and a labyrinth stop most of the water before the seal, which is a double-lip type fitted in the greasable cartridge.',
    ),
  },
  {
    id: 'shaft',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Arbre inox Ø20', 'Ø20 stainless shaft'),
    short: l(
      'Relie la roue Pelton au rotor du générateur, à travers la cloison.',
      'Connects the Pelton runner to the generator rotor, through the partition.',
    ),
    description: l(
      'Entraînement direct : la roue et le rotor tournent à la même vitesse, sans courroie ni multiplicateur, ce qui supprime une source de pertes et de pannes. Le couple est faible, environ 3 N·m pour 500 W à 1 500 tr/min, mais l’arbre doit être raide pour garder l’entrefer du générateur et résister aux vibrations. L’inox 316L ne rouille pas dans la chambre humide et offre une portée lisse au joint à lèvre.',
      'Direct drive: the runner and the rotor spin at the same speed, with no belt or gearbox, which removes a source of losses and failures. The torque is low, about 3 N·m for 500 W at 1,500 rpm, but the shaft must be stiff to keep the generator air gap and to withstand vibration. 316L stainless steel does not rust in the wet chamber and gives a smooth running surface for the lip seal.',
    ),
    material: l('Inox 316L rectifié', 'Ground 316L stainless steel'),
    specs: [
      sp('Diamètre', 'Diameter', 'Ø 20 h6'),
      sp('Longueur', 'Length', '322 mm'),
      sp('Couple à 499 W / 1 500 tr/min', 'Torque at 499 W / 1,500 rpm', '≈ 3,2 N·m'),
      sp('Bout côté roue', 'Runner end', l('Rainure de clavette 6 mm + filetage M16', '6 mm keyway + M16 thread')),
    ],
    tip: l(
      'Vérifiez le faux-rond au comparateur avant montage : 0,05 mm suffit à faire battre la roue et à fatiguer les roulements.',
      'Check run-out with a dial gauge before assembly: 0.05 mm is enough to make the runner wobble and tire the bearings.',
    ),
    video: ['03:48'],
  },
  {
    id: 'wheel-hub',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Moyeu de roue', 'Runner hub disc'),
    short: l(
      'Disque imprimé qui porte les 22 augets en couronne.',
      'Printed disc that carries the 22 buckets in a ring.',
    ),
    description: l(
      'Le moyeu positionne chaque auget au bon angle et au bon rayon : c’est lui qui fixe le diamètre primitif de 230 mm, donc la vitesse de rotation pour une chute donnée. Il est imprimé en 3D, ce qui permet de fabriquer un moyeu par taille d’auget. Au centre, quatre vis le relient à la bride acier qui reçoit le moyeu amovible conique.',
      'The hub disc sets each bucket at the right angle and radius: it fixes the 230 mm pitch diameter, and therefore the rotational speed for a given head. It is 3D printed, so one hub can be made for each bucket size. In the centre, four screws connect it to the steel flange that receives the taper-lock bush.',
    ),
    material: l('PETG, remplissage 100 % autour des logements', 'PETG, 100% infill around the seats'),
    specs: [
      sp('Diamètre du disque', 'Disc diameter', 'Ø170 mm'),
      sp('Épaisseur', 'Thickness', '12 mm'),
      sp('Logements d’augets', 'Bucket seats', l('22, au pas de 16,4°', '22, at a 16.4° pitch')),
      sp('Liaison au moyeu', 'Hub connection', l('4 vis M5 sur bride acier', '4 × M5 screws to a steel flange')),
    ],
    tip: l(
      'Imprimez le disque à plat, avec au moins 5 périmètres : les efforts passent par les parois, pas par le remplissage.',
      'Print the disc flat with at least 5 perimeters: loads go through the walls, not the infill.',
    ),
    video: ['00:18', '09:24'],
  },
  {
    id: 'buckets',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Augets Pelton', 'Pelton buckets'),
    short: l(
      'Les « cuillères » qui fendent le jet en deux et le renvoient vers l’arrière.',
      'The “spoons” that split the jet in two and turn it back.',
    ),
    description: l(
      'L’arête centrale de chaque auget fend le jet en deux ; l’eau suit les deux coquilles incurvées, fait presque demi-tour (environ 165°) et sort sur les côtés. En inversant la vitesse de l’eau, l’auget récupère l’essentiel de son énergie cinétique, à condition de tourner à environ 0,46 fois la vitesse du jet. Comme le montre la vidéo, il existe plusieurs tailles : chaque jeu d’augets est assorti à un diamètre d’injecteur, avec une largeur proche de 3,2 fois le diamètre du jet.',
      'The central splitter ridge of each bucket cuts the jet in two; the water follows the two curved cups, almost reverses (about 165°) and leaves sideways. By reversing the water’s velocity, the bucket recovers most of its kinetic energy, provided it moves at about 0.46 times the jet speed. As shown in the video, there are several sizes: each bucket set is matched to an injector diameter, with a width close to 3.2 times the jet diameter.',
    ),
    material: l('PETG ou ASA imprimé', 'Printed PETG or ASA'),
    specs: [
      sp(
        'Modèle commercial Hydronome',
        'Hydronome commercial model',
        l(
          '26 augets en polymère renforcé injecté, roue Ø244 mm ext., injecteur Ø14 mm maxi',
          '26 injection-moulded reinforced-polymer buckets, runner Ø244 mm OD, max nozzle Ø14 mm',
        ),
      ),
      sp('Nombre', 'Count', '22'),
      sp('Diamètre primitif', 'Pitch diameter', '230 mm'),
      sp('Largeur (jet 6 mm)', 'Width (6 mm jet)', '≈ 19 mm'),
      sp('Largeur (jet 8 mm)', 'Width (8 mm jet)', '≈ 26 mm'),
      sp('Déviation du jet', 'Jet deflection', '≈ 165°'),
      sp('Vitesse optimale', 'Optimum speed', 'u ≈ 0,46 · v_jet'),
    ],
    maintenance: l(
      'Chaque année, inspectez l’arête centrale (usure par le sable) et le pied de chaque auget (fissures). Remplacez le jeu complet plutôt qu’un auget isolé, pour garder l’équilibrage.',
      'Every year, inspect the splitter edge (sand erosion) and the root of each bucket (cracks). Replace the whole set rather than a single bucket, to keep the runner balanced.',
    ),
    tip: l(
      'Pesez les augets à la sortie de l’imprimante et appariez-les à ±0,5 g en vis-à-vis : une roue déséquilibrée à 1 500 tr/min use les roulements en quelques mois.',
      'Weigh the buckets as they come off the printer and pair opposite ones within ±0.5 g: an unbalanced runner at 1,500 rpm wears out the bearings in a few months.',
    ),
    video: ['00:18', '09:24', '09:36', '09:50'],
    qty: 22,
    upgrade: l(
      'En V2, les augets sont vendus en kits appairés à chaque insert d’injecteur, pesés et numérotés, et montés avec un gabarit qui garantit l’angle et le rayon de chaque pièce.',
      'In V2, buckets come in kits matched to each injector insert, weighed and numbered, and are fitted with a jig that guarantees the angle and radius of every piece.',
    ),
  },
  {
    id: 'wheel-ring',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Bague de serrage', 'Clamping ring'),
    short: l(
      'Anneau qui pince le pied des 22 augets contre le moyeu.',
      'Ring that clamps the roots of the 22 buckets against the hub disc.',
    ),
    description: l(
      'Chaque auget est pris en sandwich entre le moyeu et la bague, et une vis M4 traverse l’ensemble au droit de chaque pied. Ce montage répartit l’effort centrifuge et l’impact du jet sur toute la couronne au lieu de tout faire porter à une seule vis. On peut aussi changer un jeu d’augets sans réimprimer le moyeu.',
      'Each bucket is sandwiched between the hub disc and the ring, and an M4 bolt goes through the stack at every bucket root. This spreads the centrifugal load and the jet impact over the whole ring instead of loading a single screw. It also allows a bucket set to be changed without reprinting the hub.',
    ),
    material: l('PETG imprimé, visserie inox A4', 'Printed PETG, A4 stainless bolts'),
    specs: [
      sp('Vis', 'Bolts', l('22 × M4 inox A4 + écrous nylstop', '22 × M4 A4 stainless + nyloc nuts')),
      sp('Couple de serrage', 'Tightening torque', l('2 N·m, en étoile', '2 N·m, star pattern')),
      sp('Épaisseur', 'Thickness', '6 mm'),
    ],
    maintenance: l(
      'Contrôlez le couple des 22 vis après les 50 premières heures, puis une fois par an : le plastique flue un peu sous charge.',
      'Check the torque of the 22 bolts after the first 50 hours, then once a year: the plastic creeps a little under load.',
    ),
    tip: l(
      'Serrez en étoile en trois passes (à la main, 1 N·m, puis 2 N·m). Plus fort, vous écrasez le PETG et la roue se met à battre.',
      'Tighten in a star pattern in three passes (by hand, 1 N·m, then 2 N·m). Any tighter and you crush the PETG and the runner starts to wobble.',
    ),
    video: ['09:24'],
    upgrade: l(
      'En V2, la bague est découpée laser dans de l’inox 316L de 3 mm : elle ne flue plus et garde son serrage d’une année sur l’autre.',
      'In V2 the ring is laser-cut from 3 mm 316L stainless steel: it no longer creeps and keeps its clamping force year after year.',
    ),
  },
  {
    id: 'wheel-lock',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Moyeu conique et écrou', 'Taper-lock bush and nut'),
    short: l(
      'Bloque la roue sur l’arbre sans jeu, et permet de la démonter sans arrache-moyeu.',
      'Locks the runner on the shaft with zero backlash, and lets it come off without a puller.',
    ),
    description: l(
      'Un moyeu amovible conique de type Taper-Lock se serre par deux vis sans tête qui l’enfoncent dans une bride acier : le cône se referme sur l’arbre et centre parfaitement la roue. Contrairement à une simple vis de pression, il ne marque pas l’arbre et ne prend pas de jeu avec les vibrations. L’écrou en bout d’arbre est une sécurité axiale supplémentaire.',
      'A Taper-Lock style bush is tightened by two grub screws that draw it into a steel flange: the taper closes onto the shaft and centres the runner perfectly. Unlike a plain set screw, it does not mark the shaft and does not work loose with vibration. The nut at the shaft end is an extra axial safety.',
    ),
    material: l('Fonte / acier phosphaté, écrou inox A4', 'Cast iron / phosphated steel, A4 stainless nut'),
    specs: [
      sp('Moyeu conique', 'Taper bush', l('Taper-Lock 1108, alésage Ø20', 'Taper-Lock 1108, Ø20 bore')),
      sp('Vis du cône', 'Bush screws', l('2 × 1/4" BSW, 5,7 N·m', '2 × 1/4" BSW, 5.7 N·m')),
      sp('Écrou', 'Nut', l('M16 nylstop inox + rondelle', 'M16 stainless nyloc + washer')),
      sp('Clavette', 'Key', '6 × 6 mm'),
    ],
    tip: l(
      'Montez le cône propre et sec, sans graisse ni huile : lubrifié, il se serre trop et peut fendre la bride. Pour démonter, vissez une des vis dans le trou d’extraction.',
      'Fit the taper clean and dry, with no grease or oil: lubricated, it over-tightens and can split the flange. To remove it, drive one screw into the extraction hole.',
    ),
    video: ['00:12', '02:36'],
  },
];

// ---------------------------------------------------------------------------
// Turbine — generator and electrical output (shared V1/V2)
// ---------------------------------------------------------------------------

const TURBINE_ELECTRICAL: PartInfo[] = [
  {
    id: 'stator',
    scene: 'turbine',
    category: 'electrical',
    name: l('Stator bobiné', 'Wound stator'),
    short: l(
      'Étoile fixe de 12 dents bobinées en cuivre : c’est là que naît la tension.',
      'Fixed 12-tooth star wound with copper: this is where the voltage is born.',
    ),
    description: l(
      'Quand les aimants du rotor défilent devant les bobines, le flux magnétique qui les traverse varie et induit une tension proportionnelle à la vitesse (E = k·ω). Les 12 bobines sont réparties en trois phases décalées de 120°, ce qui donne une puissance plus régulière qu’en monophasé et un redressement plus propre. Sylvain fabrique ses propres générateurs car les machines Motenergy qu’il utilisait, pourtant performantes, voyaient leurs stators chauffer jusqu’à la destruction quand la turbine était souvent arrêtée et relancée.',
      'As the rotor magnets sweep past the coils, the magnetic flux through them changes and induces a voltage proportional to speed (E = k·ω). The 12 coils are split into three phases 120° apart, which gives smoother power than single phase and cleaner rectification. Sylvain builds his own generators because the Motenergy machines he used, efficient as they were, had stators that overheated to destruction when the turbine was frequently stopped and restarted.',
    ),
    material: l(
      'Tôles fer-silicium 0,35 mm, fil cuivre émaillé classe H',
      '0.35 mm silicon-steel laminations, class H enamelled copper wire',
    ),
    specs: [
      sp('Configuration', 'Layout', l('12 dents / 14 pôles (7 paires)', '12 teeth / 14 poles (7 pole pairs)')),
      sp('Couplage', 'Connection', l('Étoile, 4 bobines par phase', 'Star (Y), 4 coils per phase')),
      sp('Fréquence à 1 500 tr/min', 'Frequency at 1,500 rpm', '175 Hz'),
      sp('Constante de tension (DC)', 'Voltage constant (DC)', l('≈ 0,04 V par tr/min', '≈ 0.04 V per rpm')),
      sp('Classe thermique', 'Insulation class', l('H (200 °C)', 'H (200 °C)')),
    ],
    maintenance: l(
      'Mesurez la résistance entre phases chaque année : les trois valeurs doivent rester identiques à quelques pourcents près.',
      'Measure the phase-to-phase resistance every year: the three readings must stay within a few percent of each other.',
    ),
    tip: l(
      'Imprégnez le bobinage de vernis après montage : les spires ne vibrent plus et l’humidité n’atteint plus le cuivre.',
      'Varnish-impregnate the winding after assembly: the turns stop vibrating and moisture no longer reaches the copper.',
    ),
    video: ['04:25', '09:55', '10:00'],
    upgrade: l(
      'En V2, une sonde CTN est noyée dans le bobinage : le contrôleur voit la température réelle et peut ouvrir le déflecteur avant que le stator ne souffre.',
      'In V2 an NTC probe is embedded in the winding: the controller sees the real temperature and can trip the deflector before the stator suffers.',
    ),
  },
  {
    id: 'rotor',
    scene: 'turbine',
    category: 'electrical',
    name: l('Rotor extérieur à aimants', 'Outer magnet rotor'),
    short: l(
      'Cloche imprimée qui tourne autour du stator, avec les aimants à l’intérieur et un ventilateur sur la face.',
      'Printed bell that spins around the stator, with the magnets inside and a fan on its face.',
    ),
    description: l(
      'Dans un générateur à rotor extérieur, c’est la cloche qui tourne autour du stator fixe : les aimants sont plus loin de l’axe, ce qui donne plus de couple et de tension pour un encombrement réduit. La cloche est imprimée en 3D, comme on le voit dans la vidéo, avec les aimants logés à l’intérieur ; dans notre reconstruction, une bague en acier roulé referme le circuit magnétique derrière eux. Sa face avant porte des ouïes en haricot qui brassent l’air et refroidissent le bobinage.',
      'In an outer-rotor generator the bell spins around the fixed stator: the magnets sit further from the axis, which gives more torque and voltage in a compact package. The bell is 3D printed, as shown in the video, with the magnets housed inside; in our reconstruction a rolled steel ring closes the magnetic circuit behind them. Its front face carries kidney-shaped vents that stir the air and cool the winding.',
    ),
    material: l('PETG-CF imprimé, culasse en acier doux', 'Printed PETG-CF, mild-steel back-iron ring'),
    specs: [
      sp('Diamètre extérieur', 'Outer diameter', '≈ 160 mm'),
      sp('Aimants', 'Magnets', l('14, polarités alternées', '14, alternating poles')),
      sp('Entrefer', 'Air gap', '≈ 1 mm'),
      sp('Vitesse', 'Speed', l('≈ 1 500 tr/min (jusqu’à 2 000–2 500)', '≈ 1,500 rpm (up to 2,000–2,500)')),
    ],
    tip: l(
      'Équilibrez le rotor seul avant de l’assembler à la roue : une pâte à modeler sur un axe posé sur deux lames suffit à trouver le point lourd.',
      'Balance the rotor on its own before mounting it with the runner: a shaft resting on two knife edges and a bit of modelling clay are enough to find the heavy spot.',
    ),
    video: ['00:00', '03:48', '08:48', '09:00'],
    upgrade: l(
      'En V2, la cloche reçoit un petit aimant cible pour le capteur à effet Hall et elle est équilibrée dynamiquement avec la roue.',
      'In V2 the bell carries a small target magnet for the Hall-effect sensor and is dynamically balanced together with the runner.',
    ),
  },
  {
    id: 'magnets',
    scene: 'turbine',
    category: 'electrical',
    name: l('Aimants néodyme N52', 'N52 neodymium magnets'),
    short: l(
      '14 aimants permanents qui créent le champ tournant : pas de balais, pas d’excitation.',
      '14 permanent magnets that create the rotating field: no brushes, no excitation.',
    ),
    description: l(
      'Les aimants néodyme-fer-bore fournissent un champ très intense sans consommer d’énergie : le générateur produit dès les premiers tours et n’a ni balais ni bagues à entretenir. Ils sont posés en alternance nord/sud pour que chaque bobine voie le flux s’inverser à chaque passage de pôle. La nuance N52 est la plus puissante du commerce, mais elle ne supporte que 80 °C environ avant de perdre une partie de son aimantation.',
      'Neodymium-iron-boron magnets provide a very strong field without consuming any energy: the generator produces from the very first turns and has no brushes or slip rings to maintain. They are laid out alternately north/south so that each coil sees the flux reverse at every pole passage. Grade N52 is the strongest on the market, but it only tolerates about 80 °C before losing part of its magnetisation.',
    ),
    material: l('NdFeB N52, revêtement Ni-Cu-Ni', 'NdFeB N52, Ni-Cu-Ni coating'),
    specs: [
      sp('Format', 'Size', '30 × 12 × 5 mm'),
      sp('Rémanence Br', 'Remanence Br', '≈ 1,45 T'),
      sp('Température max', 'Max temperature', '80 °C'),
      sp('Collage', 'Bonding', l('Époxy structurale bi-composant', 'Two-part structural epoxy')),
    ],
    tip: l(
      'Marquez la polarité de chaque aimant au feutre avec un aimant témoin avant collage : un seul aimant inversé et une phase s’effondre.',
      'Mark each magnet’s polarity with a felt pen using a reference magnet before bonding: a single reversed magnet and one phase collapses.',
    ),
    video: ['08:48', '09:55'],
    qty: 14,
  },
  {
    id: 'rectifier',
    scene: 'turbine',
    category: 'electrical',
    name: l('Pont redresseur triphasé', 'Three-phase rectifier'),
    short: l(
      'Transforme les trois phases alternatives du générateur en courant continu pour les batteries.',
      'Turns the generator’s three AC phases into DC for the batteries.',
    ),
    description: l(
      'Six diodes laissent passer à chaque instant la phase la plus haute et la plus basse : la sortie est une tension continue légèrement ondulée, directement utilisable par un régulateur ou un parc de batteries 48 V. À 175 Hz et en triphasé, l’ondulation est faible et ne demande aucun condensateur. Le courant traverse toujours deux diodes, soit environ 2 V de chute : à 9,4 A, cela fait près de 19 W de chaleur à évacuer, d’où le dissipateur.',
      'Six diodes always pass the highest and the lowest phase: the output is a slightly rippled DC voltage that a controller or a 48 V battery bank can use directly. At 175 Hz and with three phases the ripple is small and needs no capacitor. The current always flows through two diodes, about 2 V of drop: at 9.4 A that is almost 19 W of heat to remove, hence the heatsink.',
    ),
    material: l('Module à diodes isolé, dissipateur aluminium', 'Isolated diode module, aluminium heatsink'),
    specs: [
      sp(
        'Modèle commercial Hydronome',
        'Hydronome commercial model',
        l('Pont triphasé 90 A, sortie sur connecteurs MC4', '90 A 3-phase bridge, output on MC4 connectors'),
      ),
      sp('Calibre', 'Rating', '90 A / 1 600 V'),
      sp('Chute de tension', 'Voltage drop', '≈ 2 × 1 V'),
      sp('Pertes à 9,4 A', 'Losses at 9.4 A', '≈ 19 W'),
      sp('Dissipateur', 'Heatsink', '≈ 1 K/W'),
    ],
    tip: l(
      'Mettez une fine couche de pâte thermique et serrez le module au couple indiqué : un module mal plaqué chauffe deux fois plus.',
      'Apply a thin layer of thermal paste and tighten the module to the specified torque: a poorly seated module runs twice as hot.',
    ),
    video: ['00:00', '03:48'],
    upgrade: l(
      'En V2, le pont est monté sur un dissipateur plus grand placé dans le flux d’air du rotor et raccordé par un faisceau précâblé à connecteurs détrompés ; le coffret contrôleur ajoute disjoncteur, parafoudre et relais de surtension en aval.',
      'In V2 the bridge sits on a larger heatsink in the rotor’s airflow and is connected by a pre-made harness with keyed connectors; the controller box adds a breaker, a surge arrester and an overvoltage relay downstream.',
    ),
  },
  {
    id: 'terminal',
    scene: 'turbine',
    category: 'electrical',
    name: l('Bornier et presse-étoupe', 'Terminal block and cable gland'),
    short: l(
      'Point de raccordement des phases et de la sortie continue, avec une entrée de câble étanche.',
      'Connection point for the phases and the DC output, with a watertight cable entry.',
    ),
    description: l(
      'Le bornier regroupe les trois phases et la sortie continue en un endroit accessible : c’est là qu’on branche le multimètre, comme dans la vidéo, pour vérifier que les trois phases donnent la même tension. Le presse-étoupe serre la gaine du câble de sortie pour que ni l’eau ni les vibrations ne remontent jusqu’aux bornes.',
      'The terminal block gathers the three phases and the DC output in one accessible place: this is where the multimeter goes, as in the video, to check that all three phases give the same voltage. The cable gland grips the outer sheath of the output cable so that neither water nor vibration reaches the terminals.',
    ),
    material: l('Polyamide, bornes laiton nickelé', 'Polyamide, nickel-plated brass terminals'),
    specs: [
      sp('Bornes', 'Terminals', l('3 phases + 2 pôles DC, 16 mm²', '3 phases + 2 DC poles, 16 mm²')),
      sp('Presse-étoupe', 'Cable gland', l('M20 IP68, câble Ø 8–13 mm', 'M20 IP68, Ø 8–13 mm cable')),
      sp('Couple des bornes', 'Terminal torque', '1,5–2 N·m'),
    ],
    maintenance: l(
      'Resserrez les bornes un mois après la mise en service, puis à chaque entretien : les vibrations desserrent le cuivre.',
      'Re-tighten the terminals one month after commissioning, then at every service: vibration loosens copper.',
    ),
    tip: l(
      'Sertissez des embouts sur le câble souple : des brins nus écrasés sous une vis finissent par chauffer.',
      'Crimp ferrules onto flexible cable: bare strands crushed under a screw eventually overheat.',
    ),
    video: ['03:48'],
    upgrade: l(
      'En V2, le bornier reste à l’abri dans la chambre sèche, mais le câble de sortie se termine par un connecteur IP68 débrochable : on déconnecte la turbine sans ouvrir le carter.',
      'In V2 the terminal block stays sheltered in the dry chamber, but the output cable ends in a pluggable IP68 connector: the turbine can be disconnected without opening the housing.',
    ),
  },
  {
    id: 'cable',
    scene: 'turbine',
    category: 'electrical',
    name: l('Câble de sortie 6 mm²', '6 mm² output cable'),
    short: l(
      'Emmène le courant continu de la turbine vers le local technique.',
      'Carries the DC current from the turbine to the technical room.',
    ),
    description: l(
      'La turbine sort entre 50 et 54 V : à 500 W, il passe environ 9,4 A dans le câble. Sur le site A, la vidéo indique environ 35 W perdus dans les câbles et un peu dans le régulateur ; sur le site B, la turbine est juste à côté des batteries et le 6 mm² ne perd qu’à peine 1 V. Pour les longues distances, Sylvain bobine plutôt ses générateurs en 150 à 250 V afin de garder du 6 ou du 10 mm².',
      'The turbine delivers 50–54 V: at 500 W, about 9.4 A flows in the cable. On site A the video mentions about 35 W lost in the cables and a little in the controller; on site B the turbine sits right next to the batteries and the 6 mm² cable drops barely 1 V. For long runs, Sylvain rather winds his generators for 150–250 V so that 6 or 10 mm² cable is still enough.',
    ),
    material: l(
      'Cuivre étamé classe 5, double isolation (câble solaire)',
      'Tinned class 5 copper, double insulation (solar cable)',
    ),
    specs: [
      sp(
        'Recommandation constructeur',
        'Maker recommendation',
        l(
          '10 ou 16 mm² selon distance et puissance (6 mm² possible dans certains cas)',
          '10 or 16 mm² depending on distance and power (6 mm² possible in some cases)',
        ),
      ),
      sp('Type', 'Type', 'H1Z2Z2-K 2 × 6 mm²'),
      sp('Tension', 'Voltage', '50–54 V DC'),
      sp('Courant à 499 W', 'Current at 499 W', '9,4 A'),
      sp('Résistance', 'Resistance', l('≈ 3,3 mΩ/m par conducteur', '≈ 3.3 mΩ/m per conductor')),
    ],
    tip: l(
      'Calculez la perte sur l’aller et le retour : R = ρ · 2L / S. C’est l’oubli le plus fréquent dans les dimensionnements.',
      'Count both the outgoing and the return conductor: R = ρ · 2L / S. It is the most common mistake in cable sizing.',
    ),
    video: ['03:48', '17:55', '18:05'],
    upgrade: l(
      'En V2, le câble arrive sur un connecteur IP68 et passe par le coffret contrôleur (disjoncteur, parafoudre) avant de partir vers le local.',
      'In V2 the cable lands on an IP68 connector and goes through the controller box (breaker, surge arrester) before leaving for the technical room.',
    ),
  },
];

// ---------------------------------------------------------------------------
// Turbine — water path, from the penstock end to the injectors (shared V1/V2)
// ---------------------------------------------------------------------------

const TURBINE_HYDRAULIC: PartInfo[] = [
  {
    id: 'injector-top',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Injecteur à pointeau (haut)', 'Spear-valve injector (top)'),
    short: l(
      'Injecteur variable fabriqué en Italie : une « olive » mobile règle le débit sans casser le jet.',
      'Italian-made variable injector: a movable “olive” sets the flow without breaking up the jet.',
    ),
    description: l(
      'L’injecteur transforme la pression en vitesse : à 74 m de chute nette, l’eau sort à environ 37 m/s. Dans un injecteur à pointeau, une pièce profilée, l’« olive » de la vidéo, avance ou recule dans la buse et fait varier la section annulaire de passage : le débit change, mais le jet reste compact et rapide. Sur le site B, c’est l’injecteur des gros débits d’hiver ; sur le site A, c’est l’injecteur unique, alimenté par le haut.',
      'The injector turns pressure into velocity: at 74 m of net head the water leaves at about 37 m/s. In a spear-valve injector, a streamlined spear, the “olive” in the video, moves in or out of the nozzle and changes the annular flow area: the flow changes, but the jet stays compact and fast. On site B it is the injector for the large winter flows; on site A it is the only injector, fed from the top.',
    ),
    material: l('Corps métallique, pointeau et buse inox', 'Metal body, stainless spear and nozzle'),
    specs: [
      sp(
        'Recommandation constructeur',
        'Maker recommendation',
        l(
          'Injecteur variable seulement avec une bonne filtration au captage (le sable le bloque et l’use)',
          'Variable injector only with good intake filtration (sand jams and wears it)',
        ),
      ),
      sp('Buse', 'Nozzle', l('Ø 10 mm max, ouverture réglable', 'Ø 10 mm max, adjustable opening')),
      sp('Vitesse du jet (74 m)', 'Jet velocity (74 m)', '≈ 37 m/s'),
      sp('Coefficient de débit', 'Discharge coefficient', 'Cd ≈ 0,95–0,98'),
      sp('Réglage', 'Adjustment', l('Vis et volant, manuel', 'Screw and handwheel, manual')),
    ],
    maintenance: l(
      'Démontez et inspectez la pointe du pointeau et le bord de buse chaque année : une rayure ou un dépôt suffit à faire éclater le jet.',
      'Strip and inspect the spear tip and the nozzle lip every year: a scratch or a deposit is enough to make the jet spray.',
    ),
    tip: l(
      'Réglez toujours le débit avec le pointeau, jamais avec une vanne à moitié fermée : la vanne transforme la chute en pertes, le pointeau la transforme en vitesse.',
      'Always set the flow with the spear, never with a half-closed valve: the valve turns head into losses, the spear turns it into velocity.',
    ),
    video: ['07:30', '07:48', '08:00'],
    upgrade: l(
      'En V2, il garde son principe mais reçoit la même bride normalisée que l’injecteur à inserts : les deux injecteurs deviennent interchangeables sur la nourrice.',
      'In V2 it keeps its principle but gets the same standard flange as the insert injector: both injectors become interchangeable on the manifold.',
    ),
  },
  {
    id: 'manifold',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Nourrice en col de cygne', 'Gooseneck manifold'),
    short: l(
      'Tuyauterie PVC qui monte au-dessus du carter et distribue l’eau aux injecteurs.',
      'PVC pipework that rises over the housing and feeds the injectors.',
    ),
    description: l(
      'La nourrice amène l’eau de la conduite forcée jusqu’à l’injecteur du haut par un col de cygne, et alimente l’injecteur latéral par une dérivation. Ses coudes doivent être larges et peu nombreux : chaque changement de direction coûte un peu de chute. C’est aussi la partie la plus exposée aux ruptures : Sylvain raconte que ses premiers échecs étaient des raccords qui pétaient, par excès de pression ou mauvaise colle.',
      'The manifold carries the water from the penstock to the top injector through a gooseneck, and feeds the side injector through a branch. Its bends must be wide and few: every change of direction costs a little head. It is also the part most exposed to bursts: Sylvain says his first failures were fittings blowing apart, from too much pressure or bad glue.',
    ),
    material: l('PVC-U pression PN16, collé', 'PVC-U pressure pipe PN16, solvent-welded'),
    specs: [
      sp('Tube', 'Pipe', l('PVC-U Ø 50 × 3,7 mm, PN16', 'PVC-U Ø 50 × 3.7 mm, PN16')),
      sp('Pression de service', 'Working pressure', l('≈ 7,4 bar statique (site A)', '≈ 7.4 bar static (site A)')),
      sp('Épreuve', 'Test pressure', l('1,5 × PN de la conduite, 1 h', '1.5 × penstock PN, 1 h')),
      sp('Séchage de la colle', 'Cement cure time', l('24 h avant pleine pression', '24 h before full pressure')),
    ],
    maintenance: l(
      'Inspectez chaque collage au printemps, quand les cycles de gel sont passés : un suintement est le signe d’une rupture à venir.',
      'Inspect every solvent joint in spring, once the freeze cycles are over: weeping is the sign of a burst to come.',
    ),
    tip: l(
      'Décapant puis colle « pression » en gel, sur les deux pièces, emboîtement d’un seul geste avec un quart de tour : une colle standard ou un tube non décapé est la cause n° 1 des raccords qui lâchent.',
      'Primer then gel-type pressure cement on both parts, push home in one stroke with a quarter turn: standard glue or an unprimed pipe is the number one cause of failed fittings.',
    ),
    video: ['02:12', '03:15', '03:30', '15:50'],
    upgrade: l(
      'En V2, une ventouse automatique est placée au point haut du col de cygne pour purger l’air, et chaque nourrice est éprouvée à 1,5 × PN avant de quitter l’atelier.',
      'In V2 an automatic air-release valve sits at the high point of the gooseneck to purge air, and every manifold is pressure-tested at 1.5 × PN before leaving the workshop.',
    ),
  },
  {
    id: 'valve-branch',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Vannes de branche (rouge et bleue)', 'Branch valves (red and blue)'),
    short: l(
      'Une vanne par injecteur : on choisit lequel travaille selon le débit du ruisseau.',
      'One valve per injector: you choose which one works depending on the stream flow.',
    ),
    description: l(
      'Sur le site B, la turbine a deux injecteurs : la vanne rouge alimente l’injecteur variable du haut pour les gros débits d’hiver, la vanne bleue l’injecteur fixe du bas pour les très petits débits, comme en juin après la canicule. Ce sont des vannes de sectionnement : elles s’utilisent grandes ouvertes ou fermées, jamais entre les deux.',
      'On site B the turbine has two injectors: the red valve feeds the variable top injector for large winter flows, the blue valve the fixed bottom injector for very low flows, as in June after the heatwave. These are isolation valves: they are used fully open or fully closed, never in between.',
    ),
    material: l('PVC-U, joints EPDM', 'PVC-U, EPDM seals'),
    specs: [
      sp('Type', 'Type', l('Vanne à boisseau sphérique double union', 'Double-union ball valve')),
      sp('Diamètre', 'Size', 'DN32'),
      sp('Pression nominale', 'Pressure rating', 'PN16'),
      sp(
        'Code couleur',
        'Colour code',
        l('Rouge = haut (variable), bleu = côté (fixe)', 'Red = top (variable), blue = side (fixed)'),
      ),
    ],
    tip: l(
      'Une vanne à moitié fermée lamine l’eau : elle gaspille la chute et l’érosion attaque la sphère. Pour moins de débit, fermez le pointeau ou changez de buse.',
      'A half-closed valve throttles the water: it wastes head and erosion eats the ball. For less flow, close the spear or change the nozzle.',
    ),
    video: ['15:50', '16:00', '16:05'],
    qty: 2,
  },
  {
    id: 'gauge',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Manomètre à glycérine', 'Glycerine pressure gauge'),
    short: l(
      'Affiche la pression à l’entrée de la turbine : 10 m de chute ≈ 1 bar.',
      'Shows the pressure at the turbine inlet: 10 m of head ≈ 1 bar.',
    ),
    description: l(
      'Chaque mètre de chute ajoute environ 0,1 bar : avec 76 m de dénivelé, le manomètre lit environ 7,4 bar vannes fermées, les « 6, 7 bars » évoqués dans la vidéo. En marche, la pression baisse un peu : l’écart entre la lecture statique et la lecture dynamique donne directement les pertes de charge de la conduite. Le bain de glycérine amortit l’aiguille, qui sinon tremblerait sous les pulsations et s’userait vite.',
      'Each metre of head adds about 0.1 bar: with 76 m of drop, the gauge reads about 7.4 bar with the valves closed, the “6, 7 bar” mentioned in the video. While running, the pressure drops a little: the gap between the static and the running reading directly gives the penstock friction losses. The glycerine bath damps the needle, which would otherwise shake under the pulsations and wear quickly.',
    ),
    material: l(
      'Boîtier inox rempli de glycérine, raccord laiton',
      'Glycerine-filled stainless case, brass connection',
    ),
    specs: [
      sp('Échelle', 'Range', '0–10 bar'),
      sp('Cadran', 'Dial', 'Ø 63 mm'),
      sp('Raccord', 'Connection', l('1/4" BSP, vertical', '1/4" BSP, bottom entry')),
      sp('Lecture statique (76 m)', 'Static reading (76 m)', '≈ 7,4 bar'),
      sp('Conversion', 'Rule of thumb', l('0,1 bar ≈ 1 m de chute', '0.1 bar ≈ 1 m of head')),
    ],
    tip: l(
      'Notez la lecture statique et la lecture en marche dans le carnet de bord : si l’écart grandit au fil des mois, la grille ou la conduite s’encrasse.',
      'Log both the static and the running reading: if the gap grows over the months, the screen or the pipe is fouling up.',
    ),
    video: ['01:05', '02:30'],
  },
  {
    id: 'valve-main',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Vanne principale', 'Main valve'),
    short: l(
      'Vanne quart de tour à poignée bleue qui coupe toute l’arrivée d’eau.',
      'Quarter-turn valve with a blue handle that shuts off the whole water supply.',
    ),
    description: l(
      'C’est la vanne de sectionnement de la turbine, juste après la conduite forcée. Une vanne quart de tour se ferme en une fraction de seconde : 350 m de colonne d’eau stoppés net produisent un coup de bélier de plusieurs bars, qui s’ajoute aux 7,4 bar statiques. Elle se manœuvre donc lentement, en comptant, et sert à isoler la turbine, pas à régler le débit.',
      'This is the turbine isolation valve, right after the penstock. A quarter-turn valve closes in a fraction of a second: 350 m of water column stopped dead produces a water hammer of several bar on top of the 7.4 bar static pressure. It must therefore be operated slowly, counting, and is used to isolate the turbine, not to set the flow.',
    ),
    material: l('PVC-U, sphère PVC, joints EPDM', 'PVC-U, PVC ball, EPDM seals'),
    specs: [
      sp(
        'Recommandation constructeur',
        'Maker recommendation',
        l(
          'Vanne d’arrêt primaire sur la conduite, manomètre entre vanne primaire et vannes d’injecteurs',
          'Primary shut-off valve on the pipe, gauge between the primary and the injector valves',
        ),
      ),
      sp('Type', 'Type', l('Vanne à boisseau sphérique double union', 'Double-union ball valve')),
      sp('Diamètre', 'Size', 'DN50'),
      sp('Pression nominale', 'Pressure rating', 'PN16'),
      sp('Temps de manœuvre conseillé', 'Recommended operating time', l('≥ 20 s', '≥ 20 s')),
    ],
    tip: l(
      'Fermez en au moins 20 secondes, et ouvrez aussi lentement : à l’ouverture, l’air piégé comprimé puis chassé peut faire autant de dégâts qu’un coup de bélier.',
      'Close over at least 20 seconds, and open just as slowly: on opening, trapped air that is compressed then expelled can do as much damage as water hammer.',
    ),
    video: ['02:24', '02:30'],
    upgrade: l(
      'En V2, une vanne à réducteur (volant et vis sans fin) remplace le quart de tour : il faut une vingtaine de tours pour la fermer, le coup de bélier devient physiquement impossible.',
      'In V2 a gear-operated valve (handwheel and worm gear) replaces the quarter-turn: it takes about twenty turns to close, making a hard water hammer physically impossible.',
    ),
  },
  {
    id: 'penstock-end',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Arrivée de la conduite forcée', 'Penstock end'),
    short: l(
      'Dernier mètre du tube PEHD Ø63 et son raccord à compression bleu.',
      'Last metre of the Ø63 HDPE pipe and its blue compression fitting.',
    ),
    description: l(
      'La conduite forcée est un tube PEHD de 63 mm extérieur et 55 mm intérieur, PN10, reconnaissable à son liseré blanc « irrigation ». Un raccord à compression en polypropylène fait la transition vers le PVC de la turbine sans colle ni soudure. Près de la turbine, le PEHD est glissé dans une gaine PVC grise qui le protège des chocs et des UV.',
      'The penstock is a 63 mm OD, 55 mm ID PN10 HDPE pipe, recognisable by its white “irrigation” stripe. A polypropylene compression fitting makes the transition to the turbine’s PVC without glue or welding. Near the turbine, the HDPE runs inside a grey PVC sleeve that protects it from knocks and UV.',
    ),
    material: l('PEHD PE100, raccord PP à écrou bleu', 'PE100 HDPE, PP fitting with blue nut'),
    specs: [
      sp('Tube', 'Pipe', l('PE100 SDR17 PN10, Ø 63 × 3,8 mm', 'PE100 SDR17 PN10, Ø 63 × 3.8 mm')),
      sp('Diamètre intérieur', 'Internal diameter', '≈ 55 mm'),
      sp('Raccord', 'Fitting', l('Compression PP Ø63, PN16', 'PP compression Ø63, PN16')),
      sp('Gaine', 'Sleeve', l('PVC gris, protection UV et chocs', 'Grey PVC, UV and impact protection')),
    ],
    tip: l(
      'Coupez le tube d’équerre, chanfreinez-le et tracez la profondeur d’emboîtement au feutre : vous verrez tout de suite s’il a reculé sous la pression.',
      'Cut the pipe square, chamfer it and mark the insertion depth with a felt pen: you will see at once if it has crept back under pressure.',
    ),
    video: ['01:10', '01:30', '02:30'],
  },
];

// ---------------------------------------------------------------------------
// Turbine — V1 prototype only (as seen in the video)
// ---------------------------------------------------------------------------

const TURBINE_V1: PartInfo[] = [
  {
    id: 'trestles',
    scene: 'turbine',
    category: 'structure',
    name: l('Tréteaux et madriers', 'Trestles and beams'),
    short: l(
      'Deux tréteaux rouges et deux madriers : la turbine est perchée à 1 m au-dessus du canal.',
      'Two red trestles and two wooden beams: the turbine sits 1 m above the channel.',
    ),
    description: l(
      'Sur le site d’essai, la turbine repose sur deux madriers posés sur des tréteaux métalliques rouges, de petites brides bleues imprimées l’empêchant de glisser. C’est simple et réglable, et cela laisse environ 1 m de chute libre sous la turbine, bien plus que les 30 à 40 cm minimum. Le bois mouillé en permanence travaille et pourrit, et rien n’amortit les vibrations : c’est une installation de prototype.',
      'On the test site the turbine rests on two wooden beams laid on red steel trestles, with small blue printed cleats stopping it from sliding. It is simple and adjustable, and leaves about 1 m of free fall under the turbine, far more than the 30–40 cm minimum. Permanently wet timber moves and rots, and nothing damps the vibration: this is a prototype set-up.',
    ),
    material: l(
      'Tréteaux acier peint, madriers sapin, brides PETG',
      'Painted steel trestles, softwood beams, PETG cleats',
    ),
    specs: [
      sp(
        'Recommandation constructeur',
        'Maker recommendation',
        l(
          'Turbine à 50 cm du sol minimum pour l’évacuation de l’eau ; 22 kg',
          'Turbine at least 50 cm above ground for the water to escape; 22 kg',
        ),
      ),
      sp('Hauteur du socle', 'Base height', l('≈ 0,92 m au-dessus du sol', '≈ 0.92 m above ground')),
      sp('Madriers', 'Beams', '2 × 75 × 200 mm'),
      sp('Chute libre sous la turbine', 'Free fall under the turbine', '≈ 1 m'),
    ],
    tip: l(
      'Calez les tréteaux sur des dalles et vérifiez le niveau après les premières semaines : le sol détrempé par le canal de fuite s’affaisse.',
      'Set the trestles on paving slabs and recheck the level after the first weeks: ground soaked by the tailrace settles.',
    ),
    video: ['00:00', '02:54', '03:36'],
    version: 'v1',
  },
  {
    id: 'bearing-block',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Palier principal imprimé', 'Printed main bearing housing'),
    short: l(
      'Bloc imprimé qui traverse la cloison et porte les roulements 1 et 2 et le joint à lèvre.',
      'Printed block through the partition that holds bearings 1 and 2 and the lip seal.',
    ),
    description: l(
      'Le palier principal est la pièce qui tient tout l’effort du jet : il loge les deux roulements écartés et, côté humide, le joint à lèvre. L’imprimer en 3D permet de l’adapter à chaque modèle de turbine et de le refaire soi-même, comme le souligne Sylvain pour toutes ses pièces. Sa limite est le fluage : sous la charge et la chaleur des roulements, le plastique se déforme lentement et l’ajustement peut prendre du jeu.',
      'The main bearing housing takes the whole jet load: it holds the two spaced bearings and, on the wet side, the lip seal. 3D printing it means it can be adapted to every turbine model and remade by the builder, as Sylvain points out for all his parts. Its limit is creep: under load and bearing heat, plastic slowly deforms and the fit can loosen.',
    ),
    material: l('PETG ou PA-CF imprimé, 100 % de remplissage', 'Printed PETG or PA-CF, 100% infill'),
    specs: [
      sp('Roulements', 'Bearings', '2 × 6204-2RS'),
      sp('Joint', 'Seal', '20 × 35 × 7'),
      sp('Entraxe des roulements', 'Bearing spacing', '≈ 60 mm'),
      sp('Fixation', 'Fastening', l('6 vis M6 à travers la cloison', '6 × M6 screws through the partition')),
    ],
    maintenance: l(
      'Au changement de roulements, vérifiez que le neuf ne rentre pas « tout seul » : un logement élargi doit être réimprimé.',
      'When replacing the bearings, check that the new one does not slide in by itself: a worn seat must be reprinted.',
    ),
    tip: l(
      'Imprimez les logements 0,1 à 0,2 mm sous la cote puis alésez : un roulement doit entrer serré, à la presse, jamais au marteau.',
      'Print the seats 0.1–0.2 mm undersize then ream them: a bearing must go in tight, with a press, never with a hammer.',
    ),
    video: ['04:05'],
    version: 'v1',
  },
  {
    id: 'injector-side',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Injecteur fixe imprimé', 'Printed fixed injector'),
    short: l(
      'Buse imprimée en 3D de diamètre fixe (6 ou 8 mm), pour les petits débits.',
      '3D-printed nozzle of fixed diameter (6 or 8 mm), for low flows.',
    ),
    description: l(
      'Un injecteur fixe n’a pas de pièce mobile : sa buse calibrée donne un débit qui ne dépend que de la chute. Sylvain les imprime lui-même, et ils sont « relativement solides ». Sur le site B, c’est cet injecteur qui garde une petite production quand le ruisseau tombe sous 1 L/s, en mode dégradé. Pour changer de débit, on change de buse, et de jeu d’augets assorti.',
      'A fixed injector has no moving part: its calibrated nozzle gives a flow that depends only on the head. Sylvain prints them himself, and they are “quite sturdy”. On site B this is the injector that keeps a small output going when the stream drops below 1 L/s, in degraded mode. To change the flow you change the nozzle, and the matching bucket set.',
    ),
    material: l('PETG ou ASA imprimé', 'Printed PETG or ASA'),
    specs: [
      sp('Buse', 'Nozzle', 'Ø 6 / Ø 8 mm'),
      sp('Débit à 74 m (Ø 6)', 'Flow at 74 m (Ø 6)', '≈ 1,1 L/s'),
      sp('Débit à 72 m (Ø 8)', 'Flow at 72 m (Ø 8)', '≈ 1,8 L/s'),
      sp('Pression max', 'Max pressure', '10 bar'),
    ],
    tip: l(
      'Imprimez la buse debout, sortie vers le haut, et finissez l’orifice au foret à la main : la qualité du bord de sortie fait la qualité du jet.',
      'Print the nozzle upright, outlet facing up, and finish the orifice with a hand-held drill bit: the quality of the outlet edge makes the quality of the jet.',
    ),
    video: ['08:10', '08:18', '16:00'],
    version: 'v1',
  },
];

// ---------------------------------------------------------------------------
// Turbine — V2 only: our "industrialisable but still DIY" proposal
// ---------------------------------------------------------------------------

const TURBINE_V2: PartInfo[] = [
  {
    id: 'skid',
    scene: 'turbine',
    category: 'structure',
    name: l('Châssis-skid', 'Skid frame'),
    short: l(
      'Cadre boulonné en profilés aluminium, sur pieds réglables et silentblocs.',
      'Bolted aluminium-extrusion frame on levelling feet and rubber mounts.',
    ),
    description: l(
      'Le skid remplace les tréteaux et les madriers par un cadre rigide qui arrive monté et réglé de l’atelier. Les pieds réglables rattrapent un sol en pente, les silentblocs coupent la transmission des vibrations, et un entonnoir intégré guide l’eau vers le canal de fuite. Il garantit par construction les 40 cm de chute libre sous la roue.',
      'The skid replaces the trestles and beams with a rigid frame that leaves the workshop assembled and adjusted. Levelling feet cope with sloping ground, rubber mounts stop vibration being transmitted, and a built-in funnel guides the water into the tailrace. By design, it guarantees the 40 cm of free fall under the runner.',
    ),
    material: l(
      'Profilés aluminium 40 × 40 rainure 8 (ou acier galvanisé)',
      '40 × 40 slot-8 aluminium extrusions (or galvanised steel)',
    ),
    specs: [
      sp(
        'Recommandation constructeur',
        'Maker recommendation',
        l(
          'Turbine à 50 cm du sol minimum pour l’évacuation de l’eau ; 22 kg',
          'Turbine at least 50 cm above ground for the water to escape; 22 kg',
        ),
      ),
      sp('Profilés', 'Extrusions', l('40 × 40 mm, rainure 8', '40 × 40 mm, slot 8')),
      sp('Pieds', 'Feet', l('4 pieds articulés M12, semelle caoutchouc', '4 swivel M12 feet, rubber pads')),
      sp('Silentblocs', 'Rubber mounts', 'M8, 60 Shore A'),
      sp('Garde sous la roue', 'Clearance under the runner', '≥ 400 mm'),
      sp('Levage', 'Lifting', l('4 anneaux M10', '4 × M10 eye bolts')),
    ],
    tip: l(
      'Ancrez le skid au sol avec deux tire-fonds ou des piquets : une turbine qui s’emballe vibre assez pour se déplacer.',
      'Anchor the skid with two ground screws or stakes: a runaway turbine vibrates enough to walk.',
    ),
    video: ['02:40'],
    version: 'v2',
    upgrade: l(
      'Remplace les tréteaux et madriers du prototype : montage reproductible, plus de bois qui pourrit, vibrations amorties et levage sécurisé.',
      'Replaces the prototype’s trestles and beams: repeatable installation, no more rotting timber, damped vibration and safe lifting.',
    ),
  },
  {
    id: 'bearing-cartridge',
    scene: 'turbine',
    category: 'mechanical',
    name: l('Cartouche de palier', 'Bearing cartridge'),
    short: l(
      'Cartouche usinée prémontée : 2 roulements, joint double lèvre, graisseur. Se change d’un bloc.',
      'Pre-assembled machined cartridge: 2 bearings, double lip seal, grease nipple. Swapped as one unit.',
    ),
    description: l(
      'La cartouche regroupe tout ce qui s’use autour de l’arbre dans une pièce tournée en aluminium, montée et graissée à l’atelier. Côté humide, un V-ring déflecteur et une chicane labyrinthe rejettent l’eau avant même qu’elle n’atteigne le joint double lèvre. Le jour de l’entretien, on dévisse six vis M5, on glisse la cartouche de rechange et la turbine repart en dix minutes, sans presse sur place.',
      'The cartridge gathers everything that wears around the shaft into one turned aluminium part, assembled and greased on the bench. On the wet side, a V-ring slinger and a labyrinth throw the water off before it even reaches the double lip seal. On service day you undo six M5 screws, slide in the spare cartridge and the turbine is back on in ten minutes, with no press needed on site.',
    ),
    material: l('Aluminium 6082-T6 tourné, anodisé', 'Turned aluminium 6082-T6, anodised'),
    specs: [
      sp('Roulements', 'Bearings', '2 × 6204-2RS C3'),
      sp(
        'Étanchéité',
        'Sealing',
        l(
          'V-ring V-20A + labyrinthe + joint 20 × 35 × 7 double lèvre',
          'V-20A V-ring + labyrinth + 20 × 35 × 7 double-lip seal',
        ),
      ),
      sp('Graissage', 'Lubrication', l('Graisseur M6, graisse hydrofuge', 'M6 grease nipple, water-resistant grease')),
      sp('Fixation', 'Fastening', l('Bride 4 × M6', '4 × M6 flange')),
      sp('Temps d’échange', 'Swap time', '≈ 10 min'),
    ],
    maintenance: l(
      'Deux coups de pompe à graisse par an. Tous les 3 à 5 ans, échange standard de la cartouche ; l’ancienne est révisée à l’atelier.',
      'Two strokes of the grease gun per year. Every 3–5 years, swap the cartridge; the old one is overhauled on the bench.',
    ),
    tip: l(
      'Gardez toujours une cartouche de rechange prête sur place : c’est elle qui transforme une panne en simple visite.',
      'Always keep a spare cartridge ready on site: it turns a breakdown into a routine visit.',
    ),
    video: ['04:05'],
    version: 'v2',
    upgrade: l(
      'Remplace le palier imprimé : plus de fluage du plastique, étanchéité à trois barrières, et un changement de roulements qui passe de plusieurs heures à dix minutes.',
      'Replaces the printed housing: no more plastic creep, three-barrier sealing, and a bearing change that drops from hours to ten minutes.',
    ),
  },
  {
    id: 'injector-quick',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Injecteur à inserts rapides', 'Quick-change insert injector'),
    short: l(
      'Corps d’injecteur fixe à baïonnette : on change la buse (Ø4 à Ø10) en quelques secondes.',
      'Fixed-injector body with a bayonet: the nozzle (Ø4 to Ø10) is swapped in seconds.',
    ),
    description: l(
      'Au lieu d’imprimer un injecteur complet par diamètre, on garde un corps unique sur bride normalisée et on change seulement l’insert de buse, verrouillé par baïonnette et étanché par un joint torique. Chaque insert porte une couleur et correspond à un kit d’augets assorti, ce qui évite les erreurs de montage. On adapte ainsi la turbine aux saisons : petite buse en été, grande en hiver.',
      'Instead of printing a complete injector for each diameter, a single body on a standard flange is kept and only the nozzle insert changes, locked by a bayonet and sealed by an O-ring. Each insert is colour-coded and matches a bucket kit, which prevents assembly mistakes. The turbine is thus adapted to the seasons: small nozzle in summer, large one in winter.',
    ),
    material: l(
      'Corps aluminium ou inox, inserts POM-C ou laiton, joint EPDM',
      'Aluminium or stainless body, POM-C or brass inserts, EPDM O-ring',
    ),
    specs: [
      sp('Inserts', 'Inserts', 'Ø 4 / 5 / 6 / 8 / 10 mm'),
      sp('Verrouillage', 'Locking', l('Baïonnette quart de tour + joint torique', 'Quarter-turn bayonet + O-ring')),
      sp('Bride', 'Flange', 'DN25 PN16'),
      sp('Repérage', 'Identification', l('Code couleur par diamètre', 'Colour code per diameter')),
    ],
    tip: l(
      'Ne changez jamais d’insert sous pression : fermez la vanne de branche et vérifiez au manomètre que la branche est vidée.',
      'Never change an insert under pressure: close the branch valve and check on the gauge that the branch is drained.',
    ),
    video: ['08:10', '09:30'],
    version: 'v2',
    upgrade: l(
      'Remplace l’injecteur fixe imprimé : un seul corps pour toutes les saisons, des inserts usinés à l’orifice précis, et un kit d’augets assorti à chaque buse.',
      'Replaces the printed fixed injector: one body for every season, machined inserts with a precise orifice, and a bucket kit matched to each nozzle.',
    ),
  },
  {
    id: 'deflector',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Déflecteur de jet', 'Jet deflector'),
    short: l(
      'Volet à ressort qui dévie le jet hors de la roue en moins d’une demi-seconde en cas de défaut.',
      'Spring-loaded blade that swings into the jet in under half a second on a fault.',
    ),
    description: l(
      'Si la charge électrique disparaît (batteries pleines sans délesteur, BMS ouvert, câble arraché), la roue s’emballe à près du double de sa vitesse nominale. Le déflecteur est la protection classique des Pelton industrielles : un volet tenu par une gâche électrique bascule dans le jet et l’envoie directement au canal de fuite. L’eau continue de couler dans la conduite, donc pas de coup de bélier, et la roue ralentit d’elle-même.',
      'If the electrical load disappears (full batteries with no dump load, BMS open, cable torn off), the runner races to nearly twice its rated speed. The deflector is the classic protection of industrial Pelton turbines: a blade held by an electric latch swings into the jet and sends it straight to the tailrace. Water keeps flowing in the penstock, so there is no water hammer, and the runner slows down by itself.',
    ),
    material: l(
      'Lame aluminium 5083 ou imprimée ASA, axe inox, ressort de torsion',
      'Aluminium 5083 or printed ASA blade, stainless pivot, torsion spring',
    ),
    specs: [
      sp('Temps de basculement', 'Trip time', '< 0,5 s'),
      sp(
        'Actionneur',
        'Actuator',
        l('Gâche électrique 12 V, à manque de courant', '12 V door-lock solenoid, fail-safe'),
      ),
      sp(
        'Déclencheurs',
        'Triggers',
        l('Surtension, survitesse, BMS ouvert, perte de charge', 'Overvoltage, overspeed, BMS open, load loss'),
      ),
      sp('Réarmement', 'Reset', l('Manuel, après diagnostic', 'Manual, after diagnosis')),
    ],
    tip: l(
      'Testez le déflecteur à chaque visite en coupant volontairement la charge : une sécurité jamais essayée est une sécurité qui ne marche pas.',
      'Test the deflector at every visit by deliberately removing the load: a safety device that is never tried is one that does not work.',
    ),
    video: ['19:05', '19:20'],
    version: 'v2',
    upgrade: l(
      'Nouveau en V2 : le prototype dépend entièrement du délesteur pour ne pas s’emballer. Le déflecteur ajoute une sécurité mécanique, à manque de courant, réalisable avec une gâche de porte à 15 €.',
      'New in V2: the prototype relies entirely on the dump load to avoid running away. The deflector adds a mechanical, fail-safe protection, buildable with a 15 € door-lock solenoid.',
    ),
  },
  {
    id: 'latches',
    scene: 'turbine',
    category: 'structure',
    name: l('Grenouillères', 'Toggle latches'),
    short: l(
      'Quatre fermetures inox à levier : le capot s’ouvre sans outil.',
      'Four stainless lever latches: the cover opens without tools.',
    ),
    description: l(
      'Sur le prototype, ouvrir le capot veut dire dévisser une rangée de vis dans l’aluminium, avec le risque de foirer un filetage à chaque fois. Les grenouillères serrent le capot sur son joint captif avec un effort constant et réglable. L’entretien courant devient plus rapide, donc il est fait plus souvent.',
      'On the prototype, opening the cover means undoing a row of screws in aluminium, with the risk of stripping a thread every time. Toggle latches pull the cover onto its captive gasket with a constant, adjustable force. Routine maintenance becomes faster, so it gets done more often.',
    ),
    material: l('Inox 304, rivets inox', '304 stainless, stainless rivets'),
    specs: [
      sp('Nombre', 'Count', '4'),
      sp('Effort de fermeture', 'Holding force', '≈ 900 N'),
      sp('Fixation', 'Fastening', l('Rivets aveugles inox ou écrous PEM M4', 'Stainless blind rivets or M4 PEM nuts')),
      sp('Option', 'Option', l('Moraillon cadenassable', 'Padlockable hasp')),
    ],
    tip: l(
      'Réglez la tige filetée de chaque grenouillère pour comprimer le joint d’un quart environ, puis bloquez-la au frein-filet : trop serrée, elle écrase le profilé dès la première fermeture.',
      'Adjust the threaded hook of each latch to compress the gasket by about a quarter, then lock it with threadlocker: too tight and it crushes the trim the first time it is closed.',
    ),
    qty: 4,
    version: 'v2',
    upgrade: l(
      'Remplace les vis du capot : ouverture sans outil, serrage du joint toujours identique, plus de filetages abîmés dans l’aluminium.',
      'Replaces the cover screws: tool-free opening, always the same gasket compression, no more stripped threads in the aluminium.',
    ),
  },
  {
    id: 'sensors',
    scene: 'turbine',
    category: 'electrical',
    name: l('Capteurs', 'Sensors'),
    short: l(
      'Pression d’entrée, vitesse de rotation et température du stator, mesurées en continu.',
      'Inlet pressure, rotational speed and stator temperature, measured continuously.',
    ),
    description: l(
      'Le prototype se surveille à l’œil : manomètre, afficheur du régulateur, oreille contre le carter. Trois capteurs bon marché suffisent à tout savoir à distance : la pression trahit une grille bouchée ou de l’air, la vitesse une survitesse ou un roulement qui freine, la température un stator qui souffre. Ce sont aussi les entrées de la sécurité du déflecteur.',
      'The prototype is monitored by eye: pressure gauge, controller display, ear against the housing. Three cheap sensors are enough to know everything remotely: pressure reveals a clogged screen or air, speed reveals overspeed or a dragging bearing, temperature a suffering stator. They are also the inputs of the deflector safety.',
    ),
    material: l('Capteurs industriels standard', 'Standard industrial sensors'),
    specs: [
      sp('Pression', 'Pressure', l('Transmetteur 0–10 bar, 4–20 mA, G1/4', '0–10 bar transmitter, 4–20 mA, G1/4')),
      sp(
        'Vitesse',
        'Speed',
        l('Capteur à effet Hall + aimant cible sur le rotor', 'Hall-effect sensor + target magnet on the rotor'),
      ),
      sp('Température', 'Temperature', l('CTN 10 kΩ noyée dans le bobinage', '10 kΩ NTC embedded in the winding')),
    ],
    tip: l(
      'Câblez les capteurs en câble blindé et séparé du câble de puissance : à 175 Hz, le triphasé redressé parasite les mesures analogiques.',
      'Use shielded cable for the sensors, routed apart from the power cable: at 175 Hz, the rectified three-phase output disturbs analogue readings.',
    ),
    video: ['05:55', '06:00'],
    version: 'v2',
    upgrade: l(
      'Nouveau en V2 : ce que Sylvain lit sur place (499 W, 53,02 V, 9,4 A) devient un historique consultable à distance, avec des alarmes.',
      'New in V2: what Sylvain reads on site (499 W, 53.02 V, 9.4 A) becomes a remotely accessible history, with alarms.',
    ),
  },
  {
    id: 'controller-box',
    scene: 'turbine',
    category: 'electrical',
    name: l('Coffret contrôleur', 'Controller box'),
    short: l(
      'Coffret IP65 sur le skid : protections DC, relais de surtension et télémesure.',
      'IP65 box on the skid: DC protection, overvoltage relay and telemetry.',
    ),
    description: l(
      'Les protections et l’électronique de surveillance quittent le local pour se ranger sur rail DIN dans un coffret étanche fixé au skid, au pied de la turbine. Le relais de surtension surveille la tension de sortie : si elle grimpe parce que la charge a disparu, il coupe la gâche et le déflecteur tombe. Un ESP32 publie pression, vitesse, température et puissance en MQTT ou vers le GX Victron.',
      'Protection and monitoring electronics move out to a DIN rail in a sealed box fixed to the skid, right at the turbine. The overvoltage relay watches the output voltage: if it rises because the load has gone, it cuts the latch and the deflector drops. An ESP32 publishes pressure, speed, temperature and power over MQTT or to the Victron GX.',
    ),
    material: l('Coffret polycarbonate IP65, rail DIN', 'IP65 polycarbonate enclosure, DIN rail'),
    specs: [
      sp('Entrée', 'Input', l('Sortie DC du redresseur de la turbine', 'DC output of the turbine rectifier')),
      sp(
        'Protection',
        'Protection',
        l('Disjoncteur DC 2P 32 A + parafoudre type 2', '2P 32 A DC breaker + type 2 surge arrester'),
      ),
      sp(
        'Sécurité',
        'Safety',
        l('Relais de surtension réglé à 66 V → déflecteur', 'Overvoltage relay set at 66 V → deflector'),
      ),
      sp('Télémesure', 'Telemetry', l('ESP32, MQTT ou VE.Can vers le GX', 'ESP32, MQTT or VE.Can to the GX')),
      sp('Sortie', 'Output', l('Connecteur IP68 débrochable', 'Pluggable IP68 connector')),
    ],
    tip: l(
      'Installez le coffret côté aval du carter et percez un petit trou de drainage en point bas : la condensation doit pouvoir s’évacuer.',
      'Mount the box on the downstream side of the housing and drill a small drain hole at the lowest point: condensation must be able to escape.',
    ),
    video: ['19:00'],
    version: 'v2',
    upgrade: l(
      'Nouveau en V2 : rapproche de la turbine les protections du « boîtier de sécurité » de la vidéo et y ajoute la commande du déflecteur et la télémesure.',
      'New in V2: brings the protection of the “safety box” seen in the video next to the turbine, and adds the deflector control and telemetry.',
    ),
  },
  {
    id: 'air-valve',
    scene: 'turbine',
    category: 'hydraulic',
    name: l('Ventouse automatique', 'Automatic air-release valve'),
    short: l(
      'Purge l’air qui s’accumule au point haut du col de cygne.',
      'Bleeds the air that collects at the high point of the gooseneck.',
    ),
    description: l(
      'L’air entré par la prise d’eau ou dissous dans l’eau froide remonte et se loge dans le point haut de la nourrice. Une poche d’air fait cracher l’injecteur, fait chuter la puissance et, comprimée puis relâchée, peut provoquer des pics de pression. La ventouse, un simple flotteur, laisse sortir l’air et se referme dès que l’eau arrive.',
      'Air drawn in at the intake, or dissolved in cold water, rises and lodges at the high point of the manifold. An air pocket makes the injector sputter, drops the power and, when compressed then released, can cause pressure spikes. The air-release valve, a simple float, lets the air out and shuts as soon as water reaches it.',
    ),
    material: l('Corps PP ou laiton, flotteur PP', 'PP or brass body, PP float'),
    specs: [
      sp('Type', 'Type', l('Ventouse à flotteur simple fonction', 'Single-function float air valve')),
      sp('Raccord', 'Connection', '1/2" BSP'),
      sp('Pression nominale', 'Pressure rating', 'PN16'),
      sp('Position', 'Location', l('Point haut du col de cygne', 'High point of the gooseneck')),
    ],
    maintenance: l(
      'Vérifiez une fois par an qu’elle ne goutte pas : un flotteur entartré reste entrouvert.',
      'Check once a year that it does not drip: a scaled float stays slightly open.',
    ),
    tip: l(
      'Mettez une petite vanne d’isolement sous la ventouse : on peut la nettoyer sans arrêter la turbine.',
      'Fit a small isolating valve under the air valve: it can then be cleaned without stopping the turbine.',
    ),
    video: ['14:05'],
    version: 'v2',
    upgrade: l(
      'Nouvelle en V2, associée à la vanne principale à réducteur : l’air et les coups de bélier, deux causes de casse de raccords, sont traités à la source.',
      'New in V2, together with the gear-operated main valve: air and water hammer, two causes of burst fittings, are dealt with at the source.',
    ),
  },
];

// ---------------------------------------------------------------------------
// Site scene: from the stream to the house
// ---------------------------------------------------------------------------

const SITE_PARTS: PartInfo[] = [
  {
    id: 'stream',
    scene: 'site',
    category: 'site',
    name: l('Ruisseau', 'Stream'),
    short: l(
      'Un tout petit cours d’eau, mais une pente raide : c’est tout le secret.',
      'A tiny watercourse, but a steep slope: that is the whole secret.',
    ),
    description: l(
      'Une Pelton ne demande pas un gros débit mais de la hauteur : la vidéo montre des ruisseaux qu’on enjamberait. Le débit varie énormément au fil de l’année : sur le site B, il y a de l’eau de décembre à mai, à peine 0,7 à 0,8 L/s début juin après une canicule, et le lit est à sec en été. On ne prélève qu’une partie du débit, et toute l’eau turbinée retourne au ruisseau plus bas.',
      'A Pelton does not need a large flow but height: the video shows streams you could step across. The flow varies enormously over the year: on site B there is water from December to May, barely 0.7–0.8 L/s in early June after a heatwave, and the bed is dry in summer. Only part of the flow is taken, and all the turbined water returns to the stream further down.',
    ),
    material: l('Cours d’eau de montagne (Ariège)', 'Mountain stream (Ariège)'),
    specs: [
      sp('Débit minimal Pelton', 'Minimum Pelton flow', '≈ 1 L/s'),
      sp('Site B, juin', 'Site B, June', '0,7–0,8 L/s'),
      sp('Période utile (site B)', 'Useful season (site B)', l('Décembre à mai', 'December to May')),
      sp(
        'Débit réservé',
        'Reserved flow',
        l('≥ 1/10 du module (règle générale en France)', '≥ 1/10 of mean annual flow (general rule in France)'),
      ),
    ],
    tip: l(
      'Mesurez le débit à l’étiage, pas au printemps : une turbine dimensionnée sur les hautes eaux passera la moitié de l’année à l’arrêt.',
      'Measure the flow at low water, not in spring: a turbine sized on high water will stand idle half the year.',
    ),
    video: ['00:30', '12:20', '14:50'],
  },
  {
    id: 'weir',
    scene: 'site',
    category: 'site',
    name: l('Petite retenue', 'Small weir'),
    short: l(
      'Seuil de pierres et de planches qui relève l’eau devant la prise.',
      'Low stone-and-board sill that raises the water in front of the intake.',
    ),
    description: l(
      'Sur le site B, une petite retenue crée un bassin juste en amont de la boîte Coanda. Elle stabilise le niveau, alimente toute la largeur de la grille et sert de tampon quand le débit fluctue. Le surplus doit toujours déborder par-dessus : c’est ce petit débordement permanent qui garantit qu’aucun air n’entre dans la conduite.',
      'On site B a small weir forms a pool just upstream of the Coanda box. It steadies the level, feeds the full width of the screen and acts as a buffer when the flow fluctuates. The surplus must always spill over: that small, permanent overflow is what guarantees no air enters the penstock.',
    ),
    material: l('Pierres sèches, planches, géomembrane', 'Dry stones, boards, geomembrane'),
    specs: [
      sp('Hauteur', 'Height', '20–40 cm'),
      sp('Volume tampon', 'Buffer volume', l('Quelques centaines de litres', 'A few hundred litres')),
      sp('Règle d’or', 'Golden rule', l('Toujours un débordement visible', 'Always a visible overflow')),
    ],
    tip: l(
      'Un seuil dans un cours d’eau est un ouvrage soumis à déclaration ou autorisation : renseignez-vous auprès de la DDT avant de poser la première pierre.',
      'A sill in a watercourse is a structure that requires declaration or authorisation: check with the DDT before laying the first stone.',
    ),
    video: ['13:20', '14:00'],
  },
  {
    id: 'coanda',
    scene: 'site',
    category: 'hydraulic',
    name: l('Prise d’eau Coanda', 'Coanda intake'),
    short: l(
      'Grille inox incurvée autonettoyante qui filtre à 1 mm.',
      'Curved, self-cleaning stainless screen that filters down to 1 mm.',
    ),
    description: l(
      'L’eau glisse sur une grille en fil profilé inox légèrement incurvée : par effet Coanda, elle épouse la surface et chaque fil en découpe une fine lame qui tombe dans la boîte, tandis que feuilles et graviers roulent par-dessus avec le surplus. Le filtrage est d’environ 1 mm, assez fin pour protéger l’injecteur. Selon Sylvain, même couverte de débris, la grille laisse passer l’eau sans problème ; un coup de brosse une fois par trimestre suffit.',
      'Water slides over a slightly curved stainless wedge-wire screen: thanks to the Coanda effect it clings to the surface and each wire slices off a thin sheet that drops into the box, while leaves and gravel roll over with the surplus. Filtration is about 1 mm, fine enough to protect the injector. According to Sylvain, even covered with debris the screen still lets the water in; a brush stroke once a quarter is enough.',
    ),
    material: l('Grille inox en fil profilé, boîte inox', 'Stainless wedge-wire screen, stainless box'),
    specs: [
      sp('Fente', 'Slot width', '≈ 1 mm'),
      sp('Largeur de grille', 'Screen width', '≈ 400 mm'),
      sp('Capacité', 'Capacity', l('≈ 100 L/s par mètre de largeur', '≈ 100 L/s per metre of width')),
      sp('Nettoyage', 'Cleaning', l('Brosse, une fois par trimestre', 'Brush, once a quarter')),
      sp('Sortie', 'Outlet', l('Ø63 noyée, vers la conduite', 'Submerged Ø63, to the penstock')),
    ],
    maintenance: l(
      'Un coup de brosse par trimestre, plus après chaque crue. Contrôlez que l’eau déborde toujours par-dessus la grille.',
      'A brush stroke every quarter, plus after every flood. Check that water always spills over the screen.',
    ),
    tip: l(
      'Placez la sortie de la boîte bien sous le niveau d’eau : une sortie trop haute forme un vortex qui aspire de l’air, même quand la boîte paraît pleine.',
      'Set the box outlet well below the water level: an outlet that is too high forms a vortex that draws in air, even when the box looks full.',
    ),
    video: ['13:24', '13:40', '14:05'],
  },
  {
    id: 'penstock',
    scene: 'site',
    category: 'hydraulic',
    name: l('Conduite forcée', 'Penstock'),
    short: l(
      'Tube PEHD qui descend la pente et transforme la chute en pression.',
      'HDPE pipe running down the slope that turns the drop into pressure.',
    ),
    description: l(
      'La conduite amène l’eau de la prise à la turbine en gardant toute la chute sous forme de pression : 76 m de dénivelé donnent environ 7,4 bar. Sur le site A, c’est du PEHD Ø63 PN10 de 55 mm intérieur sur 350 m : le frottement coûte un peu de chute, et un Ø80 ou un Ø100 aurait été plus indiqué, comme le reconnaît Sylvain. Sur le site B, 55 m de conduite seulement pour 21 m de chute.',
      'The penstock carries the water from the intake to the turbine while keeping the whole drop as pressure: 76 m of elevation give about 7.4 bar. On site A it is Ø63 PN10 HDPE with a 55 mm bore over 350 m: friction costs some head, and Ø80 or Ø100 would have been better suited, as Sylvain admits. On site B there are only 55 m of pipe for 21 m of head.',
    ),
    material: l('PEHD PE100 SDR17, PN10', 'PE100 HDPE SDR17, PN10'),
    specs: [
      sp('Site A', 'Site A', l('Ø63 PN10, 350 m, 76 m de chute', 'Ø63 PN10, 350 m, 76 m head')),
      sp('Site B', 'Site B', l('55 m, 21 m de chute', '55 m, 21 m head')),
      sp('Diamètre intérieur', 'Internal diameter', '≈ 55 mm'),
      sp('Pertes à 1,1 L/s (site A)', 'Losses at 1.1 L/s (site A)', '≈ 2 m'),
      sp('Pression statique (76 m)', 'Static pressure (76 m)', '≈ 7,4 bar'),
    ],
    maintenance: l(
      'Parcourez le tracé après chaque hiver : chutes de pierres, rongeurs, raccords déboîtés.',
      'Walk the route after every winter: falling stones, rodents, fittings pulled apart.',
    ),
    tip: l(
      'Pente continue, sans point haut ni contre-pente : chaque bosse piège une bulle d’air qui étrangle le débit. Enterrez la conduite ou protégez-la du soleil et des chocs.',
      'Continuous slope, no high point and no reverse gradient: every hump traps an air bubble that chokes the flow. Bury the pipe or protect it from sun and impacts.',
    ),
    video: ['01:05', '01:25', '14:25'],
  },
  {
    id: 'turbine',
    scene: 'site',
    category: 'site',
    name: l('Turbine Pelton', 'Pelton turbine'),
    short: l(
      'La machine : jet, roue, générateur. Cliquez pour l’ouvrir dans l’atelier.',
      'The machine: jet, runner, generator. Click to open it in the workshop.',
    ),
    description: l(
      'La turbine transforme la pression de l’eau en jet, le jet en rotation et la rotation en électricité, sans multiplicateur. Sur le site A, un seul injecteur de 6 mm fournit 499 W sous 76 m ; sur le site B, deux injecteurs couvrent des débits très différents selon la saison. Elle doit tourner 24 h/24 à vitesse constante et toujours en charge.',
      'The turbine turns water pressure into a jet, the jet into rotation and rotation into electricity, with no gearbox. On site A, a single 6 mm injector delivers 499 W under 76 m; on site B, two injectors cover very different flows depending on the season. It must run 24/7 at constant speed and always under load.',
    ),
    material: l('Aluminium marin, PMMA, pièces imprimées 3D', 'Marine aluminium, PMMA, 3D-printed parts'),
    specs: [
      sp(
        'Site A',
        'Site A',
        l('76 m, 1,1 L/s, 499 W (≈ 950 W prévus en Ø8)', '76 m, 1.1 L/s, 499 W (≈ 950 W planned with Ø8)'),
      ),
      sp(
        'Site B',
        'Site B',
        l('21 m, 90–100 W en étiage, 250–300 W, jusqu’à 500 W', '21 m, 90–100 W at low water, 250–300 W, up to 500 W'),
      ),
      sp('Vitesse', 'Speed', '≈ 1 500 tr/min'),
      sp('Tension de sortie', 'Output voltage', '50–54 V DC'),
      sp('Gamme du constructeur', 'Builder’s range', l('≈ 100 W à 20–25 kW', '≈ 100 W to 20–25 kW')),
    ],
    tip: l(
      'Gardez au moins 30 à 40 cm de chute libre sous la turbine : si l’eau remonte dans le carter, la roue barbote et le rendement s’effondre.',
      'Keep at least 30–40 cm of free fall under the turbine: if water backs up into the housing, the runner churns and efficiency collapses.',
    ),
    video: ['00:00', '02:40', '15:45'],
  },
  {
    id: 'tailrace',
    scene: 'site',
    category: 'site',
    name: l('Canal de fuite', 'Tailrace'),
    short: l('Rigole qui rend l’eau turbinée au ruisseau.', 'Channel that returns the turbined water to the stream.'),
    description: l(
      'Une Pelton ne consomme pas d’eau : elle lui prend son énergie et la rend intacte au ruisseau, un peu plus bas. Le canal doit évacuer librement tout le débit pour que l’eau ne remonte jamais vers la roue ; il faut au minimum 30 à 40 cm de chute libre entre le socle et la surface de l’eau. Un fond empierré évite que le jet résiduel ne creuse le sol sous la turbine.',
      'A Pelton does not consume water: it takes its energy and returns it intact to the stream, a little further down. The channel must carry the full flow freely so that water never backs up to the runner; at least 30–40 cm of free fall is needed between the base and the water surface. A stone-lined bed stops the residual jet from scouring the ground under the turbine.',
    ),
    material: l('Rigole empierrée ou demi-tube PVC', 'Stone-lined ditch or half PVC pipe'),
    specs: [
      sp('Chute libre minimale', 'Minimum free fall', '30–40 cm'),
      sp('Débit à évacuer', 'Flow to carry', l('Tout le débit turbiné (1–5 L/s)', 'The full turbined flow (1–5 L/s)')),
      sp(
        'Retour au cours d’eau',
        'Return point',
        l('En aval, au plus près de la turbine', 'Downstream, as close as possible to the turbine'),
      ),
    ],
    tip: l(
      'Ramenez l’eau au ruisseau par le chemin le plus court : le tronçon entre la prise et le rejet est celui où le milieu manque d’eau.',
      'Return the water to the stream by the shortest route: the stretch between intake and outfall is where the river is short of water.',
    ),
    video: ['02:40', '02:54', '03:00'],
  },
  {
    id: 'cable-run',
    scene: 'site',
    category: 'electrical',
    name: l('Liaison électrique enterrée', 'Buried cable run'),
    short: l(
      'Câble qui relie la turbine au local technique : sa section dépend de la distance et de la tension.',
      'Cable from the turbine to the technical room: its size depends on distance and voltage.',
    ),
    description: l(
      'Les pertes dans un câble valent R·I² : à puissance égale, monter la tension réduit le courant et divise les pertes par le carré. En 48 V, on se contente de 6 mm² quand la turbine est à côté des batteries, comme sur le site B (à peine 1 V de chute). Pour les longues distances, Sylvain choisit des générateurs en 150 à 250 V qui permettent de rester en 6 ou 10 mm².',
      'Cable losses equal R·I²: for the same power, raising the voltage lowers the current and divides the losses by its square. At 48 V, 6 mm² is fine when the turbine is next to the batteries, as on site B (barely 1 V of drop). For long runs, Sylvain picks 150–250 V generators that allow 6 or 10 mm² cable to be kept.',
    ),
    material: l('Câble cuivre sous gaine TPC rouge', 'Copper cable in red corrugated duct'),
    specs: [
      sp('Section', 'Cross-section', '6–10 mm²'),
      sp(
        'Pertes à 500 W sur 200 m (6 mm²), en 50 V',
        'Losses at 500 W over 200 m (6 mm²), at 50 V',
        l('≈ 117 W (23 %)', '≈ 117 W (23%)'),
      ),
      sp('Même liaison en 200 V', 'Same run at 200 V', l('≈ 7 W (1,5 %)', '≈ 7 W (1.5%)')),
      sp(
        'Pose',
        'Laying',
        l('Gaine TPC à 50 cm, grillage avertisseur rouge', 'Corrugated duct at 50 cm, red warning mesh'),
      ),
    ],
    tip: l(
      'Faites le calcul de chute de tension avant d’acheter le câble : il est presque toujours moins cher de monter la tension du générateur que la section du cuivre.',
      'Do the voltage-drop calculation before buying the cable: it is almost always cheaper to raise the generator voltage than the copper cross-section.',
    ),
    video: ['06:05', '17:55', '18:20'],
  },
  {
    id: 'cabin',
    scene: 'site',
    category: 'site',
    name: l('Habitation', 'House'),
    short: l(
      'Le foyer autonome : ce qu’on consomme, la turbine et le solaire doivent le produire.',
      'The off-grid household: whatever is used, the turbine and the sun must produce.',
    ),
    description: l(
      'Le site B est un hameau de montagne hors réseau. L’hiver, le soleil passe vite derrière les crêtes et la turbine prend le relais, de jour comme de nuit ; elle sert aussi à faire l’eau chaude. L’été, le ruisseau est à sec et ce sont les panneaux solaires qui assurent seuls la consommation.',
      'Site B is an off-grid mountain hamlet. In winter, the sun quickly drops behind the ridges and the turbine takes over, day and night; it is also used to heat water. In summer the stream is dry and the solar panels cover the consumption on their own.',
    ),
    material: l('Bâti traditionnel en pierre', 'Traditional stone buildings'),
    specs: [
      sp('Distribution', 'Supply', '230 V AC'),
      sp('Hiver', 'Winter', l('Turbine en base + solaire en appoint', 'Turbine as base load + solar top-up')),
      sp('Été', 'Summer', l('Solaire seul', 'Solar only')),
    ],
    tip: l(
      'Programmez les gros consommateurs (lave-linge, ballon d’eau chaude) quand l’énergie est là : surplus solaire l’été, délestage de la turbine l’hiver.',
      'Schedule the big loads (washing machine, water heater) when energy is available: solar surplus in summer, turbine diversion in winter.',
    ),
    video: ['01:00', '12:48'],
  },
  {
    id: 'pv',
    scene: 'site',
    category: 'electrical',
    name: l('Champ photovoltaïque', 'Solar array'),
    short: l(
      '4,5 kWc de panneaux : la production d’été, quand le ruisseau est à sec.',
      '4.5 kWp of panels: summer production, when the stream is dry.',
    ),
    description: l(
      'Hydraulique et solaire se complètent presque parfaitement : beaucoup d’eau et peu de soleil l’hiver, l’inverse l’été. Sur le site B, 4 500 W crête alimentent le parc de batteries par un régulateur Victron SmartSolar. Sylvain le dit sans détour : le solaire seul pose problème lors d’une semaine de mauvais temps ou quand le soleil est très bas en hiver.',
      'Hydro and solar complement each other almost perfectly: lots of water and little sun in winter, the opposite in summer. On site B, 4,500 W peak feed the battery bank through a Victron SmartSolar charge controller. Sylvain says it plainly: solar alone struggles during a week of bad weather or when the sun is very low in winter.',
    ),
    material: l('Modules silicium monocristallin', 'Monocrystalline silicon modules'),
    specs: [
      sp('Puissance crête', 'Peak power', l('4,5 kWc', '4.5 kWp')),
      sp('Régulateur', 'Charge controller', 'Victron SmartSolar MPPT 250/100 VE.Can'),
      sp('Saison forte', 'Strong season', l('Mai à octobre', 'May to October')),
    ],
    maintenance: l(
      'Contrôlez visuellement les connecteurs MC4 et les fixations une fois par an ; la pluie suffit en général au nettoyage.',
      'Inspect the MC4 connectors and mountings once a year; rain is usually enough to keep the modules clean.',
    ),
    tip: l(
      'En montagne, inclinez fort les panneaux (50 à 60°) : on sacrifie un peu d’été pour gagner en hiver, et la neige glisse.',
      'In the mountains, tilt the panels steeply (50–60°): a little summer yield is traded for winter output, and snow slides off.',
    ),
    video: ['15:10', '16:45'],
  },
  {
    id: 'techroom',
    scene: 'site',
    category: 'electrical',
    name: l('Local technique', 'Technical room'),
    short: l(
      'Batteries, onduleur, régulateurs et protections. Cliquez pour entrer.',
      'Batteries, inverter, charge controllers and protection. Click to step inside.',
    ),
    description: l(
      'Toute l’énergie converge ici : la turbine et les panneaux chargent un bus 48 V, les batteries lissent les écarts et l’onduleur-chargeur fournit le 230 V de la maison. Sur le site B, quatre batteries Pylontech, un MultiPlus-II GX et des SmartSolar sont montés sur un panneau OSB, les batteries rangées sous un établi en bois. Le délesteur et ses résistances garantissent que la turbine reste en charge même batteries pleines.',
      'All the energy converges here: the turbine and the panels charge a 48 V bus, the batteries smooth out the differences and the inverter-charger supplies the house with 230 V. On site B, four Pylontech batteries, a MultiPlus-II GX and SmartSolar units are mounted on an OSB board, with the batteries stored under a wooden bench. The diversion controller and its resistors make sure the turbine stays loaded even with full batteries.',
    ),
    material: l('Panneau OSB, chemins de câbles, coffrets', 'OSB board, cable trays, enclosures'),
    specs: [
      sp('Stockage', 'Storage', l('4 × Pylontech US2000C, ≈ 10 kWh', '4 × Pylontech US2000C, ≈ 10 kWh')),
      sp('Onduleur', 'Inverter', 'Victron MultiPlus-II GX 48/3000'),
      sp('Tension du bus', 'Bus voltage', '48 V DC'),
      sp('Coût de la partie hydro (site B)', 'Hydro part cost (site B)', '≈ 3 000 €'),
    ],
    tip: l(
      'Gardez le local hors gel et ventilé : les batteries lithium ne se chargent pas sous 0 °C et les résistances de délestage dégagent jusqu’à 2 kW de chaleur.',
      'Keep the room frost-free and ventilated: lithium batteries cannot be charged below 0 °C and the dump resistors can give off up to 2 kW of heat.',
    ),
    video: ['15:00', '16:20', '17:00'],
  },
];

// ---------------------------------------------------------------------------
// Technical room (site B reconstruction: hybrid hydro + solar, 48 V bus)
// ---------------------------------------------------------------------------

const TECHROOM_PARTS: PartInfo[] = [
  {
    id: 'battery',
    scene: 'techroom',
    category: 'electrical',
    name: l('Batteries lithium Pylontech', 'Pylontech lithium batteries'),
    short: l(
      'Quatre modules LiFePO₄ de 2,4 kWh rangés sous l’établi : près de 10 kWh de stockage.',
      'Four 2.4 kWh LiFePO₄ modules stored under the bench: almost 10 kWh of storage.',
    ),
    description: l(
      'Le parc stocke l’énergie de la turbine la nuit et celle du soleil le jour. Comme la turbine recharge en continu, les batteries ne descendent presque jamais à 20 ou 30 % de charge, ce qui les ménage nettement. Chaque module a son propre BMS : s’il juge une cellule trop chargée, il ouvre le circuit, d’où l’importance du délesteur pour que la turbine ne se retrouve jamais à vide.',
      'The bank stores the turbine’s energy at night and the sun’s during the day. Because the turbine charges continuously, the batteries almost never drop to 20 or 30% state of charge, which spares them considerably. Each module has its own BMS: if it finds a cell overcharged it opens the circuit, hence the importance of the dump load so that the turbine is never left unloaded.',
    ),
    material: l('Cellules LiFePO₄ 15S, BMS intégré', '15S LiFePO₄ cells, built-in BMS'),
    specs: [
      sp('Modèle', 'Model', '4 × Pylontech US2000C'),
      sp('Capacité', 'Capacity', l('4 × 2,4 kWh ≈ 9,6 kWh', '4 × 2.4 kWh ≈ 9.6 kWh')),
      sp('Tension', 'Voltage', l('48 V nominal (44,5–53,5 V)', '48 V nominal (44.5–53.5 V)')),
      sp('Courant conseillé', 'Recommended current', l('25 A par module', '25 A per module')),
      sp('Communication', 'Communication', l('CAN vers le GX Victron', 'CAN to the Victron GX')),
    ],
    maintenance: l(
      'Rien à faire au quotidien. Une fois par an, resserrez les cosses et comparez les tensions des modules sur le GX.',
      'Nothing to do day to day. Once a year, re-tighten the lugs and compare the module voltages on the GX.',
    ),
    tip: l(
      'Le lithium ne se charge pas sous 0 °C : dans un local non chauffé, la turbine qui tourne l’hiver doit pouvoir délester même si le BMS refuse la charge.',
      'Lithium cannot be charged below 0 °C: in an unheated room, a turbine running in winter must be able to divert even when the BMS refuses to charge.',
    ),
    video: ['16:55', '17:05', '17:15'],
    qty: 4,
  },
  {
    id: 'inverter',
    scene: 'techroom',
    category: 'electrical',
    name: l('Onduleur-chargeur MultiPlus-II GX', 'MultiPlus-II GX inverter-charger'),
    short: l(
      'Transforme le 48 V des batteries en 230 V pour la maison, et pilote l’ensemble.',
      'Turns the 48 V battery bus into 230 V for the house, and manages the whole system.',
    ),
    description: l(
      'Le grand boîtier bleu du local est un onduleur-chargeur Victron : il fabrique une sinusoïde propre à partir des batteries et peut, à l’inverse, recharger les batteries depuis un groupe électrogène. La version GX intègre le cerveau du système, qui dialogue avec les batteries et les régulateurs solaires. Son pic de démarrage encaisse les moteurs (pompe, lave-linge) que la turbine seule ne pourrait jamais fournir.',
      'The large blue unit in the room is a Victron inverter-charger: it produces a clean sine wave from the batteries and can, conversely, charge the batteries from a generator. The GX version includes the system’s brain, which talks to the batteries and the solar controllers. Its surge capacity copes with motor starts (pump, washing machine) that the turbine alone could never supply.',
    ),
    material: l('Boîtier acier peint, IP21', 'Painted steel enclosure, IP21'),
    specs: [
      sp('Modèle', 'Model', 'MultiPlus-II GX 48/3000/35-32'),
      sp('Puissance', 'Power', l('3 000 VA (2 400 W en continu à 25 °C)', '3,000 VA (2,400 W continuous at 25 °C)')),
      sp('Chargeur', 'Charger', '35 A'),
      sp('Câbles batterie', 'Battery cables', l('35 mm², fusible 125 A', '35 mm², 125 A fuse')),
    ],
    tip: l(
      'Gardez 30 cm libres au-dessus et en dessous : l’onduleur se refroidit par convection et réduit sa puissance quand il a chaud.',
      'Keep 30 cm clear above and below: the inverter cools by convection and derates when it gets hot.',
    ),
    video: ['16:25', '16:35'],
  },
  {
    id: 'mppt-pv',
    scene: 'techroom',
    category: 'electrical',
    name: l('Régulateur solaire SmartSolar', 'SmartSolar charge controller'),
    short: l(
      'Charge les batteries depuis les panneaux en cherchant en permanence le point de puissance maximale.',
      'Charges the batteries from the panels while constantly tracking the maximum power point.',
    ),
    description: l(
      'Un régulateur MPPT ajuste sans cesse la tension des panneaux pour en tirer le maximum quand l’ensoleillement change. C’est idéal pour le solaire, qui n’a pas d’inertie, mais c’est exactement ce qu’il ne faut pas faire avec une turbine : voir la leçon sur la vitesse constante. Le modèle visible dans la vidéo est un SmartSolar VE.Can de la gamme 250 V ; un 250/100 encaisse les 4,5 kWc en 48 V.',
      'An MPPT controller keeps adjusting the panel voltage to extract the maximum as sunlight changes. This is ideal for solar, which has no inertia, but it is exactly what must not be done with a turbine: see the lesson on constant speed. The unit seen in the video is a 250 V-range SmartSolar VE.Can; a 250/100 handles the 4.5 kWp array at 48 V.',
    ),
    material: l('Boîtier aluminium, IP43', 'Aluminium enclosure, IP43'),
    specs: [
      sp(
        'Modèle',
        'Model',
        l('Victron SmartSolar MPPT 250/100 VE.Can (probable)', 'Victron SmartSolar MPPT 250/100 VE.Can (likely)'),
      ),
      sp('Tension PV max', 'Max PV voltage', '250 V'),
      sp('Courant de charge', 'Charge current', '100 A'),
      sp('Puissance PV à 48 V', 'PV power at 48 V', l('≈ 5,8 kW', '≈ 5.8 kW')),
      sp('Champ raccordé', 'Connected array', l('4,5 kWc', '4.5 kWp')),
    ],
    tip: l(
      'Calculez la tension des chaînes par grand froid : la tension à vide grimpe d’environ 8 % à −10 °C, et dépasser 250 V détruit le régulateur.',
      'Work out string voltage for very cold weather: open-circuit voltage rises by about 8% at −10 °C, and exceeding 250 V destroys the controller.',
    ),
    video: ['16:40'],
  },
  {
    id: 'hydro-ctrl',
    scene: 'techroom',
    category: 'electrical',
    name: l('Régulateur hydro TriStar MPPT', 'TriStar MPPT hydro controller'),
    short: l(
      'Morningstar TS-MPPT-45 réglé en tension d’entrée fixe : la turbine tourne à vitesse constante.',
      'Morningstar TS-MPPT-45 set to a fixed input voltage: the turbine runs at constant speed.',
    ),
    description: l(
      'C’est le régulateur utilisé sur le site A. Bien qu’il s’appelle MPPT, il possède une fonction qui impose une tension d’entrée fixe ; or la tension d’un générateur à aimants est proportionnelle à sa vitesse, donc tension fixe veut dire vitesse fixe. Un MPPT classique ferait varier la vitesse en permanence, se calerait rarement au bon endroit et fatiguerait la mécanique. Sur le site B, turbine collée aux batteries, Sylvain s’en passe : c’est la batterie qui fixe la tension, et environ 500 € d’économisés.',
      'This is the controller used on site A. Although it is called MPPT, it has a function that holds a fixed input voltage; since a magnet generator’s voltage is proportional to its speed, a fixed voltage means a fixed speed. A classic MPPT would keep changing the speed, rarely settle at the right point and wear the mechanics. On site B, with the turbine right next to the batteries, Sylvain does without it: the battery sets the voltage, and about 500 € is saved.',
    ),
    material: l('Boîtier aluminium à ailettes', 'Finned aluminium enclosure'),
    specs: [
      sp('Modèle', 'Model', 'Morningstar TriStar TS-MPPT-45'),
      sp('Tension d’entrée max', 'Max input voltage', l('150 V (Voc)', '150 V (Voc)')),
      sp('Courant', 'Current', '45 A'),
      sp('Puissance en 48 V', 'Power at 48 V', '≈ 2 400 W'),
      sp('Mode utilisé', 'Mode used', l('Tension d’entrée fixe (vitesse fixe)', 'Fixed input voltage (fixed speed)')),
    ],
    tip: l(
      'Une turbine à vide peut dépasser le double de sa tension nominale : vérifiez que la tension d’emballement reste sous les 150 V du régulateur.',
      'An unloaded turbine can exceed twice its rated voltage: check that the runaway voltage stays below the controller’s 150 V.',
    ),
    video: ['06:05', '06:30', '07:00'],
  },
  {
    id: 'diversion',
    scene: 'techroom',
    category: 'electrical',
    name: l('Régulateur de délestage', 'Diversion controller'),
    short: l(
      'Quand les batteries sont pleines, envoie le surplus de la turbine dans les résistances.',
      'When the batteries are full, sends the turbine’s surplus into the resistors.',
    ),
    description: l(
      'Une turbine doit rester en charge 24 h/24 : si personne ne consomme et que les batteries sont pleines, le courant n’a plus où aller et la roue s’emballe. Le délesteur surveille la tension du bus et, dès qu’elle atteint sa consigne, envoie en PWM juste ce qu’il faut de courant dans les résistances pour la maintenir. La turbine ne voit aucune différence : elle continue de produire à pleine charge.',
      'A turbine must stay loaded around the clock: if nobody is using power and the batteries are full, the current has nowhere to go and the runner races. The diversion controller watches the bus voltage and, as soon as it reaches its set point, sends just enough PWM current into the resistors to hold it. The turbine sees no difference: it keeps producing at full load.',
    ),
    material: l('Boîtier aluminium à ailettes', 'Finned aluminium enclosure'),
    specs: [
      sp(
        'Pack constructeur',
        'Maker pack',
        l(
          'TriStar TS-45 PWM 45 A, préréglé en atelier selon la tension batterie',
          'TriStar TS-45 PWM 45 A, preset in the workshop for the battery voltage',
        ),
      ),
      sp(
        'Exemple',
        'Example',
        l('Morningstar TriStar TS-60 en mode délestage', 'Morningstar TriStar TS-60 in diversion mode'),
      ),
      sp('Courant', 'Current', l('60 A max (48 A en usage continu)', '60 A max (48 A continuous use)')),
      sp(
        'Consigne',
        'Set point',
        l('≈ 53–53,5 V, sous le seuil de coupure du BMS', '≈ 53–53.5 V, below the BMS cut-off'),
      ),
      sp('Commande', 'Control', 'PWM'),
    ],
    tip: l(
      'Réglez la consigne du délesteur au-dessus de la tension de charge mais en dessous du seuil où le BMS ouvre : sinon le BMS coupe avant que le délestage ne démarre.',
      'Set the diversion threshold above the charge voltage but below the point where the BMS opens: otherwise the BMS trips before diversion starts.',
    ),
    video: ['19:05', '19:15'],
  },
  {
    id: 'dump-load',
    scene: 'techroom',
    category: 'electrical',
    name: l('Résistances de délestage', 'Dump-load resistors'),
    short: l(
      'Coffret ventilé de résistances qui transforment le surplus en chaleur.',
      'Vented box of resistors that turn the surplus into heat.',
    ),
    description: l(
      'Ce sont de simples résistances qui chauffent l’air, que Sylvain appelle aussi « résistances de freinage » : elles freinent électriquement la turbine quand les batteries n’ont plus besoin d’énergie. Leur puissance doit dépasser celle de la turbine avec une bonne marge, car si elles ne suffisent pas, la vitesse remonte. Le surplus peut aussi chauffer un ballon d’eau chaude plutôt que l’air du local.',
      'They are simple air-heating resistors, which Sylvain also calls “braking resistors”: they brake the turbine electrically when the batteries no longer need energy. Their rating must exceed the turbine’s power with a good margin, because if they fall short the speed climbs. The surplus can also heat a hot-water tank rather than the room air.',
    ),
    material: l(
      'Résistances bobinées sous boîtier aluminium, coffret tôle ventilé',
      'Aluminium-housed wirewound resistors, vented steel box',
    ),
    specs: [
      sp(
        'Boîtier constructeur',
        'Maker box',
        l(
          'Caisson alu ajouré, 4 résistances bobinées vitrifiées sur barrettes cuivre',
          'Louvred aluminium box, 4 vitreous wire-wound resistors on copper bars',
        ),
      ),
      sp('Puissance', 'Rating', l('≥ 1,25 × la puissance max de la turbine', '≥ 1.25 × maximum turbine power')),
      sp('Exemple', 'Example', l('2 × 1 kW à 54 V (≈ 2,9 Ω chacune)', '2 × 1 kW at 54 V (≈ 2.9 Ω each)')),
      sp('Température de surface', 'Surface temperature', l('> 150 °C', '> 150 °C')),
    ],
    maintenance: l(
      'Dépoussiérez le coffret chaque année et vérifiez qu’aucun objet n’est posé dessus ou contre lui.',
      'Dust the box every year and check that nothing is resting on it or against it.',
    ),
    tip: l(
      'Fixez le coffret en haut du mur, loin du bois et des câbles : il peut dissiper toute la puissance de la turbine pendant des jours.',
      'Mount the box high on the wall, away from timber and cables: it may dissipate the turbine’s full output for days on end.',
    ),
    video: ['19:10', '19:20'],
  },
  {
    id: 'dc-protect',
    scene: 'techroom',
    category: 'electrical',
    name: l('Coffret de protection DC', 'DC protection box'),
    short: l(
      'Le « boîtier de sécurité » où arrive la turbine : sectionnement, fusibles, parafoudre.',
      'The “safety box” where the turbine lands: isolation, fuses, surge arrester.',
    ),
    description: l(
      'Dans la vidéo, la sortie de la turbine arrive directement dans un boîtier de sécurité. On doit pouvoir y isoler la turbine des batteries pour intervenir, et y protéger le câble contre un court-circuit : une batterie lithium peut débiter des milliers d’ampères en un instant. Le parafoudre écoule les surtensions induites par la foudre sur la longue liaison enterrée.',
      'In the video, the turbine output lands directly in a safety box. It must allow the turbine to be isolated from the batteries for work, and protect the cable against a short circuit: a lithium battery can deliver thousands of amps in an instant. The surge arrester diverts lightning-induced surges picked up by the long buried cable run.',
    ),
    material: l(
      'Coffret polycarbonate IP65, appareillage modulaire DC',
      'IP65 polycarbonate box, modular DC switchgear',
    ),
    specs: [
      sp('Sectionneur', 'Isolator', l('Interrupteur-sectionneur DC 2P 32 A', '2P 32 A DC switch-disconnector')),
      sp(
        'Protection',
        'Protection',
        l('Disjoncteur DC 2P 25 A ou fusibles gPV 25 A', '2P 25 A DC breaker or 25 A gPV fuses'),
      ),
      sp('Parafoudre', 'Surge arrester', l('Type 2, adapté à la tension DC', 'Type 2, rated for the DC voltage')),
    ],
    tip: l(
      'Ne coupez jamais la liaison turbine-batteries en charge sans délesteur actif ni déflecteur : vous venez de mettre la turbine à vide.',
      'Never open the turbine-to-battery link under load without an active dump load or a deflector: you have just left the turbine unloaded.',
    ),
    video: ['19:00'],
  },
  {
    id: 'ac-panel',
    scene: 'techroom',
    category: 'electrical',
    name: l('Tableau AC', 'AC distribution board'),
    short: l(
      'Départs 230 V de la maison, protégés par différentiel et disjoncteurs.',
      '230 V circuits of the house, protected by an RCD and circuit breakers.',
    ),
    description: l(
      'La sortie de l’onduleur alimente un tableau classique, comme sur le réseau. Le différentiel 30 mA protège les personnes, les disjoncteurs protègent chaque circuit. En site isolé, le neutre doit être relié à la terre en sortie d’onduleur, sinon le différentiel ne verrait jamais un défaut.',
      'The inverter output feeds a standard distribution board, just like on the grid. The 30 mA RCD protects people, the breakers protect each circuit. In an off-grid system the neutral must be bonded to earth at the inverter output, otherwise the RCD would never see a fault.',
    ),
    material: l('Coffret modulaire, appareillage DIN', 'Modular enclosure, DIN-rail devices'),
    specs: [
      sp('Différentiel', 'RCD', l('30 mA type A ou F', '30 mA type A or F')),
      sp('Départs', 'Circuits', l('Disjoncteurs 10–20 A', '10–20 A circuit breakers')),
      sp(
        'Schéma',
        'Earthing',
        l('TT, neutre relié à la terre en sortie d’onduleur', 'TT, neutral bonded to earth at the inverter output'),
      ),
    ],
    tip: l(
      'Testez le bouton du différentiel tous les six mois : c’est la seule protection des personnes en 230 V.',
      'Press the RCD test button every six months: it is the only protection for people on the 230 V side.',
    ),
    video: ['16:30'],
  },
  {
    id: 'busbar',
    scene: 'techroom',
    category: 'electrical',
    name: l('Barres de distribution DC', 'DC busbars'),
    short: l(
      'Points de rencontre de tous les courants continus : batteries, onduleur, solaire, turbine.',
      'Meeting point of every DC current: batteries, inverter, solar, turbine.',
    ),
    description: l(
      'Plutôt que d’empiler des cosses sur les bornes des batteries, chaque appareil arrive sur une barre positive et une barre négative. Chaque départ a son propre fusible dimensionné pour son câble. C’est aussi là que se mesure le courant total, pour que le GX connaisse l’état de charge réel.',
      'Rather than stacking lugs on the battery terminals, every device lands on a positive and a negative busbar. Each feeder has its own fuse sized for its cable. It is also where the total current is measured, so that the GX knows the real state of charge.',
    ),
    material: l('Cuivre étamé, socle isolant', 'Tinned copper, insulating base'),
    specs: [
      sp('Calibre', 'Rating', '250 A'),
      sp('Fusible onduleur', 'Inverter fuse', 'MEGA 125 A'),
      sp('Couple des cosses M8', 'M8 lug torque', '10–12 N·m'),
    ],
    tip: l(
      'Serrez au couple et marquez chaque écrou d’un trait de peinture : un desserrage se voit au premier coup d’œil.',
      'Torque every nut and mark it with a paint stripe: any loosening shows at a glance.',
    ),
    video: ['16:30'],
  },
  {
    id: 'gx-display',
    scene: 'techroom',
    category: 'electrical',
    name: l('Supervision GX', 'GX monitoring'),
    short: l(
      'L’écran du système : état de charge, production solaire et hydro, consommation.',
      'The system screen: state of charge, solar and hydro production, consumption.',
    ),
    description: l(
      'Le GX centralise les données des batteries, des régulateurs et de l’onduleur, et les remonte sur le portail VRM accessible à distance. On y voit en un coup d’œil si la turbine produit, si le délestage travaille et à quel niveau sont les batteries. C’est l’équivalent, pour le local, de l’afficheur qui indiquait 53,02 V, 9,4 A et 499 W sur le site A.',
      'The GX gathers data from the batteries, the controllers and the inverter, and pushes it to the remotely accessible VRM portal. At a glance you can see whether the turbine is producing, whether diversion is working and how full the batteries are. It is the technical-room equivalent of the display that read 53.02 V, 9.4 A and 499 W on site A.',
    ),
    material: l('Électronique Victron GX', 'Victron GX electronics'),
    specs: [
      sp('Matériel', 'Hardware', l('GX intégré au MultiPlus-II GX', 'GX built into the MultiPlus-II GX')),
      sp('Liaisons', 'Links', 'VE.Direct, VE.Can, Ethernet / Wi-Fi'),
      sp('Portail', 'Portal', 'Victron VRM'),
    ],
    tip: l(
      'Activez les alertes VRM sur la tension haute du bus : c’est le premier signe d’un délesteur qui ne suit plus.',
      'Enable VRM alerts on high bus voltage: it is the first sign of a dump load that can no longer keep up.',
    ),
    video: ['06:00', '16:30'],
  },
  {
    id: 'wiring',
    scene: 'techroom',
    category: 'electrical',
    name: l('Câblage et chemins de câbles', 'Wiring and cable trays'),
    short: l(
      'Câbles dimensionnés, repérés et rangés : la moitié de la fiabilité d’une installation.',
      'Sized, labelled and tidy cables: half of an installation’s reliability.',
    ),
    description: l(
      'Le local de la vidéo est câblé proprement sur panneau OSB, avec goulottes et départs repérés. En 48 V, les courants sont élevés : un câble sous-dimensionné ou une cosse mal sertie chauffe sans que rien ne disjoncte. Chaque section se choisit selon le courant et la longueur, et chaque câble porte un repère à ses deux extrémités.',
      'The room in the video is neatly wired on an OSB board, with trunking and labelled feeders. At 48 V currents are high: an undersized cable or a badly crimped lug heats up without anything tripping. Each cross-section is chosen for its current and length, and every cable is labelled at both ends.',
    ),
    material: l(
      'Câble cuivre souple, cosses tubulaires, goulottes PVC',
      'Flexible copper cable, tubular lugs, PVC trunking',
    ),
    specs: [
      sp('Batteries ↔ onduleur', 'Batteries ↔ inverter', '35 mm²'),
      sp('Turbine et PV', 'Turbine and PV', '6 mm²'),
      sp('Sorties AC', 'AC circuits', '2,5 mm²'),
      sp('Chute de tension visée', 'Target voltage drop', '≤ 3 %'),
    ],
    tip: l(
      'Sertissez les grosses cosses à la pince hydraulique, jamais au marteau, et vérifiez chaque sertissage en tirant fort dessus.',
      'Crimp large lugs with a hydraulic crimper, never with a hammer, and test each crimp by pulling hard on it.',
    ),
    video: ['16:30', '18:00'],
  },
];

// ---------------------------------------------------------------------------
// Detailed Coanda intake (dedicated 3D view)

const INTAKE_PARTS: PartInfo[] = [
  {
    id: 'in-weir',
    scene: 'intake',
    category: 'site',
    name: l('Seuil en pierres sèches', 'Dry-stone weir'),
    short: l(
      'Petit barrage qui crée une retenue au niveau constant en amont de la grille.',
      'Small dam that holds a constant-level pond upstream of the screen.',
    ),
    description: l(
      'Le seuil relève légèrement le niveau du ruisseau pour former une petite retenue : l’eau arrive ainsi calme et régulière sur la prise d’eau, quel que soit le débit. Il est monté en pierres plates locales, sans béton, ce qui le rend facile à réparer après une crue. Sa crête est calée juste sous le bord de la plaque d’accélération : tout le débit du ruisseau passe d’abord sur la grille, le surplus repart vers l’aval.',
      'The weir raises the stream a little to form a small pond, so the water reaches the intake calm and steady whatever the flow. It is built from local flat stones without concrete, which makes it easy to repair after a flood. Its crest sits just below the lip of the acceleration plate: the whole stream flows over the screen first and the surplus carries on downstream.',
    ),
    material: l('Pierres plates (ardoise, schiste) posées à sec', 'Flat stones (slate, schist) laid dry'),
    specs: [
      sp('Hauteur', 'Height', l('≈ 30 à 50 cm', '≈ 30 to 50 cm')),
      sp('Rôle', 'Role', l('Niveau constant, alimentation de la grille', 'Constant level, feeds the screen')),
      sp(
        'Débit réservé',
        'Residual flow',
        l('Laisser passer le débit minimum biologique', 'Let the minimum ecological flow through'),
      ),
    ],
    maintenance: l(
      'Après chaque crue, remettez en place les pierres déplacées et retirez les branches coincées.',
      'After each flood, put displaced stones back and remove jammed branches.',
    ),
    tip: l(
      'En France, un seuil dans un cours d’eau relève de la police de l’eau : déclarez-le à la DDT avant de le construire.',
      'In France a weir in a stream falls under water regulations: declare it to the DDT before building it.',
    ),
    video: ['13:25'],
  },
  {
    id: 'in-frame',
    scene: 'intake',
    category: 'structure',
    name: l('Caisson et cadre bois', 'Wooden box frame'),
    short: l(
      'Porte la grille et le bac, ancré dans le seuil.',
      'Carries the screen and the trough, anchored in the weir.',
    ),
    description: l(
      'Un cadre en planches épaisses et poteaux d’angle tient la grille à la bonne inclinaison et protège le bac de collecte des chocs. Dans la vidéo, il est en bois, assemblé avec des équerres galvanisées : facile à fabriquer sur place et à remplacer. Il doit être bien calé et étanche au contact du seuil pour que l’eau ne contourne pas la grille.',
      'A frame of thick planks and corner posts holds the screen at the right angle and shields the collection trough from knocks. In the video it is wooden, assembled with galvanised brackets: easy to make on site and to replace. It must be firmly bedded and sealed against the weir so water cannot bypass the screen.',
    ),
    material: l(
      'Mélèze ou douglas, équerres et boulons galvanisés',
      'Larch or Douglas fir, galvanised brackets and bolts',
    ),
    specs: [
      sp('Largeur', 'Width', l('≈ 0,7 m', '≈ 0.7 m')),
      sp('Fixation', 'Fixing', l('Boulons M10 galvanisés', 'Galvanised M10 bolts')),
      sp('Durée de vie', 'Service life', l('10 à 15 ans en bois de classe 3–4', '10 to 15 years in class 3–4 timber')),
    ],
    tip: l(
      'Évitez le bois traité au cuivre en contact direct avec l’eau de boisson ou une zone sensible : le mélèze brut tient très bien.',
      'Avoid copper-treated timber in direct contact with drinking water or a sensitive area: untreated larch lasts very well.',
    ),
    video: ['13:25'],
  },
  {
    id: 'in-ramp',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Plaque d’accélération', 'Acceleration plate'),
    short: l(
      'Lèvre inox pleine qui transforme l’eau calme en une lame mince et rapide.',
      'Solid stainless lip that turns calm water into a thin, fast sheet.',
    ),
    description: l(
      'Avant d’atteindre la grille, l’eau dévale une courte plaque pleine et courbe. Elle s’y accélère et s’amincit en une lame régulière, collée à la surface par l’effet Coanda. C’est cette vitesse qui rend la grille efficace : chaque fil profilé « tranche » la couche inférieure de la lame, tandis que le reste continue sa course en emportant les débris.',
      'Before reaching the screen, the water runs down a short, solid, curved plate. It speeds up and thins into an even sheet that clings to the surface through the Coanda effect. That speed is what makes the screen work: each wedge wire "slices" the bottom layer of the sheet while the rest carries on, taking the debris with it.',
    ),
    material: l('Inox 304, 2 mm, cintré', 'Bent 2 mm 304 stainless'),
    specs: [
      sp('Longueur', 'Length', l('≈ 15 cm', '≈ 15 cm')),
      sp('Vitesse en bas de plaque', 'Speed at the bottom', l('≈ 1,5 à 2,5 m/s', '≈ 1.5 to 2.5 m/s')),
    ],
    video: ['13:25'],
  },
  {
    id: 'in-screen',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Grille Coanda en fil profilé', 'Wedge-wire Coanda screen'),
    short: l(
      'Fils inox triangulaires espacés de 1 mm, légèrement inclinés : l’eau passe, les feuilles glissent.',
      'Triangular stainless wires 1 mm apart, slightly tilted: water goes through, leaves slide off.',
    ),
    description: l(
      'La grille est faite de fils de section triangulaire posés en travers du courant, pointe vers le bas, avec une fente de 1 mm. Chaque fil est incliné de quelques degrés : son arête amont dépasse légèrement et découpe une fine couche d’eau qui plonge dans la fente, puis s’élargit vers le bas (pas de bouchage). Les particules plus grosses que la fente, feuilles et graviers, restent dans la lame rapide et sont évacuées au bout : la grille est autonettoyante. Selon Sylvain, même couverte de débris, elle laisse passer l’eau sans problème.',
      'The screen is made of triangular-section wires laid across the flow, point down, with a 1 mm slot. Each wire is tilted a few degrees: its upstream edge sticks up slightly and slices off a thin layer of water that dives into the slot, which then widens downwards (no clogging). Particles bigger than the slot, leaves and grit, stay in the fast sheet and are carried off at the end: the screen cleans itself. According to Sylvain, even covered in debris it still lets water through.',
    ),
    material: l(
      'Fil profilé inox 304/316 soudé sur barres support',
      '304/316 stainless wedge wire welded on support rods',
    ),
    specs: [
      sp('Fente', 'Slot', '1 mm'),
      sp('Profil', 'Profile', l('Fil triangulaire ≈ 2 mm, pointe en bas', 'Triangular wire ≈ 2 mm, point down')),
      sp('Inclinaison des fils', 'Wire tilt', l('3 à 5°', '3 to 5°')),
      sp('Rayon de courbure', 'Curvature radius', l('≈ 1 m', '≈ 1 m')),
      sp(
        'Capacité indicative',
        'Typical capacity',
        l('50 à 140 L/s par mètre de largeur', '50 to 140 L/s per metre of width'),
      ),
    ],
    maintenance: l(
      'Un coup de brosse par trimestre suffit d’après la vidéo ; plus souvent à l’automne, quand les feuilles tombent.',
      'A brush stroke once a quarter is enough according to the video; more often in autumn when leaves fall.',
    ),
    tip: l(
      'Ne retournez jamais la grille : les fils doivent présenter leur face plate vers le haut et leur arête amont en saillie.',
      'Never fit the screen upside down: the wires must show their flat face up with the upstream edge proud.',
    ),
    video: ['13:25', '13:52'],
  },
  {
    id: 'in-box',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Bac de collecte', 'Collection trough'),
    short: l(
      'Reçoit l’eau filtrée sous la grille et sert de petit réservoir tampon.',
      'Catches the filtered water under the screen and acts as a small buffer tank.',
    ),
    description: l(
      'Sous la grille, un bac étanche récupère l’eau filtrée. Son volume amortit les variations de débit pendant quelques dizaines de secondes. Tant que le ruisseau apporte plus que ce que la turbine consomme, le bac reste plein et la grille déborde au bout. Si la turbine demande plus que le ruisseau, le niveau baisse jusqu’à découvrir la sortie : l’air entre dans la conduite et la production s’effondre.',
      'Under the screen, a watertight trough collects the filtered water. Its volume smooths flow changes over a few tens of seconds. As long as the stream brings more than the turbine uses, the trough stays full and the screen overflows at its end. If the turbine asks for more than the stream gives, the level drops until the outlet is uncovered: air enters the penstock and output collapses.',
    ),
    material: l('Inox 304 ou PEHD soudé', '304 stainless or welded HDPE'),
    specs: [
      sp('Volume', 'Volume', l('≈ 40 à 60 L', '≈ 40 to 60 L')),
      sp('Rôle', 'Role', l('Tampon, mise en charge de la conduite', 'Buffer, keeps the penstock primed')),
    ],
    video: ['13:52', '14:10'],
  },
  {
    id: 'in-overflow',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Trop-plein et glissière à débris', 'Overflow and debris chute'),
    short: l(
      'Le bout de la grille, par où repartent le surplus d’eau et les feuilles.',
      'The end of the screen, where surplus water and leaves leave.',
    ),
    description: l(
      'Tout ce que la grille ne capte pas, eau en excès, feuilles et graviers, glisse jusqu’au bout et retombe dans le lit du ruisseau. Sylvain insiste : il faut toujours voir un léger débordement. Un bout de grille sec signifie que la turbine prélève tout le débit, que le bac va se vider et que de l’air finira dans la conduite. Ce débordement permanent laisse aussi de l’eau au ruisseau en aval.',
      'Whatever the screen does not catch, surplus water, leaves and grit, slides to the end and drops back into the stream bed. Sylvain insists: you must always see a slight overflow. A dry screen end means the turbine is taking the whole flow, the trough will empty and air will end up in the pipe. This permanent overflow also leaves water in the stream downstream.',
    ),
    material: l('Inox, lèvre pliée', 'Stainless, folded lip'),
    specs: [
      sp('Règle d’exploitation', 'Operating rule', l('Toujours un léger débordement', 'Always a slight overflow')),
      sp('Évacue', 'Carries off', l('Feuilles, brindilles, graviers > 1 mm', 'Leaves, twigs, grit > 1 mm')),
    ],
    tip: l(
      'Si le débordement disparaît en été, réduisez la buse ou fermez l’injecteur variable plutôt que de laisser l’air entrer.',
      'If the overflow disappears in summer, use a smaller nozzle or close the variable injector rather than letting air in.',
    ),
    video: ['14:04', '14:16'],
  },
  {
    id: 'in-sandtrap',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Dessableur et vanne de purge', 'Sand trap and flush valve'),
    short: l(
      'Fosse au point bas du bac où se dépose le sable fin, vidée par une vanne.',
      'Pit at the low point of the trough where fine sand settles, emptied through a valve.',
    ),
    description: l(
      'Le sable plus fin que 1 mm traverse la grille. Dans le bac, l’eau ralentit et ce sable se dépose dans une petite fosse au point bas. Une vanne de purge permet de la vider en quelques secondes. C’est important : un jet à 37 m/s chargé de sable use très vite la pointe de l’injecteur et l’arête des augets.',
      'Sand finer than 1 mm goes through the screen. In the trough the water slows down and this sand settles in a small pit at the low point. A flush valve empties it in a few seconds. This matters: a 37 m/s jet loaded with sand wears the injector tip and the bucket splitters very quickly.',
    ),
    material: l('Inox, vanne quart de tour PVC DN32', 'Stainless, DN32 PVC quarter-turn valve'),
    specs: [
      sp('Vanne', 'Valve', 'DN32'),
      sp(
        'Fréquence de purge',
        'Flush interval',
        l('À chaque visite, et après les crues', 'At every visit and after floods'),
      ),
    ],
    maintenance: l(
      'Ouvrez la purge quelques secondes à chaque nettoyage de grille, et toujours après une crue.',
      'Open the flush for a few seconds at every screen cleaning, and always after a flood.',
    ),
  },
  {
    id: 'in-outlet',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Crépine et départ de conduite', 'Strainer and penstock start'),
    short: l(
      'Sortie immergée du bac, crépine perforée, traversée de paroi et réduction vers le PEHD Ø63.',
      'Submerged trough outlet, perforated strainer, bulkhead fitting and reducer to the Ø63 HDPE.',
    ),
    description: l(
      'L’eau quitte le bac par une crépine perforée, dernier filet de sécurité contre une feuille passée par-dessus le cadre. La sortie doit rester bien immergée : trop près de la surface, un vortex aspire de l’air dans la conduite. Une traversée de paroi étanche puis une réduction raccordent ensuite le PEHD Ø63 PN10 de la conduite forcée, qui part avec une pente continue, sans point haut.',
      'Water leaves the trough through a perforated strainer, a last safety net against a leaf that got over the frame. The outlet must stay well submerged: too close to the surface, a vortex draws air into the pipe. A watertight bulkhead fitting and a reducer then connect the Ø63 PN10 HDPE penstock, which leaves with a continuous slope and no high point.',
    ),
    material: l('Crépine inox, traversée PVC, PEHD PE100', 'Stainless strainer, PVC bulkhead, PE100 HDPE'),
    specs: [
      sp('Conduite', 'Pipe', l('PEHD Ø63 PN10, 55 mm intérieur', 'HDPE Ø63 PN10, 55 mm bore')),
      sp('Immersion de la sortie', 'Outlet submergence', l('≥ 2 × le diamètre', '≥ 2 × the diameter')),
      sp('Perforations', 'Perforations', l('≈ 3 mm', '≈ 3 mm')),
    ],
    tip: l(
      'Faites partir la conduite en descente dès la sortie du bac : un point haut près de la prise est un piège à air.',
      'Make the pipe go downhill straight out of the trough: a high point near the intake is an air trap.',
    ),
    video: ['01:18', '14:16'],
  },
  {
    id: 'in-vent',
    scene: 'intake',
    category: 'hydraulic',
    name: l('Évent (reniflard)', 'Air vent (breather)'),
    short: l(
      'Tube vertical qui laisse s’échapper l’air au départ de la conduite.',
      'Vertical pipe that lets air escape at the start of the penstock.',
    ),
    description: l(
      'Juste après le bac, un tube vertical monte au-dessus du niveau d’eau. Au remplissage, il évacue l’air chassé par l’eau. En marche, il laisse sortir les bulles entraînées. Il casse aussi le vide si la conduite se vide brutalement, par exemple si la turbine demande trop : la conduite ne s’écrase pas et se réamorce plus facilement.',
      'Just after the trough, a vertical pipe rises above the water level. During filling it lets out the air pushed by the water. In operation it releases entrained bubbles. It also breaks the vacuum if the pipe drains suddenly, for example when the turbine asks too much: the pipe does not collapse and primes again more easily.',
    ),
    material: l('Tube PVC Ø32 + chapeau anti-feuilles', 'Ø32 PVC pipe + leaf cap'),
    specs: [
      sp('Hauteur', 'Height', l('Au-dessus du niveau maxi du bac', 'Above the trough’s top level')),
      sp('Diamètre', 'Diameter', 'Ø32'),
    ],
    upgrade: l(
      'En V2, une ventouse automatique sur le col de cygne de la turbine complète l’évent de la prise d’eau.',
      'In V2 an automatic air valve on the turbine gooseneck complements the intake vent.',
    ),
  },
  {
    id: 'in-brush',
    scene: 'intake',
    category: 'structure',
    name: l('Brosse de nettoyage', 'Cleaning brush'),
    short: l(
      'Laissée sur place : un coup de brosse par trimestre suffit.',
      'Left on site: a brush stroke once a quarter is enough.',
    ),
    description: l(
      'Dans la vidéo, le propriétaire a laissé une brosse à côté de la grille. Grâce à l’autonettoyage, l’entretien se résume à passer la brosse de temps en temps pour décoller les feuilles plaquées et le biofilm, environ une fois par trimestre, et à ouvrir la purge du dessableur.',
      'In the video the owner left a brush next to the screen. Thanks to self-cleaning, maintenance comes down to brushing now and then to lift stuck leaves and biofilm, about once a quarter, and opening the sand-trap flush.',
    ),
    material: l('Manche bois, poils nylon raides', 'Wooden handle, stiff nylon bristles'),
    specs: [sp('Fréquence', 'Interval', l('≈ 1 fois par trimestre', '≈ once a quarter'))],
    tip: l(
      'Brossez dans le sens du courant, jamais en travers des fils : on garde les arêtes vives.',
      'Brush along the flow, never across the wires: it keeps the edges sharp.',
    ),
    video: ['13:52'],
  },
];

// ---------------------------------------------------------------------------

export const PARTS: PartInfo[] = [
  ...TURBINE_STRUCTURE,
  ...TURBINE_ROTATING,
  ...TURBINE_ELECTRICAL,
  ...TURBINE_HYDRAULIC,
  ...TURBINE_V1,
  ...TURBINE_V2,
  ...SITE_PARTS,
  ...INTAKE_PARTS,
  ...TECHROOM_PARTS,
];
