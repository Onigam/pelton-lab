// Turbine assembly guide: 19 steps. The `id` and `parts` of every step drive the 3D build
// animation: every part id must exist in parts.ts and be installed after the part it sits on.

import type { GuideStep } from './types';
import { l } from '../i18n';

const ASSEMBLY_1: GuideStep[] = [
  {
    id: 'kit',
    title: l('Préparer le kit et l’atelier', 'Prepare the kit and the workspace'),
    text: l(
      'Étalez toutes les pièces sur un établi propre et pointez-les sur la nomenclature : pièces imprimées, plaques de PMMA, tôlerie aluminium, cartouche de palier, injecteurs, coffret, joints et visserie inox. Vérifiez que le jeu d’**augets** correspond bien à l’injecteur prévu : jeu S pour les buses jusqu’à Ø6, jeu L pour les buses Ø8 à Ø14. Triez la visserie par taille dans des barquettes. Chaque pièce porte un numéro et un QR code (étiquette imprimée) qui renvoie à sa fiche, à son fichier STL ou DXF et à sa référence de rechange ; les gabarits (auget, alignement des paliers) et le tableau des couples de serrage sont fournis.',
      'Lay every part out on a clean bench and tick it off the bill of materials: printed parts, PMMA plates, aluminium sheet parts, bearing cartridge, injectors, controller box, seals and stainless fasteners. Check that the **bucket** set matches the planned injector: S set for nozzles up to Ø6, L set for Ø8 to Ø14 nozzles. Sort the fasteners by size into trays. Every part carries a number and a QR code (printed label) linking to its data sheet, its STL or DXF file and its spare-part number; the jigs (bucket, bearing alignment) and the torque table are included.',
    ),
    parts: [],
    tools: [
      l('Clés Allen et clés plates', 'Hex keys and spanners'),
      l('Clé dynamométrique 1–25 N·m', '1–25 N·m torque wrench'),
      l('Pied à coulisse, multimètre', 'Calipers, multimeter'),
      l('Balance de cuisine au 0,1 g', 'Kitchen scale reading to 0.1 g'),
      l('Graisse, gants, chiffons', 'Grease, gloves, rags'),
    ],
    tip: l(
      'Pesez les 26 augets dès maintenant et appariez-les deux à deux à ±0,5 g : vous monterez les 13 paires en vis-à-vis à l’étape de la roue.',
      'Weigh the 26 buckets now and pair them within ±0.5 g: the 13 pairs will be fitted opposite each other at the runner step.',
    ),
    duration: '30 min',
  },
  {
    id: 'support',
    title: l('Poser le châssis-skid', 'Set up the skid frame'),
    text: l(
      'Le **châssis-skid** arrive assemblé et réglé. Posez-le sur ses quatre pieds réglables, son entonnoir au-dessus du canal de fuite, mettez-le de niveau puis ancrez-le au sol. Vérifiez que l’eau pourra quitter la roue librement : la garde de 40 cm sous la roue est intégrée par construction, il ne faut jamais moins de 30 à 40 cm entre le socle et l’eau, et le constructeur demande au moins 50 cm entre la turbine et le sol.',
      'The **skid frame** arrives assembled and adjusted. Stand it on its four levelling feet with its funnel over the tailrace, level it, then anchor it to the ground. Check that the water can leave the runner freely: the 40 cm clearance under the runner is built into the design, there must never be less than 30–40 cm between the base and the water, and the maker asks for at least 50 cm between the turbine and the ground.',
    ),
    parts: ['skid'],
    tools: [
      l('Niveau à bulle, mètre', 'Spirit level, tape measure'),
      l('Dalles ou cales', 'Paving slabs or shims'),
      l('Tire-fonds ou piquets', 'Ground screws or stakes'),
    ],
    tip: l(
      'Posez les pieds sur des dalles : le sol détrempé par le canal de fuite s’affaisse au fil des semaines.',
      'Stand the feet on paving slabs: ground soaked by the tailrace sinks over the weeks.',
    ),
    warning: l(
      'Une turbine qui s’emballe vibre fort : un skid mal ancré ou mal calé peut se déplacer, voire basculer, avec une vingtaine de kilos de machine (22 kg pour le modèle commercial) et une conduite sous pression dessus.',
      'A runaway turbine vibrates hard: a badly anchored or badly shimmed skid can walk or even tip over with some twenty kilos of machine (22 kg for the commercial model) and a pressurised pipe on it.',
    ),
    duration: '30 min',
  },
  {
    id: 'base',
    title: l('Poser le socle', 'Fit the base plate'),
    text: l(
      'Boulonnez le **socle** en PMMA noir sur les profilés du skid, lumière d’évacuation centrée au-dessus du canal. Contrôlez le niveau dans les deux sens et l’équerrage en mesurant les diagonales : la cloison et le capot seront ensuite positionnés à partir de lui.',
      'Bolt the black PMMA **base plate** onto the skid extrusions, with the water outlet centred over the channel. Check that it is level both ways and square by measuring the diagonals: the partition and the cover will then be positioned from it.',
    ),
    parts: ['base'],
    tools: [l('Niveau, mètre', 'Level, tape measure'), l('Clé Allen ou visseuse', 'Hex key or screwdriver')],
    tip: l(
      'Le socle est la référence de tout le reste : une erreur de niveau ici se retrouve dans l’alignement des trois roulements.',
      'The base plate is the datum for everything else: a levelling error here ends up in the alignment of the three bearings.',
    ),
    duration: '15 min',
  },
  {
    id: 'partition',
    title: l('Installer la cloison étanche', 'Install the watertight partition'),
    text: l(
      'Présentez la **cloison étanche** sur le socle, bien d’équerre, puis serrez-la sur son joint EPDM avec ses quatre vis : ni colle ni temps de séchage, et elle se démonte sans rien casser. Cette jonction est ce qui empêchera le brouillard de la chambre humide d’atteindre le générateur.',
      'Offer up the **watertight partition** on the base plate, perfectly square, then clamp it on its EPDM gasket with its four screws: no glue, no curing time, and it can be taken apart without breaking anything. This joint is what will keep the wet-chamber mist away from the generator.',
    ),
    parts: ['partition'],
    tools: [l('Équerre', 'Square'), l('Tournevis ou clé Allen', 'Screwdriver or hex key')],
    tip: l(
      'Serrez les quatre vis progressivement et en croix, juste assez pour comprimer le joint : un serrage excessif fait fissurer le PMMA autour des vis.',
      'Tighten the four screws gradually and in a cross pattern, just enough to compress the gasket: over-tightening cracks the PMMA around the screws.',
    ),
    warning: l(
      'Pas de silicone acétique ni de cyanoacrylate au contact du PMMA : leurs vapeurs font fissurer la plaque.',
      'No acetic silicone or cyanoacrylate in contact with PMMA: their fumes make the plate craze and crack.',
    ),
    duration: '20 min',
  },
  {
    id: 'bearings',
    title: l('Monter la cartouche de palier', 'Fit the bearing cartridge'),
    text: l(
      'La **cartouche de palier** arrive prémontée, graissée et contrôlée à l’atelier, avec ses **roulements 1 et 2**. Engagez-la dans l’alésage de la cloison et fixez sa bride par six vis M5. Aucun roulement n’est manipulé sur place.',
      'The **bearing cartridge** arrives pre-assembled, greased and checked on the bench, with its **bearings 1 and 2**. Slide it into the partition bore and fix its flange with six M5 screws. No bearing is handled on site.',
    ),
    parts: ['bearing-cartridge', 'bearing-1', 'bearing-2'],
    tools: [l('Clé dynamométrique', 'Torque wrench'), l('Clé Allen', 'Hex key')],
    tip: l(
      'Serrez les six vis progressivement et en croix, la bride bien à plat contre la cloison : un serrage de travers désaligne les roulements.',
      'Tighten the six screws gradually and in a cross pattern, with the flange flat against the partition: tightening it crooked misaligns the bearings.',
    ),
    warning: l(
      'Ne frappez jamais la cartouche ni un roulement au marteau : le choc passe par les billes, marque les pistes et le roulement est perdu, même s’il tourne encore.',
      'Never hammer the cartridge or a bearing: the shock goes through the balls, dents the raceways and the bearing is ruined, even if it still turns.',
    ),
    torque: '3 N·m (M5)',
    duration: '10 min',
  },
  {
    id: 'shaft',
    title: l('Joint à lèvre et arbre', 'Lip seal and shaft'),
    text: l(
      'Le **joint à lèvre**, à double lèvre, est déjà dans la cartouche, protégé par le V-ring et la chicane labyrinthe : graissez simplement sa lèvre. Enfilez ensuite l’**arbre** depuis la chambre sèche à travers les deux roulements, avec la douille conique de montage fournie qui protège la lèvre, en poussant sur les bagues intérieures, jusqu’à la butée.',
      'The double-lip **lip seal** is already inside the cartridge, shielded by the V-ring and the labyrinth: just grease its lip. Then slide the **shaft** in from the dry chamber through both bearings, using the supplied tapered fitting sleeve that protects the lip, pushing on the inner rings, until it reaches its shoulder.',
    ),
    parts: ['shaft', 'seal'],
    tools: [
      l('Douille conique de montage (fournie)', 'Tapered fitting sleeve (supplied)'),
      l('Graisse silicone', 'Silicone grease'),
      l('Ruban adhésif', 'Adhesive tape'),
    ],
    tip: l(
      'Couvrez la rainure de clavette et le filetage d’un tour de ruban adhésif : leurs arêtes vives coupent la lèvre au passage.',
      'Wrap the keyway and the thread with a turn of adhesive tape: their sharp edges cut the lip on the way through.',
    ),
    duration: '20 min',
  },
  {
    id: 'wheel',
    title: l('Assembler la roue Pelton', 'Assemble the Pelton runner'),
    text: l(
      'Posez le **moyeu de roue** (Ø140) à plat et placez les 26 **augets** pesés et numérotés dans leurs logements, les paires de même masse face à face ; un gabarit fixe l’angle et le rayon de chaque pièce pendant le serrage. Coiffez avec la **bague de serrage**, engagez les 26 vis M4 sur le cercle de Ø124 et serrez en étoile en trois passes : à la main, à 1 N·m, puis au couple final. Équilibrez enfin la roue complète, avec son moyeu conique, sur un banc à deux lames, et repérez sa position par rapport à l’arbre.',
      'Lay the **hub disc** (Ø140) flat and place the 26 weighed and numbered **buckets** in their seats, with pairs of equal mass facing each other; a jig holds the angle and radius of each piece during tightening. Cap them with the **clamping ring**, start the 26 M4 bolts on the Ø124 circle and tighten in a star pattern in three passes: by hand, at 1 N·m, then to final torque. Finally, balance the finished runner together with its taper bush on a two-knife-edge stand, and mark its position relative to the shaft.',
    ),
    parts: ['wheel-hub', 'buckets', 'wheel-ring'],
    tools: [
      l('Clé dynamométrique 1–5 N·m', '1–5 N·m torque wrench'),
      l('Clé de 7 et embout hexagonal 3 mm', '7 mm spanner and 3 mm hex bit'),
      l('Gabarit d’angle et de rayon', 'Angle-and-radius jig'),
    ],
    tip: l(
      'Avant le serrage final, vérifiez au réglet que toutes les pointes d’augets sont sur le même cercle (Ø244 avec le jeu L), à ±0,5 mm près.',
      'Before final tightening, check with a rule that every bucket tip sits on the same circle (Ø244 with the L set), within ±0.5 mm.',
    ),
    warning: l(
      'Au-delà de 2 N·m, le PETG des augets et du moyeu s’écrase puis flue : la roue perd son serrage en quelques semaines et les augets prennent du jeu.',
      'Beyond 2 N·m the PETG of the buckets and hub is crushed and then creeps: the runner loses its clamping within weeks and the buckets work loose.',
    ),
    torque: '2 N·m (M4)',
    duration: '45 min',
  },
  {
    id: 'wheel-lock',
    title: l('Bloquer la roue sur l’arbre', 'Lock the runner on the shaft'),
    text: l(
      'Glissez la roue sur l’arbre côté humide avec sa clavette, en alignant ses repères sur ceux de l’arbre : la roue et son moyeu conique ayant été équilibrés ensemble, ils se remontent toujours dans la même position, sans réglage. Engagez le **moyeu conique** dans sa bride et serrez alternativement ses deux vis. Vissez l’écrou nylstop en bout d’arbre, puis faites tourner la roue à la main : elle doit tourner rond, sans frotter.',
      'Slide the runner onto the shaft on the wet side with its key, lining up its marks with those on the shaft: since the runner and its taper bush were balanced together, they always go back in the same position, with no adjustment. Seat the **taper-lock bush** in its flange and tighten its two screws alternately. Screw the nyloc nut onto the shaft end, then spin the runner by hand: it must run true, without rubbing.',
    ),
    parts: ['wheel-lock'],
    tools: [l('Clé Allen 1/8"', '1/8" hex key'), l('Clé de 24', '24 mm spanner'), l('Comparateur', 'Dial gauge')],
    tip: l(
      'Contrôlez le voile au comparateur posé en bout d’auget : au-delà de 0,3 mm, desserrez le cône, tournez la roue d’un cran et recommencez.',
      'Check axial run-out with a dial gauge at a bucket tip: above 0.3 mm, release the taper, turn the runner one notch and try again.',
    ),
    warning: l(
      'Montez le cône propre et sec : graissé, il se serre trop loin et peut fendre la bride.',
      'Fit the taper clean and dry: if greased, it pulls in too far and can split the flange.',
    ),
    torque: '≈ 6 N·m (Taper-Lock 1108)',
    duration: '20 min',
  },
  {
    id: 'stator',
    title: l('Fixer le stator', 'Mount the stator'),
    text: l(
      'Fixez le **stator** sur sa platine dans la chambre sèche, centré sur l’arbre, et amenez les trois phases vers le bornier ; la sonde CTN est déjà noyée dans le bobinage. Fixez aussi les **capteurs** : le capteur à effet Hall face à la trajectoire de l’aimant cible de la cloche, à 2–3 mm, avec leurs câbles blindés rangés à l’écart des phases. Mesurez la résistance entre phases : les trois valeurs doivent être identiques à quelques pourcents près.',
      'Fix the **stator** on its mounting plate in the dry chamber, centred on the shaft, and route the three phase leads towards the terminal block; the NTC probe is already embedded in the winding. Fit the **sensors** too: the Hall-effect sensor facing the path of the bell’s target magnet, 2–3 mm away, with their shielded cables routed away from the phase leads. Measure the phase-to-phase resistance: the three readings must agree within a few percent.',
    ),
    parts: ['stator', 'sensors'],
    tools: [
      l('Multimètre', 'Multimeter'),
      l('Clés Allen', 'Hex keys'),
      l('Gaine thermorétractable', 'Heat-shrink sleeving'),
    ],
    tip: l(
      'Si vous avez accès à un mégohmmètre, contrôlez l’isolement entre cuivre et tôles : plus de 10 MΩ, sinon un fil a été blessé au bobinage.',
      'If you can borrow an insulation tester, check copper-to-core insulation: above 10 MΩ, otherwise a wire was nicked during winding.',
    ),
    torque: '4 N·m (M5)',
    duration: '30 min',
  },
];

