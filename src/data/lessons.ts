// Lessons: 14 short courses, each tied to a 3D focus (scene / part / preset / scenario).
// Worked examples use the same figures as the parts catalogue and the simulator:
// site A = 76 m gross, ~74 m net, 1.1 L/s, 499 W; site B = 21 m, 4.5 kWp, ~10 kWh.

import type { L } from '@onigam/lab-kit/i18n';
import type { Lesson, Spec } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';

/** French-written number -> English form (7,4 -> 7.4 ; 1 500 -> 1,500 ; 62 % -> 62%). */
function num(fr: string): L | string {
  const en = fr
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d) (\d{3})(?!\d)/g, '$1,$2')
    .replace(/(\d) %/g, '$1%');
  return en === fr ? fr : l(fr, en);
}

/** Key-figure chip. */
function fig(fr: string, en: string, value: string | L): Spec {
  return { label: l(fr, en), value: typeof value === 'string' ? num(value) : value };
}

const LESSONS_1: Lesson[] = [
  {
    id: 'principle',
    title: l('Le principe : la puissance de l’eau', 'The principle: water power'),
    summary: l(
      'Débit × chute : pourquoi un filet d’eau sur une forte pente suffit.',
      'Flow × head: why a trickle on a steep slope is enough.',
    ),
    body: [
      l(
        'Une turbine ne crée pas d’énergie : elle récupère l’**énergie potentielle** de l’eau qui descend. Chaque kilo d’eau qui tombe de H mètres libère g·H joules ; avec un débit Q, cela donne la **puissance hydraulique** ρ·g·Q·H.',
        'A turbine does not create energy: it recovers the **potential energy** of water flowing downhill. Every kilogram of water dropping H metres releases g·H joules; with a flow Q, that gives the **hydraulic power** ρ·g·Q·H.',
      ),
      l(
        'Deux leviers comptent autant l’un que l’autre : le **débit** Q et la **chute** H. Un litre par seconde qui tombe de 76 m vaut autant que 76 L/s qui tombent d’un mètre. Voilà pourquoi un ruisseau minuscule sur une pente raide suffit, là où un moulin a besoin de beaucoup d’eau.',
        'Two levers count equally: the **flow** Q and the **head** H. One litre per second falling 76 m is worth as much as 76 L/s falling one metre. That is why a tiny stream on a steep slope is enough, where a mill needs a lot of water.',
      ),
      l(
        'Site A : Q = 1,1 L/s, 76 m de chute brute dont environ 2 m perdus dans la conduite, soit ~74 m nets. P_hyd = 1000 × 9,81 × 0,0011 × 74 ≈ **800 W**. L’afficheur indique **499 W** (53,02 V × 9,4 A) : le rendement global, de l’eau au courant continu, est d’environ **62 %**.',
        'Site A: Q = 1.1 L/s, 76 m of gross head of which about 2 m are lost in the penstock, so ~74 m net. P_hyd = 1000 × 9.81 × 0.0011 × 74 ≈ **800 W**. The display shows **499 W** (53.02 V × 9.4 A): the overall efficiency, from water to DC output, is about **62%**.',
      ),
      l(
        'Les 38 % restants se perdent dans l’injecteur, la roue, les roulements, le générateur et le redresseur. En assortissant mieux la buse et les augets, Sylvain vise environ 950 W avec un injecteur de 8 mm. Et une turbine tourne 24 h/24 : 499 W en continu, c’est près de **12 kWh par jour**, de jour comme de nuit.',
        'The remaining 38% is lost in the injector, the runner, the bearings, the generator and the rectifier. By matching nozzle and buckets better, Sylvain aims at about 950 W with an 8 mm injector. And a turbine runs around the clock: 499 W continuously is almost **12 kWh a day**, night and day.',
      ),
    ],
    figures: [
      fig('Chute brute', 'Gross head', '76 m'),
      fig('Débit', 'Flow', '1,1 L/s'),
      fig('Puissance hydraulique', 'Hydraulic power', '≈ 800 W'),
      fig('Puissance électrique', 'Electrical power', '499 W'),
      fig('Rendement global', 'Overall efficiency', '≈ 62 %'),
    ],
    formula: 'P = ρ · g · Q · H · η',
    focus: { scene: 'site', preset: 'siteA' },
    video: '01:05',
    quiz: [
      {
        q: l('Quel ruisseau offre le plus de puissance hydraulique ?', 'Which stream offers the most hydraulic power?'),
        choices: [
          l('2 L/s sur 20 m de chute', '2 L/s over a 20 m head'),
          l('0,5 L/s sur 100 m de chute', '0.5 L/s over a 100 m head'),
          l('Les deux se valent', 'Both are the same'),
        ],
        answer: 1,
        explain: l(
          'Seul compte le produit Q × H : 2 × 20 = 40 contre 0,5 × 100 = 50. Soit ≈ 390 W contre ≈ 490 W hydrauliques.',
          'Only the product Q × H matters: 2 × 20 = 40 versus 0.5 × 100 = 50. That is ≈ 390 W versus ≈ 490 W of hydraulic power.',
        ),
      },
      {
        q: l(
          'Le site A reçoit environ 800 W hydrauliques et fournit 499 W. Quel est son rendement global ?',
          'Site A receives about 800 W of hydraulic power and delivers 499 W. What is its overall efficiency?',
        ),
        choices: [l('≈ 40 %', '≈ 40%'), l('≈ 62 %', '≈ 62%'), l('≈ 85 %', '≈ 85%')],
        answer: 1,
        explain: l(
          '499 / 800 ≈ 0,62. C’est un bon chiffre pour une pico-turbine qui inclut le générateur et le redresseur.',
          '499 / 800 ≈ 0.62. That is a good figure for a pico turbine, generator and rectifier included.',
        ),
      },
    ],
  },
  {
    id: 'head-pressure',
    title: l('Chute et pression', 'Head and pressure'),
    summary: l(
      '10 m d’eau ≈ 1 bar : lire la chute sur un manomètre.',
      '10 m of water ≈ 1 bar: reading the head on a gauge.',
    ),
    body: [
      l(
        'Une colonne d’eau de 10 m appuie sur sa base presque autant que toute l’atmosphère : **10 m ≈ 1 bar** (0,981 bar exactement). La pression ne dépend que de la **hauteur** d’eau, pas de la longueur ni du diamètre du tuyau.',
        'A 10 m column of water presses on its base almost as hard as the whole atmosphere: **10 m ≈ 1 bar** (0.981 bar exactly). Pressure depends only on the **height** of water, not on the length or diameter of the pipe.',
      ),
      l(
        'Sur le site A, la prise est 76 m plus haut : vannes fermées, le **manomètre** lit ρ·g·H = 1000 × 9,81 × 76 ≈ **7,4 bar**, les « 6, 7 bars » évoqués dans la vidéo. C’est la **pression statique**.',
        'On site A the intake is 76 m higher: with the valves closed, the **gauge** reads ρ·g·H = 1000 × 9.81 × 76 ≈ **7.4 bar**, the “6, 7 bar” mentioned in the video. This is the **static pressure**.',
      ),
      l(
        'Quand l’eau circule, une partie de la chute est consommée par le frottement : la **pression en marche** est un peu plus basse, environ 7,2 bar à 1,1 L/s. L’écart, converti en mètres (0,1 bar ≈ 1 m), donne directement les **pertes de charge** de la conduite.',
        'Once water flows, part of the head is used up by friction: the **running pressure** is a little lower, about 7.2 bar at 1.1 L/s. The difference, converted into metres (0.1 bar ≈ 1 m), directly gives the penstock **friction losses**.',
      ),
      l(
        'La conduite doit tenir la pression statique avec de la marge : le PEHD **PN10** est garanti 10 bar à 20 °C. Avec 7,4 bar statiques, il ne reste que 2,6 bar pour absorber les surpressions, d’où l’importance de manœuvrer les vannes lentement.',
        'The penstock must withstand the static pressure with a margin: **PN10** HDPE is rated 10 bar at 20 °C. With 7.4 bar static, only 2.6 bar remain to absorb surges, hence the importance of operating valves slowly.',
      ),
    ],
    figures: [
      fig('Règle', 'Rule of thumb', '10 m ≈ 1 bar'),
      fig('Site A, statique', 'Site A, static', '≈ 7,4 bar'),
      fig('Site A, en marche', 'Site A, running', '≈ 7,2 bar'),
      fig('Conduite', 'Penstock', 'PEHD PN10'),
    ],
    formula: 'p = ρ · g · H   (bar ≈ H / 10)',
    focus: { scene: 'turbine', part: 'gauge' },
    video: '01:05',
    quiz: [
      {
        q: l(
          'Site B : 21 m de chute. Que lit le manomètre, vannes fermées ?',
          'Site B: 21 m of head. What does the gauge read with the valves closed?',
        ),
        choices: [l('≈ 0,2 bar', '≈ 0.2 bar'), l('≈ 2,1 bar', '≈ 2.1 bar'), l('≈ 21 bar', '≈ 21 bar')],
        answer: 1,
        explain: l(
          '21 m / 10 ≈ 2,1 bar (2,06 bar exactement). Une conduite PN6 suffirait en statique, mais on garde de la marge pour les coups de bélier.',
          '21 m / 10 ≈ 2.1 bar (2.06 bar exactly). A PN6 pipe would hold the static pressure, but a margin is kept for water hammer.',
        ),
      },
      {
        q: l(
          'En marche, le manomètre passe de 7,4 à 7,0 bar. Combien de chute perd-on dans la conduite ?',
          'When running, the gauge drops from 7.4 to 7.0 bar. How much head is lost in the penstock?',
        ),
        choices: [l('≈ 0,4 m', '≈ 0.4 m'), l('≈ 4 m', '≈ 4 m'), l('≈ 40 m', '≈ 40 m')],
        answer: 1,
        explain: l(
          '0,4 bar × 10 m/bar ≈ 4 m : c’est l’ordre de grandeur des pertes du site A à 1,8 L/s avec la buse de 8 mm.',
          '0.4 bar × 10 m/bar ≈ 4 m: that is the order of magnitude of site A’s losses at 1.8 L/s with the 8 mm nozzle.',
        ),
      },
    ],
  },
  {
    id: 'penstock-losses',
    title: l('Pertes de charge dans la conduite', 'Penstock friction losses'),
    summary: l('Pourquoi un Ø80 aurait mieux valu que le Ø63 du site A.', 'Why Ø80 would have beaten site A’s Ø63.'),
    body: [
      l(
        'L’eau frotte sur la paroi et sur elle-même : une partie de la chute se transforme en chaleur. L’équation de **Darcy-Weisbach** chiffre cette perte : elle croît avec la longueur L et le **carré de la vitesse** v, et diminue avec le diamètre D.',
        'Water rubs against the wall and against itself: part of the head turns into heat. The **Darcy–Weisbach** equation quantifies this loss: it grows with the length L and the **square of the velocity** v, and decreases with the diameter D.',
      ),
      l(
        'Site A : 1,1 L/s dans 55 mm intérieurs donne v ≈ 0,46 m/s ; sur 350 m, la perte vaut environ 1,7 m, plus quelques décimètres dans les coudes et les vannes, soit ~2 m sur 76. Sylvain le confirme : même avec les pertes de charge, « on a quelque chose de correct à l’arrivée ».',
        'Site A: 1.1 L/s in a 55 mm bore gives v ≈ 0.46 m/s; over 350 m the loss is about 1.7 m, plus a few decimetres in bends and valves, so ~2 m out of 76. Sylvain confirms it: even with the friction losses, “what arrives is still decent”.',
      ),
      l(
        'Mais la perte grimpe vite avec le débit : avec la buse de 8 mm (1,8 L/s), v ≈ 0,76 m/s et la perte atteint ~**4 m**. En **Ø80 intérieur**, elle tomberait à ~**0,7 m** : à débit égal, la perte varie à peu près comme **1/D⁵**.',
        'But the loss climbs quickly with flow: with the 8 mm nozzle (1.8 L/s), v ≈ 0.76 m/s and the loss reaches ~**4 m**. With an **80 mm bore** it would fall to ~**0.7 m**: at equal flow, the loss varies roughly as **1/D⁵**.',
      ),
      l(
        'Règle pratique : viser des pertes inférieures à **5 à 10 % de la chute brute** et une vitesse sous 1 à 1,5 m/s. Un plus gros tuyau coûte plus cher à l’achat, mais il se rembourse en watts produits 24 h/24 pendant des décennies, et il atténue les coups de bélier.',
        'Rule of thumb: aim for losses below **5–10% of the gross head** and a velocity under 1–1.5 m/s. A bigger pipe costs more up front, but it pays back in watts produced around the clock for decades, and it softens water hammer.',
      ),
    ],
    figures: [
      fig('Longueur (site A)', 'Length (site A)', '350 m'),
      fig('Ø intérieur', 'Bore', '55 mm'),
      fig('Perte à 1,1 L/s', 'Loss at 1.1 L/s', '≈ 2 m'),
      fig('Perte à 1,8 L/s', 'Loss at 1.8 L/s', '≈ 4 m'),
      fig('Même débit en Ø80', 'Same flow, Ø80', '≈ 0,7 m'),
    ],
    formula: 'Δh = f · (L / D) · v² / (2g)',
    focus: { scene: 'site', part: 'penstock' },
    video: '01:30',
    quiz: [
      {
        q: l(
          'On double le débit dans la même conduite. La perte de charge est multipliée par environ…',
          'The flow in the same pipe is doubled. The friction loss is multiplied by about…',
        ),
        choices: [l('2', '2'), l('3,5 à 4', '3.5 to 4'), l('8', '8')],
        answer: 1,
        explain: l(
          'La vitesse double et la perte suit v² ; le coefficient de frottement baisse un peu quand la vitesse augmente, d’où un facteur ≈ 3,4 plutôt que 4.',
          'Velocity doubles and the loss follows v²; the friction factor drops slightly as velocity increases, hence a factor of ≈ 3.4 rather than 4.',
        ),
      },
      {
        q: l('Pourquoi un Ø80 aurait-il mieux valu sur le site A ?', 'Why would Ø80 have been better on site A?'),
        choices: [
          l('Il supporte une pression plus élevée', 'It withstands a higher pressure'),
          l(
            'Il réduit fortement les pertes, surtout avec la buse de 8 mm',
            'It cuts the losses sharply, especially with the 8 mm nozzle',
          ),
          l('Il augmente la chute brute', 'It increases the gross head'),
        ],
        answer: 1,
        explain: l(
          'La chute brute est fixée par le terrain. Le diamètre agit sur les pertes : ~4 m perdus en Ø55 intérieur contre ~0,7 m en Ø80 à 1,8 L/s.',
          'The gross head is set by the terrain. Diameter acts on the losses: ~4 m lost with a 55 mm bore versus ~0.7 m with 80 mm at 1.8 L/s.',
        ),
      },
    ],
  },
  {
    id: 'intake',
    title: l('La prise d’eau Coanda', 'The Coanda intake'),
    summary: l(
      'Filtrer à 1 mm sans entretien quotidien, et ne jamais laisser entrer d’air.',
      'Filtering to 1 mm without daily care, and never letting air in.',
    ),
    body: [
      l(
        'La prise doit livrer à la conduite une eau **propre** et **sans air**. Une grille classique se colmate en une nuit d’automne ; la grille **Coanda** se nettoie toute seule.',
        'The intake must deliver **clean**, **air-free** water to the penstock. A conventional screen clogs in a single autumn night; the **Coanda** screen cleans itself.',
      ),
      l(
        'L’eau qui déborde de la retenue glisse sur une grille incurvée en fil profilé inox. Par **effet Coanda**, elle colle à la surface ; chaque fil découpe une fine lame qui tombe dans la boîte, tandis que feuilles et graviers, trop gros pour les fentes de **1 mm**, roulent avec le surplus et repartent au ruisseau.',
        'Water spilling over the weir slides down a curved stainless wedge-wire screen. Thanks to the **Coanda effect** it clings to the surface; each wire slices off a thin sheet that drops into the box, while leaves and gravel, too big for the **1 mm** slots, roll on with the surplus back to the stream.',
      ),
      l(
        'Sur le site B, un coup de brosse **une fois par trimestre** suffit : même couverte de débris, la grille continue d’alimenter la boîte, comme le montre Sylvain.',
        'On site B a brush stroke **once a quarter** is enough: even covered in debris, the screen keeps feeding the box, as Sylvain shows.',
      ),
      l(
        'La règle d’or : toujours un **petit débordement**. Si le ruisseau baisse et que la boîte se vide, la conduite aspire de l’**air** : la turbine crache, la puissance s’effondre et les bulles provoquent des à-coups de pression. Le scénario « prise à sec » montre ce qui arrive quand on prélève plus que ce que le ruisseau apporte.',
        'The golden rule: always a **small overflow**. If the stream drops and the box empties, the penstock sucks in **air**: the turbine sputters, power collapses and the bubbles cause pressure surges. The “dry intake” scenario shows what happens when more is drawn than the stream supplies.',
      ),
    ],
    figures: [
      fig('Filtration', 'Filtration', '≈ 1 mm'),
      fig('Nettoyage', 'Cleaning', l('1 fois par trimestre', 'once a quarter')),
      fig('Débordement', 'Overflow', l('toujours', 'always')),
      fig('Prise → turbine (site B)', 'Intake → turbine (site B)', '55 m'),
    ],
    focus: { scene: 'intake', part: 'in-screen', scenario: 'dryIntake' },
    video: '13:24',
    quiz: [
      {
        q: l(
          'Pourquoi faut-il toujours un petit débordement à la prise ?',
          'Why must there always be a small overflow at the intake?',
        ),
        choices: [
          l('Pour augmenter la pression à la turbine', 'To increase the pressure at the turbine'),
          l(
            'Pour que la boîte reste pleine et qu’aucun air n’entre dans la conduite',
            'So the box stays full and no air enters the penstock',
          ),
          l('Pour refroidir la grille', 'To cool the screen'),
        ],
        answer: 1,
        explain: l(
          'Le débordement prouve que l’on prélève moins que ce qui arrive : la boîte reste pleine, la sortie noyée, et l’air ne peut pas entrer.',
          'The overflow proves that less is drawn than what arrives: the box stays full, the outlet submerged, and air cannot get in.',
        ),
      },
      {
        q: l(
          'Que devient un gravier de 5 mm qui arrive sur la grille ?',
          'What happens to a 5 mm piece of gravel arriving on the screen?',
        ),
        choices: [
          l('Il passe dans la boîte et bouche l’injecteur', 'It goes into the box and blocks the injector'),
          l('Il roule sur la grille et repart avec le surplus', 'It rolls over the screen and leaves with the surplus'),
          l('Il bloque définitivement la grille', 'It blocks the screen for good'),
        ],
        answer: 1,
        explain: l(
          'Les fentes font environ 1 mm : le gravier ne peut pas passer, et l’écoulement du surplus l’emporte par-dessus la grille.',
          'The slots are about 1 mm wide: the gravel cannot pass, and the overflow carries it away over the screen.',
        ),
      },
    ],
  },
  {
    id: 'bucket',
    title: l('L’auget Pelton', 'The Pelton bucket'),
    summary: l(
      'Fendre le jet, le retourner, et avancer à 0,46 fois sa vitesse.',
      'Split the jet, turn it back, and move at 0.46 times its speed.',
    ),
    body: [
      l(
        'Le jet arrive à près de **37 m/s**. L’**arête centrale** le fend en deux ; chaque moitié suit une coquille incurvée, fait presque **demi-tour (~165°)** et ressort sur le côté. C’est ce retournement, ce « retour en arrière » dont parle Sylvain, qui pousse l’auget.',
        'The jet arrives at nearly **37 m/s**. The **splitter ridge** cuts it in two; each half follows a curved cup, almost **reverses (~165°)** and leaves sideways. It is this reversal, the water “turning back” as Sylvain puts it, that drives the bucket.',
      ),
      l(
        'Pourquoi 165° et pas 180° ? Si l’eau repartait exactement vers l’arrière, elle frapperait le dos de l’auget suivant. Les quelques degrés manquants la laissent s’échapper sur les côtés, pour une perte minime.',
        'Why 165° and not 180°? If the water went straight back, it would hit the back of the next bucket. The few missing degrees let it escape sideways, at a tiny cost.',
      ),
      l(
        'En théorie, l’auget doit avancer à la **moitié de la vitesse du jet** ; en pratique, à cause des frottements, l’optimum se situe vers **u ≈ 0,46 à 0,5·v**. Avec v ≈ 37 m/s, u ≈ 17 m/s ; sur un diamètre primitif de 190 mm, N = 60 × 17 / (π × 0,19) ≈ **1 700 tr/min**, et jusqu’à 1 900 tr/min vers u/v = 0,5. La vidéo cite « 1 500 tr/min en moyenne, jusqu’à 2 000–2 500 » : même ordre de grandeur, notre roue reprenant les cotes du modèle commercial, qui peuvent différer de celles de la turbine filmée.',
        'In theory the bucket should move at **half the jet speed**; in practice, because of friction, the optimum is around **u ≈ 0.46–0.5·v**. With v ≈ 37 m/s, u ≈ 17 m/s; on a 190 mm pitch diameter, N = 60 × 17 / (π × 0.19) ≈ **1,700 rpm**, and up to 1,900 rpm towards u/v = 0.5. The video quotes “1,500 rpm on average, up to 2,000–2,500”: the same order of magnitude, since our runner follows the commercial model’s dimensions, which may differ from the filmed turbine’s.',
      ),
      l(
        'La taille compte : la largeur de l’auget vaut en gros **3 à 4 fois le diamètre du jet** (≈ 3,2 × d sur les grandes roues classiques). Trop petit, il déborde ; trop grand, il est lourd et brasse l’air humide. D’où les différentes tailles d’augets montrées par Sylvain : sur notre roue de 26 augets (pointes sur Ø244), le jeu L de 40 mm de large est centré vers un jet de Ø10 et accepte les buses Ø8 à Ø14 du constructeur ; le jeu S, plus petit, sert aux jets jusqu’à Ø6, comme celui du site A.',
        'Size matters: the bucket width is roughly **3 to 4 times the jet diameter** (≈ 3.2 × d on large classic runners). Too small and it spills; too large and it is heavy and churns the damp air. Hence the different bucket sizes Sylvain shows: on our 26-bucket runner (tips on Ø244), the 40 mm wide L set is centred on a Ø10 jet and accepts the maker’s Ø8 to Ø14 nozzles; the smaller S set serves jets up to Ø6, like site A’s.',
      ),
    ],
    figures: [
      fig('Vitesse du jet', 'Jet velocity', '≈ 37 m/s'),
      fig('Déviation', 'Deflection', '≈ 165°'),
      fig('u / v optimal', 'Optimum u / v', '≈ 0,46–0,5'),
      fig('Largeur d’auget', 'Bucket width', '≈ 3–4 × d'),
      fig('Roue', 'Runner', l('26 augets, primitif Ø190, pointes Ø244', '26 buckets, Ø190 pitch, Ø244 tips')),
      fig('Vitesse à 76 m', 'Speed at 76 m', l('≈ 1 700–1 900 tr/min', '≈ 1,700–1,900 rpm')),
    ],
    formula: 'u ≈ 0.46 · v_jet   ;   N = 60 · u / (π · D)',
    focus: { scene: 'turbine', part: 'buckets' },
    video: '09:30',
    quiz: [
      {
        q: l(
          'Le jet sort à 37 m/s. À quelle vitesse les augets doivent-ils avancer pour un rendement maximal ?',
          'The jet leaves at 37 m/s. How fast should the buckets move for maximum efficiency?',
        ),
        choices: [l('≈ 37 m/s', '≈ 37 m/s'), l('≈ 17 m/s', '≈ 17 m/s'), l('≈ 5 m/s', '≈ 5 m/s')],
        answer: 1,
        explain: l(
          '0,46 × 37 ≈ 17 m/s. À 37 m/s, l’auget fuirait devant le jet sans rien recevoir ; à 5 m/s, l’eau ressortirait encore très vite et emporterait son énergie.',
          '0.46 × 37 ≈ 17 m/s. At 37 m/s the bucket would run away from the jet and receive nothing; at 5 m/s the water would still leave very fast, carrying its energy away.',
        ),
      },
      {
        q: l(
          'Le jeu d’augets L fait 40 mm de large. Autour de quel diamètre de jet est-il optimisé ?',
          'The L bucket set is 40 mm wide. Around which jet diameter is it optimised?',
        ),
        choices: [l('≈ Ø4 mm', '≈ Ø4 mm'), l('≈ Ø10 mm', '≈ Ø10 mm'), l('≈ Ø25 mm', '≈ Ø25 mm')],
        answer: 1,
        explain: l(
          'Avec une largeur de 3 à 4 fois le jet : 40 / 4 = 10 mm (40 / 3,2 ≈ 12,5). D’où un jeu centré vers Ø10 qui couvre les buses Ø8 à Ø14 ; un jet de Ø6 demande le jeu S, plus petit.',
          'With a width of 3 to 4 times the jet: 40 / 4 = 10 mm (40 / 3.2 ≈ 12.5). Hence a set centred on Ø10 that covers Ø8 to Ø14 nozzles; a Ø6 jet needs the smaller S set.',
        ),
      },
    ],
  },
];

