// V1 (prototype seen in the video) vs V2 (OUR proposal: industrialisable, still DIY-friendly).
// Each row lists the 3D part ids to highlight when it is selected.

import type { UpgradeRow } from './types';
import { l } from '../i18n';

export const UPGRADES: UpgradeRow[] = [
  {
    id: 'frame',
    area: l('Châssis', 'Frame'),
    v1: l(
      'Tréteaux rouges et deux madriers, turbine bridée par des cales imprimées.',
      'Red trestles and two wooden beams, turbine held by printed cleats.',
    ),
    v2: l(
      'Skid boulonné en profilés aluminium 40 × 40, pieds réglables, silentblocs, entonnoir vers le canal de fuite et anneaux de levage.',
      'Bolted skid in 40 × 40 aluminium extrusions, levelling feet, rubber mounts, funnel to the tailrace and lifting eyes.',
    ),
    benefit: l(
      'Installation reproductible, plus de bois qui pourrit, vibrations amorties et 40 cm de chute libre garantis par construction.',
      'Repeatable installation, no rotting timber, damped vibration and 40 cm of free fall guaranteed by design.',
    ),
    diy: l(
      'Profilés rainurés vendus à la coupe, équerres et écrous marteau : une clé Allen suffit. Variante soudée en acier galvanisé.',
      'Slotted extrusions sold cut to length, brackets and T-nuts: a hex key is all you need. Welded galvanised-steel variant possible.',
    ),
    parts: ['skid', 'trestles'],
  },
  {
    id: 'bearings',
    area: l('Paliers', 'Bearings'),
    v1: l(
      'Palier principal imprimé ; roulements pressés et joint posé sur place.',
      'Printed main bearing housing; bearings pressed and seal fitted on site.',
    ),
    v2: l(
      'Cartouche aluminium 6082 tournée : 2 × 6204-2RS, joint double lèvre, V-ring, chicane labyrinthe et graisseur, prémontée à l’atelier.',
      'Turned aluminium 6082 cartridge: 2 × 6204-2RS, double-lip seal, V-ring, labyrinth and grease nipple, pre-assembled on the bench.',
    ),
    benefit: l(
      'Changement de roulements en 10 minutes au lieu de plusieurs heures, plus de fluage du plastique, trois barrières contre l’eau.',
      'Bearing change in 10 minutes instead of hours, no plastic creep, three barriers against water.',
    ),
    diy: l(
      'Une pièce simple pour un petit tour d’établi, ou à commander en usinage en ligne d’après un plan ; roulements et joints restent standard.',
      'A simple part for a bench lathe, or ordered from an online machining service from a drawing; bearings and seals stay standard.',
    ),
    parts: ['bearing-cartridge', 'bearing-block', 'bearing-1', 'bearing-2', 'seal'],
  },
  {
    id: 'sheet-metal',
    area: l('Carter et tôlerie', 'Housing and sheet metal'),
    v1: l(
      'Capot aluminium plié et vissé, plaques PMMA assemblées et jointées au mastic.',
      'Folded aluminium cover screwed on, PMMA plates assembled and sealed with sealant.',
    ),
    v2: l(
      'Tôle découpée laser à languettes et encoches auto-positionnantes, écrous sertis PEM, cloison serrée sur joint EPDM au lieu d’être collée.',
      'Laser-cut sheet with self-locating tabs and slots, PEM self-clinching nuts, partition clamped on an EPDM gasket instead of glued.',
    ),
    benefit: l(
      'Montage sans gabarit ni mesure, carter entièrement démontable, plus de filetage foiré dans l’aluminium.',
      'Assembly with no jig or measuring, fully dismountable housing, no more stripped threads in the aluminium.',
    ),
    diy: l(
      'Fichiers DXF envoyés à un découpeur laser en ligne ; les PEM se posent à l’étau ou à la presse d’établi.',
      'DXF files sent to an online laser-cutting service; PEM nuts are pressed in with a vice or a bench press.',
    ),
    parts: ['cover', 'base', 'partition'],
  },
  {
    id: 'latches',
    area: l('Joints et fermetures', 'Gaskets and latches'),
    v1: l(
      'Capot fixé par une rangée de vis, joint en mousse collé.',
      'Cover held by a row of screws, glued foam gasket.',
    ),
    v2: l(
      'Profilé EPDM captif clipsé sur le chant et quatre grenouillères inox.',
      'Captive EPDM edge trim clipped onto the edge and four stainless toggle latches.',
    ),
    benefit: l(
      'Capot ouvert en dix secondes, sans outil, avec une compression du joint toujours identique : l’entretien est fait plus souvent.',
      'Cover off in ten seconds, without tools, with always the same gasket compression: maintenance gets done more often.',
    ),
    diy: l(
      'Grenouillères et profilés EPDM au mètre se trouvent en accastillage ou en quincaillerie industrielle.',
      'Toggle latches and EPDM trim by the metre are available from marine chandlers or industrial hardware suppliers.',
    ),
    parts: ['latches', 'gasket', 'cover'],
  },
  {
    id: 'injectors',
    area: l('Injecteurs et augets', 'Injectors and buckets'),
    v1: l(
      'Un injecteur fixe imprimé par diamètre, un injecteur à pointeau italien, augets de plusieurs tailles assortis à la main.',
      'One printed fixed injector per diameter, an Italian spear injector, several bucket sizes matched by hand.',
    ),
    v2: l(
      'Corps unique sur bride normalisée, inserts à baïonnette Ø4 à Ø14 mm (le maximum annoncé par le constructeur) à joint torique et code couleur, kit d’augets assorti à chaque insert : jeu S jusqu’à Ø6, jeu L de Ø8 à Ø14.',
      'Single body on a standard flange, O-ring sealed bayonet inserts from Ø4 to Ø14 mm (the maker’s stated maximum) with a colour code, a bucket kit matched to each insert: S set up to Ø6, L set from Ø8 to Ø14.',
    ),
    benefit: l(
      'Adaptation saisonnière en quelques minutes, orifices précis, et impossible de monter une buse avec les mauvais augets.',
      'Seasonal changeover in minutes, precise orifices, and no way to fit a nozzle with the wrong buckets.',
    ),
    diy: l(
      'Inserts tournés en POM ou en laiton sur un petit tour, ou imprimés puis alésés au foret ; le code couleur se fait à la bague imprimée.',
      'Inserts turned from POM or brass on a small lathe, or printed then reamed with a drill bit; the colour code is a printed ring.',
    ),
    parts: ['injector-quick', 'injector-side', 'injector-top', 'buckets'],
  },
  {
    id: 'deflector',
    area: l('Sécurité survitesse', 'Overspeed safety'),
    v1: l(
      'Aucune protection mécanique : la turbine ne compte que sur le délesteur et les batteries pour rester en charge.',
      'No mechanical protection: the turbine relies only on the dump load and the batteries to stay loaded.',
    ),
    v2: l(
      'Déflecteur de jet à ressort retenu par une gâche 12 V à manque de courant : il bascule en moins de 0,5 s sur surtension, survitesse, BMS ouvert ou câble coupé.',
      'Spring-loaded jet deflector held by a fail-safe 12 V latch: it trips in under 0.5 s on overvoltage, overspeed, BMS open or cable cut.',
    ),
    benefit: l(
      'Plus d’emballement possible même si le délesteur lâche, et sans coup de bélier puisque l’eau continue de couler.',
      'No more runaway even if the dump load fails, and no water hammer since the water keeps flowing.',
    ),
    diy: l(
      'Lames en aluminium, deux leviers et une biellette en plat acier, un ressort de traction accroché sur un goujon du flasque arrière, une gâche électrique 12 V à une quinzaine d’euros et un relais.',
      'Aluminium blades, two levers and a link rod cut from steel flat bar, a tension spring hooked on a stud of the rear panel, a 12 V latch solenoid costing about fifteen euros and a relay.',
    ),
    parts: ['deflector', 'controller-box'],
  },
  {
    id: 'telemetry',
    area: l('Capteurs et télémesure', 'Sensors and telemetry'),
    v1: l(
      'Manomètre et afficheur du régulateur, relevés sur place (53,02 V, 9,4 A, 499 W).',
      'Pressure gauge and controller display, read on site (53.02 V, 9.4 A, 499 W).',
    ),
    v2: l(
      'Transmetteur de pression 4–20 mA, capteur de vitesse à effet Hall, CTN dans le stator, ESP32 publiant en MQTT ou vers le GX Victron.',
      '4–20 mA pressure transmitter, Hall-effect speed sensor, NTC in the stator, ESP32 publishing over MQTT or to the Victron GX.',
    ),
    benefit: l(
      'Alertes à distance et maintenance prédictive : une pression qui baisse trahit la grille, une vitesse qui dérive un roulement, une température qui monte un stator.',
      'Remote alerts and predictive maintenance: falling pressure points to the screen, drifting speed to a bearing, rising temperature to the stator.',
    ),
    diy: l(
      'Un ESP32 à 10 €, une soixantaine d’euros de capteurs et un firmware libre type ESPHome.',
      'A 10 € ESP32, about sixty euros of sensors and open-source firmware such as ESPHome.',
    ),
    parts: ['sensors', 'controller-box'],
  },
  {
    id: 'controller',
    area: l('Coffret et connectique', 'Controller box and connectors'),
    v1: l(
      'Bornier dans le carter, câble au presse-étoupe, protections uniquement dans le local technique.',
      'Terminal block inside the housing, cable through a gland, protection only in the technical room.',
    ),
    v2: l(
      'Coffret IP65 sur le skid : disjoncteur DC, parafoudre, relais de surtension pilotant le déflecteur, télémesure, et connecteur IP68 détrompé.',
      'IP65 box on the skid: DC breaker, surge arrester, overvoltage relay driving the deflector, telemetry, and a keyed IP68 connector.',
    ),
    benefit: l(
      'Protection au plus près de la machine, turbine débranchable sans outil, inversion de polarité impossible.',
      'Protection right at the machine, turbine unplugged without tools, reversed polarity impossible.',
    ),
    diy: l(
      'Coffret et appareillage modulaire du commerce, connecteurs circulaires IP68 à visser ; câblage sur rail DIN.',
      'Off-the-shelf enclosure and modular devices, screw-on IP68 circular connectors; wiring on a DIN rail.',
    ),
    parts: ['controller-box', 'cable', 'terminal', 'rectifier'],
  },
  {
    id: 'air-hammer',
    area: l('Air et coup de bélier', 'Air and water hammer'),
    v1: l(
      'Vanne principale quart de tour, aucune purge au point haut du col de cygne (seule la vanne de dérivation, en partie basse, chasse l’air au remplissage) ; des raccords ont déjà « pété ».',
      'Quarter-turn main valve, no bleed at the gooseneck high point (only the low bypass valve flushes air out at filling); fittings have already “blown”.',
    ),
    v2: l(
      'Ventouse automatique au point haut et vanne à réducteur qui demande une vingtaine de tours pour se fermer.',
      'Automatic air-release valve at the high point and a gear-operated valve that takes about twenty turns to close.',
    ),
    benefit: l(
      'Plus de poche d’air ni de fermeture brutale : les deux causes classiques de surpression disparaissent.',
      'No more air pockets or sudden closures: the two classic causes of pressure surges are gone.',
    ),
    diy: l(
      'Ventouse d’irrigation 1/2" à une vingtaine d’euros, vanne papillon ou à boisseau à réducteur DN50 du commerce.',
      'A 1/2" irrigation air valve for about twenty euros, an off-the-shelf DN50 gear-operated butterfly or ball valve.',
    ),
    parts: ['air-valve', 'valve-main', 'valve-bypass', 'manifold'],
  },
  {
    id: 'runner',
    area: l('Équilibrage de la roue', 'Runner balancing'),
    v1: l(
      'Augets imprimés montés à la main, bague de serrage imprimée en PETG (le modèle commercial passe à 26 augets injectés en polymère renforcé).',
      'Printed buckets fitted by hand, printed PETG clamping ring (the commercial model moves to 26 injection-moulded reinforced-polymer buckets).',
    ),
    v2: l(
      'Augets pesés et numérotés, gabarit d’angle et de rayon, bague inox 316L découpée laser, équilibrage de la roue avec le rotor.',
      'Weighed and numbered buckets, angle-and-radius jig, laser-cut 316L stainless ring, runner balanced together with the rotor.',
    ),
    benefit: l(
      'Moins de vibrations, roulements qui durent, serrage qui ne flue plus et rendement identique d’une machine à l’autre.',
      'Less vibration, longer-lasting bearings, clamping that no longer creeps and the same efficiency from one machine to the next.',
    ),
    diy: l(
      'Balance au 0,1 g, gabarit imprimé, banc d’équilibrage statique à deux lames et un peu de pâte à modeler.',
      'A 0.1 g scale, a printed jig, a two-knife-edge static balancing stand and a bit of modelling clay.',
    ),
    parts: ['buckets', 'wheel-hub', 'wheel-ring', 'wheel-lock'],
  },
  {
    id: 'qa',
    area: l('Contrôle qualité', 'Quality control'),
    v1: l(
      'Essais et mises au point sur site, chez un voisin accommodant.',
      'Tests and tuning on site, at an obliging neighbour’s.',
    ),
    v2: l(
      'Épreuve hydraulique à 1,5 × PN pendant une heure, rodage de deux heures consigné (température, bruit, vibrations), tableau des couples et fiche de contrôle signée.',
      'Pressure test at 1.5 × PN for one hour, two-hour logged run-in (temperature, noise, vibration), torque table and a signed inspection sheet.',
    ),
    benefit: l(
      'Les défauts sont trouvés à l’atelier et non chez le client ; chaque machine a son dossier de référence.',
      'Defects are found in the workshop, not at the customer’s; every machine has its reference record.',
    ),
    diy: l(
      'Pompe d’épreuve manuelle à une soixantaine d’euros, manomètre de référence et une fiche papier ou un tableur.',
      'A hand-operated test pump for about sixty euros, a reference gauge and a paper form or spreadsheet.',
    ),
    parts: ['manifold', 'gauge', 'penstock-end'],
  },
  {
    id: 'docs',
    area: l('Documentation et rechanges', 'Documentation and spares'),
    v1: l(
      'Le savoir-faire est dans la tête du constructeur, qui peut refaire chaque pièce.',
      'The know-how lives in the builder’s head; he can remake every part.',
    ),
    v2: l(
      'Chaque pièce numérotée avec un QR code vers sa fiche, son fichier STL ou DXF et sa référence de rechange ; carnet d’entretien fourni.',
      'Every part numbered with a QR code linking to its data sheet, its STL or DXF file and its spare-part number; service logbook supplied.',
    ),
    benefit: l(
      'N’importe quel bricoleur peut entretenir la machine, et les pièces se commandent sans erreur.',
      'Any handy person can service the machine, and parts are ordered without mistakes.',
    ),
    diy: l(
      'Étiquettes QR imprimées, un wiki ou un dépôt de fichiers partagé ; aucun logiciel coûteux.',
      'Printed QR labels, a wiki or a shared file repository; no expensive software.',
    ),
    parts: ['cover', 'bearing-cartridge', 'injector-quick'],
  },
  {
    id: 'thermal',
    area: l('Protection thermique du générateur', 'Generator thermal protection'),
    v1: l(
      'Aucune mesure de température ; l’expérience Motenergy montre que les arrêts-relances répétés font chauffer les stators.',
      'No temperature measurement; the Motenergy experience shows that repeated stop-starts overheat stators.',
    ),
    v2: l(
      'CTN noyée dans le bobinage, alarme et déclenchement du déflecteur au-delà du seuil, relance temporisée pour éviter les cycles arrêt-marche, aimants SH (150 °C) en option.',
      'NTC embedded in the winding, alarm and deflector trip above the threshold, delayed restart to avoid stop-start cycling, optional SH-grade magnets (150 °C).',
    ),
    benefit: l(
      'Le stator et les aimants restent dans leur plage de température : la machine dure aussi longtemps que ses roulements le permettent.',
      'The stator and magnets stay within their temperature range: the machine lasts as long as its bearings allow.',
    ),
    diy: l(
      'Une CTN 10 kΩ à un euro, quelques lignes de firmware, et des aimants N42SH au même format que les N52.',
      'A one-euro 10 kΩ NTC, a few lines of firmware, and N42SH magnets in the same size as the N52s.',
    ),
    parts: ['stator', 'magnets', 'rotor', 'sensors'],
  },
];
