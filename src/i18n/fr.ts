type DeepReplaceLiterals<T> =
  T extends (...args: infer Args) => infer Result
    ? (...args: Args) => Result
    : T extends readonly (infer Item)[]
      ? readonly DeepReplaceLiterals<Item>[]
      : T extends object
        ? { [Key in keyof T]: DeepReplaceLiterals<T[Key]> }
        : T extends string
          ? string
          : T extends number
            ? number
            : T extends boolean
              ? boolean
              : T;

const fr = {
  common: {
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    continue: 'Continuer',
    back: 'Retour',
    retry: 'Réessayer',
    close: 'Fermer',
    yes: 'Oui',
    no: 'Non',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    send: 'Envoyer',
    read: 'Lire',
    seeAll: 'Voir tout',
    premium: 'Premium',
    free: 'Gratuit',
    days: 'jours',
    daysLeft: (n: number) => `${n}j restants`,
    subscribe: "S'abonner",
    optional: '(Optionnel)',
    required: 'Champs obligatoires',
    copy: 'Copier',
    ok: 'OK',
    understood: 'Compris !',
    refresh: 'Actualiser',
    start: 'Commencer',
  },

  auth: {
    appName: 'Oracle Plus',
    tagline: 'Votre compagnon spirituel',
    welcome: 'Bienvenue',
    loginSubtitle: 'Entrez votre numéro pour continuer',
    phonePlaceholder: '07 00 00 00 00',
    phoneLabel: 'Numéro de téléphone',
    phoneError: 'Entrez un numéro valide',
    phoneInvalid: 'Entrez un numéro valide',
    continue: 'Continuer',
    newUserInfo:
      'Nouveau sur Oracle Plus ? Votre compte sera créé automatiquement lors de la première connexion.',
    loginInfoNew:
      'Nouveau sur Oracle Plus ? Votre compte sera créé automatiquement lors de la première connexion.',
    chooseDialCode: "Choisir l'indicatif",
    pickDialCode: "Choisir l'indicatif",
    searchCountry: 'Rechercher un pays...',

    pinTitle: 'Code PIN',
    pinHint: 'Entrez votre code PIN à 4 chiffres',
    pinForgot: 'Code PIN oublié ?',

    otpTitleRegister: 'Vérifier votre numéro',
    otpTitleReset: 'Code de vérification',
    otpSubtitleRegister: 'Un code à 4 chiffres a été envoyé par SMS',
    otpSubtitleReset: 'Entrez le code reçu pour réinitialiser\nvotre mot de passe',
    otpHint: 'Code OTP à 4 chiffres',
    otpResendTimer: (seconds: number) => `Renvoyer le code dans ${seconds}s`,
    otpResend: 'Renvoyer le code',
    otpError: 'Code incorrect. Réessayez.',

    newPinTitle: 'Nouveau mot de passe',
    confirmPinTitle: 'Confirmer le code',
    newPinSubtitle: 'Choisissez un nouveau code PIN à 4 chiffres',
    confirmPinSubtitle: 'Entrez à nouveau le code pour confirmer',
    newPinHint: 'Code PIN à 4 chiffres',
    confirmPinHint: 'Répétez le même code',
    pinMismatch: 'Les codes ne correspondent pas',
    pinSetError: 'Impossible de définir le PIN. Réessayez.',

    forgotTitle: 'Mot de passe oublié',
    forgotSubtitle: 'Entrez votre numéro pour recevoir un code de vérification',
    sendCode: 'Envoyer le code',

    logoutTitle: 'Déconnexion',
    logoutMessage: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    logout: 'Se déconnecter',
  },

  completeProfile: {
    welcome: 'Bienvenue !',
    subtitle:
      'Complétez votre profil pour personnaliser votre expérience spirituelle.',
    avatarHint: 'Aperçu de votre avatar',
    firstName: 'Prénom',
    lastName: 'Nom',
    gender: 'Genre',
    firstNamePh: 'Ex : Jean',
    lastNamePh: 'Ex : Kouassi',
    male: 'Homme',
    female: 'Femme',
    other: 'Autre',
  },

  home: {
    greeting: (name: string) => `Bienvenue, ${name}`,
    todayMessage: 'MESSAGE DU JOUR',
    dailyPrayers: 'Prières du jour',
    quickAccess: 'Accès rapide',
    actions: {
      prayer: 'Prière et suivi spirituel',
      ai: 'Guide spirituel',
      library: 'Bibliothèque et formations',
      consultation: 'Se former spirituellement',
      dreams: 'Interpréter mon rêve',
      prophet: 'Consultation et orientation',
      accompagnements: 'Accompagnements 7 jours',
    },
  },

  tabs: {
    home: 'Accueil',
    consultation: 'Guide',
    library: 'Livres',
    profile: 'Profil',
  },

  prayers: {
    title: 'Prières',
    subtitle: 'Restez connecté à Dieu chaque jour',
    tabToday: "Aujourd'hui",
    tabArchive: 'Archives',
    morning: 'Matin',
    evening: 'Soir',
    loading: 'Chargement des prières...',
    empty: "Aucune prière pour aujourd'hui",
    archiveHint:
      'Sélectionnez une date passée pour retrouver les prières de ce jour.',
    noDateSelected: 'Aucune date sélectionnée',
    noArchive: 'Aucune prière enregistrée pour cette date.',
    prayerOf: (date: string) => `Prières du ${date}`,
    sectionPrayer: 'Prière',
    practiceLabel: 'PRATIQUE DU JOUR',
    quanticFreq: (hz: number) => `Fréquence quantique — ${hz} Hz`,
    loadingArchive: (date: string) => `Chargement des prières du ${date}...`,
  },

  ai: {
    headerChat: 'Guide spirituel',
    headerHistory: 'Historique',
    historySubtitle: 'Vos échanges précédents',
    badgeUnlimited: 'Messages illimités',
    badgeRemaining: (remaining: number, max: number) =>
      `${remaining}/${max} messages gratuits restants`,
    badgeLimitReached: "Limite du jour atteinte",
    emptyHistoryTitle: 'Aucune conversation',
    emptyHistoryMsg:
      'Commencez un échange avec votre guide spirituel pour retrouver votre historique ici.',
    newConversation: 'Nouvelle conversation',
    limitAlertTitle: 'Limite atteinte',
    limitAlertMsg: (limit: number) =>
      `Vous avez atteint votre limite de ${limit} questions par jour. Abonnez-vous ou choisissez un autre service.`,
    deleteTitle: 'Supprimer',
    deleteMsg: 'Cette action est irréversible.',
    emptyChatTitle: 'Bonjour, comment vas-tu ?',
    emptyChatSubtitle:
      'Je suis là pour t\'accueillir et t\'accompagner. Dis-moi comment tu vas et ce que je peux faire pour toi.',
    suggestions: [
      'Je ne vais pas bien en ce moment.',
      "J'ai une situation difficile à te soumettre.",
      'Je cherche un accompagnement spirituel.',
    ],
    typing: 'Votre guide spirituel vous répond...',
    inputLimited: 'Limite atteinte — Passez Premium',
    inputPlaceholder: 'Dis-moi comment tu vas...',
    messagesCount: (count: number, date: string) =>
      `${count} message${count > 1 ? 's' : ''} • ${date}`,
  },

  library: {
    title: 'Bibliothèque',
    subtitle: (count: number) => `${count} livres spirituels disponibles`,
    freeBanner: '1 livre gratuit · Abonnez-vous pour tout débloquer',
    sectionAbout: 'À propos',
    sectionChapters: (count: number) => `Chapitres (${count})`,
    startReading: 'Commencer la lecture',
    premiumTitle: 'Contenu Premium',
    premiumMsg:
      'Abonnez-vous pour accéder à ce livre et à toute la bibliothèque spirituelle.',
    subscribeRead: "S'abonner pour lire",
    pages: (count: number) => `${count} pages`,
    chapter: (count: number) => `Ch. ${count}`,
    prev: 'Précédent',
    next: 'Suivant',
    defaultAuthor: 'Oracle Plus',
    sessionExpired: 'Session expirée. Reconnectez-vous pour ouvrir ce livre.',
    pdfLoadError: 'Impossible de charger le PDF pour le moment.',
    readerLoading: 'Chargement du PDF...',
    readerPreparing: 'Préparation du document...',
    readerUnavailableTitle: 'Lecture indisponible',
    noDescription: 'Aucune description disponible pour ce livre.',
    formatLabel: 'Format',
    formatPdf: 'PDF',
    accessLabel: 'Accès',
    accessFree: 'Libre',
    accessSubscribers: 'Abonnés',
    statusLabel: 'Statut',
    statusAvailable: 'Disponible',
    statusLocked: 'Verrouillé',
    emptyTitle: 'Aucun livre disponible',
    emptyMsg:
      "Publiez un livre côté administration pour qu'il apparaisse ici.",
    refreshLibrary: 'Rafraîchir la bibliothèque',
  },

  profile: {
    sectionAccount: 'MON COMPTE',
    sectionSubscription: 'ABONNEMENT',
    sectionCommunity: 'COMMUNAUTÉ',
    sectionLegal: 'LÉGAL',
    editProfile: 'Modifier le profil',
    notifications: 'Notifications',
    language: 'Langue',
    subscribeCta: "S'abonner — 5 000 FCFA/mois",
    manageSubscription: 'Gérer mon abonnement',
    paymentHistory: 'Historique paiements',
    referral: 'Parrainage',
    support: 'Support',
    terms: "Conditions d'utilisation",
    privacy: 'Politique de confidentialité',
    logout: 'Se déconnecter',
    version: 'Oracle Plus v1.0.0',
    premiumBadge: (days: number) => `Membre Premium — ${days}j restants`,
    upgradeBadge: 'Passer Premium',
    editModalTitle: 'Modifier le profil',
    firstName: 'Prénom',
    lastName: 'Nom',
    firstNamePh: 'Votre prénom',
    lastNamePh: 'Votre nom',
    genre: 'Genre',
    male: 'Homme',
    female: 'Femme',
    other: 'Autre',
    langModalTitle: 'Langue',
    logoutTitle: 'Déconnexion',
    logoutMsg: 'Êtes-vous sûr de vouloir vous déconnecter ?',
  },

  subscription: {
    premiumTitle: 'Vous êtes Premium !',
    premiumSubtitle: 'Tous les accès sont déverrouillés',
    upgradeTitle: 'Oracle Plus Premium',
    upgradeSubtitle: 'Accès complet à votre accompagnement spirituel',
    price: '5 000 FCFA',
    perMonth: '/mois',
    included: 'Ce qui est inclus',
    features: {
      aiChat: 'Guide spirituel illimité',
      aiDesc: 'Échangez sans limite avec votre guide spirituel',
      library: 'Bibliothèque complète',
      libraryDesc: '4+ livres spirituels en lecture illimitée',
      formations: 'Formations',
      formDesc: 'Accès à toutes nos formations spirituelles',
      consult: 'Consultations dédiées',
      consultDesc: 'Un accompagnement réservé aux abonnés',
      prayers: 'Prières complètes',
      prayersDesc: 'Accès à toutes les prières du jour et aux archives',
      dreams: 'Interprétation des rêves',
      dreamsDesc: 'Analyse de vos rêves et visions',
      program: 'Programme personnalisé',
      programDesc: 'Un programme de prière adapté à votre vie',
    },
    subscribeCta: "S'abonner maintenant — 5 000 FCFA/mois",
    disclaimer:
      'Sans engagement • Annulable à tout moment • Renouvellement automatique',
    mySubscription: 'MON ABONNEMENT',
    status: 'Statut',
    statusActive: 'Actif',
    statusCancelled: 'Annulé',
    statusSuccess: 'Réussi',
    statusFailed: 'Échoué',
    statusPending: 'En attente',
    expiresOn: 'Expire le',
    daysLeft: 'Jours restants',
    amount: 'Montant',
    renewNow: 'Renouveler maintenant',
    manage: 'Gérer mon abonnement',
    history: 'Historique des paiements',
    startDate: 'Début',
    renewal: 'Renouvellement',
    renewalAuto: 'Automatique',
    renewalDisabled: 'Désactivé',
    emptyPaymentsTitle: 'Aucun paiement',
    emptyPaymentsMsg: 'Votre historique de paiements apparaîtra ici.',
    referenceShort: (reference: string) => `Réf: ${reference}`,
    cancelConfirmTitle: 'Annuler',
    cancelConfirmMsg:
      "Vous perdrez tous vos accès premium à la date d'expiration. Confirmez-vous ?",
    cancelKeep: 'Non, garder',
    cancelSuccessTitle: 'Abonnement annulé',
    cancelSuccessMsg: "Votre abonnement expirera à la date prévue.",

    payTitle: 'Oracle Plus Premium',
    paySubtitle: 'Accès illimité pendant 30 jours',
    payRecap: 'Récapitulatif',
    payItem: 'Abonnement Premium',
    payDuration: 'Durée',
    pay30days: '30 jours',
    payTotal: 'Total',
    payWithPaystack: 'Payer avec Paystack',
    payInitializing: 'Initialisation...',
    paySecure: 'Paiement sécurisé via Paystack',
    payOpenedInfo:
      'La page de paiement Paystack a été ouverte. Effectuez votre paiement, puis revenez ici pour confirmer.',
    payDone: "J'ai effectué le paiement",
    payVerifying: 'Vérification...',
    payReopen: 'Rouvrir la page Paystack',
    payRetry: 'Annuler et recommencer',

    successTitle: 'Paiement réussi !',
    successSubtitle: 'Bienvenue dans la famille Premium Oracle Plus',
    successAmount: 'Montant',
    successExpiry: 'Expire le',
    successRef: 'Référence',
    successExplore: "Commencer l'exploration",
    successManage: 'Voir mon abonnement',

    failureTitle: 'Paiement échoué',
    failureDefault:
      'Une erreur est survenue lors du paiement. Veuillez réessayer.',
    failureCausesTitle: 'Causes possibles :',
    failureCauses: [
      'Solde insuffisant',
      'Numéro incorrect',
      'Connexion instable',
      'Transaction refusée',
    ],
  },

  consultation: {
    title: 'Consultations',
    subtitle: 'Réservez une consultation avec un membre de notre ministère',
    myConsults: 'Mes consultations',
    featureName: 'Consultations',
    formTitle: 'Demande de consultation',
    formSubtitle:
      'Remplissez ce formulaire et nous vous recontactons dans les 24h',
    topicLabel: 'Sujet de consultation *',
    needLabel: 'Décrivez votre besoin *',
    needPh: 'Décrivez votre situation en détail...',
    submit: 'Soumettre la demande',
    requiredTitle: 'Champs requis',
    requiredMsg:
      'Veuillez sélectionner un sujet et décrire votre besoin.',
    sentTitle: 'Demande envoyée',
    sentMsg:
      'Votre demande de consultation a été reçue. Notre équipe vous contactera dans les 24h.',
    emptyTitle: 'Aucune consultation',
    emptyMsg: "Vous n'avez pas encore fait de demande de consultation.",
    emptyCta: 'Demander une consultation',
    requestedOn: (date: string) => `Demandé le ${date}`,
    types: [
      {
        title: 'Prière personnalisée',
        desc: 'Session de prière dédiée à votre situation',
      },
      {
        title: 'Conseil spirituel',
        desc: 'Échangez avec un conseiller spirituel expérimenté',
      },
      {
        title: 'Lecture prophétique',
        desc: 'Recevez une direction prophétique pour votre vie',
      },
    ],
    topics: [
      'Prière',
      'Guérison',
      'Finance',
      'Famille',
      'Mariage',
      'Travail',
      'Délivrance',
      'Prophétie',
    ],
    statuses: {
      pending: 'En attente',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
    },
  },

  dreams: {
    title: 'Interprétation des rêves',
    featureName: 'Interprétation des rêves',
    subtitle: 'Décryptez les messages divins dans vos rêves',
    howTitle: 'Comment ça fonctionne',
    step1: 'Décrivez votre rêve en détail (émotions, symboles, personnes...)',
    step2: 'Nous analyserons les éléments spirituels et symboliques',
    step3: 'Vous recevrez une interprétation guidée par les Écritures',
    dreamLabel: 'Décrivez votre rêve *',
    dreamPh:
      "J'ai rêvé que je marchais sur l'eau, il y avait une lumière brillante...",
    charCount: (count: number) => `${count}/500 caractères (minimum 20)`,
    interpret: 'Interpréter ce rêve',
    interpreting: 'Analyse en cours...',
    resultLabel: (date: string) => `INTERPRÉTATION — ${date}`,
    disclaimer:
      'Cette interprétation est une guidance spirituelle. Priez pour une confirmation divine.',
  },

  notifications: {
    title: 'Notifications',
    toggleLabel: 'Activer les notifications',
    toggleDesc: 'Recevez vos prières et messages quotidiens',
    schedulesTitle: 'Horaires des rappels',
    morningPrayer: 'Prière du matin',
    middayMessage: 'Message de midi',
    eveningPrayer: 'Prière du soir',
    everyday: (hour: string, minute: string) => `${hour}:${minute} chaque jour`,
    pushMorningTitle: 'Prière du matin',
    pushMorningBody:
      'Commencez votre journée avec Dieu. Votre prière du matin vous attend.',
    pushMiddayTitle: 'Message spirituel',
    pushMiddayBody:
      "Un message d'encouragement vous attend pour cet après-midi.",
    pushEveningTitle: 'Prière du soir',
    pushEveningBody:
      'Terminez votre journée dans la paix. Votre prière du soir est prête.',
  },

  settings: {
    title: 'Paramètres',
    appearance: 'APPARENCE',
    themeLabel: "Thème de l'application",
    themeLight: 'Clair',
    themeDark: 'Sombre',
    themeAuto: 'Auto',
    themeHintAuto: 'Suit automatiquement les préférences de votre appareil',
    themeHintDark: 'Mode sombre activé',
    themeHintLight: 'Mode clair activé',
    languageSection: 'LANGUE',
    privacy: 'CONFIDENTIALITÉ',
    screenProtect: "Protection capture d'écran",
    enabled: 'Activée',
    french: 'Français',
    english: 'English',
  },

  referral: {
    title: 'Programme de parrainage',
    subtitle:
      "Invitez vos proches et bénéficiez d'avantages exclusifs pour chaque abonné parrainé.",
    codeTitle: 'VOTRE CODE DE PARRAINAGE',
    copy: 'Copier',
    copiedTitle: 'Code copié',
    copiedMsg: 'Votre code de parrainage a été copié.',
    share: 'Partager mon code',
    howTitle: 'Comment ça marche',
    step1: 'Partagez votre code unique avec vos proches',
    step2: "Ils s'inscrivent avec votre code",
    step3: "Quand ils s'abonnent, vous gagnez des avantages",
    shareMsg: (code: string, url?: string) =>
      `Rejoins Oracle Plus — ta plateforme spirituelle !\n\nUtilise mon code de parrainage *${code}* pour bénéficier d'un avantage exclusif.\n\n${url ?? 'https://oracleplus.app'}`,
  },

  support: {
    title: 'Support',
    contactUs: 'Nous contacter',
    email: 'Email',
    whatsapp: 'WhatsApp',
    liveChat: 'Chat en ligne',
    available: 'Disponible 8h-20h',
    faqTitle: 'Questions fréquentes',
    faq: [
      {
        q: 'Comment annuler mon abonnement ?',
        a: 'Rendez-vous dans Profil > Abonnement > Gérer > Annuler.',
      },
      {
        q: 'Mon paiement a-t-il été débité ?',
        a: 'Vérifiez votre historique de paiements dans Profil > Historique paiements.',
      },
      {
        q: "Puis-je utiliser l'app sans connexion ?",
        a: 'Les prières et contenus chargés restent accessibles hors ligne.',
      },
    ],
  },

  formations: {
    title: 'Formations',
    featureName: 'Formations',
    subtitle: (count: number) => `${count} formations spirituelles`,
    about: 'À propos',
    programme: (count: number) => `Programme (${count} leçons)`,
    lessons: (count: number) => `${count} leçons`,
    start: 'Commencer la formation',
    lessonProgress: (current: number, total: number) =>
      `Leçon ${current}/${total}`,
    previous: 'Précédente',
    next: 'Suivante',
    levels: {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
    },
    readerExtra:
      "Dans cette leçon, nous explorons en profondeur les principes spirituels qui fondent notre marche avec Dieu. Chaque vérité présentée ici a été soigneusement sélectionnée pour vous accompagner dans votre croissance spirituelle.\n\nPrenez le temps de méditer sur ce qui est enseigné. La connaissance sans méditation reste superficielle. C'est dans le silence de la réflexion que la Parole prend racine dans votre cœur.\n\nNote pratique : Tenez un journal de vos révélations au fur et à mesure que vous progressez dans cette formation.",
  },

  legal: {
    privacyTitle: 'Politique de confidentialité',
    termsTitle: "Conditions d’utilisation",
    updatedOn: (date: string) => `Dernière mise à jour : ${date}`,
    privacySections: [
      {
        title: 'Données collectées',
        content:
          'Nous collectons : nom, numéro de téléphone, pays, langue, historique de prières et conversations de consultation stockées localement.',
      },
      {
        title: 'Utilisation des données',
        content:
          'Vos données sont utilisées uniquement pour personnaliser votre expérience spirituelle et gérer votre abonnement.',
      },
      {
        title: 'Sécurité',
        content:
          "Vos données sont chiffrées et stockées de façon sécurisée. L'accès est strictement limité aux services essentiels.",
      },
      {
        title: 'Vos droits',
        content:
          'Vous pouvez demander la suppression de vos données à tout moment en contactant support@spiritapp.com.',
      },
      {
        title: 'Cookies',
        content:
          "En version web, nous utilisons uniquement des cookies techniques essentiels. Aucun cookie publicitaire n'est utilisé.",
      },
    ],
    termsSections: [
      {
        title: '1. Acceptation des conditions',
        content:
          "En utilisant Oracle Plus, vous acceptez les présentes conditions d'utilisation. L'application est destinée à un usage spirituel et éducatif personnel.",
      },
      {
        title: '2. Abonnement',
        content:
          "L'abonnement Premium est facturé 5 000 FCFA/mois. Il est renouvelé automatiquement sauf annulation au moins 24h avant le renouvellement.",
      },
      {
        title: '3. Contenu',
        content:
          "Tout le contenu de l'application (prières, formations, livres) est protégé par le droit d'auteur. Toute reproduction non autorisée est interdite.",
      },
      {
        title: '4. Confidentialité',
        content:
          'Vos données personnelles sont traitées conformément à notre politique de confidentialité. Nous ne vendons jamais vos données à des tiers.',
      },
      {
        title: '5. Limitation de responsabilité',
        content:
          "Oracle Plus est un outil d'accompagnement spirituel. Les conseils prodigués ne remplacent pas un suivi médical ou psychologique professionnel.",
      },
    ],
  },

  onboarding: {
    slide1Title: 'Votre Compagnon Spirituel',
    slide1Subtitle:
      'Guidance, prières, accompagnements et bien plus — tout en un seul endroit, 24h/24.',
    slide2Title: 'Guidance & Consultation',
    slide2Subtitle: 'Des réponses claires pour votre vie spirituelle',
    slide3Title: 'Accompagnements de Vie',
    slide3Subtitle: 'Un soutien spirituel pour chaque étape',
    slide4Title: 'Réussite & Identité',
    slide4Subtitle: 'Se connaître et avancer avec force',
    slide5Title: 'Tout ça pour 5 000 FCFA/mois',
    slide5Subtitle:
      'Accès illimité aux consultations, livres, formations et accompagnements. Sans engagement.',
    services1: [
      'Consultation spirituelle générale',
      'Interprétation de rêve',
      'Éclaircissement sur un sujet précis',
      'Conseils personnalisés',
      'Orientation spirituelle',
      'Prières personnalisées',
    ],
    services2: [
      'Trouver un mari / une femme',
      'Trouver un travail',
      'Projet de voyage',
      'Suivi des enfants',
      'Combat spirituel (addiction…)',
    ],
    services3: [
      'Concours / Examens',
      'Accompagnement professionnel',
      'Connaître mon chiffre spirituel',
      'Boutique spirituelle',
    ],
    skip: "Passer l'introduction",
    start: 'Commencer',
  },

  pwa: {
    installTitle: 'Installer Oracle Plus',
    iosSubtitle:
      "Appuyez pour voir comment l'ajouter à l'écran d'accueil",
    howTo: 'Comment ?',
    safariNoAuto:
      'Safari ne propose pas de bouton automatique.\nSuivez ces 3 étapes simples :',
    step1: "Appuyez sur l'icône Partager",
    step1Hint:
      '(le carré avec une flèche vers le haut, en bas de Safari)',
    step2: "Faites défiler et appuyez sur « Sur l'écran d'accueil »",
    step3: 'Appuyez sur « Ajouter »',
    safariBarHint: 'Barre Safari en bas',
    nativeSubtitle: "Accès rapide depuis votre écran d'accueil",
    installButton: 'Installer',
  },

  premiumGuard: {
    inlineTitle: (featureName?: string) =>
      featureName ? `${featureName} — Abonnés uniquement` : 'Contenu Premium',
    inlineDesc:
      'Abonnez-vous pour accéder à ce contenu et à toutes les fonctionnalités premium.',
    inlineCta: "S'abonner — 5 000 FCFA/mois",
    fullTitle: (featureName?: string) => featureName ?? 'Contenu Premium',
    fullDesc:
      'Cette section est réservée aux abonnés. Rejoignez Oracle Plus Premium pour un accès illimité.',
    discover: "Découvrir l'abonnement",
  },

  premiumBanner: {
    title: 'Passer Premium',
    subtitle: 'Guide spirituel, Livres, Formations & plus',
    price1: '5 000',
    price2: 'FCFA/mois',
    compact: 'Passer Premium — 5 000 FCFA/mois',
  },
} as const;

export default fr;
export type Translations = DeepReplaceLiterals<typeof fr>;