const LESSONS_2: Lesson[] = [
  {
    id: 'injector',
    title: l('L’injecteur et le débit', 'The injector and the flow'),
    summary: l('De 6 à 8 mm : presque deux fois plus de puissance.', 'From 6 to 8 mm: almost twice the power.'),
    body: [
      l(
        'L’injecteur transforme la pression en vitesse : v = √(2·g·H), soit ~38 m/s en théorie à 74 m nets et ~37 m/s en réalité. Le débit est cette vitesse multipliée par la section de la buse : **Q = Cd·A·√(2·g·H)**, avec Cd ≈ 0,95 à 0,98 pour une buse bien profilée.',
        'The injector turns pressure into velocity: v = √(2·g·H), ~38 m/s in theory at 74 m net and ~37 m/s in reality. The flow is that velocity times the nozzle area: **Q = Cd·A·√(2·g·H)**, with Cd ≈ 0.95–0.98 for a well-shaped nozzle.',
      ),
      l(
        'La section varie comme le **carré du diamètre** : passer de 6 à 8 mm la multiplie par (8/6)² ≈ 1,78. Le débit passe donc de **1,1 à ~1,8 L/s**, exactement l’ordre de grandeur annoncé par Sylvain (« 1,7, 1,8 litre »).',
        'Area goes with the **square of the diameter**: going from 6 to 8 mm multiplies it by (8/6)² ≈ 1.78. The flow therefore rises from **1.1 to ~1.8 L/s**, exactly the figure Sylvain gives (“1.7, 1.8 litres”).',
      ),
      l(
        'La puissance suit : avec ~72 m nets (la conduite perd un peu plus à fort débit), la puissance hydraulique atteint ~1,27 kW. Avec une roue aux augets plus gros, bien assortis au jet, Sylvain vise **~950 W**, presque le double des 499 W actuels, soit un rendement global proche de 75 %. Sur la roue du modèle commercial, le constructeur accepte des buses jusqu’à **Ø14 mm**, à condition que le ruisseau et la conduite suivent.',
        'Power follows: with ~72 m net (the penstock loses a bit more at higher flow), hydraulic power reaches ~1.27 kW. With a runner carrying larger buckets, properly matched to the jet, Sylvain expects **~950 W**, almost double the current 499 W, an overall efficiency close to 75%. On the commercial model’s runner, the maker accepts nozzles up to **Ø14 mm**, provided the stream and the penstock can keep up.',
      ),
      l(
        'Buse fixe ou **pointeau** ? La buse fixe n’a aucune pièce mobile mais son débit est figé (pour le changer, on change d’insert) ; l’injecteur à pointeau (l’« olive » italienne) fait varier la section annulaire en gardant un jet compact. Ce qu’il ne faut jamais faire : régler le débit avec une vanne à moitié fermée, qui détruit la chute au lieu de la transformer en vitesse.',
        'Fixed nozzle or **spear valve**? A fixed nozzle has no moving part but its flow is set (to change it, you swap the insert); the spear injector (the Italian “olive”) varies the annular area while keeping a compact jet. What must never be done: setting the flow with a half-closed valve, which destroys head instead of turning it into velocity.',
      ),
      l(
        'Enfin, la buse ne doit jamais demander plus que ce que le ruisseau donne : sinon la prise se vide et l’air entre dans la conduite. Sur le site B, c’est la raison d’être du second injecteur, à buse fixe et petite, pour les débits d’été.',
        'Finally, the nozzle must never draw more than the stream supplies: otherwise the intake empties and air enters the penstock. On site B that is why there is a second injector with a small fixed nozzle for summer flows.',
      ),
    ],
    figures: [
      fig('Buse Ø6', 'Ø6 nozzle', '1,1 L/s'),
      fig('Buse Ø8', 'Ø8 nozzle', '≈ 1,8 L/s'),
      fig('Section', 'Area', '× 1,78'),
      fig('Puissance visée', 'Target power', '≈ 950 W'),
    ],
    formula: 'Q = Cd · A · √(2 · g · H)',
    focus: { scene: 'turbine', part: 'injector-top', preset: 'siteA8' },
    video: '10:30',
    quiz: [
      {
        q: l(
          'À chute égale, on passe d’une buse de 6 mm à une buse de 12 mm. Le débit est multiplié par…',
          'At the same head, the nozzle goes from 6 mm to 12 mm. The flow is multiplied by…',
        ),
        choices: [l('2', '2'), l('4', '4'), l('8', '8')],
        answer: 1,
        explain: l(
          'Le débit suit la section, donc le carré du diamètre : (12/6)² = 4. À condition, bien sûr, que le ruisseau et la conduite suivent.',
          'Flow follows the area, hence the square of the diameter: (12/6)² = 4. Provided, of course, that the stream and the penstock can keep up.',
        ),
      },
      {
        q: l(
          'Pourquoi ne pas régler le débit avec la vanne principale à moitié fermée ?',
          'Why not set the flow with the main valve half closed?',
        ),
        choices: [
          l(
            'La vanne transforme la chute en pertes au lieu de la transformer en vitesse de jet',
            'The valve turns head into losses instead of jet velocity',
          ),
          l('La vanne n’a aucun effet sur le débit', 'The valve has no effect on the flow'),
          l('C’est interdit par la réglementation', 'It is forbidden by regulations'),
        ],
        answer: 0,
        explain: l(
          'Une vanne laminée dissipe la pression en turbulence : le jet sort moins vite et l’énergie est perdue. Le pointeau réduit la section mais conserve toute la vitesse.',
          'A throttled valve dissipates pressure into turbulence: the jet comes out slower and the energy is lost. The spear reduces the area but keeps the full velocity.',
        ),
      },
    ],
  },
  {
    id: 'generator',
    title: l('Le générateur à aimants', 'The permanent-magnet generator'),
    summary: l('Des aimants qui défilent devant des bobines : E = k·ω.', 'Magnets sweeping past coils: E = k·ω.'),
    body: [
      l(
        '« Des aimants qui tournent autour des bobines », résume Sylvain : c’est le principe de tous les générateurs, éoliens comme hydrauliques. Quand le flux magnétique qui traverse une bobine varie, une tension y apparaît : c’est la **loi de Faraday**.',
        '“Magnets turning around coils”, as Sylvain sums it up: that is the principle of every generator, wind or hydro. When the magnetic flux through a coil changes, a voltage appears across it: this is **Faraday’s law**.',
      ),
      l(
        'La tension est proportionnelle à la vitesse : **E = k·ω**. Ici, 14 aimants (7 paires de pôles) tournent autour de 12 bobines ; sur le site A, à 1 800 tr/min, la fréquence électrique est de 210 Hz et la tension redressée à vide d’environ 70 V (k ≈ 0,37 V·s/rad, soit ≈ 0,04 V par tr/min). En charge, elle retombe vers 55 à 60 V à l’entrée du régulateur et 50 à 54 V côté batteries : la différence se perd dans la résistance des bobines, les diodes et le câble.',
        'Voltage is proportional to speed: **E = k·ω**. Here, 14 magnets (7 pole pairs) spin around 12 coils; on site A, at 1,800 rpm, the electrical frequency is 210 Hz and the rectified open-circuit voltage about 70 V (k ≈ 0.37 V·s/rad, i.e. ≈ 0.04 V per rpm). Under load it drops to 55–60 V at the controller input and 50–54 V on the battery side: the difference is lost in the coil resistance, the diodes and the cable.',
      ),
      l(
        'Les bobines sont réparties en **trois phases** décalées de 120°. Le couple est plus régulier qu’en monophasé, donc moins de vibrations, et un **pont de six diodes** donne un courant continu peu ondulé, directement utilisable par un régulateur ou des batteries 48 V.',
        'The coils are split into **three phases** 120° apart. Torque is smoother than single phase, so there is less vibration, and a **six-diode bridge** gives a low-ripple DC output that a controller or 48 V batteries can use directly.',
      ),
      l(
        'Pourquoi fabriquer ses propres générateurs ? Sylvain utilisait des moteurs **Motenergy**, efficaces, mais dont les stators chauffaient jusqu’à la destruction quand la turbine était souvent arrêtée et relancée. En les fabriquant lui-même, il choisit la tension (48 V près des batteries, 150 à 250 V pour les longues liaisons), l’isolation et le refroidissement.',
        'Why build his own generators? Sylvain used **Motenergy** motors, efficient ones, but their stators overheated to destruction when the turbine was frequently stopped and restarted. Making them himself, he chooses the voltage (48 V next to the batteries, 150–250 V for long cable runs), the insulation and the cooling.',
      ),
    ],
    figures: [
      fig('Bobines / aimants', 'Coils / magnets', '12 / 14'),
      fig('Fréquence à 1 800 tr/min', 'Frequency at 1,800 rpm', '210 Hz'),
      fig('Sortie DC', 'DC output', '50–54 V'),
      fig('Aimants', 'Magnets', l('N52, 80 °C max', 'N52, 80 °C max')),
    ],
    formula: 'E = k · ω   ;   f = p · N / 60',
    focus: { scene: 'turbine', part: 'stator' },
    video: '09:55',
    quiz: [
      {
        q: l(
          'La turbine passe de 1 800 à 3 600 tr/min parce qu’elle a perdu sa charge. Sa tension à vide…',
          'The turbine goes from 1,800 to 3,600 rpm because it lost its load. Its open-circuit voltage…',
        ),
        choices: [
          l('reste vers 70 V', 'stays around 70 V'),
          l('double, vers 140 V', 'doubles, to about 140 V'),
          l('baisse', 'drops'),
        ],
        answer: 1,
        explain: l(
          'E = k·ω : deux fois plus vite, deux fois plus de tension. Assez pour frôler les 150 V maximum d’un TriStar MPPT 45 et détruire des appareils 48 V.',
          'E = k·ω: twice the speed, twice the voltage. Enough to come close to the 150 V limit of a TriStar MPPT 45 and destroy 48 V equipment.',
        ),
      },
      {
        q: l(
          'Pourquoi Sylvain a-t-il cessé d’utiliser des générateurs Motenergy ?',
          'Why did Sylvain stop using Motenergy generators?',
        ),
        choices: [
          l('Leur rendement était trop faible', 'Their efficiency was too low'),
          l(
            'Leurs stators surchauffaient quand la turbine était souvent arrêtée et relancée',
            'Their stators overheated when the turbine was often stopped and restarted',
          ),
          l('Ils étaient introuvables en France', 'They could not be found in France'),
        ],
        answer: 1,
        explain: l(
          'Il souligne au contraire leur bon rendement : c’est la fiabilité en marche-arrêt répétée qui posait problème.',
          'He actually praises their efficiency: reliability under repeated stop-start was the problem.',
        ),
      },
    ],
  },
  {
    id: 'constant-speed',
    title: l('Tourner à vitesse constante', 'Running at constant speed'),
    summary: l(
      'Pourquoi un régulateur MPPT solaire fait souffrir une turbine.',
      'Why a solar MPPT controller makes a turbine suffer.',
    ),
    body: [
      l(
        'Une Pelton n’a qu’une vitesse où elle rend le maximum : celle où les augets avancent à ~0,46 fois la vitesse du jet. En dehors, le rendement chute, et, comme le dit Sylvain, « c’est mauvais pour la mécanique de tout le temps changer de vitesse ».',
        'A Pelton has only one speed at which it performs best: the one where the buckets move at ~0.46 times the jet speed. Away from it, efficiency drops and, as Sylvain says, “constantly changing speed is bad for the mechanics”.',
      ),
      l(
        'Un régulateur **MPPT** classique cherche le point de puissance maximale en bougeant sans cesse la tension : un peu plus, on regarde la puissance, un peu moins… Sur un panneau solaire, sans inertie, cela marche très bien. Sur une turbine, chaque pas fait accélérer ou ralentir une roue lourde : le régulateur lit mal la réponse et, selon Sylvain, « se cale presque jamais sur la bonne vitesse ». La vitesse **pompe** en permanence.',
        'A classic **MPPT** controller looks for the maximum power point by constantly nudging the voltage: a bit up, check the power, a bit down… On a solar panel, which has no inertia, this works very well. On a turbine, each step speeds up or slows down a heavy runner: the controller misreads the response and, according to Sylvain, “almost never settles on the right speed”. The speed keeps **hunting**.',
      ),
      l(
        'La solution utilisée sur le site A : un **Morningstar TriStar TS-MPPT-45** réglé en **tension d’entrée fixe**. Comme E = k·ω, imposer la tension revient à imposer la vitesse. On règle la consigne une fois pour toutes, au point où la turbine rend le mieux.',
        'The solution used on site A: a **Morningstar TriStar TS-MPPT-45** set to a **fixed input voltage**. Since E = k·ω, fixing the voltage means fixing the speed. The set point is chosen once and for all, where the turbine performs best.',
      ),
      l(
        'Sur le site B, Sylvain va plus loin : la turbine est branchée **directement sur les batteries** 48 V. Leur tension, qui varie peu, fixe la vitesse, et l’on économise un régulateur d’environ 500 €. Cela suppose une turbine tout près des batteries (6 mm², ~1 V de chute) et un générateur bobiné pour la bonne tension.',
        'On site B Sylvain goes further: the turbine is wired **straight to the 48 V batteries**. Their voltage, which varies little, sets the speed, and a controller worth about 500 € is saved. This requires the turbine to be right next to the batteries (6 mm², ~1 V drop) and a generator wound for the right voltage.',
      ),
    ],
    figures: [
      fig('Régulateur (site A)', 'Controller (site A)', 'TS-MPPT-45'),
      fig('Mode', 'Mode', l('Tension d’entrée fixe', 'Fixed input voltage')),
      fig('Vitesse (site A)', 'Speed (site A)', l('≈ 1 700–1 900 tr/min', '≈ 1,700–1,900 rpm')),
      fig('Économie (site B)', 'Saving (site B)', '≈ 500 €'),
    ],
    formula: 'V = k · ω   ⇒   V = const ⇔ ω = const',
    focus: { scene: 'techroom', part: 'hydro-ctrl', scenario: 'mpptHunting' },
    video: '06:10',
    quiz: [
      {
        q: l(
          'Pourquoi imposer la tension revient-il à imposer la vitesse ?',
          'Why does fixing the voltage amount to fixing the speed?',
        ),
        choices: [
          l(
            'La tension d’un générateur à aimants est proportionnelle à sa vitesse',
            'A magnet generator’s voltage is proportional to its speed',
          ),
          l('Le régulateur freine mécaniquement la roue', 'The controller brakes the runner mechanically'),
          l('La pression de l’eau est constante', 'Water pressure is constant'),
        ],
        answer: 0,
        explain: l(
          'Le régulateur ajuste le courant qu’il prélève jusqu’à ce que la tension, donc la vitesse, tombe sur la consigne.',
          'The controller adjusts the current it draws until the voltage, and therefore the speed, sits on the set point.',
        ),
      },
      {
        q: l(
          'Sur le site B, sans régulateur hydro, qu’est-ce qui fixe la vitesse de la turbine ?',
          'On site B, with no hydro controller, what sets the turbine speed?',
        ),
        choices: [
          l('Le pointeau de l’injecteur', 'The injector spear'),
          l('La tension du parc de batteries', 'The battery bank voltage'),
          l('Le délesteur', 'The dump load'),
        ],
        answer: 1,
        explain: l(
          'La batterie impose sa tension au bus ; le générateur s’y aligne, à la vitesse correspondante. D’où l’importance de bobiner le générateur pour la bonne tension.',
          'The battery imposes its voltage on the bus; the generator follows at the matching speed. Hence the need to wind the generator for the right voltage.',
        ),
      },
    ],
  },
  {
    id: 'dump-load',
    title: l('Le délestage', 'The dump load'),
    summary: l(
      'Une turbine doit toujours être en charge, même batteries pleines.',
      'A turbine must always be loaded, even with full batteries.',
    ),
    body: [
      l(
        'Un panneau solaire sans charge ne risque rien. Une turbine, si : le jet continue de pousser quand on cesse de consommer. Sans **charge électrique**, plus rien ne freine la roue, qui monte à sa **vitesse d’emballement**, environ **1,8 à 2 fois** la vitesse nominale, soit 3 000 à 3 800 tr/min sur le site A.',
        'An unloaded solar panel is at no risk. A turbine is: the jet keeps pushing when nobody uses power. With no **electrical load**, nothing brakes the runner, which climbs to its **runaway speed**, about **1.8–2 times** the rated speed, 3,000–3,800 rpm on site A.',
      ),
      l(
        'À cette vitesse, la tension à vide double aussi (120 à 140 V sur le site A), au risque de détruire le régulateur ou les appareils 48 V, et les efforts centrifuges sur les augets imprimés, les aimants collés et les roulements sont multipliés par quatre. C’est pourquoi, comme le répète Sylvain, la turbine doit tourner 24 h/24 **en charge constante**.',
        'At that speed the open-circuit voltage doubles too (120–140 V on site A), which can destroy the controller or 48 V equipment, and centrifugal loads on the printed buckets, the bonded magnets and the bearings are multiplied by four. That is why, as Sylvain insists, the turbine must run around the clock **under constant load**.',
      ),
      l(
        'Quand les batteries sont pleines et que personne ne consomme, le **régulateur de délestage** détourne le surplus vers des **résistances** qui chauffent l’air, les « résistances de freinage ». La turbine ne voit aucune différence : elle produit toujours la même puissance, simplement envoyée ailleurs.',
        'When the batteries are full and nobody is using power, the **diversion controller** sends the surplus to air-heating **resistors**, the “braking resistors”. The turbine sees no difference: it keeps producing the same power, simply sent elsewhere.',
      ),
      l(
        'Dimensionnement : les résistances doivent absorber au moins **1,25 fois** la puissance maximale de la turbine, et le délestage doit démarrer avant que le BMS des batteries n’ouvre le circuit. Le scénario « panne du délesteur » montre ce qui arrive quand ces conditions ne sont pas réunies.',
        'Sizing: the resistors must absorb at least **1.25 times** the turbine’s maximum power, and diversion must start before the battery BMS opens the circuit. The “dump-load failure” scenario shows what happens when these conditions are not met.',
      ),
    ],
    figures: [
      fig('Emballement', 'Runaway speed', '≈ 1,8–2 × N'),
      fig('Tension à vide (site A)', 'Open-circuit voltage (site A)', '≈ 120–140 V'),
      fig('Résistances', 'Resistors', '≥ 1,25 × P max'),
      fig('Fonctionnement', 'Duty', l('24 h/24, toujours en charge', '24/7, always loaded')),
    ],
    formula: 'F_c ∝ ω²   (ω × 2 ⇒ F_c × 4)',
    focus: { scene: 'techroom', part: 'dump-load', scenario: 'dumpFailure' },
    video: '19:05',
    quiz: [
      {
        q: l(
          'Les batteries sont pleines et le délesteur tombe en panne. Que fait la turbine ?',
          'The batteries are full and the dump load fails. What does the turbine do?',
        ),
        choices: [
          l('Elle s’arrête d’elle-même', 'It stops by itself'),
          l('Elle s’emballe vers le double de sa vitesse nominale', 'It runs away towards twice its rated speed'),
          l('Elle reste vers 1 800 tr/min', 'It stays around 1,800 rpm'),
        ],
        answer: 1,
        explain: l(
          'Le BMS ouvre, plus rien ne prélève de courant, donc plus rien ne freine : seule la limite hydraulique (u ≈ v) arrête la montée en vitesse.',
          'The BMS opens, nothing draws current any more, so nothing brakes: only the hydraulic limit (u ≈ v) stops the speed from rising further.',
        ),
      },
      {
        q: l(
          'Turbine de 950 W : quelle puissance minimale pour les résistances de délestage ?',
          '950 W turbine: what minimum rating for the dump resistors?',
        ),
        choices: [l('≈ 500 W', '≈ 500 W'), l('≈ 1 200 W', '≈ 1,200 W'), l('≈ 5 000 W', '≈ 5,000 W')],
        answer: 1,
        explain: l(
          '950 × 1,25 ≈ 1 190 W. Inutile de surdimensionner énormément, mais jamais en dessous de la puissance maximale de la turbine.',
          '950 × 1.25 ≈ 1,190 W. No need to oversize hugely, but never below the turbine’s maximum power.',
        ),
      },
    ],
  },
  {
    id: 'transport',
    title: l('Transporter l’électricité', 'Carrying the power'),
    summary: l(
      'Pertes = R·I² : pourquoi monter la tension plutôt que la section.',
      'Losses = R·I²: why raise the voltage rather than the cross-section.',
    ),
    body: [
      l(
        'Un câble a une résistance **R = ρ·2L/S** : aller **et** retour. Le courant I qui le traverse y perd une puissance **R·I²** et une tension R·I. À puissance égale, le courant est inversement proportionnel à la tension : tout est là.',
        'A cable has a resistance **R = ρ·2L/S**: out **and** back. The current I flowing through it loses **R·I²** of power and R·I of voltage. For a given power, current is inversely proportional to voltage: that is the whole point.',
      ),
      l(
        'Exemple : 500 W à transporter sur 200 m en 6 mm². R = 0,0175 × 400 / 6 ≈ 1,17 Ω. En **50 V**, I = 10 A et les pertes atteignent ~117 W, près d’un quart de la production. En **200 V**, I = 2,5 A et les pertes tombent à ~7 W : quatre fois plus de tension, **seize fois moins de pertes**.',
        'Example: 500 W to carry over 200 m in 6 mm². R = 0.0175 × 400 / 6 ≈ 1.17 Ω. At **50 V**, I = 10 A and the losses reach ~117 W, almost a quarter of the output. At **200 V**, I = 2.5 A and the losses fall to ~7 W: four times the voltage, **sixteen times fewer losses**.',
      ),
      l(
        'Sur le site A, la vidéo mentionne environ **35 W perdus** dans les câbles et un peu dans le régulateur, pour 499 W produits. Sur le site B, la turbine est collée aux batteries : 6 mm², à peine **1 V de chute**, des pertes négligeables.',
        'On site A the video mentions about **35 W lost** in the cables and a little in the controller, out of 499 W produced. On site B the turbine sits right next to the batteries: 6 mm², barely **1 V of drop**, negligible losses.',
      ),
      l(
        'D’où la stratégie de Sylvain : plutôt que de poser du 25 ou du 35 mm² hors de prix, il installe pour les longues distances des générateurs en **150 à 250 V**, qui permettent de rester en 6 ou 10 mm². Un régulateur acceptant une haute tension d’entrée ramène ensuite l’énergie au 48 V des batteries.',
        'Hence Sylvain’s strategy: rather than laying expensive 25 or 35 mm² cable, for long distances he fits **150–250 V** generators, which allow 6 or 10 mm² cable to be kept. A controller that accepts a high input voltage then brings the energy down to the 48 V battery bus.',
      ),
    ],
    figures: [
      fig('200 m en 6 mm²', '200 m of 6 mm²', '≈ 1,17 Ω'),
      fig('500 W en 50 V', '500 W at 50 V', l('≈ 117 W perdus', '≈ 117 W lost')),
      fig('500 W en 200 V', '500 W at 200 V', l('≈ 7 W perdus', '≈ 7 W lost')),
      fig('Pertes site A', 'Site A losses', '≈ 35 W'),
    ],
    formula: 'ΔP = R · I²   ;   R = ρ · 2L / S',
    focus: { scene: 'site', part: 'cable-run', scenario: 'longCable' },
    video: '18:05',
    quiz: [
      {
        q: l(
          'Même câble, même puissance : on passe de 50 V à 100 V. Les pertes sont…',
          'Same cable, same power: the voltage goes from 50 V to 100 V. The losses are…',
        ),
        choices: [l('divisées par 2', 'halved'), l('divisées par 4', 'divided by 4'), l('inchangées', 'unchanged')],
        answer: 1,
        explain: l(
          'Le courant est divisé par 2, et les pertes suivent I² : divisées par 4.',
          'The current is halved, and losses follow I²: divided by 4.',
        ),
      },
      {
        q: l('Pourquoi compte-t-on 2L dans la résistance du câble ?', 'Why does the cable resistance use 2L?'),
        choices: [
          l('Par marge de sécurité', 'As a safety margin'),
          l('Parce que le courant fait l’aller et le retour', 'Because the current goes out and comes back'),
          l('À cause de l’échauffement', 'Because of heating'),
        ],
        answer: 1,
        explain: l(
          'Un circuit continu a deux conducteurs : 200 m de liaison, c’est 400 m de cuivre parcourus par le courant.',
          'A DC circuit has two conductors: a 200 m run means 400 m of copper carrying the current.',
        ),
      },
    ],
  },
];

