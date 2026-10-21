// Turbine assembly guide: 19 steps. The `id` and `parts` of every step drive the 3D build
// animation — keep the mapping unchanged. `v2` describes OUR industrialised variant.

import type { GuideStep } from './types';
import { l } from '../i18n';

const ASSEMBLY_1: GuideStep[] = [
  {
    id: 'kit',
    title: l('Préparer le kit et l’atelier', 'Prepare the kit and the workspace'),
    text: l(
      'Étalez toutes les pièces sur un établi propre et pointez-les sur la nomenclature : pièces imprimées, plaques de PMMA, capot aluminium, roulements, joints et visserie inox. Vérifiez que le jeu d’**augets** correspond bien au diamètre de l’injecteur prévu (6 ou 8 mm). Triez la visserie par taille dans des barquettes.',
      'Lay every part out on a clean bench and tick it off the bill of materials: printed parts, PMMA plates, aluminium cover, bearings, seals and stainless fasteners. Check that the **bucket** set matches the planned injector diameter (6 or 8 mm). Sort the fasteners by size into trays.',
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
      'Pesez les 22 augets dès maintenant et appariez-les deux à deux à ±0,5 g : vous les monterez en vis-à-vis à l’étape de la roue.',
      'Weigh the 22 buckets now and pair them within ±0.5 g: they will be fitted opposite each other at the runner step.',
    ),
    duration: '30 min',
    v2: {
      text: l(
        'Le kit V2 arrive en caisses numérotées : chaque pièce porte un QR code qui renvoie à sa fiche, à sa référence de rechange et à ce guide. Les gabarits (auget, alignement des paliers) et le tableau des couples de serrage sont fournis.',
        'The V2 kit arrives in numbered crates: every part carries a QR code linking to its data sheet, its spare-part number and this guide. The jigs (bucket, bearing alignment) and the torque table are included.',
      ),
    },
  },
  {
    id: 'support',
    title: l('Monter le support', 'Set up the stand'),
    text: l(
      'Installez les **tréteaux** de part et d’autre du canal de fuite et posez les deux madriers dessus, de niveau. Le socle doit se retrouver à environ 1 m du sol et jamais à moins de 30 à 40 cm au-dessus de l’eau, pour que celle-ci quitte la roue librement.',
      'Set the **trestles** on either side of the tailrace and lay the two beams across them, level. The base must end up about 1 m above the ground and never less than 30–40 cm above the water, so that the water can leave the runner freely.',
    ),
    parts: ['trestles'],
    tools: [l('Niveau à bulle, mètre', 'Spirit level, tape measure'), l('Dalles ou cales', 'Paving slabs or shims')],
    tip: l(
      'Posez les pieds sur des dalles : le sol détrempé par le canal de fuite s’affaisse au fil des semaines.',
      'Stand the feet on paving slabs: ground soaked by the tailrace sinks over the weeks.',
    ),
    warning: l(
      'Une turbine qui s’emballe vibre fort : un support instable peut basculer avec 30 kg de machine et une conduite sous pression dessus.',
      'A runaway turbine vibrates hard: an unstable stand can tip over with 30 kg of machine and a pressurised pipe on it.',
    ),
    duration: '30 min',
    v2: {
      text: l(
        'Le **châssis-skid** arrive assemblé. Posez-le sur ses quatre pieds réglables, faites le niveau, ancrez-le au sol et vérifiez la garde de 40 cm sous la roue, intégrée par construction.',
        'The **skid frame** arrives assembled. Stand it on its four levelling feet, level it, anchor it to the ground and check the 40 cm clearance under the runner, built into the design.',
      ),
      parts: ['skid'],
    },
  },
  {
    id: 'base',
    title: l('Poser le socle', 'Fit the base plate'),
    text: l(
      'Posez le **socle** sur les madriers, lumière d’évacuation centrée au-dessus du canal, et bridez-le avec les quatre brides imprimées. Contrôlez le niveau dans les deux sens et l’équerrage en mesurant les diagonales.',
      'Lay the **base plate** on the beams with the water outlet centred over the channel, and clamp it down with the four printed cleats. Check that it is level both ways and square by measuring the diagonals.',
    ),
    parts: ['base'],
    tools: [l('Niveau, mètre', 'Level, tape measure'), l('Visseuse', 'Screwdriver')],
    tip: l(
      'Le socle est la référence de tout le reste : une erreur de niveau ici se retrouve dans l’alignement des trois roulements.',
      'The base is the datum for everything else: a levelling error here ends up in the alignment of the three bearings.',
    ),
    duration: '15 min',
    v2: {
      text: l(
        'Le bac-socle en aluminium se boulonne sur le skid grâce à ses écrous sertis PEM ; ses languettes et encoches positionneront ensuite la cloison et le capot sans mesure.',
        'The aluminium base tray bolts onto the skid through its PEM nuts; its tabs and slots will then locate the partition and the cover without any measuring.',
      ),
    },
  },
  {
    id: 'partition',
    title: l('Installer la cloison étanche', 'Install the watertight partition'),
    text: l(
      'Présentez la **cloison étanche** dans sa feuillure du socle, bien d’équerre, puis fixez-la. Appliquez un cordon continu de MS-polymère sur toute la jonction avec le socle et lissez-le : c’est lui qui empêchera le brouillard de la chambre humide d’atteindre le générateur.',
      'Set the **watertight partition** in its rebate in the base, perfectly square, then fix it. Run a continuous bead of MS polymer along the whole joint with the base and tool it smooth: this is what will keep the wet-chamber mist away from the generator.',
    ),
    parts: ['partition'],
    tools: [l('Pistolet à mastic', 'Caulking gun'), l('Équerre, ruban de masquage', 'Square, masking tape')],
    tip: l(
      'Masquez de part et d’autre du joint avant de mastiquer, lissez, puis retirez le ruban tout de suite : le cordon sera net.',
      'Mask both sides of the joint before sealing, tool the bead, then pull the tape straight away: you get a clean line.',
    ),
    warning: l(
      'Pas de silicone acétique ni de cyanoacrylate au contact du PMMA : leurs vapeurs font fissurer la plaque.',
      'No acetic silicone or cyanoacrylate in contact with PMMA: their fumes make the plate craze and crack.',
    ),
    duration: '20 min (+24 h)',
    v2: {
      text: l(
        'La cloison V2 s’emboîte par ses tenons dans les encoches du bac et se serre sur un joint EPDM par quatre vis : ni colle, ni temps de séchage, et elle se démonte.',
        'The V2 partition keys into the tray slots with its tabs and is clamped onto an EPDM gasket by four screws: no glue, no curing time, and it can be taken apart.',
      ),
    },
  },
  {
    id: 'bearings',
    title: l('Monter le palier et les roulements', 'Fit the bearing housing and bearings'),
    text: l(
      'Pressez les **roulements 1 et 2** dans le **palier principal** en appuyant uniquement sur la bague extérieure, celle qui est ajustée serrée : l’effort ne doit jamais traverser les billes. Glissez l’entretoise entre eux, puis fixez le palier à travers la cloison avec ses six vis M6.',
      'Press **bearings 1 and 2** into the **main bearing housing** by pushing only on the outer ring, the one with the tight fit: the force must never go through the balls. Slide the spacer between them, then fix the housing through the partition with its six M6 screws.',
    ),
    parts: ['bearing-block', 'bearing-1', 'bearing-2'],
    tools: [
      l('Presse ou tige filetée + rondelles épaisses', 'Press or threaded rod + thick washers'),
      l('Douille au diamètre de la bague extérieure', 'Socket matching the outer ring'),
      l('Clé dynamométrique', 'Torque wrench'),
    ],
    tip: l(
      'Passez les roulements une demi-heure au congélateur : ils se contractent de quelques centièmes et entrent sans forcer.',
      'Put the bearings in the freezer for half an hour: they shrink by a few hundredths of a millimetre and slide in without force.',
    ),
    warning: l(
      'Ne frappez jamais un roulement au marteau, et surtout pas sur la bague extérieure quand vous le montez sur l’arbre : les billes marquent les pistes et le roulement est perdu, même s’il tourne encore.',
      'Never hammer a bearing, and above all never on the outer ring when fitting it onto a shaft: the balls dent the raceways and the bearing is ruined, even if it still turns.',
    ),
    torque: '3 N·m (M6)',
    duration: '30 min',
    v2: {
      text: l(
        'La **cartouche de palier** arrive prémontée, graissée et contrôlée à l’atelier : engagez-la dans l’alésage de la cloison et fixez sa bride par quatre vis M6. Aucun roulement n’est manipulé sur place.',
        'The **bearing cartridge** arrives pre-assembled, greased and checked on the bench: slide it into the partition bore and fix its flange with four M6 screws. No bearing is handled on site.',
      ),
      parts: ['bearing-cartridge', 'bearing-1', 'bearing-2'],
    },
  },
  {
    id: 'shaft',
    title: l('Joint à lèvre et arbre', 'Lip seal and shaft'),
    text: l(
      'Graissez la lèvre du **joint à lèvre** et emmanchez-le côté humide, lèvre principale tournée vers la roue. Enfilez ensuite l’**arbre** depuis la chambre sèche à travers les deux roulements, en poussant sur les bagues intérieures, jusqu’à la butée.',
      'Grease the lip of the **lip seal** and press it in on the wet side, main lip facing the runner. Then slide the **shaft** in from the dry chamber through both bearings, pushing on the inner rings, until it reaches its shoulder.',
    ),
    parts: ['shaft', 'seal'],
    tools: [
      l('Douille d’emmanchement pour le joint', 'Seal driver or socket'),
      l('Graisse silicone', 'Silicone grease'),
      l('Ruban adhésif', 'Adhesive tape'),
    ],
    tip: l(
      'Couvrez la rainure de clavette et le filetage d’un tour de ruban adhésif : leurs arêtes vives coupent la lèvre au passage.',
      'Wrap the keyway and the thread with a turn of adhesive tape: their sharp edges cut the lip on the way through.',
    ),
    duration: '20 min',
    v2: {
      text: l(
        'Le joint double lèvre est déjà dans la cartouche, protégé par le V-ring et la chicane. On enfile l’arbre avec la douille conique de montage fournie, qui protège la lèvre.',
        'The double-lip seal is already inside the cartridge, shielded by the V-ring and the labyrinth. The shaft goes in with the supplied tapered fitting sleeve, which protects the lip.',
      ),
    },
  },
  {
    id: 'wheel',
    title: l('Assembler la roue Pelton', 'Assemble the Pelton runner'),
    text: l(
      'Posez le **moyeu de roue** à plat et placez les 22 **augets** dans leurs logements, les paires de même masse face à face. Coiffez avec la **bague de serrage**, engagez les 22 vis M4 et serrez en étoile en trois passes : à la main, à 1 N·m, puis au couple final.',
      'Lay the **hub disc** flat and place the 22 **buckets** in their seats, with pairs of equal mass facing each other. Cap them with the **clamping ring**, start the 22 M4 bolts and tighten in a star pattern in three passes: by hand, at 1 N·m, then to final torque.',
    ),
    parts: ['wheel-hub', 'buckets', 'wheel-ring'],
    tools: [
      l('Clé dynamométrique 1–5 N·m', '1–5 N·m torque wrench'),
      l('Clé de 7 et embout hexagonal 3 mm', '7 mm spanner and 3 mm hex bit'),
    ],
    tip: l(
      'Avant le serrage final, vérifiez au réglet que toutes les arêtes d’augets sont au même rayon, à ±0,5 mm près.',
      'Before final tightening, check with a rule that every splitter edge sits at the same radius, within ±0.5 mm.',
    ),
    warning: l(
      'Au-delà de 2 N·m, le PETG s’écrase puis flue : la roue perd son serrage en quelques semaines et les augets prennent du jeu.',
      'Beyond 2 N·m the PETG is crushed and then creeps: the runner loses its clamping within weeks and the buckets work loose.',
    ),
    torque: '2 N·m (M4)',
    duration: '45 min',
    v2: {
      text: l(
        'Les augets du kit V2 sont pesés et numérotés, et un gabarit fixe l’angle et le rayon de chaque pièce pendant le serrage. La bague inox découpée laser ne flue pas, et la roue complète est équilibrée sur banc avant expédition.',
        'The V2 kit buckets are weighed and numbered, and a jig holds the angle and radius of each piece during tightening. The laser-cut stainless ring does not creep, and the finished runner is balanced on a stand before shipping.',
      ),
    },
  },
  {
    id: 'wheel-lock',
    title: l('Bloquer la roue sur l’arbre', 'Lock the runner on the shaft'),
    text: l(
      'Glissez la roue sur l’arbre côté humide avec sa clavette, engagez le **moyeu conique** dans sa bride et serrez alternativement ses deux vis. Vissez l’écrou nylstop en bout d’arbre, puis faites tourner la roue à la main : elle doit tourner rond, sans frotter.',
      'Slide the runner onto the shaft on the wet side with its key, seat the **taper-lock bush** in its flange and tighten its two screws alternately. Screw the nyloc nut onto the shaft end, then spin the runner by hand: it must run true, without rubbing.',
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
    v2: {
      text: l(
        'En V2, la roue et son moyeu conique sont équilibrés ensemble à l’atelier et repérés par rapport à l’arbre : on les remonte dans la même position, sans réglage.',
        'In V2 the runner and its taper bush are balanced together on the bench and marked relative to the shaft: they go back in the same position, with no adjustment.',
      ),
    },
  },
  {
    id: 'stator',
    title: l('Fixer le stator', 'Mount the stator'),
    text: l(
      'Fixez le **stator** sur sa platine dans la chambre sèche, centré sur l’arbre, et amenez les trois phases vers le bornier. Mesurez la résistance entre phases : les trois valeurs doivent être identiques à quelques pourcents près.',
      'Fix the **stator** on its mounting plate in the dry chamber, centred on the shaft, and route the three phase leads towards the terminal block. Measure the phase-to-phase resistance: the three readings must agree within a few percent.',
    ),
    parts: ['stator'],
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
    v2: {
      text: l(
        'La sonde CTN est déjà noyée dans le bobinage V2. On fixe en plus les **capteurs** : le capteur à effet Hall face à la cloche, à 2–3 mm de l’aimant cible, et l’on range leurs câbles blindés à l’écart des phases.',
        'The NTC probe is already embedded in the V2 winding. The **sensors** are added here: the Hall-effect sensor facing the bell, 2–3 mm from the target magnet, with their shielded cables routed away from the phase leads.',
      ),
      parts: ['stator', 'sensors'],
    },
  },
];

const ASSEMBLY_2: GuideStep[] = [
  {
    id: 'rotor',
    title: l('Poser le rotor à aimants', 'Fit the magnet rotor'),
    text: l(
      'Vérifiez à la boussole que les 14 **aimants** alternent bien nord et sud, puis descendez la **cloche du rotor** sur l’arbre, au-dessus du stator. Guidez-la avec une tige filetée et un écrou, jamais à mains nues, jusqu’en butée, puis contrôlez l’entrefer avec des cales en laiton.',
      'Check with a compass that the 14 **magnets** alternate north and south, then lower the **rotor bell** onto the shaft, over the stator. Guide it down with a threaded rod and a nut, never by hand, until it seats, then check the air gap with brass feeler shims.',
    ),
    parts: ['rotor', 'magnets'],
    tools: [
      l('Tige filetée + écrou de guidage', 'Threaded rod + guide nut'),
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
    v2: {
      text: l(
        'En V2, un outil de pose à vis fourni descend le rotor sur le stator en douceur, et la cloche a été équilibrée avec la roue : il suffit de respecter le repère d’orientation gravé.',
        'In V2 a supplied screw-driven fitting tool lowers the rotor over the stator smoothly, and the bell has been balanced together with the runner: just follow the engraved orientation mark.',
      ),
    },
  },
  {
    id: 'wiring',
    title: l('Câbler le redresseur', 'Wire the rectifier'),
    text: l(
      'Montez le **pont redresseur** sur son dissipateur avec une fine couche de pâte thermique, raccordez les trois phases à ses entrées alternatives et sa sortie continue au **bornier**. Sertissez un embout sur chaque fil et repérez clairement le + et le −.',
      'Mount the **rectifier** on its heatsink with a thin layer of thermal paste, connect the three phases to its AC inputs and its DC output to the **terminal block**. Crimp a ferrule on every wire and mark + and − clearly.',
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
    v2: {
      text: l(
        'En V2, un faisceau précâblé à connecteurs détrompés relie stator, redresseur et bornier : impossible d’inverser une phase ou une polarité. Le redresseur est placé sur un dissipateur plus grand, dans le flux d’air du rotor.',
        'In V2 a pre-made harness with keyed connectors links stator, rectifier and terminal block: a phase or polarity cannot be swapped. The rectifier sits on a larger heatsink, in the rotor’s airflow.',
      ),
    },
  },
  {
    id: 'window',
    title: l('Poser la vitre avant', 'Fit the front window'),
    text: l(
      'Collez le **joint** EPDM sur le pourtour de la façade, raccord placé en haut. Posez la **vitre avant** et serrez ses vis M5 en croix, juste assez pour comprimer le joint d’environ un quart de son épaisseur.',
      'Stick the EPDM **gasket** around the front face, with the joint at the top. Fit the **front window** and tighten its M5 screws in a cross pattern, just enough to compress the gasket by about a quarter of its thickness.',
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
    v2: {
      text: l(
        'En V2, la vitre est pincée dans un cadre aluminium sur écrous PEM et le joint est un profilé captif : la façade se démonte et se remonte sans changer le joint ni risquer de fissure.',
        'In V2 the window is clamped in an aluminium frame on PEM nuts and the gasket is a captive trim: the front comes off and goes back on without replacing the gasket or risking a crack.',
      ),
    },
  },
  {
    id: 'rear',
    title: l('Panneau arrière et roulement 3', 'Rear panel and bearing 3'),
    text: l(
      'Pressez le **roulement 3** dans le flasque du **panneau arrière**, puis présentez le panneau sur le bout de l’arbre. Serrez ses vis progressivement en faisant tourner l’arbre à la main : il doit rester parfaitement libre jusqu’au serrage final.',
      'Press **bearing 3** into the flange of the **rear panel**, then offer the panel up to the shaft end. Tighten its screws gradually while turning the shaft by hand: it must stay perfectly free right up to final tightening.',
    ),
    parts: ['rear-panel', 'bearing-3'],
    tools: [l('Presse ou tige filetée', 'Press or threaded rod'), l('Clé dynamométrique', 'Torque wrench')],
    tip: l(
      'Si l’arbre durcit pendant le serrage, desserrez, recentrez le panneau dans ses jeux et recommencez : trois roulements mal alignés s’usent les uns les autres en quelques mois.',
      'If the shaft stiffens as you tighten, back off, re-centre the panel within its clearances and start again: three misaligned bearings wear each other out within months.',
    ),
    warning: l(
      'Ne tapez jamais le panneau pour le mettre en place : le choc passe par le roulement 3 et marque ses pistes.',
      'Never tap the panel into place: the shock goes through bearing 3 and dents its raceways.',
    ),
    torque: '3 N·m (M5)',
    duration: '20 min',
    v2: {
      text: l(
        'En V2, le panneau arrière se centre sur deux pions usinés : l’alignement des trois roulements est garanti par construction, sans aucun réglage.',
        'In V2 the rear panel locates on two machined dowels: the alignment of the three bearings is guaranteed by design, with no adjustment at all.',
      ),
    },
  },
  {
    id: 'cover',
    title: l('Fermer le capot', 'Close the cover'),
    text: l(
      'Coiffez l’ensemble avec le **capot aluminium**, en l’engageant d’abord côté façade, puis fixez-le sur le socle et les plaques avec des vis inox A4 et des rondelles nylon. Vérifiez que l’eau qui ruisselle sur le capot ne peut pas couler vers la grille du panneau arrière.',
      'Lower the **aluminium cover** over the assembly, engaging the front edge first, then fix it to the base and plates with A4 stainless screws and nylon washers. Check that rain running off the cover cannot flow towards the rear-panel grille.',
    ),
    parts: ['cover'],
    tools: [l('Visseuse', 'Cordless driver'), l('Graisse anti-grippage', 'Anti-seize compound')],
    tip: l(
      'Une touche d’anti-grippage sur chaque vis inox évite la corrosion galvanique : le capot se démontera encore dans cinq ans.',
      'A dab of anti-seize on every stainless screw prevents galvanic corrosion: the cover will still come off in five years.',
    ),
    torque: '3 N·m (M5)',
    duration: '15 min',
    v2: {
      text: l(
        'En V2, le capot se pose sur ses languettes et se ferme par les quatre **grenouillères** sur le joint captif : pas une vis à serrer, et il s’enlève en dix secondes pour l’entretien.',
        'In V2 the cover drops onto its tabs and is closed by the four **toggle latches** onto the captive gasket: not a single screw to turn, and it comes off in ten seconds for servicing.',
      ),
      parts: ['cover', 'latches'],
    },
  },
  {
    id: 'injectors',
    title: l('Monter les injecteurs', 'Fit the injectors'),
    text: l(
      'Montez l’**injecteur à pointeau** sur la bride du haut et l’**injecteur fixe** imprimé sur le côté. Chaque jet doit frapper l’arête centrale des augets, tangent au cercle primitif de 230 mm : vérifiez-le à travers la vitre en glissant une tige droite dans la buse.',
      'Fit the **spear-valve injector** on the top flange and the printed **fixed injector** on the side. Each jet must strike the buckets’ splitter ridge, tangent to the 230 mm pitch circle: check it through the window by sliding a straight rod into the nozzle.',
    ),
    parts: ['injector-top', 'injector-side'],
    tools: [l('Tige de visée', 'Sighting rod'), l('Joints plats, ruban PTFE', 'Flat gaskets, PTFE tape')],
    tip: l(
      'Un jet décalé de 2 mm par rapport à l’arête coûte plusieurs points de rendement et use un seul côté des augets.',
      'A jet 2 mm off the splitter ridge costs several points of efficiency and wears only one side of the buckets.',
    ),
    duration: '30 min',
    v2: {
      text: l(
        'En V2, les deux injecteurs partagent la même bride normalisée, centrée par un pion : l’alignement du jet est garanti. L’**injecteur à inserts** reçoit la buse de la saison, et le **déflecteur** à ressort est armé sur son axe, retenu par sa gâche électrique.',
        'In V2 both injectors share the same standard flange, located by a dowel: jet alignment is guaranteed. The **insert injector** takes the nozzle for the season, and the spring-loaded **deflector** is cocked on its pivot, held by its electric latch.',
      ),
      parts: ['injector-top', 'injector-quick', 'deflector'],
    },
  },
  {
    id: 'manifold',
    title: l('Assembler la nourrice', 'Assemble the manifold'),
    text: l(
      'Assemblez la **nourrice** en col de cygne : coupe d’équerre, ébavurage, décapant, colle PVC pression, emboîtement d’un seul geste. Montez les deux **vannes de branche**, rouge vers l’injecteur du haut et bleue vers l’injecteur latéral, puis le **manomètre** sur son té, avec du ruban PTFE.',
      'Build the gooseneck **manifold**: square cut, deburr, primer, PVC pressure cement, push home in one stroke. Fit the two **branch valves**, red to the top injector and blue to the side injector, then the **pressure gauge** on its tee, with PTFE tape.',
    ),
    parts: ['manifold', 'valve-branch', 'gauge'],
    tools: [
      l('Coupe-tube PVC, ébavureur', 'PVC pipe cutter, deburrer'),
      l('Décapant et colle PVC pression', 'PVC primer and pressure cement'),
      l('Ruban PTFE', 'PTFE tape'),
    ],
    tip: l(
      'Collez tout la veille de la mise en eau : 24 h de séchage avant la pleine pression.',
      'Do all the solvent welding the day before filling: 24 h of curing before full pressure.',
    ),
    warning: l(
      'Un raccord mal collé lâche brutalement à 7 bar : c’est la panne que Sylvain dit avoir le plus vécue. Personne dans l’axe des raccords lors de la première mise en pression.',
      'A badly glued fitting lets go violently at 7 bar: it is the failure Sylvain says he has had most often. Nobody stands in line with the fittings during the first pressurisation.',
    ),
    duration: '1 h (+24 h)',
    v2: {
      text: l(
        'En V2, la nourrice est livrée assemblée, éprouvée à 1,5 × PN et étiquetée. Une **ventouse automatique** au point haut du col de cygne purge l’air en continu.',
        'In V2 the manifold arrives assembled, pressure-tested at 1.5 × PN and labelled. An **automatic air-release valve** at the high point of the gooseneck bleeds air continuously.',
      ),
      parts: ['manifold', 'valve-branch', 'gauge', 'air-valve'],
    },
  },
  {
    id: 'inlet',
    title: l('Raccorder la conduite forcée', 'Connect the penstock'),
    text: l(
      'Montez la **vanne principale** à l’entrée de la nourrice, en position fermée. Coupez le tube PEHD d’équerre, chanfreinez-le, engagez-le dans le **raccord à compression** jusqu’au repère, puis serrez l’écrou bleu à la main et finissez à la clé à sangle.',
      'Fit the **main valve** at the manifold inlet, in the closed position. Cut the HDPE pipe square, chamfer it, push it into the **compression fitting** up to the mark, then tighten the blue nut by hand and finish with a strap wrench.',
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
    v2: {
      text: l(
        'En V2, la vanne principale est à réducteur : une vingtaine de tours de volant pour l’ouvrir ou la fermer, ce qui rend le coup de bélier impossible, même par mégarde.',
        'In V2 the main valve is gear-operated: about twenty turns of the handwheel to open or close it, which makes water hammer impossible, even by accident.',
      ),
    },
  },
  {
    id: 'cable',
    title: l('Raccorder le câble de sortie', 'Connect the output cable'),
    text: l(
      'Passez le **câble de sortie** 2 × 6 mm² dans le presse-étoupe du panneau arrière, raccordez-le au bornier en respectant + et −, puis serrez le presse-étoupe sur la gaine. À l’autre bout, il arrive dans le coffret de protection DC, sectionneur ouvert.',
      'Feed the 2 × 6 mm² **output cable** through the rear-panel gland, connect it to the terminal block observing + and −, then tighten the gland onto the sheath. At the other end it lands in the DC protection box, with the isolator open.',
    ),
    parts: ['cable'],
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
    v2: {
      text: l(
        'En V2, le câble se branche par un connecteur IP68 détrompé sur le **coffret contrôleur** du skid, qui regroupe disjoncteur DC, parafoudre, relais de surtension et télémesure : inverser + et − devient impossible.',
        'In V2 the cable plugs through a keyed IP68 connector into the skid-mounted **controller box**, which holds the DC breaker, surge arrester, overvoltage relay and telemetry: + and − can no longer be swapped.',
      ),
      parts: ['cable', 'controller-box'],
    },
  },
  {
    id: 'commissioning',
    title: l('Mise en service', 'Commissioning'),
    text: l(
      'Raccordez la charge électrique avant d’ouvrir l’eau : régulateur ou batteries en ligne, délesteur actif. Ouvrez la vanne principale très lentement, vannes de branche fermées, purgez l’air au point haut, et contrôlez environ 7,4 bar statiques pour 76 m de chute. Ouvrez ensuite une vanne de branche puis le pointeau, réglez la tension fixe du régulateur et vérifiez une vitesse proche de 1 500 tr/min. Terminez en simulant des batteries pleines : le délesteur doit prendre le relais sans que la vitesse grimpe.',
      'Connect the electrical load before opening the water: controller or batteries online, dump load active. Open the main valve very slowly with the branch valves closed, bleed the air at the high point, and check about 7.4 bar static for 76 m of head. Then open a branch valve and the spear, set the controller’s fixed voltage and check a speed close to 1,500 rpm. Finish by simulating full batteries: the dump load must take over without the speed climbing.',
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
      'Ne laissez jamais la turbine tourner à vide : sans charge, elle approche le double de sa vitesse nominale et sa tension à vide peut dépasser 100 V. Et toute manœuvre de vanne se fait en au moins 20 secondes.',
      'Never let the turbine run unloaded: without a load it approaches twice its rated speed and its open-circuit voltage can exceed 100 V. And every valve movement takes at least 20 seconds.',
    ),
    duration: '1 h',
    v2: {
      text: l(
        'En V2, la mise en service suit une check-list liée au QR code de la machine : épreuve hydraulique, essai du déflecteur par coupure volontaire de la charge, rodage d’une heure avec relevé de température, puis vérification que pression, vitesse et puissance remontent bien sur le GX.',
        'In V2, commissioning follows a checklist linked to the machine’s QR code: pressure test, deflector trial by deliberately cutting the load, one-hour run-in with temperature readings, then a check that pressure, speed and power show up on the GX.',
      ),
    },
  },
];

export const ASSEMBLY: GuideStep[] = [...ASSEMBLY_1, ...ASSEMBLY_2];