const ASSEMBLY_2: GuideStep[] = [
  {
    id: 'rotor',
    title: l('Poser le rotor à aimants', 'Fit the magnet rotor'),
    text: l(
      'Vérifiez à la boussole que les 14 **aimants** alternent bien nord et sud, puis descendez la **cloche du rotor** sur l’arbre, au-dessus du stator, avec l’outil de pose à vis (une tige filetée et un écrou), jamais à mains nues, jusqu’en butée. La cloche ayant été équilibrée avec la roue, respectez le repère d’orientation gravé. Contrôlez ensuite l’entrefer avec des cales en laiton.',
      'Check with a compass that the 14 **magnets** alternate north and south, then lower the **rotor bell** onto the shaft, over the stator, with the screw-driven fitting tool (a threaded rod and a nut), never by hand, until it seats. Since the bell was balanced together with the runner, follow the engraved orientation mark. Then check the air gap with brass feeler shims.',
    ),
    parts: ['rotor', 'magnets'],
    tools: [
      l('Outil de pose à vis (tige filetée + écrou)', 'Screw-driven fitting tool (threaded rod + nut)'),
      l('Cales en laiton (non magnétiques)', 'Brass (non-magnetic) shims'),
      l('Boussole', 'Compass'),
    ],
    tip: l(
      'Faites tourner le rotor à la main : il doit « cranter » régulièrement sans jamais frotter. Un point dur à chaque tour signale un entrefer décentré.',
      'Turn the rotor by hand: it should cog evenly and never rub. A tight spot once per turn means the air gap is off-centre.',
    ),
    warning: l(
      'Les aimants N52 aspirent la cloche vers le stator avec une force de plusieurs dizaines de kilos : doigts écrasés et aimants éclatés si on la lâche. Éloignez téléphones, cartes bancaires et toute personne portant un stimulateur cardiaque.',
      'The N52 magnets pull the bell onto the stator with a force of several tens of kilos: crushed fingers and shattered magnets if you let go. Keep phones, bank cards and anyone with a pacemaker well away.',
    ),
    torque: '5 N·m (M5)',
    duration: '30 min',
  },
  {
    id: 'wiring',
    title: l('Câbler le redresseur', 'Wire the rectifier'),
    text: l(
      'Montez le **pont redresseur** sur son grand dissipateur, dans le flux d’air du rotor, avec une fine couche de pâte thermique. Raccordez stator, redresseur et **bornier** avec le faisceau précâblé à connecteurs détrompés : impossible d’inverser une phase ou une polarité. Sertissez un embout sur chaque fil raccordé au bornier et repérez clairement le + et le −.',
      'Mount the **rectifier** on its large heatsink, in the rotor’s airflow, with a thin layer of thermal paste. Connect stator, rectifier and **terminal block** with the pre-made harness with keyed connectors: a phase or polarity cannot be swapped. Crimp a ferrule on every wire going to the terminal block and mark + and − clearly.',
    ),
    parts: ['rectifier', 'terminal'],
    tools: [
      l('Pince à sertir et embouts', 'Crimping tool and ferrules'),
      l('Pâte thermique', 'Thermal paste'),
      l('Multimètre', 'Multimeter'),
    ],
    tip: l(
      'Lancez la roue à la main, multimètre sur la sortie continue : quelques volts doivent apparaître. C’est la preuve que les trois phases et le pont sont bien raccordés.',
      'Spin the runner by hand with the multimeter on the DC output: a few volts should appear. It proves that the three phases and the bridge are correctly connected.',
    ),
    warning: l(
      'Un générateur à aimants produit dès qu’il tourne : ne touchez jamais aux bornes quand la roue bouge, même lentement, et encore moins à vide.',
      'A magnet generator produces as soon as it turns: never touch the terminals while the runner is moving, even slowly, let alone unloaded.',
    ),
    torque: '2 N·m',
    duration: '30 min',
  },
  {
    id: 'window',
    title: l('Poser la vitre avant', 'Fit the front window'),
    text: l(
      'Clipsez le **joint** EPDM captif sur le chant de la façade, raccord placé en haut. Posez la **vitre avant** dans son cadre aluminium sur les écrous PEM et serrez ses vis M5 en croix, juste assez pour comprimer le joint d’environ un quart de son épaisseur : la façade se démonte ensuite et se remonte sans changer le joint ni risquer de fissure.',
      'Clip the captive EPDM **gasket** onto the edge of the front face, with the joint at the top. Fit the **front window** in its aluminium frame on the PEM nuts and tighten its M5 screws in a cross pattern, just enough to compress the gasket by about a quarter of its thickness: the front then comes off and goes back on without replacing the gasket or risking a crack.',
    ),
    parts: ['window', 'gasket'],
    tools: [
      l('Eau savonneuse, chiffon doux', 'Soapy water, soft cloth'),
      l('Tournevis ou clé Allen', 'Screwdriver or hex key'),
    ],
    tip: l(
      'Laissez le film de protection sur la vitre jusqu’à la fin du montage, et percez les trous 1 mm plus grands que les vis pour laisser le PMMA se dilater.',
      'Leave the protective film on the window until the build is finished, and drill the holes 1 mm larger than the screws so the PMMA can expand.',
    ),
    warning: l(
      'Un serrage excessif fait fissurer le PMMA en étoile autour des vis, souvent quelques jours plus tard. Jamais d’alcool ni d’acétone pour le nettoyer.',
      'Over-tightening cracks the PMMA in a star around the screws, often a few days later. Never clean it with alcohol or acetone.',
    ),
    torque: '2 N·m (M5)',
    duration: '20 min',
  },
  {
    id: 'rear',
    title: l('Panneau arrière et roulement 3', 'Rear panel and bearing 3'),
    text: l(
      'Pressez le **roulement 3** dans le flasque du **panneau arrière**, puis présentez le panneau sur le bout de l’arbre : il se centre sur ses deux pions usinés, ce qui garantit l’alignement des trois roulements. Serrez ses vis progressivement en faisant tourner l’arbre à la main : il doit rester parfaitement libre jusqu’au serrage final.',
      'Press **bearing 3** into the flange of the **rear panel**, then offer the panel up to the shaft end: it locates on its two machined dowels, which guarantees the alignment of the three bearings. Tighten its screws gradually while turning the shaft by hand: it must stay perfectly free right up to final tightening.',
    ),
    parts: ['rear-panel', 'bearing-3'],
    tools: [l('Presse ou tige filetée', 'Press or threaded rod'), l('Clé dynamométrique', 'Torque wrench')],
    tip: l(
      'Si l’arbre durcit pendant le serrage, desserrez et vérifiez que le panneau est bien en appui sur ses deux pions : trois roulements mal alignés s’usent les uns les autres en quelques mois.',
      'If the shaft stiffens as you tighten, back off and check that the panel is seated properly on its two dowels: three misaligned bearings wear each other out within months.',
    ),
    warning: l(
      'Ne tapez jamais le panneau pour le mettre en place : le choc passe par le roulement 3 et marque ses pistes.',
      'Never tap the panel into place: the shock goes through bearing 3 and dents its raceways.',
    ),
    torque: '3 N·m (M5)',
    duration: '20 min',
  },
  {
    id: 'cover',
    title: l('Fermer le capot', 'Close the cover'),
    text: l(
      'Coiffez l’ensemble avec le **capot aluminium**, en l’engageant d’abord côté façade : il se pose sur ses languettes. Fermez les quatre **grenouillères** sur le joint captif, en réglant le crochet de chacune pour comprimer le joint d’environ un quart : pas une vis à serrer, et le capot s’enlève en dix secondes pour l’entretien. Vérifiez que l’eau qui ruisselle sur le capot ne peut pas couler vers la grille du panneau arrière.',
      'Lower the **aluminium cover** over the assembly, engaging the front edge first: it drops onto its tabs. Close the four **toggle latches** onto the captive gasket, adjusting each hook to compress the gasket by about a quarter: not a single screw to turn, and the cover comes off in ten seconds for servicing. Check that rain running off the cover cannot flow towards the rear-panel grille.',
    ),
    parts: ['cover', 'latches'],
    tools: [
      l('Clé plate', 'Spanner'),
      l('Frein-filet', 'Threadlocker'),
      l('Graisse anti-grippage', 'Anti-seize compound'),
    ],
    tip: l(
      'Une touche d’anti-grippage sur les fixations inox des grenouillères évite la corrosion galvanique : elles se démonteront encore dans cinq ans.',
      'A dab of anti-seize on the stainless fasteners of the latches prevents galvanic corrosion: they will still come off in five years.',
    ),
    duration: '15 min',
  },
  {
    id: 'injectors',
    title: l('Monter les injecteurs', 'Fit the injectors'),
    text: l(
      'Montez l’**injecteur à pointeau** sur la bride du toit plat et l’**injecteur latéral** sur la paroi haute : les deux partagent la même bride normalisée, centrée par un pion, ce qui garantit l’alignement du jet. Chaque jet doit frapper l’arête centrale des augets, tangent au cercle primitif de 190 mm : le jet du haut descend à la verticale à 95 mm de l’axe, le jet latéral arrive à l’horizontale 95 mm sous l’axe. Vérifiez-le à travers la vitre en glissant une tige droite dans la buse. Posez dans l’injecteur latéral l’insert de buse de la saison, avec son kit d’augets assorti, puis armez le **déflecteur** à ressort sur son axe, retenu par sa gâche électrique.',
      'Fit the **spear-valve injector** on the flat-roof flange and the **side injector** on the tall wall: both share the same standard flange, located by a dowel, which guarantees jet alignment. Each jet must strike the buckets’ splitter ridge, tangent to the 190 mm pitch circle: the top jet comes straight down 95 mm from the axis, the side jet arrives horizontally 95 mm below the axis. Check it through the window by sliding a straight rod into the nozzle. Fit the nozzle insert for the season in the side injector, with its matching bucket kit, then cock the spring-loaded **deflector** on its pivot, held by its electric latch.',
    ),
    parts: ['injector-top', 'injector-quick', 'deflector'],
    tools: [l('Tige de visée', 'Sighting rod'), l('Joints plats, ruban PTFE', 'Flat gaskets, PTFE tape')],
    tip: l(
      'Un jet décalé de 2 mm par rapport à l’arête coûte plusieurs points de rendement et use un seul côté des augets.',
      'A jet 2 mm off the splitter ridge costs several points of efficiency and wears only one side of the buckets.',
    ),
    duration: '30 min',
  },
  {
    id: 'manifold',
    title: l('Assembler la nourrice', 'Assemble the manifold'),
    text: l(
      'Assemblez la **nourrice** en col de cygne : coupe d’équerre, ébavurage, décapant, colle PVC pression, emboîtement d’un seul geste. Montez les deux **vannes de branche**, rouge vers l’injecteur du haut et bleue vers l’injecteur latéral, puis le **manomètre** sur son té, avec du ruban PTFE. Entre le té du manomètre et les vannes de branche, comme sur le plan d’injection du constructeur, collez le piquage de la **vanne de dérivation** et sa descente vers le canal de fuite : elle servira à purger l’air et à chasser les sédiments sans faire passer l’eau par la roue. Laissez-la fermée. Posez enfin la **ventouse automatique** au point haut du col de cygne, qui purge l’air en continu, puis, après les 24 h de séchage, éprouvez l’ensemble à 1,5 × PN pendant une heure et étiquetez-le.',
      'Build the gooseneck **manifold**: square cut, deburr, primer, PVC pressure cement, push home in one stroke. Fit the two **branch valves**, red to the top injector and blue to the side injector, then the **pressure gauge** on its tee, with PTFE tape. Between the gauge tee and the branch valves, as on the maker’s injection drawing, glue in the **bypass valve** tee and its drop pipe to the tailrace: it will be used to purge air and flush out sediment without sending water through the runner. Leave it closed. Finally, fit the **automatic air-release valve** at the high point of the gooseneck, which bleeds air continuously, then, after the 24 h cure, pressure-test the whole assembly at 1.5 × PN for one hour and label it.',
    ),
    parts: ['manifold', 'valve-branch', 'gauge', 'valve-bypass', 'air-valve'],
    tools: [
      l('Coupe-tube PVC, ébavureur', 'PVC pipe cutter, deburrer'),
      l('Décapant et colle PVC pression', 'PVC primer and pressure cement'),
      l('Ruban PTFE', 'PTFE tape'),
      l('Pompe d’épreuve manuelle, manomètre de référence', 'Hand test pump, reference gauge'),
    ],
    tip: l(
      'Collez tout la veille de la mise en eau : 24 h de séchage avant la pleine pression.',
      'Do all the solvent welding the day before filling: 24 h of curing before full pressure.',
    ),
    warning: l(
      'Un raccord mal collé lâche brutalement à 7 bar : c’est la panne que Sylvain dit avoir le plus vécue. Personne dans l’axe des raccords lors de la première mise en pression.',
      'A badly glued fitting lets go violently at 7 bar: it is the failure Sylvain says he has had most often. Nobody stands in line with the fittings during the first pressurisation.',
    ),
    duration: '2 h (+24 h)',
  },
  {
    id: 'inlet',
    title: l('Raccorder la conduite forcée', 'Connect the penstock'),
    text: l(
      'Montez la **vanne principale** à réducteur à l’entrée de la nourrice, en position fermée : il faut une vingtaine de tours de volant pour l’ouvrir ou la fermer, ce qui rend le coup de bélier impossible, même par mégarde. Coupez le tube PEHD d’équerre, chanfreinez-le, engagez-le dans le **raccord à compression** jusqu’au repère, puis serrez l’écrou bleu à la main et finissez à la clé à sangle.',
      'Fit the gear-operated **main valve** at the manifold inlet, in the closed position: it takes about twenty turns of the handwheel to open or close it, which makes water hammer impossible, even by accident. Cut the HDPE pipe square, chamfer it, push it into the **compression fitting** up to the mark, then tighten the blue nut by hand and finish with a strap wrench.',
    ),
    parts: ['valve-main', 'penstock-end'],
    tools: [l('Coupe-tube PEHD', 'HDPE pipe cutter'), l('Clé à sangle', 'Strap wrench'), l('Feutre', 'Felt pen')],
    tip: l(
      'Tracez la profondeur d’emboîtement au feutre sur le tube : s’il recule sous la pression, vous le verrez tout de suite.',
      'Mark the insertion depth on the pipe with a felt pen: if it creeps back under pressure, you will see it at once.',
    ),
    warning: l(
      'La vanne principale reste fermée pendant tout le montage : une conduite pleine, c’est 7,4 bar prêts à sortir par le premier raccord ouvert.',
      'The main valve stays closed throughout the build: a full penstock means 7.4 bar ready to blow out of the first open fitting.',
    ),
    duration: '20 min',
  },
  {
    id: 'cable',
    title: l('Raccorder le câble de sortie', 'Connect the output cable'),
    text: l(
      'Passez le **câble de sortie** 2 × 6 mm² dans le presse-étoupe du panneau arrière, raccordez-le au bornier en respectant + et −, puis serrez le presse-étoupe sur la gaine. À l’autre bout, il se branche par un connecteur IP68 détrompé sur le **coffret contrôleur** du skid, qui regroupe disjoncteur DC, parafoudre, relais de surtension et télémesure : inverser + et − devient impossible. De là, la liaison repart vers le coffret de protection DC du local technique, sectionneur ouvert.',
      'Feed the 2 × 6 mm² **output cable** through the rear-panel gland, connect it to the terminal block observing + and −, then tighten the gland onto the sheath. At the other end it plugs through a keyed IP68 connector into the skid-mounted **controller box**, which holds the DC breaker, surge arrester, overvoltage relay and telemetry: + and − can no longer be swapped. From there the run continues to the DC protection box in the technical room, with the isolator open.',
    ),
    parts: ['cable', 'controller-box'],
    tools: [l('Pince à dénuder, pince à sertir', 'Wire stripper, crimper'), l('Clé de presse-étoupe', 'Gland spanner')],
    tip: l(
      'Faites une boucle d’égouttage sous le presse-étoupe : l’eau qui ruisselle le long du câble tombe avant d’atteindre le carter.',
      'Leave a drip loop below the gland: water running down the cable drops off before reaching the housing.',
    ),
    warning: l(
      'Une inversion de polarité sur les batteries met deux diodes du pont en court-circuit franc : le pont, le fusible et parfois le câble y passent.',
      'Reversed polarity on the batteries puts two bridge diodes in a dead short: the bridge, the fuse and sometimes the cable are destroyed.',
    ),
    duration: '20 min',
  },
  {
    id: 'commissioning',
    title: l('Mise en service', 'Commissioning'),
    text: l(
      'La mise en service suit la check-list liée au QR code de la machine. Raccordez la charge électrique avant d’ouvrir l’eau : régulateur ou batteries en ligne, délesteur actif. Vannes de branche fermées et **vanne de dérivation entrouverte**, ouvrez la vanne principale très lentement : l’air et les dépôts sortent par la dérivation. Quand l’eau coule claire et sans bulles, refermez la dérivation lentement, purgez le reste d’air au point haut et contrôlez environ 7,4 bar statiques pour 76 m de chute. Ouvrez ensuite une vanne de branche puis le pointeau, réglez la tension fixe du régulateur et vérifiez une vitesse d’environ 1 700 à 1 900 tr/min (la vidéo cite 1 500 tr/min en moyenne). Testez le déflecteur en coupant volontairement la charge : il doit basculer en moins de 0,5 s, puis se réarme à la main. Terminez en simulant des batteries pleines : le délesteur doit prendre le relais sans que la vitesse grimpe. Laissez tourner une heure en relevant la température, puis vérifiez que pression, vitesse et puissance remontent bien sur le GX.',
      'Commissioning follows the checklist linked to the machine’s QR code. Connect the electrical load before opening the water: controller or batteries online, dump load active. With the branch valves closed and the **bypass valve slightly open**, open the main valve very slowly: air and debris leave through the bypass. Once the water runs clear and bubble-free, close the bypass slowly, bleed any remaining air at the high point and check about 7.4 bar static for 76 m of head. Then open a branch valve and the spear, set the controller’s fixed voltage and check a speed of about 1,700–1,900 rpm (the video quotes 1,500 rpm on average). Trial the deflector by deliberately cutting the load: it must trip in under 0.5 s, then be reset by hand. Finish by simulating full batteries: the dump load must take over without the speed climbing. Let it run for one hour while logging the temperature, then check that pressure, speed and power show up on the GX.',
    ),
    parts: [],
    tools: [
      l('Tachymètre optique', 'Optical tachometer'),
      l('Pince ampèremétrique DC, multimètre', 'DC clamp meter, multimeter'),
      l('Carnet de mise en service', 'Commissioning log'),
    ],
    tip: l(
      'Notez tout : pression statique et en marche, tension, courant, vitesse, température du carter après une heure. Ce sont vos valeurs de référence pour les années à venir.',
      'Log everything: static and running pressure, voltage, current, speed, housing temperature after one hour. These are your reference values for years to come.',
    ),
    warning: l(
      'Ne laissez jamais la turbine tourner à vide : sans charge, elle approche le double de sa vitesse nominale et sa tension à vide peut atteindre 120 à 140 V. Et toute manœuvre de vanne, dérivation comprise, se fait en au moins 20 secondes.',
      'Never let the turbine run unloaded: without a load it approaches twice its rated speed and its open-circuit voltage can reach 120–140 V. And every valve movement, the bypass included, takes at least 20 seconds.',
    ),
    duration: '1 h',
  },
];

export const ASSEMBLY: GuideStep[] = [...ASSEMBLY_1, ...ASSEMBLY_2];