const LESSONS_3: Lesson[] = [
  {
    id: 'hybrid',
    title: l('Hydro + solaire : le duo des saisons', 'Hydro + solar: a seasonal duo'),
    summary: l(
      'La turbine l’hiver et la nuit, le soleil l’été.',
      'The turbine in winter and at night, the sun in summer.',
    ),
    body: [
      l(
        'Sur le site B, le ruisseau coule de décembre à mai puis s’assèche ; le soleil, lui, est bas et vite caché par les crêtes en hiver. Les deux sources sont **complémentaires** : la turbine tient l’hiver, les **4,5 kWc** de panneaux tiennent l’été.',
        'On site B the stream flows from December to May and then dries up; the sun, meanwhile, is low and quickly hidden by the ridges in winter. The two sources are **complementary**: the turbine covers winter, the **4.5 kWp** of panels cover summer.',
      ),
      l(
        'Une petite turbine paraît modeste : 250 à 300 W en temps normal. Mais elle tourne **24 h/24** : 300 W × 24 h = **7,2 kWh par jour**, autant qu’un champ de 4,5 kWc par une belle journée d’hiver, et cela même la nuit, sous la pluie ou pendant une semaine de grisaille.',
        'A small turbine looks modest: 250–300 W in normal conditions. But it runs **around the clock**: 300 W × 24 h = **7.2 kWh a day**, as much as a 4.5 kWp array on a fine winter day, and it keeps going at night, in the rain or through a week of grey skies.',
      ),
      l(
        'La turbine ménage aussi les **batteries** : cette recharge de fond empêche le parc de quatre Pylontech (~10 kWh) de descendre à 20 ou 30 % de charge, ce qui prolonge nettement sa durée de vie.',
        'The turbine also spares the **batteries**: this background charge stops the bank of four Pylontech modules (~10 kWh) from dropping to 20 or 30% state of charge, which noticeably extends its life.',
      ),
      l(
        'Côté budget, Sylvain chiffre la partie hydraulique du site B à environ **3 000 €**. Elle a tout son sens en montagne, où le solaire d’hiver est faible ; dans une région très ensoleillée avec un ruisseau maigre, des panneaux et des batteries peuvent suffire. Le scénario « nuit d’hiver » montre la turbine porter seule la maison.',
        'Budget-wise, Sylvain puts the hydro part of site B at about **3,000 €**. It makes full sense in the mountains, where winter solar is weak; in a very sunny region with a meagre stream, panels and batteries may be enough. The “winter night” scenario shows the turbine carrying the house on its own.',
      ),
    ],
    figures: [
      fig('Solaire', 'Solar', l('4,5 kWc', '4.5 kWp')),
      fig('Batteries', 'Batteries', '≈ 10 kWh'),
      fig('Turbine', 'Turbine', l('250–300 W, jusqu’à 500 W', '250–300 W, up to 500 W')),
      fig('Partie hydro', 'Hydro part', '≈ 3 000 €'),
    ],
    formula: 'E = P × 24 h   (300 W → 7.2 kWh)',
    focus: { scene: 'site', part: 'pv', preset: 'siteB', scenario: 'winterNight' },
    video: '15:05',
    quiz: [
      {
        q: l(
          'Combien d’énergie par jour une turbine de 300 W produit-elle ?',
          'How much energy does a 300 W turbine produce per day?',
        ),
        choices: [l('0,3 kWh', '0.3 kWh'), l('≈ 2,4 kWh', '≈ 2.4 kWh'), l('≈ 7,2 kWh', '≈ 7.2 kWh')],
        answer: 2,
        explain: l(
          '300 W × 24 h = 7 200 Wh. C’est la force de l’hydro : une puissance modeste, mais sans interruption.',
          '300 W × 24 h = 7,200 Wh. That is the strength of hydro: modest power, but without interruption.',
        ),
      },
      {
        q: l(
          'Pourquoi la turbine prolonge-t-elle la vie des batteries ?',
          'Why does the turbine extend the batteries’ life?',
        ),
        choices: [
          l('Elle les refroidit', 'It cools them'),
          l('Elle les empêche de descendre à 20–30 % de charge', 'It keeps them from dropping to 20–30% charge'),
          l('Elle augmente leur capacité', 'It increases their capacity'),
        ],
        answer: 1,
        explain: l(
          'Des décharges moins profondes usent beaucoup moins les cellules : la recharge continue de la turbine évite les creux profonds de fin de nuit.',
          'Shallower discharges wear the cells far less: the turbine’s continuous charge avoids deep troughs at the end of the night.',
        ),
      },
    ],
  },
  {
    id: 'water-hammer',
    title: l('Le coup de bélier', 'Water hammer'),
    summary: l(
      'Fermer une vanne trop vite peut faire éclater une conduite.',
      'Closing a valve too fast can burst a pipe.',
    ),
    body: [
      l(
        'Dans la conduite du site A, 350 m d’eau, soit plus de **800 kg**, avancent à 0,5 à 0,8 m/s. Fermer brutalement une vanne revient à arrêter net ce train d’eau : son énergie se transforme en une **onde de surpression** qui remonte la conduite à la vitesse du son dans le tuyau.',
        'In site A’s penstock, 350 m of water, more than **800 kg**, moves at 0.5–0.8 m/s. Slamming a valve shut means stopping this train of water dead: its energy turns into a **pressure wave** that travels back up the pipe at the speed of sound in the pipe.',
      ),
      l(
        'La formule de **Joukowsky** donne la surpression : **Δp = ρ·a·Δv**. Dans le PEHD, souple, l’onde voyage à a ≈ 300 à 400 m/s. À 1,8 L/s (v ≈ 0,76 m/s), Δp ≈ 1000 × 350 × 0,76 ≈ **2,7 bar**, qui s’ajoutent aux 7,4 bar statiques : plus de **10 bar**, au-delà du PN10 de la conduite.',
        'The **Joukowsky** formula gives the surge: **Δp = ρ·a·Δv**. In flexible HDPE the wave travels at a ≈ 300–400 m/s. At 1.8 L/s (v ≈ 0.76 m/s), Δp ≈ 1000 × 350 × 0.76 ≈ **2.7 bar**, on top of the 7.4 bar static: more than **10 bar**, beyond the pipe’s PN10 rating.',
      ),
      l(
        'La parade est simple : **fermer lentement**. Si la fermeture dure bien plus longtemps que l’aller-retour de l’onde (2L/a ≈ 2 s pour 350 m), la surpression devient négligeable. En pratique, on compte au moins 20 secondes pour une vanne quart de tour, ou l’on installe une **vanne à réducteur** qui rend la fermeture brutale impossible, comme sur la vanne principale de notre turbine.',
        'The cure is simple: **close slowly**. If closing takes much longer than the wave’s round trip (2L/a ≈ 2 s for 350 m), the surge becomes negligible. In practice, allow at least 20 seconds for a quarter-turn valve, or fit a **gear-operated valve** that makes a sudden closure impossible, as on our turbine’s main valve.',
      ),
      l(
        'Les injecteurs à pointeau se ferment lentement par construction, et le **déflecteur**, protection classique des Pelton industrielles que porte aussi notre turbine, coupe la puissance sans toucher au débit. L’air piégé est l’autre danger : une poche comprimée puis chassée provoque elle aussi des pics. Quand Sylvain évoque des raccords qui ont « pété » par excès de pression, ces surpressions sont les suspects habituels.',
        'Spear injectors close slowly by design, and the **deflector**, the classic protection of industrial Pelton turbines that ours also carries, cuts the power without touching the flow. Trapped air is the other danger: a pocket that is compressed then expelled also causes spikes. When Sylvain mentions fittings that “blew” from too much pressure, these surges are the usual suspects.',
      ),
    ],
    figures: [
      fig('Célérité (PEHD)', 'Wave speed (HDPE)', '≈ 300–400 m/s'),
      fig('Aller-retour 2L/a', 'Round trip 2L/a', '≈ 2 s'),
      fig('Surpression à 1,8 L/s', 'Surge at 1.8 L/s', '≈ 2,7 bar'),
      fig('Fermeture conseillée', 'Recommended closing time', '≥ 20 s'),
    ],
    formula: 'Δp = ρ · a · Δv   ;   T_c = 2L / a',
    focus: { scene: 'turbine', part: 'valve-main', scenario: 'waterHammer' },
    video: '03:15',
    quiz: [
      {
        q: l(
          'Pourquoi fermer une vanne en 20 s plutôt qu’en 0,2 s ?',
          'Why close a valve over 20 s rather than 0.2 s?',
        ),
        choices: [
          l('Pour économiser l’eau', 'To save water'),
          l(
            'Pour que la fermeture dure bien plus que 2L/a et que la surpression reste faible',
            'So that closing takes much longer than 2L/a and the surge stays small',
          ),
          l('Pour ménager la poignée', 'To spare the handle'),
        ],
        answer: 1,
        explain: l(
          'Plus lente que l’aller-retour de l’onde, la fermeture laisse le temps aux réflexions d’amortir la surpression au lieu de l’empiler.',
          'Slower than the wave’s round trip, the closure gives reflections time to damp the surge instead of stacking it up.',
        ),
      },
      {
        q: l(
          'Dans un tube acier (a ≈ 1 200 m/s), le même arrêt brutal donnerait une surpression…',
          'In a steel pipe (a ≈ 1,200 m/s), the same sudden stop would give a surge that is…',
        ),
        choices: [
          l('plus faible', 'smaller'),
          l('identique', 'the same'),
          l('environ trois fois plus forte', 'about three times larger'),
        ],
        answer: 2,
        explain: l(
          'Δp est proportionnelle à a : 1 200 / 350 ≈ 3,4. La souplesse du PEHD est un atout face au coup de bélier.',
          'Δp is proportional to a: 1,200 / 350 ≈ 3.4. The flexibility of HDPE is an asset against water hammer.',
        ),
      },
    ],
  },
  {
    id: 'maintenance',
    title: l('Entretien et réglementation', 'Maintenance and regulations'),
    summary: l(
      '« Tout ce qui bouge casse » : quoi surveiller, et quand.',
      '“Everything that moves breaks”: what to check, and when.',
    ),
    body: [
      l(
        'Une Pelton bien conçue demande peu : selon Sylvain, les **roulements** durent 3 à 5 ans, voire plus, alors que la roue tourne nuit et jour vers 1 500 à 1 900 tr/min. Un roulement coûte une dizaine d’euros, il y en a trois, et avec les **joints** l’entretien revient à 50 ou 60 € de pièces tous les 3 à 5 ans. Le modèle commercial monte trois roulements SKF en opposition, annoncés sans entretien pendant au moins 4 ans.',
        'A well-designed Pelton asks for little: according to Sylvain, the **bearings** last 3 to 5 years or more, while the runner spins day and night at about 1,500–1,900 rpm. A bearing costs around ten euros, there are three of them, and with the **seals** the service comes to 50–60 € of parts every 3 to 5 years. The commercial model uses three SKF bearings in opposed mounting, claimed maintenance-free for at least 4 years.',
      ),
      l(
        'Au quotidien, la priorité est la **prise d’eau** : un coup de brosse par trimestre sur la grille Coanda, plus après les crues, et un coup d’œil au débordement. Le **manomètre** est le meilleur outil de diagnostic : si l’écart entre pression statique et pression en marche grandit, quelque chose s’encrasse.',
        'Day to day, the priority is the **intake**: a brush stroke every quarter on the Coanda screen, plus after floods, and a glance at the overflow. The **pressure gauge** is the best diagnostic tool: if the gap between static and running pressure grows, something is fouling.',
      ),
      l(
        'Une fois par an : augets (arête centrale, fissures au pied), couple de la bague de serrage, cloison (traces d’eau côté générateur), collages PVC et bornes électriques. L’oreille aide beaucoup : un roulement fatigué grogne bien avant de lâcher.',
        'Once a year: buckets (splitter edge, cracks at the root), clamping-ring torque, partition (water traces on the generator side), PVC joints and electrical terminals. Your ears help a lot: a tired bearing growls long before it fails.',
      ),
      l(
        'Côté **réglementation**, en France, détourner l’eau d’un ruisseau, même pour la rendre plus bas, relève du droit de l’eau, comme pour les moulins. Avant tout projet, adressez-vous à la **DDT** et à l’**OFB** : débit réservé, continuité écologique et autorisation éventuelle se discutent en amont.',
        'As for **regulations**, in France diverting water from a stream, even to return it further down, falls under water law, just as for mills. Before any project, contact the **DDT** (departmental land office) and the **OFB** (French biodiversity agency): reserved flow, ecological continuity and any authorisation are settled up front.',
      ),
    ],
    figures: [
      fig('Roulements', 'Bearings', l('3 à 5 ans', '3–5 years')),
      fig('Pièces', 'Parts', '≈ 50–60 €'),
      fig('Grille Coanda', 'Coanda screen', l('1 fois par trimestre', 'once a quarter')),
      fig('Interlocuteurs', 'Authorities', 'DDT + OFB'),
    ],
    focus: { scene: 'turbine', part: 'bearing-1' },
    video: '04:05',
    quiz: [
      {
        q: l(
          'À quelle fréquence faut-il changer roulements et joints selon Sylvain ?',
          'How often should bearings and seals be replaced according to Sylvain?',
        ),
        choices: [
          l('Tous les ans', 'Every year'),
          l('Tous les 3 à 5 ans', 'Every 3 to 5 years'),
          l('Tous les 15 ans', 'Every 15 years'),
        ],
        answer: 1,
        explain: l(
          '3 à 5 ans selon la vitesse de rotation, pour environ 50 à 60 € de pièces.',
          '3 to 5 years depending on rotational speed, for about 50–60 € of parts.',
        ),
      },
      {
        q: l(
          'Qui contacter avant d’installer une micro-turbine sur un ruisseau en France ?',
          'Who should be contacted before installing a micro turbine on a stream in France?',
        ),
        choices: [
          l('Personne, c’est libre', 'Nobody, it is unrestricted'),
          l('La DDT et l’OFB', 'The DDT and the OFB'),
          l('Uniquement le fournisseur d’électricité', 'Only the electricity supplier'),
        ],
        answer: 1,
        explain: l(
          'L’usage de l’eau est réglementé : la DDT instruit les dossiers, l’OFB veille aux milieux aquatiques.',
          'Water use is regulated: the DDT handles the applications, the OFB looks after aquatic environments.',
        ),
      },
    ],
  },
  {
    id: 'industrial',
    title: l('Une turbine pensée pour durer', 'A turbine designed to last'),
    summary: l(
      'Sécurité, entretien, fabrication : les choix qui rendent la turbine fiable et à la portée d’un maker.',
      'Safety, servicing, manufacturing: the choices that make the turbine reliable and still within a maker’s reach.',
    ),
    body: [
      l(
        'Une turbine tourne nuit et jour, souvent sur un site isolé : il faut que chaque exemplaire soit **reproductible**, **sûr** et **rapide à entretenir**, sans pour autant tout usiner. Les choix présentés ici sont **notre conception**, inspirée de la turbine de la vidéo : ce n’est pas un produit Hydronome.',
        'A turbine runs day and night, often on an isolated site: every unit has to be **repeatable**, **safe** and **quick to service**, without machining everything. The choices shown here are **our own design**, inspired by the turbine in the video: it is not a Hydronome product.',
      ),
      l(
        '**Sécurité d’abord** : un **déflecteur de jet** à ressort, retenu par une gâche électrique à manque de courant, bascule dans le jet en moins d’une demi-seconde si la charge disparaît. Le débit continue, donc pas de coup de bélier, et la roue ralentit. Une **ventouse** et une **vanne à réducteur** traitent l’air et les surpressions à la source.',
        '**Safety first**: a spring-loaded **jet deflector**, held by a fail-safe electric latch, swings into the jet in under half a second if the load disappears. The flow keeps going, so there is no water hammer, and the runner slows down. An **air-release valve** and a **gear-operated valve** deal with air and surges at the source.',
      ),
      l(
        '**Fabrication et entretien** : tôle découpée laser à languettes et encoches, écrous sertis PEM, **cartouche de palier** interchangeable en dix minutes, grenouillères sur joint captif, injecteur à **inserts rapides** et kits d’augets assortis, roue équilibrée sur gabarit.',
        '**Manufacturing and servicing**: laser-cut sheet with tabs and slots, PEM self-clinching nuts, a **bearing cartridge** swapped in ten minutes, toggle latches on a captive gasket, a **quick-change insert** injector with matched bucket kits, and a runner balanced on a jig.',
      ),
      l(
        '**Qualité et suivi** : épreuve hydraulique à 1,5 × PN, rodage consigné, tableau des couples, pièces repérées par QR code et **capteurs** (pression, vitesse, température) remontés au GX. Tout reste à la portée d’un atelier avec une imprimante 3D, une perceuse à colonne et un sous-traitant de découpe laser.',
        '**Quality and monitoring**: pressure test at 1.5 × PN, logged run-in, a torque table, QR-coded parts and **sensors** (pressure, speed, temperature) reporting to the GX. Everything stays within reach of a workshop with a 3D printer, a pillar drill and a laser-cutting subcontractor.',
      ),
    ],
    figures: [
      fig('Déflecteur', 'Deflector', '< 0,5 s'),
      fig('Échange de palier', 'Bearing swap', '≈ 10 min'),
      fig('Épreuve', 'Pressure test', '1,5 × PN'),
      fig('Inserts de buse', 'Nozzle inserts', 'Ø 4–14 mm'),
    ],
    focus: { scene: 'turbine', part: 'deflector' },
    video: '03:35',
    quiz: [
      {
        q: l(
          'Pourquoi un déflecteur plutôt qu’une fermeture de vanne en cas de perte de charge ?',
          'Why a deflector rather than closing a valve when the load is lost?',
        ),
        choices: [
          l('Il est moins cher', 'It is cheaper'),
          l(
            'Il coupe la puissance en 0,5 s sans arrêter l’eau, donc sans coup de bélier',
            'It cuts the power in 0.5 s without stopping the water, so without water hammer',
          ),
          l('Il améliore le rendement', 'It improves efficiency'),
        ],
        answer: 1,
        explain: l(
          'Fermer une vanne en 0,5 s provoquerait un coup de bélier. Dévier le jet retire la puissance instantanément tout en laissant l’eau couler.',
          'Closing a valve in 0.5 s would cause water hammer. Deflecting the jet removes the power instantly while letting the water flow.',
        ),
      },
      {
        q: l(
          'Quel est le principal intérêt de la cartouche de palier ?',
          'What is the main benefit of the bearing cartridge?',
        ),
        choices: [
          l(
            'Changer roulements et joint d’un bloc en dix minutes, sans presse sur place',
            'Swapping bearings and seal as one unit in ten minutes, with no press on site',
          ),
          l('Augmenter la vitesse de rotation', 'Increasing the rotational speed'),
          l('Supprimer le joint à lèvre', 'Doing away with the lip seal'),
        ],
        answer: 0,
        explain: l(
          'Les pièces d’usure sont regroupées et prémontées à l’atelier : l’intervention sur site devient un simple échange standard.',
          'The wear parts are grouped and pre-assembled on the bench: the site visit becomes a simple unit swap.',
        ),
      },
    ],
  },
];

export const LESSONS: Lesson[] = [...LESSONS_1, ...LESSONS_2, ...LESSONS_3];
