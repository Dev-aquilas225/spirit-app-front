/**
 * Messages push "curiosity gap" — Oracle Plus
 * Organisés par tranche horaire pour coller au contexte de l'utilisateur.
 */

export interface PushMessage {
  title: string;
  body: string;
}

/** Matin 5h–11h : énergie, espoir, démarrage de journée */
const MORNING: PushMessage[] = [
  { title: '🌅 Une porte s\'ouvre pour toi', body: 'Ce matin, une bénédiction particulière t\'attend. Ouvre l\'application pour découvrir le message.' },
  { title: '🔮 Révélation du matin', body: 'Le Prophète Georges a reçu un message pour toi cette nuit. Clique pour le lire maintenant.' },
  { title: '⚡ Ton destin s\'écrit aujourd\'hui', body: 'Une opportunité rare se présente dans les prochaines heures. Découvre comment la saisir.' },
  { title: '🙏 Prière urgente pour toi', body: 'Une intercession spéciale a été faite en ton nom ce matin. Viens recevoir ta bénédiction.' },
  { title: '💰 Entrée d\'argent inattendue', body: 'Je vois une source financière s\'ouvrir pour toi aujourd\'hui. Clique pour connaître les détails.' },
  { title: '🌟 Ton nom résonne ce matin', body: 'Une bénédiction particulière porte ton nom aujourd\'hui. Ouvre l\'application pour la recevoir.' },
  { title: '🔑 La clé de ta délivrance', body: 'Ce que tu cherches depuis longtemps est sur le point d\'arriver. Découvre le signe.' },
  { title: '📖 Parole prophétique du jour', body: 'Un verset puissant a été révélé pour ta situation. Lis-le avant de commencer ta journée.' },
];

/** Après-midi 12h–17h : opportunités, travail, déblocage */
const AFTERNOON: PushMessage[] = [
  { title: '⚠️ Ne laisse pas passer ça', body: 'Une fenêtre d\'opportunité se ferme ce soir. Clique maintenant pour ne pas la manquer.' },
  { title: '🔓 Ton blocage est levé', body: 'Ce qui t\'empêchait d\'avancer vient d\'être brisé spirituellement. Viens confirmer ta victoire.' },
  { title: '💼 Percée professionnelle proche', body: 'Je vois un changement majeur dans ta carrière dans les 72h. Découvre ce que tu dois faire.' },
  { title: '🎯 Message urgent pour toi', body: 'Il y a quelque chose que tu dois absolument savoir maintenant. Ouvre l\'application.' },
  { title: '🌊 Le tournant de ta vie', body: 'Après cette période difficile, une grande transformation s\'annonce. Clique pour voir le signe.' },
  { title: '💡 La réponse à ta prière', body: 'Ta prière a été entendue. Voici ce que le Seigneur veut que tu saches maintenant.' },
  { title: '🤝 Une rencontre décisive', body: 'Une personne importante va croiser ton chemin très bientôt. Prépare-toi spirituellement.' },
  { title: '🏆 Ta victoire est confirmée', body: 'Ce combat que tu mènes touche à sa fin. Découvre le message de victoire qui t\'attend.' },
];

/** Soir/Nuit 18h–4h : protection, réflexion, révélations */
const EVENING: PushMessage[] = [
  { title: '🌙 Révélation de cette nuit', body: 'Un rêve prophétique te sera envoyé cette nuit. Prépare ton cœur en lisant ce message.' },
  { title: '🛡️ Protection sur ta famille', body: 'Une prière de protection a été activée pour toi et tes proches. Viens la recevoir.' },
  { title: '✨ Ce que demain te réserve', body: 'Le Prophète Georges a vu quelque chose d\'important pour ton lendemain. Clique pour découvrir.' },
  { title: '🔥 Feu de délivrance ce soir', body: 'Ce soir est un moment puissant pour briser les chaînes. Rejoins la prière maintenant.' },
  { title: '💎 Ta valeur est reconnue', body: 'Quelqu\'un pense à toi en ce moment et prépare quelque chose de beau. Découvre le signe.' },
  { title: '🌺 Guérison en chemin', body: 'Ce que tu portes dans ton corps ou ton âme commence à se dissoudre. Viens confirmer.' },
  { title: '📿 Intercession spéciale', body: 'Une prière d\'intercession a été faite pour ta situation ce soir. Reçois ta délivrance.' },
  { title: '🌠 Signe dans les étoiles', body: 'La configuration spirituelle de cette nuit est favorable pour toi. Lis le message complet.' },
];

/**
 * Retourne un message aléatoire selon l'heure actuelle.
 * Matin 5h–11h | Après-midi 12h–17h | Soir/Nuit 18h–4h
 */
export function getScheduledMessage(): PushMessage {
  const hour = new Date().getHours();
  let pool: PushMessage[];
  if (hour >= 5 && hour < 12) {
    pool = MORNING;
  } else if (hour >= 12 && hour < 18) {
    pool = AFTERNOON;
  } else {
    pool = EVENING;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export const ALL_MESSAGES = { MORNING, AFTERNOON, EVENING };
