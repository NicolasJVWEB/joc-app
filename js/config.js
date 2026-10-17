/*
 * Réglages de l'app JOC.
 * C'est le seul fichier à modifier pour brancher le Google Sheet.
 */
window.JOC_CONFIG = {
  // Nom affiché dans l'app
  nom: "Jeux Olympiques des Copains",
  sigle: "JOC",

  // Identifiant du Google Sheet (la longue suite de caractères dans l'URL,
  // entre /d/ et /edit). Laisser vide = mode démo avec des données fictives.
  sheetId: "",

  // Noms exacts des onglets du Google Sheet
  onglets: {
    infos: "Infos",
    equipes: "Equipes",
    epreuves: "Epreuves",
    scores: "Scores",
  },

  // Points attribués selon le rang quand la colonne "points" est vide
  // (1er = 10 pts, 2e = 8 pts, etc. Au-delà de la liste : 1 pt).
  bareme: [10, 8, 6, 5, 4, 3, 2],

  // Rafraîchissement automatique des données (en secondes)
  rafraichissement: 60,
};
