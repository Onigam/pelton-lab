// Site installation guide: from the survey to the first night of production.
// Part ids refer to the site scene. `v2` describes OUR industrialised variant.

import type { GuideStep } from './types';
import { l } from '../i18n';

export const INSTALL: GuideStep[] = [
  {
    id: 'survey',
    title: l('Mesurer la chute et le débit', 'Measure head and flow'),
    text: l(
      'Tout se dimensionne sur mesure : mesurez la **chute** entre la future prise et l’emplacement de la turbine, et le **débit** du ruisseau à l’étiage. Pour la chute, un altimètre donne un ordre de grandeur, un niveau à eau (tuyau transparent rempli d’eau, avancé par bonds) donne la précision. Pour le débit, détournez tout le ruisseau dans un tuyau et chronométrez le remplissage d’un seau. Avant tout travail, consultez la DDT et l’OFB : en France, utiliser un cours d’eau est réglementé, comme pour les moulins.',
      'Everything is sized to the site: measure the **head** between the future intake and the turbine location, and the stream **flow** at low water. For head, an altimeter gives a rough figure and a water level (a clear hose filled with water, moved forward in steps) gives the precision. For flow, divert the whole stream into a pipe and time how long it takes to fill a bucket. Before any work, contact the DDT and the OFB: in France, using a watercourse is regulated, just as for mills.',
    ),
    parts: [],
    tools: [
      l('Seau gradué de 10 à 20 L, chronomètre', '10–20 L graduated bucket, stopwatch'),
      l('Tuyau cristal de 20–30 m ou altimètre', '20–30 m clear hose or altimeter'),
      l('Décamètre, carnet', 'Long tape, notebook'),
    ],
    tip: l(
      'Faites trois mesures de débit et gardez la moyenne : 10 L en 9 s, c’est 1,1 L/s, le débit du site A. Recommencez à la fin de l’été, c’est ce chiffre-là qui compte.',
      'Take three flow readings and keep the average: 10 L in 9 s is 1.1 L/s, the flow on site A. Repeat at the end of summer: that is the figure that matters.',
    ),
    warning: l(
      'Des travaux en rivière sans autorisation peuvent valoir une remise en état forcée et une amende. Le dossier passe avant la pioche.',
      'Unauthorised works in a river can lead to a forced restoration order and a fine. The paperwork comes before the pickaxe.',
    ),
    duration: '4 h',
    v2: {
      text: l(
        'En V2, le relevé suit une fiche standard (chute, débit d’étiage et de hautes eaux, longueur de conduite, distance au local) qui alimente un tableau de dimensionnement : diamètre de conduite, buse, kit d’augets et bobinage du générateur en découlent directement.',
        'In V2 the survey follows a standard form (head, low and high-water flow, pipe length, distance to the technical room) that feeds a sizing sheet: penstock diameter, nozzle, bucket kit and generator winding follow directly from it.',
      ),
    },
  },
  {
    id: 'weir',
    title: l('Aménager la retenue', 'Build the weir'),
    text: l(
      'Construisez une petite **retenue** de pierres et de planches juste en amont de la prise, sans barrer tout le lit. Elle stabilise le niveau devant la grille et sert de tampon quand le débit varie. Le surplus doit toujours passer par-dessus et poursuivre sa route dans le ruisseau.',
      'Build a small **weir** of stones and boards just upstream of the intake, without blocking the whole bed. It steadies the level in front of the screen and acts as a buffer when the flow varies. The surplus must always spill over and carry on down the stream.',
    ),
    parts: ['weir'],
    tools: [
      l('Pioche, barre à mine', 'Pickaxe, crowbar'),
      l('Planches de mélèze, géomembrane', 'Larch boards, geomembrane'),
    ],
    tip: l(
      'Travaillez en fin d’été, aux basses eaux : le chantier est plus facile et vous voyez exactement où passe le filet d’eau d’étiage.',
      'Work at the end of summer, at low water: the job is easier and you can see exactly where the low-water flow runs.',
    ),
    warning: l(
      'Pas de béton coulé dans le lit sans autorisation, et ne coupez jamais toute la continuité du cours d’eau : poissons et sédiments doivent pouvoir passer.',
      'No poured concrete in the bed without authorisation, and never cut off the stream’s continuity: fish and sediment must still be able to pass.',
    ),
    duration: '8 h',
    v2: {
      text: l(
        'En V2, une retenue préfabriquée (plaque inox ou PEHD ancrée par goujons) se pose en une matinée. Elle intègre une échancrure en V calibrée qui sert de déversoir de mesure pour suivre le débit du ruisseau.',
        'In V2 a prefabricated weir (stainless or HDPE plate anchored with studs) goes in within a morning. It includes a calibrated V-notch that doubles as a measuring weir to track the stream flow.',
      ),
    },
  },
  {
    id: 'intake',
    title: l('Poser la prise Coanda', 'Install the Coanda intake'),
    text: l(
      'Calez la **boîte Coanda** dans la retenue, grille face au courant, et vérifiez que l’eau couvre toute sa largeur. La sortie vers la conduite doit être bien noyée, et un petit débordement doit toujours passer par-dessus : c’est lui qui empêche l’air d’entrer dans la conduite.',
      'Bed the **Coanda box** into the weir with the screen facing the flow, and check that water covers its full width. The outlet to the penstock must be well submerged, and a small overflow must always pass over the top: that is what keeps air out of the penstock.',
    ),
    parts: ['coanda'],
    tools: [l('Niveau, pierres de calage', 'Level, packing stones'), l('Brosse', 'Brush')],
    tip: l(
      'Laissez une brosse à demeure près de la prise, comme sur le site B : un coup de brosse par trimestre suffit, même si la grille paraît encombrée.',
      'Leave a brush permanently next to the intake, as on site B: a brush stroke every quarter is enough, even when the screen looks cluttered.',
    ),
    warning: l(
      'Une boîte qui se vide aspire de l’air : la turbine crache, la puissance s’effondre et les poches d’air créent des à-coups de pression dans toute la conduite.',
      'A box that runs dry sucks in air: the turbine sputters, power collapses and the air pockets cause pressure surges along the whole penstock.',
    ),
    duration: '4 h',
    v2: {
      text: l(
        'En V2, la boîte Coanda reçoit un capteur de niveau relié par radio à la télémesure : une alerte prévient avant que la boîte ne se vide ou que la grille ne se colmate.',
        'In V2 the Coanda box gets a level sensor linked by radio to the telemetry: an alert warns before the box runs dry or the screen clogs.',
      ),
    },
  },
  {
    id: 'penstock',
    title: l('Poser la conduite forcée', 'Lay the penstock'),
    text: l(
      'Déroulez la **conduite** PEHD de la prise à la turbine en suivant une pente continue, sans point haut ni contre-pente où l’air se piégerait. Choisissez la classe de pression d’après la chute (76 m donnent 7,4 bar statiques : PN10 au minimum, PN16 si des coups de bélier sont possibles) et le diamètre d’après les pertes de charge : sur le site A, le Ø63 perd environ 2 m à 1,1 L/s, mais un Ø80 ou un Ø100 aurait été préférable. Enterrez-la ou protégez-la des UV, du gel et des chutes de pierres.',
      'Run the HDPE **penstock** from the intake to the turbine on a continuous slope, with no high point or reverse gradient where air could be trapped. Choose the pressure class from the head (76 m means 7.4 bar static: PN10 at least, PN16 if water hammer is possible) and the diameter from the friction losses: on site A the Ø63 loses about 2 m at 1.1 L/s, but Ø80 or Ø100 would have been better. Bury it or protect it from UV, frost and falling stones.',
    ),
    parts: ['penstock'],
    tools: [
      l('Mini-pelle ou trancheuse', 'Mini-digger or trencher'),
      l('Coupe-tube PEHD, raccords à compression', 'HDPE pipe cutter, compression fittings'),
      l('Piquets et cordeau', 'Stakes and string line'),
    ],
    tip: l(
      'Laissez la conduite onduler légèrement au fond de la tranchée : le PEHD se dilate d’environ 0,2 mm par mètre et par degré, soit plus d’un mètre sur 350 m entre l’été et l’hiver.',
      'Let the pipe snake slightly in the bottom of the trench: HDPE expands by about 0.2 mm per metre per degree, more than a metre over 350 m between summer and winter.',
    ),
    warning: l(
      'Pas de raccord collé ni de tube sous-classé en bas de conduite, là où la pression est maximale : c’est là que les raccords « pètent ».',
      'No glued fitting or under-rated pipe at the bottom of the penstock, where pressure is highest: that is where fittings blow.',
    ),
    duration: '16–40 h',
    v2: {
      text: l(
        'En V2, les tronçons sont assemblés par électrosoudure ou raccords à compression PN16, la conduite est éprouvée à 1,5 × PN pendant une heure avant d’être enterrée, et une ventouse est posée à chaque point haut inévitable.',
        'In V2 the sections are joined by electrofusion or PN16 compression fittings, the penstock is pressure-tested at 1.5 × PN for one hour before burial, and an air valve is fitted at every unavoidable high point.',
      ),
    },
  },
  {
    id: 'turbine',
    title: l('Installer la turbine', 'Install the turbine'),
    text: l(
      'Installez la **turbine** au point bas du tracé, sur son support, en gardant au moins 30 à 40 cm de chute libre entre le socle et la surface de l’eau. Raccordez la conduite sur la vanne principale fermée, et gardez de la place autour pour ouvrir le capot et changer les roulements.',
      'Set the **turbine** at the low point of the route, on its stand, keeping at least 30–40 cm of free fall between the base and the water surface. Connect the penstock to the closed main valve, and leave room around it to open the cover and change the bearings.',
    ),
    parts: ['turbine'],
    tools: [l('Niveau', 'Level'), l('Clé à sangle', 'Strap wrench')],
    tip: l(
      'Placez la turbine hors d’atteinte des crues : le ruisseau peut monter de 50 cm en une nuit d’orage.',
      'Keep the turbine out of reach of floods: the stream can rise by 50 cm in one stormy night.',
    ),
    warning: l(
      'Vanne principale fermée tant que la charge électrique n’est pas raccordée.',
      'Main valve closed until the electrical load is connected.',
    ),
    duration: '2 h',
    v2: {
      text: l(
        'En V2, la turbine arrive sur son skid, éprouvée et rodée : quatre ancrages, un raccord, un connecteur, et elle est en place en une heure.',
        'In V2 the turbine arrives on its skid, pressure-tested and run in: four anchors, one fitting, one connector, and it is in place within an hour.',
      ),
    },
  },
  {
    id: 'tailrace',
    title: l('Creuser le canal de fuite', 'Dig the tailrace'),
    text: l(
      'Creusez un **canal de fuite** qui ramène l’eau au ruisseau par le chemin le plus court, avec un fond empierré sous la turbine pour que l’eau ne creuse pas le sol. L’eau doit s’évacuer librement : si elle remonte jusqu’à la roue, celle-ci barbote et le rendement s’effondre.',
      'Dig a **tailrace** that returns the water to the stream by the shortest route, with a stone-lined bed under the turbine so the water does not scour the ground. The water must drain away freely: if it backs up to the runner, the wheel churns and efficiency collapses.',
    ),
    parts: ['tailrace'],
    tools: [l('Pelle, pioche', 'Shovel, pickaxe'), l('Pierres plates, géotextile', 'Flat stones, geotextile')],
    tip: l(
      'Versez quelques seaux d’eau dans le canal avant de poser la turbine : vous verrez tout de suite si l’eau stagne quelque part.',
      'Pour a few buckets of water down the channel before setting the turbine: you will see at once if water pools anywhere.',
    ),
    duration: '4 h',
    v2: {
      text: l(
        'En V2, l’entonnoir intégré au skid concentre l’eau dans un demi-tube PVC Ø160 qui la guide jusqu’au ruisseau, sans érosion sous la machine.',
        'In V2 the funnel built into the skid gathers the water into a Ø160 half PVC pipe that guides it back to the stream, with no scouring under the machine.',
      ),
    },
  },
  {
    id: 'cable',
    title: l('Tirer la liaison électrique', 'Run the power cable'),
    text: l(
      'Choisissez tension et section avant de creuser : les pertes valent R·I², avec R = ρ·2L/S. Turbine à quelques mètres des batteries, du 6 mm² en 48 V suffit (environ 1 V de chute sur le site B) ; au-delà de 100 à 200 m, mieux vaut un générateur bobiné en 150 à 250 V. Posez le **câble** sous gaine TPC rouge à 50 cm de profondeur, grillage avertisseur rouge au-dessus.',
      'Choose voltage and cross-section before digging: losses equal R·I², with R = ρ·2L/S. With the turbine a few metres from the batteries, 6 mm² at 48 V is enough (about 1 V drop on site B); beyond 100–200 m, a generator wound for 150–250 V is the better choice. Lay the **cable** in red corrugated duct 50 cm deep, with red warning mesh above it.',
    ),
    parts: ['cable-run'],
    tools: [
      l('Trancheuse ou pelle', 'Trencher or spade'),
      l('Gaine TPC, grillage avertisseur', 'Corrugated duct, warning mesh'),
      l('Aiguille tire-fil', 'Cable rod'),
    ],
    tip: l(
      'Posez une gaine de réserve dans la même tranchée : elle servira aux capteurs ou à une liaison de données le jour où vous en aurez besoin.',
      'Lay a spare duct in the same trench: it will carry sensor or data cables the day you need them.',
    ),
    warning: l(
      'Une turbine qui tourne est une source de tension : sectionneur ouvert et roue arrêtée avant de toucher à la liaison.',
      'A spinning turbine is a live source: isolator open and runner stopped before touching the cable run.',
    ),
    duration: '4–8 h',
    v2: {
      text: l(
        'En V2, la gaine de réserve porte un câble de données pour la télémesure, et la liaison se termine aux deux bouts par des connecteurs IP68 : aucune boîte de dérivation enterrée.',
        'In V2 the spare duct carries a data cable for telemetry, and the run ends in IP68 connectors at both ends: no buried junction box.',
      ),
    },
  },
  {
    id: 'techroom',
    title: l('Équiper le local technique', 'Fit out the technical room'),
    text: l(
      'Fixez les appareils sur un panneau, batteries en bas, onduleur et régulateurs à hauteur d’yeux, résistances de délestage en haut, loin du bois. Raccordez la turbine au **local technique** par le coffret de protection DC, puis câblez le délesteur et ses résistances avant toute mise en eau : la turbine ne doit jamais tourner sans charge.',
      'Mount the equipment on a board, batteries at the bottom, inverter and controllers at eye level, dump resistors at the top, away from timber. Connect the turbine to the **technical room** through the DC protection box, then wire the diversion controller and its resistors before any water is let in: the turbine must never run without a load.',
    ),
    parts: ['techroom'],
    tools: [
      l('Pince à sertir hydraulique', 'Hydraulic crimper'),
      l('Clé dynamométrique, outils isolés', 'Torque wrench, insulated tools'),
      l('Multimètre', 'Multimeter'),
    ],
    tip: l(
      'Dimensionnez les résistances de délestage à au moins 1,25 fois la puissance maximale de la turbine, y compris après le passage à une buse plus grosse.',
      'Size the dump resistors at no less than 1.25 times the turbine’s maximum power, including after an upgrade to a larger nozzle.',
    ),
    warning: l(
      'Une batterie lithium débite des milliers d’ampères dans un court-circuit : outils isolés, fusibles posés en premier, une seule borne découverte à la fois.',
      'A lithium battery delivers thousands of amps into a short circuit: insulated tools, fuses fitted first, only one terminal exposed at a time.',
    ),
    duration: '8 h',
    v2: {
      text: l(
        'En V2, le coffret contrôleur de la turbine dialogue avec le GX Victron : puissance hydro, pression et vitesse apparaissent sur le même écran que les batteries et le solaire.',
        'In V2 the turbine’s controller box talks to the Victron GX: hydro power, pressure and speed appear on the same screen as the batteries and the solar array.',
      ),
    },
  },
  {
    id: 'solar',
    title: l('Ajouter le solaire', 'Add the solar array'),
    text: l(
      'Sur un site hybride comme le site B, posez les **panneaux** pour l’été, quand le ruisseau est à sec : 4,5 kWc y suffisent. Raccordez-les à leurs propres régulateurs MPPT, jamais au régulateur de la turbine, et vérifiez la tension des chaînes par grand froid.',
      'On a hybrid site like site B, install the **panels** for summer, when the stream is dry: 4.5 kWp is enough there. Connect them to their own MPPT controllers, never to the turbine controller, and check the string voltage for very cold weather.',
    ),
    parts: ['pv'],
    tools: [
      l('Pince MC4, multimètre DC', 'MC4 crimper, DC multimeter'),
      l('Harnais et ligne de vie', 'Harness and lifeline'),
    ],
    tip: l(
      'En montagne, inclinez fort (50 à 60°) : on perd un peu en été, on gagne en hiver et la neige glisse.',
      'In the mountains, tilt steeply (50–60°): a little is lost in summer, more is gained in winter and the snow slides off.',
    ),
    warning: l(
      'Un panneau au soleil est toujours sous tension : branchez et débranchez les connecteurs hors charge, régulateur coupé.',
      'A panel in sunlight is always live: plug and unplug connectors off-load, with the controller switched off.',
    ),
    duration: '8 h',
    v2: {
      text: l(
        'En V2, solaire et hydro sont dimensionnés ensemble à partir d’un bilan mois par mois : la puissance crête est choisie pour combler exactement les mois où la turbine manque d’eau.',
        'In V2, solar and hydro are sized together from a month-by-month energy balance: the peak power is chosen to fill exactly the months when the turbine is short of water.',
      ),
    },
  },
  {
    id: 'start',
    title: l('Mettre le site en service', 'Commission the site'),
    text: l(
      'Batteries et délesteur en ligne, ouvrez la vanne principale très lentement et purgez l’air. Relevez la pression statique, puis en marche, la vitesse et la puissance, et laissez tourner 24 heures avant de partir : comme le dit Sylvain, la turbine doit tourner quand on s’en va. Montrez enfin au propriétaire le nettoyage de la grille et la manœuvre lente des vannes.',
      'With batteries and dump load online, open the main valve very slowly and bleed the air. Record the static pressure, then the running pressure, speed and power, and let it run for 24 hours before leaving: as Sylvain says, the turbine has to be running when you go. Finally, show the owner how to clean the screen and how to operate the valves slowly.',
    ),
    parts: [],
    tools: [l('Tachymètre, pince ampèremétrique DC', 'Tachometer, DC clamp meter'), l('Carnet de bord', 'Logbook')],
    tip: l(
      'Laissez au propriétaire un carnet avec les valeurs de référence : pression, tension, courant, vitesse. Tout écart futur se lit par comparaison.',
      'Leave the owner a logbook with the reference values: pressure, voltage, current, speed. Any future drift is read by comparison.',
    ),
    warning: l(
      'Jamais de turbine à vide, jamais de vanne fermée d’un coup : ce sont les deux manœuvres qui cassent une installation.',
      'Never an unloaded turbine, never a valve slammed shut: these are the two moves that break an installation.',
    ),
    duration: '24 h',
    v2: {
      text: l(
        'En V2, le propriétaire reçoit un dossier lié au QR code (plan, couples, fréquences d’entretien, références de rechange) et la télémesure l’alerte dès que la puissance, la pression ou la vitesse sortent de leur plage.',
        'In V2 the owner gets a file linked to the QR code (layout, torques, service intervals, spare-part numbers) and the telemetry alerts them as soon as power, pressure or speed leave their normal range.',
      ),
    },
  },
];
