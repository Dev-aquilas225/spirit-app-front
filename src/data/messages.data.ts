import type { Language } from '../types/auth.types';
import { SpiritualMessage } from '../types/content.types';
import { getCurrentLanguage } from '../utils/helpers';

// Sélection par index du jour de l'année — change chaque jour automatiquement
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

const MESSAGES_FR: { content: string; verse: string }[] = [
  { content: "Dieu t'a placé là où tu es pour une raison. Ne laisse pas les circonstances te définir — laisse Sa présence te transformer.", verse: 'Jérémie 29:11' },
  { content: 'La paix que tu cherches ne se trouve pas dans les circonstances, mais dans la présence de Celui qui tient toutes choses.', verse: 'Philippiens 4:7' },
  { content: "Chaque matin est une nouvelle opportunité de te rapprocher de Dieu. N'attends pas que les choses soient parfaites pour prier.", verse: 'Lamentations 3:22-23' },
  { content: "L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages.", verse: 'Psaume 23:1-2' },
  { content: "Ne crains rien, car je suis avec toi ; ne te laisse pas abattre, car je suis ton Dieu.", verse: 'Ésaïe 41:10' },
  { content: "Remets ton sort à l'Éternel, mets en lui ta confiance, et il agira.", verse: 'Psaume 37:5' },
  { content: "Je puis tout par celui qui me fortifie.", verse: 'Philippiens 4:13' },
  { content: "L'Éternel est proche de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement.", verse: 'Psaume 34:19' },
  { content: "Cherchez premièrement le royaume et la justice de Dieu ; toutes ces choses vous seront données par-dessus.", verse: 'Matthieu 6:33' },
  { content: "Dieu est notre refuge et notre force, un secours qui ne manque jamais dans la détresse.", verse: 'Psaume 46:2' },
  { content: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", verse: 'Proverbes 3:5' },
  { content: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", verse: 'Matthieu 11:28' },
  { content: "Dieu n'a pas donné un esprit de crainte, mais un esprit de force, d'amour et de sagesse.", verse: '2 Timothée 1:7' },
  { content: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.", verse: 'Psaume 119:105' },
  { content: "Toutes choses concourent au bien de ceux qui aiment Dieu.", verse: 'Romains 8:28' },
  { content: "Soyez dans la joie, priez sans cesse, rendez grâces en toutes choses.", verse: '1 Thessaloniciens 5:16-18' },
  { content: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", verse: 'Psaume 27:1' },
  { content: "Approchez-vous de Dieu, et il s'approchera de vous.", verse: 'Jacques 4:8' },
  { content: "Soyez forts et courageux. Ne craignez point, car l'Éternel, ton Dieu, est avec toi.", verse: 'Josué 1:9' },
  { content: "Que la paix de Dieu, qui surpasse toute intelligence, garde vos cœurs et vos pensées.", verse: 'Philippiens 4:7' },
  { content: "Celui qui a commencé en vous cette bonne œuvre la rendra parfaite jusqu'au jour de Jésus-Christ.", verse: 'Philippiens 1:6' },
  { content: "L'Éternel bénira ton entrée et ta sortie, dès maintenant et à jamais.", verse: 'Psaume 121:8' },
  { content: "Fortifiez-vous dans le Seigneur et par sa force toute-puissante.", verse: 'Éphésiens 6:10' },
  { content: "Heureux ceux qui ont faim et soif de la justice, car ils seront rassasiés.", verse: 'Matthieu 5:6' },
  { content: "L'Éternel est bon, il est un refuge au jour de la détresse.", verse: 'Nahum 1:7' },
  { content: "Dieu est fidèle, et il ne permettra pas que vous soyez tentés au-delà de vos forces.", verse: '1 Corinthiens 10:13' },
  { content: "L'amour de Dieu a été répandu dans nos cœurs par le Saint-Esprit qui nous a été donné.", verse: 'Romains 5:5' },
  { content: "Ceux qui espèrent en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.", verse: 'Ésaïe 40:31' },
  { content: "Heureux ceux qui ont le cœur pur, car ils verront Dieu.", verse: 'Matthieu 5:8' },
  { content: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.", verse: 'Psaume 91:1' },
];

const MESSAGES_EN: { content: string; verse: string }[] = [
  { content: 'God placed you where you are for a reason. Do not let circumstances define you — let His presence transform you.', verse: 'Jeremiah 29:11' },
  { content: 'The peace you seek is not found in circumstances, but in the presence of the One who holds all things together.', verse: 'Philippians 4:7' },
  { content: 'Every morning is a new opportunity to draw closer to God. Do not wait for everything to be perfect before you pray.', verse: 'Lamentations 3:22-23' },
  { content: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.', verse: 'Psalm 23:1-2' },
  { content: 'Fear not, for I am with you; be not dismayed, for I am your God.', verse: 'Isaiah 41:10' },
  { content: 'Commit your way to the Lord; trust in him, and he will act.', verse: 'Psalm 37:5' },
  { content: 'I can do all things through him who strengthens me.', verse: 'Philippians 4:13' },
  { content: 'The Lord is near to the brokenhearted and saves the crushed in spirit.', verse: 'Psalm 34:18' },
  { content: 'Seek first the kingdom of God and his righteousness, and all these things will be added to you.', verse: 'Matthew 6:33' },
  { content: 'God is our refuge and strength, a very present help in trouble.', verse: 'Psalm 46:1' },
  { content: 'Trust in the Lord with all your heart, and do not lean on your own understanding.', verse: 'Proverbs 3:5' },
  { content: 'Come to me, all who labor and are heavy laden, and I will give you rest.', verse: 'Matthew 11:28' },
  { content: 'God gave us a spirit not of fear but of power and love and self-control.', verse: '2 Timothy 1:7' },
  { content: 'Your word is a lamp to my feet and a light to my path.', verse: 'Psalm 119:105' },
  { content: 'All things work together for good for those who love God.', verse: 'Romans 8:28' },
];

// Prières du jour — 30 prières longues avec 10 déclarations chacune, varient chaque jour
export interface DailyPrayer {
  title: string;
  intro: string;
  declarations: string[];
  closing: string;
  verse: string;
  verseRef: string;
}

export const DAILY_PRAYERS_FR: DailyPrayer[] = [
  {
    title: "Prière de Protection Divine",
    intro: "Seigneur Dieu Tout-Puissant, je me présente devant Toi en ce jour avec un cœur reconnaissant. Tu es mon bouclier, ma forteresse et mon refuge. Je déclare à voix haute et avec foi :",
    declarations: [
      "Je déclare que je suis couvert par le sang précieux de Jésus-Christ et qu'aucune arme forgée contre moi ne prospérera !",
      "Je déclare que les anges de l'Éternel campent autour de moi et me délivrent de tout mal !",
      "Je déclare que je marche sous la protection divine et que le Seigneur garde mon entrée et ma sortie !",
      "Je déclare que la peur n'a aucune emprise sur moi car Dieu ne m'a pas donné un esprit de crainte mais de puissance !",
      "Je déclare que ma famille est protégée, mon foyer est sanctifié et la paix de Dieu règne chez moi !",
      "Je déclare que je suis à l'abri du Très-Haut et que je repose à l'ombre du Tout-Puissant !",
      "Je déclare que le Seigneur est ma lumière et mon salut, de qui aurais-je crainte ?",
      "Je déclare que je marche dans la faveur de Dieu et que Sa grâce me précède partout où je vais !",
      "Je déclare que les plans de l'ennemi contre ma vie sont déjoués et réduits à néant au nom de Jésus !",
      "Je déclare que cette journée est bénie, protégée et placée entre les mains du Seigneur Tout-Puissant !",
    ],
    closing: "Père, je Te confie cette journée. Que Ta volonté soit faite. Amen.",
    verse: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.",
    verseRef: "Psaume 91:1",
  },
  {
    title: "Prière de Percée et de Victoire",
    intro: "Père céleste, je viens à Toi avec foi et détermination. Tu es le Dieu des percées, le Dieu qui ouvre des portes que nul ne peut fermer. Je prends autorité sur tout obstacle et je déclare à voix haute :",
    declarations: [
      "Je déclare que cette saison est ma saison de percée et que rien ne peut retenir les bénédictions que Dieu a préparées pour moi !",
      "Je déclare que toutes les portes fermées dans ma vie s'ouvrent maintenant au nom de Jésus-Christ !",
      "Je déclare que je suis plus que vainqueur par Celui qui m'a aimé et que la victoire est déjà mienne !",
      "Je déclare que chaque montagne dans ma vie est déplacée et jetée à la mer par la puissance de ma foi !",
      "Je déclare que les chaînes qui me retenaient sont brisées et que je marche dans la liberté totale que Christ m'a acquise !",
      "Je déclare que ma percée financière, professionnelle et spirituelle est en route et rien ne peut l'arrêter !",
      "Je déclare que je suis la tête et non la queue, que je suis en haut et non en bas selon la Parole de Dieu !",
      "Je déclare que le Seigneur combat pour moi et que je n'ai qu'à me tenir ferme et voir Sa délivrance !",
      "Je déclare que cette année est mon année de faveur divine et que les portes du ciel s'ouvrent sur ma vie !",
      "Je déclare que je marche de victoire en victoire, de gloire en gloire, par la grâce de Dieu Tout-Puissant !",
    ],
    closing: "Seigneur, je Te remercie pour la victoire déjà remportée. Je marche par la foi et non par la vue. Amen.",
    verse: "Je puis tout par celui qui me fortifie.",
    verseRef: "Philippiens 4:13",
  },
  {
    title: "Prière de Guérison et de Restauration",
    intro: "Seigneur Jésus, Tu es le même hier, aujourd'hui et éternellement. Tu es le Dieu qui guérit toutes mes maladies et qui rachète ma vie de la fosse. Je me tiens devant Toi et je déclare avec foi :",
    declarations: [
      "Je déclare que par les meurtrissures de Jésus-Christ, je suis guéri et restauré dans mon corps, mon âme et mon esprit !",
      "Je déclare que la maladie n'a aucun droit sur mon corps car mon corps est le temple du Saint-Esprit !",
      "Je déclare que la puissance de guérison de Dieu circule en moi maintenant et restaure chaque cellule de mon corps !",
      "Je déclare que je rejette toute infirmité, toute douleur et toute maladie au nom de Jésus-Christ de Nazareth !",
      "Je déclare que Dieu restaure ma santé et me guérit de toutes mes plaies selon Sa Parole !",
      "Je déclare que ma guérison est complète, totale et permanente car Dieu est fidèle à Ses promesses !",
      "Je déclare que je vis et ne mourrai pas et que je proclamerai les œuvres de l'Éternel !",
      "Je déclare que la joie du Seigneur est ma force et que cette joie contribue à ma guérison et à ma santé !",
      "Je déclare que Dieu renouvelle ma jeunesse comme l'aigle et que je marche dans une santé divine !",
      "Je déclare que je suis entier, guéri et restauré par la grâce et la puissance du Dieu Vivant !",
    ],
    closing: "Père, je Te remercie pour Ta guérison. Je reçois Ta santé divine par la foi. Amen.",
    verse: "C'est lui qui pardonne toutes tes iniquités, qui guérit toutes tes maladies.",
    verseRef: "Psaume 103:3",
  },
  {
    title: "Prière de Prospérité et d'Abondance",
    intro: "Dieu de l'abondance, Tu as dit que Tu veux que je prospère et que je sois en bonne santé comme mon âme prospère. Je viens à Toi avec foi et je déclare à voix haute :",
    declarations: [
      "Je déclare que Dieu pourvoit à tous mes besoins selon Sa richesse en gloire en Jésus-Christ !",
      "Je déclare que je suis béni à mon entrée et béni à ma sortie, béni dans la ville et béni dans les champs !",
      "Je déclare que la prospérité divine coule dans ma vie comme un fleuve et que mes greniers sont remplis !",
      "Je déclare que je donne généreusement et que Dieu me rend au centuple selon Sa promesse immuable !",
      "Je déclare que toutes mes dettes sont effacées et que je marche dans la liberté financière que Dieu a préparée pour moi !",
      "Je déclare que mes projets prospèrent car le Seigneur est avec moi et bénit tout ce que j'entreprends !",
      "Je déclare que je suis la tête et non la queue dans les affaires et que la faveur de Dieu m'ouvre des portes extraordinaires !",
      "Je déclare que l'esprit de pauvreté est brisé sur ma vie et que j'entre dans l'abondance que Christ m'a acquise !",
      "Je déclare que mes enfants et ma famille marchent dans la prospérité et la bénédiction de génération en génération !",
      "Je déclare que je suis un canal de bénédiction pour les autres et que Dieu multiplie tout ce que je touche !",
    ],
    closing: "Seigneur, je Te remercie pour Ta provision. Je reçois Ta prospérité par la foi. Amen.",
    verse: "Mon Dieu pourvoira à tous vos besoins selon sa richesse, avec gloire, en Jésus-Christ.",
    verseRef: "Philippiens 4:19",
  },
  {
    title: "Prière pour la Famille et le Foyer",
    intro: "Père céleste, Tu as institué la famille comme fondement de la société. Je viens intercéder pour mon foyer et mes proches. Je déclare avec autorité et foi :",
    declarations: [
      "Je déclare que mon foyer est sanctifié et consacré à Dieu et que le Seigneur règne en maître dans ma maison !",
      "Je déclare que la paix de Dieu qui surpasse toute intelligence garde les cœurs et les esprits de ma famille !",
      "Je déclare que mes enfants sont des disciples de l'Éternel et que leur paix est grande selon la Parole de Dieu !",
      "Je déclare que l'unité, l'amour et le respect règnent dans mon foyer et que toute division est rejetée !",
      "Je déclare que mon mariage est béni, restauré et fortifié par la grâce de Dieu Tout-Puissant !",
      "Je déclare que mes parents sont protégés, en bonne santé et couverts par la faveur divine !",
      "Je déclare que toute malédiction familiale est brisée au nom de Jésus et que ma lignée est libérée !",
      "Je déclare que mes enfants marchent dans la sagesse, la grâce et la faveur de Dieu toute leur vie !",
      "Je déclare que mon foyer est un lieu de refuge, de paix et de présence divine pour tous ceux qui y entrent !",
      "Je déclare que ma famille sert le Seigneur de génération en génération selon la promesse faite à Abraham !",
    ],
    closing: "Seigneur, je Te confie ma famille. Protège-la, bénis-la et garde-la dans Ta main. Amen.",
    verse: "Moi et ma maison, nous servirons l'Éternel.",
    verseRef: "Josué 24:15",
  },
  {
    title: "Prière de Sagesse et de Direction Divine",
    intro: "Dieu de toute sagesse, Tu es la source de toute connaissance et de tout discernement. Je viens à Toi pour recevoir Ta direction dans ma vie. Je déclare à voix haute avec foi :",
    declarations: [
      "Je déclare que Dieu me donne la sagesse, l'intelligence et la connaissance pour prendre les bonnes décisions !",
      "Je déclare que le Saint-Esprit me guide dans toute la vérité et m'éclaire sur le chemin que je dois prendre !",
      "Je déclare que j'ai l'esprit de sagesse et de révélation dans la connaissance de Dieu selon Éphésiens 1:17 !",
      "Je déclare que je ne marche pas selon ma propre compréhension mais que je m'appuie entièrement sur Dieu !",
      "Je déclare que Dieu dirige mes pas et que même mes erreurs sont transformées en bénédictions par Sa grâce !",
      "Je déclare que j'ai la sagesse pour gérer mes finances, mes relations et mes responsabilités avec excellence !",
      "Je déclare que je reconnais la voix de Dieu et que je suis sensible aux directions du Saint-Esprit !",
      "Je déclare que la sagesse divine m'ouvre des portes que la sagesse humaine ne peut pas ouvrir !",
      "Je déclare que je prends des décisions alignées avec la volonté de Dieu et que ces décisions me mènent vers la destinée divine !",
      "Je déclare que je marche dans la lumière de la Parole de Dieu et que cette lumière illumine chacun de mes pas !",
    ],
    closing: "Père, guide mes pas aujourd'hui. Que Ta sagesse soit ma sagesse. Amen.",
    verse: "Si quelqu'un d'entre vous manque de sagesse, qu'il la demande à Dieu, qui donne à tous généreusement.",
    verseRef: "Jacques 1:5",
  },
  {
    title: "Prière de Délivrance et de Liberté",
    intro: "Seigneur Jésus, Tu es venu pour libérer les captifs et proclamer la délivrance aux prisonniers. Je viens à Toi pour recevoir ma liberté totale. Je déclare avec autorité :",
    declarations: [
      "Je déclare que je suis libre par le sang de Jésus-Christ et qu'aucune chaîne ne peut me retenir !",
      "Je déclare que toute addiction, toute habitude destructrice et tout esclavage sont brisés dans ma vie au nom de Jésus !",
      "Je déclare que l'esprit de dépression, d'anxiété et de découragement est chassé de ma vie maintenant !",
      "Je déclare que je suis délivré de toute oppression spirituelle et que je marche dans la liberté totale de Christ !",
      "Je déclare que toute malédiction prononcée contre moi est annulée et retournée au nom de Jésus-Christ !",
      "Je déclare que les liens du passé sont brisés et que je marche dans la nouveauté de vie que Dieu m'a donnée !",
      "Je déclare que je suis délivré de la peur, du doute et de l'incrédulité et que ma foi est forte comme un roc !",
      "Je déclare que toute œuvre des ténèbres dans ma vie est exposée et détruite par la lumière de Dieu !",
      "Je déclare que je suis libre pour adorer Dieu, libre pour servir et libre pour accomplir ma destinée divine !",
      "Je déclare que là où l'Esprit du Seigneur est, là est la liberté, et cet Esprit habite en moi pleinement !",
    ],
    closing: "Seigneur, je reçois ma délivrance complète. Je suis libre au nom de Jésus. Amen.",
    verse: "Si donc le Fils vous affranchit, vous serez réellement libres.",
    verseRef: "Jean 8:36",
  },
  {
    title: "Prière pour les Projets et la Réussite",
    intro: "Dieu de l'excellence, Tu as créé l'homme pour dominer et réussir. Je viens à Toi avec mes projets et mes ambitions, sachant que Tu es le Dieu qui fait réussir. Je déclare :",
    declarations: [
      "Je déclare que tous mes projets sont bénis de Dieu et qu'ils prospèrent selon Sa volonté parfaite !",
      "Je déclare que la faveur divine m'ouvre des portes extraordinaires dans ma carrière et mes entreprises !",
      "Je déclare que j'ai l'esprit d'excellence comme Daniel et que je me distingue dans tout ce que j'entreprends !",
      "Je déclare que les bonnes personnes, les bonnes opportunités et les bonnes ressources viennent à moi au bon moment !",
      "Je déclare que mes études, mon travail et mes projets sont couronnés de succès par la grâce de Dieu !",
      "Je déclare que je suis créatif, innovant et inspiré par le Saint-Esprit dans tout ce que je fais !",
      "Je déclare que les obstacles sur mon chemin professionnel sont transformés en tremplins par la puissance de Dieu !",
      "Je déclare que je suis reconnu, promu et honoré dans mon domaine car la main de Dieu est sur moi !",
      "Je déclare que mes concurrents ne peuvent pas me surpasser car Dieu est mon avantage compétitif !",
      "Je déclare que je réussis non par ma force ni par ma puissance mais par l'Esprit du Seigneur des armées !",
    ],
    closing: "Père, bénis mes projets et guide mes efforts. Que Ta gloire brille à travers ma réussite. Amen.",
    verse: "Recommande à l'Éternel tes œuvres, et tes projets réussiront.",
    verseRef: "Proverbes 16:3",
  },
  {
    title: "Prière de Louange et d'Adoration",
    intro: "Seigneur, Tu es digne de toute louange, de tout honneur et de toute gloire. Je viens devant Toi avec un cœur rempli de gratitude. Je déclare à voix haute pour que les cieux et la terre entendent :",
    declarations: [
      "Je déclare que l'Éternel est grand et très digne de louange et que Sa grandeur est insondable !",
      "Je déclare que Dieu est bon, que Sa miséricorde dure à toujours et que Sa fidélité est de génération en génération !",
      "Je déclare que je loue Dieu en tout temps et que Sa louange est continuellement dans ma bouche !",
      "Je déclare que la louange est mon arme puissante et que quand je loue Dieu, mes ennemis sont mis en déroute !",
      "Je déclare que je suis créé pour la gloire de Dieu et que ma vie est un acte de louange perpétuel !",
      "Je déclare que la joie du Seigneur est ma force et que cette joie déborde dans toutes les sphères de ma vie !",
      "Je déclare que je rends grâce en toutes choses car c'est la volonté de Dieu pour moi en Jésus-Christ !",
      "Je déclare que ma louange brise les chaînes comme elle a brisé les chaînes de Paul et Silas en prison !",
      "Je déclare que je suis un adorateur en esprit et en vérité et que Dieu cherche de tels adorateurs !",
      "Je déclare que la gloire de Dieu remplit ma vie, mon foyer et tout ce qui me concerne maintenant et toujours !",
    ],
    closing: "Seigneur, reçois ma louange. Tu es digne de tout honneur. Amen.",
    verse: "Que tout ce qui respire loue l'Éternel ! Louez l'Éternel !",
    verseRef: "Psaume 150:6",
  },
  {
    title: "Prière pour les Concours et Examens",
    intro: "Dieu de toute intelligence, Tu as donné à Daniel dix fois plus de sagesse que tous les autres. Je viens à Toi avant cette épreuve importante et je déclare avec foi :",
    declarations: [
      "Je déclare que Dieu m'a donné un esprit de sagesse, d'intelligence et de connaissance pour réussir cet examen !",
      "Je déclare que ma mémoire est excellente, que je retiens tout ce que j'ai appris et que je le restitue parfaitement !",
      "Je déclare que la paix de Dieu garde mon cœur et mon esprit et que je suis calme et concentré pendant l'épreuve !",
      "Je déclare que le Saint-Esprit m'assiste et me rappelle toutes les choses que j'ai apprises !",
      "Je déclare que je suis parmi les premiers, que je me distingue et que mon résultat glorifie Dieu !",
      "Je déclare que la fatigue, le stress et l'anxiété n'ont aucune emprise sur moi car Dieu est ma force !",
      "Je déclare que les questions posées sont celles que je connais et que je réponds avec précision et excellence !",
      "Je déclare que les portes de l'avenir s'ouvrent devant moi grâce à ce succès que Dieu m'accorde !",
      "Je déclare que je suis préparé, équipé et oint par Dieu pour exceller dans ce domaine !",
      "Je déclare que ma réussite est certaine car Dieu a dit que ceux qui espèrent en Lui ne seront pas confondus !",
    ],
    closing: "Père, je remets cet examen entre Tes mains. Que Ta sagesse soit ma sagesse. Amen.",
    verse: "Dieu leur donna de la science, de l'intelligence dans toutes les lettres et dans la sagesse.",
    verseRef: "Daniel 1:17",
  },
  {
    title: "Prière de Réconciliation et de Pardon",
    intro: "Dieu d'amour et de miséricorde, Tu nous as réconciliés avec Toi par Jésus-Christ. Je viens à Toi pour recevoir et accorder le pardon. Je déclare avec un cœur ouvert :",
    declarations: [
      "Je déclare que je pardonne à tous ceux qui m'ont blessé, trahi ou fait du mal, comme Dieu m'a pardonné !",
      "Je déclare que l'amertume, la rancœur et la haine sont arrachées de mon cœur par la grâce de Dieu !",
      "Je déclare que je suis libéré du poids du passé et que je marche dans la légèreté du pardon divin !",
      "Je déclare que mes relations brisées sont restaurées par la puissance de l'amour de Dieu !",
      "Je déclare que je suis un artisan de paix et que je cherche la réconciliation là où il y a division !",
      "Je déclare que Dieu me pardonne tous mes péchés et que je marche dans la pureté de conscience !",
      "Je déclare que je ne garde pas de comptes des torts subis car l'amour de Dieu en moi couvre tout !",
      "Je déclare que la paix de Dieu règne dans toutes mes relations et que l'harmonie est restaurée !",
      "Je déclare que je suis un canal de la grâce de Dieu et que Sa miséricorde coule à travers moi vers les autres !",
      "Je déclare que le pardon que j'accorde me libère et m'ouvre les portes des bénédictions de Dieu !",
    ],
    closing: "Seigneur, aide-moi à pardonner comme Tu m'as pardonné. Restaure mes relations. Amen.",
    verse: "Supportez-vous les uns les autres et pardonnez-vous réciproquement.",
    verseRef: "Colossiens 3:13",
  },
  {
    title: "Prière pour une Nouvelle Saison",
    intro: "Dieu qui fait toutes choses nouvelles, Tu as dit que Tu allais faire une chose nouvelle et qu'elle éclaterait. Je me tiens à l'entrée de cette nouvelle saison et je déclare :",
    declarations: [
      "Je déclare que cette nouvelle saison est marquée par la faveur de Dieu et que tout change pour le mieux !",
      "Je déclare que les anciennes choses sont passées et que toutes choses sont devenues nouvelles dans ma vie !",
      "Je déclare que je laisse derrière moi les échecs, les déceptions et les douleurs du passé et que je regarde en avant !",
      "Je déclare que Dieu fait une chose nouvelle dans ma vie et que je la vois déjà se manifester !",
      "Je déclare que cette saison est ma saison de moisson et que je récolte ce que j'ai semé avec foi !",
      "Je déclare que de nouvelles opportunités, de nouvelles relations et de nouvelles bénédictions arrivent dans ma vie !",
      "Je déclare que je suis prêt pour ce que Dieu a préparé et que mon cœur est ouvert à Ses surprises divines !",
      "Je déclare que cette nouvelle saison est meilleure que toutes les précédentes car Dieu garde le meilleur pour la fin !",
      "Je déclare que je grandis spirituellement, émotionnellement et matériellement dans cette nouvelle saison !",
      "Je déclare que la gloire de cette dernière maison sera plus grande que celle de la première selon la Parole de Dieu !",
    ],
    closing: "Père, je reçois cette nouvelle saison avec joie et expectative. Fais du neuf dans ma vie. Amen.",
    verse: "Voici, je fais toutes choses nouvelles.",
    verseRef: "Apocalypse 21:5",
  },
];

const SPIRITUAL_MESSAGES_BY_LANGUAGE: Record<'fr' | 'en', SpiritualMessage[]> = {
  fr: MESSAGES_FR.map((m, i) => ({ id: `m${i}`, content: m.content, verse: m.verse, date: '' })),
  en: MESSAGES_EN.map((m, i) => ({ id: `m${i}`, content: m.content, verse: m.verse, date: '' })),
};

const MOCK_RESPONSES_BY_LANGUAGE: Record<'fr' | 'en', Record<string, string>> = {
  fr: {
    default:
      'Que la paix de Dieu soit avec vous. Votre question reflète une recherche sincère. Je vous encourage à méditer sur Psaume 23 et à confier cette préoccupation dans la prière.',
    prayer:
      "La prière est notre ligne directe avec le Père. Pour fortifier votre vie de prière, commencez par la louange, poursuivez avec la confession, puis l'intercession et enfin vos requêtes personnelles.",
    fear:
      "L'Écriture nous dit que Dieu ne nous a pas donné un esprit de crainte, mais de puissance, d'amour et de sagesse (2 Timothée 1:7). Remplacez chaque peur par une promesse de Sa Parole.",
    healing:
      'Jésus est le même hier, aujourd’hui et éternellement. Sa volonté est que vous soyez relevé — faites appel à Sa puissance par la foi et la prière.',
    dream:
      'Les rêves portent souvent des indications spirituelles. Notez-les dès le réveil, priez pour recevoir la bonne compréhension et confrontez-les toujours à la Parole.',
    family:
      'La famille est une institution divine. Priez ensemble, pratiquez le pardon et rebâtissez des fondations spirituelles solides, un jour après l’autre.',
  },
  en: {
    default:
      'May the peace of God be with you. Your question reflects a sincere search. I encourage you to meditate on Psalm 23 and bring this concern before God in prayer.',
    prayer:
      'Prayer is our direct line to the Father. To strengthen your prayer life, begin with praise, continue with confession, then intercession, and finally your personal requests.',
    fear:
      'Scripture tells us that God has not given us a spirit of fear, but of power, love and wisdom (2 Timothy 1:7). Replace each fear with a promise from His Word.',
    healing:
      'Jesus is the same yesterday, today and forever. His desire is to restore you — lean on His power through faith and prayer.',
    dream:
      'Dreams often carry spiritual direction. Write them down as soon as you wake up, pray for understanding, and always weigh them against Scripture.',
    family:
      'Family is a divine institution. Pray together, practise forgiveness, and rebuild strong spiritual foundations one day at a time.',
  },
};

function resolveLanguage(language: Language = getCurrentLanguage()): 'fr' | 'en' {
  return language === 'en' ? 'en' : 'fr';
}

export function getTodayMessage(language: Language = getCurrentLanguage()): SpiritualMessage | null {
  const selectedLanguage = resolveLanguage(language);
  const messages = SPIRITUAL_MESSAGES_BY_LANGUAGE[selectedLanguage];
  const idx = getDayOfYear() % messages.length;
  const m = messages[idx];
  return { ...m, date: new Date().toISOString().split('T')[0] };
}

export function getTodayPrayer(): DailyPrayer {
  const idx = getDayOfYear() % DAILY_PRAYERS_FR.length;
  return DAILY_PRAYERS_FR[idx];
}

export function getMockAIResponse(
  question: string,
  language: Language = getCurrentLanguage(),
): string {
  const selectedLanguage = resolveLanguage(language);
  const responses = MOCK_RESPONSES_BY_LANGUAGE[selectedLanguage];
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes('prière') ||
    lowerQuestion.includes('prier') ||
    lowerQuestion.includes('prayer') ||
    lowerQuestion.includes('pray')
  ) {
    return responses.prayer;
  }

  if (
    lowerQuestion.includes('peur') ||
    lowerQuestion.includes('angoisse') ||
    lowerQuestion.includes('anxiété') ||
    lowerQuestion.includes('fear') ||
    lowerQuestion.includes('anxiety')
  ) {
    return responses.fear;
  }

  if (
    lowerQuestion.includes('guérison') ||
    lowerQuestion.includes('maladie') ||
    lowerQuestion.includes('santé') ||
    lowerQuestion.includes('healing') ||
    lowerQuestion.includes('health')
  ) {
    return responses.healing;
  }

  if (
    lowerQuestion.includes('rêve') ||
    lowerQuestion.includes('songe') ||
    lowerQuestion.includes('vision') ||
    lowerQuestion.includes('dream')
  ) {
    return responses.dream;
  }

  if (
    lowerQuestion.includes('famille') ||
    lowerQuestion.includes('mariage') ||
    lowerQuestion.includes('enfant') ||
    lowerQuestion.includes('family') ||
    lowerQuestion.includes('marriage') ||
    lowerQuestion.includes('child')
  ) {
    return responses.family;
  }

  return responses.default;
}
