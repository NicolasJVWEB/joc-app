/*
 * Réglages de l'app JOC.
 * C'est le seul fichier à modifier pour brancher la base Supabase.
 */
window.JOC_CONFIG = {
  // Nom affiché dans l'app
  nom: "Jeux Olympiques des Copaings",
  sigle: "JOC",

  // Supabase > Project Settings > API (ou "Connect") :
  //  - supabaseUrl : "Project URL", du type https://xxxx.supabase.co
  //  - supabaseCle : la clé "anon" / "publishable" (elle est faite pour être publique)
  // Laisser vide = mode démo avec des données fictives, sans connexion.
  supabaseUrl: "https://nkdlishmmutknvmbmgrw.supabase.co",
  supabaseCle: "sb_publishable_x6Ti9t_6NzgaP_q3XpzCkw_HXdl9pg9",

  // Points attribués selon le rang quand aucun nombre de points n'est saisi
  // (1er = 10 pts, 2e = 8 pts, etc. Au-delà de la liste : 1 pt).
  bareme: [10, 8, 6, 5, 4, 3, 2],

  // Rafraîchissement automatique des données (en secondes)
  rafraichissement: 60,
};
