# CLAUDE.md · Web app des JOC

## Contexte

- **JOC = Jeux Olympiques des Copaings** (orthographe "Copaings" voulue, ne pas corriger) : un week-end de jeux par équipes entre une quarantaine d'amis, organisé chaque année. 3e édition en juillet 2026 (passée, données importées comme historique). **Édition en préparation : 4e édition, du vendredi 18 au dimanche 20 juin 2027.**
- Projet perso de Guillaume, **sans aucun rapport avec Hélia** : les règles métier Hélia (toile, Serge Ferrari, HubSpot, Drive Affaires...) ne s'appliquent pas ici.
- **Guillaume ne code pas.** Explique chaque changement en langage simple, sans jargon, et dis-lui concrètement quoi faire de son côté (cliquer où, remplir quoi).

## Objectifs (non négociables)

1. **Coût zéro** : aucun service payant, aucune clé d'API, aucun abonnement.
2. **Mobile first** : pensé pour un téléphone tenu à une main, en extérieur, au soleil.
3. **Installable** (PWA) : "Ajouter à l'écran d'accueil" sur iPhone et Android, fonctionne hors connexion avec les dernières données vues.
4. **Charte JOC** : tout part du logo (voir "Charte" plus bas).

## Infra

- **Site statique** hébergé sur **GitHub Pages**, dépôt **public** `guillaumebrisco-alt/joc-app`.
- **Pas de build, pas de framework, pas de npm** : HTML, CSS et JavaScript simples, servis tels quels. Un fichier modifié = un site à jour. Ne pas introduire d'outil de build sans accord explicite.
- **Données dans Supabase** (offre gratuite) : comptes (mail + mot de passe, ou Google ; mot de passe oublié par code à 6 chiffres), profils, photos, présences, équipes, épreuves, scores, palmarès. Validé par Guillaume à la place du Google Sheet prévu au départ.
  - Schéma, sécurité et données de départ : `supabase/schema.sql` (relançable sans perte). Mise en place pas à pas : `docs/supabase.md`.
  - Branchement : `js/config.js` > `supabaseUrl` et `supabaseCle` (clé anon/publishable, publique par nature). Vides = mode démo (fichiers `data/demo/*.csv`, pas de connexion, rien n'est enregistré).
  - Accès : il faut un compte **et** le code JOC (`code_acces`) pour voir quoi que ce soit. Le `code_admin` donne les droits orga. Les codes vivent uniquement dans la table `reglages` de Supabase.
  - Sécurité par règles de ligne (RLS) : lecture réservée aux inscrits, écriture aux orgas, chacun modifie sa propre fiche mais ne peut ni se nommer orga ni changer d'équipe.
  - Bibliothèque `supabase-js` auto-hébergée dans `assets/vendor/` (version figée dans le nom du fichier).
  - **Réveil** : `.github/workflows/reveil-supabase.yml` interroge Supabase tous les 3 jours (l'offre gratuite s'endort après 7 jours sans visite) et se réactive lui-même (GitHub coupe les robots planifiés après 60 jours sans activité).
- **Gestion de l'événement** (remplace le dossier Drive « Gestion » du CAJOC) : programme jour par jour (visible par tous), et pour les orgas uniquement : tâches du comité, courses, budget, paiements, spectateurs, récap t-shirts / régimes / arrivées, équilibre des équipes (niveaux sport et culture).
  - Infos perso utiles à l'orga (taille de t-shirt, régime, arrivée) : table `fiches_privees`, lisible par la personne et les orgas seulement. T-shirt et régime sont fixes d'une édition à l'autre et **obligatoires** : tant qu'ils manquent, l'app n'affiche que l'écran « Encore 2 infos » (`profil-essentiel`, hors mode démo). « Je mange de tout » = régime `Rien de spécial` (masqué dans le récap orga). L'arrivée vient du formulaire de l'édition. Paiements et niveaux : table `suivi_orga`, orgas seulement.
- **Éditions** : l'app gère une édition à la fois (infos `edition`, `annee`, `dates`). Espace orga > « Nouvelle édition » archive l'édition en cours dans l'historique de chacun (lignes `palmares` « Équipe … » ou « Participant·e »), garde participants, tâches et courses (décochées) et le programme type recalé sur les nouvelles dates (mêmes jours de la semaine), et remet à zéro épreuves, scores, équipes, présences, paiements, dépenses et spectateurs. Écran « La légende des JOC » (`#/historique`) : toutes les éditions passées.
- **Buzzer en direct** (`js/buzzer.js`) : l'orga ouvre une question (Orga > Buzzer), tous les téléphones connectés basculent sur un gros bouton BUZZ. Tables `buzzer` (état, une ligne) et `buzzes` (un buzz par personne et par question, heure fixée par le serveur via trigger). Temps réel Supabase (publication `supabase_realtime`) + vérification toutes les 2 s en secours. Mode grand écran pour vidéoprojecteur.
- **Voir l'app comme** (Orga > Participants > fiche) : l'orga voit l'app exactement comme ce participant (pas d'onglet Orga, écrans verrouillés, « Encore 2 infos », son compte JOC), à partir des données qu'il lit déjà. **Lecture seule** : toutes les actions sont bloquées sauf « Quitter » et « Copier » (sinon, avec les droits orga, elles seraient vraiment enregistrées au nom du participant). Bandeau jaune en haut, recharger la page quitte aussi l'aperçu.
- **Suivi des comptes** (Orga > Participants) : comptes reliés / pas encore venus / nouveaux / vus en 24 h, colonnes `rejoint_le`, `derniere_visite`, `nouveau` sur `participants` (protégées contre la triche par le trigger).
- **Inscription** : « Déjà venu·e aux JOC ? » (on retrouve son prénom, avec recherche) ou « Première fois aux JOC ? » (on crée son profil).
- **Je viens aux JOC** (`js/inscription.js`, remplace le Google Form) : carte « JOC {année} : tu viens ? » sur l'accueil et le profil, écran `#/inscription` (oui / peut-être / non, arrivée, mot pour les orgas ; t-shirt, surnom et régime rappelés depuis le profil). Table `inscriptions` (une ligne par personne et par année). **Tant qu'on n'a pas répondu** (quelle que soit la réponse), les écrans de l'édition sont verrouillés (`ECRANS_EDITION` : classement, programme, épreuves, équipes, présents, buzzer) et l'accueil n'en montre rien ; restent ouverts l'accueil, le profil, les fiches et la légende. Les orgas voient tout. Orga > Inscriptions : compteurs, filtres, prénoms à relancer, réponse à la place de quelqu'un.
- **Mon compte JOC** : acompte / solde cochés par les orgas, reste à payer, lien de paiement (Lydia...) et RIB à copier. Montants et moyens de paiement dans Orga > Infos (`montant_total`, `montant_acompte`, `paiement_lien`, `paiement_rib`). Chacun ne lit que sa propre ligne via la fonction `mon_paiement()`.
- **Records et étoiles** (`js/records.js`) : les orgas saisissent les performances (Orga > Records, table `performances`). L'app calcule record de tous les temps, meilleur·e de chaque année, records battus, et donne 0 à 5 étoiles autour de la photo (Recrue > Copaing > Habitué·e > Pilier > Champion·ne > Légende) selon participations, trophées et exploits. Bloc « Exploits » sur chaque profil, tableau des records dans la légende.
- L'app se met à jour toute seule (toutes les 60 s et à chaque retour sur l'app), sans redessiner un écran où l'on est en train de saisir.

## Règles dures

- **Aucune donnée personnelle dans le dépôt** (il est public) : pas de vrai nom, téléphone, mail, adresse, photo de personne, âge réel. Les données de démo sont fictives. Les vraies données (dont les photos des copains) vont uniquement dans Supabase, derrière la connexion.
- **Import de vraies données** (listes Drive) : un fichier SQL généré hors du dépôt (scratchpad), remis à Guillaume pour le coller dans Supabase. Jamais commité (`.gitignore` bloque `import-*.sql`).
- **Jamais de secret dans le dépôt** : ni codes JOC, ni clé `service_role`/secret, ni mot de passe de base.
- Toute nouvelle table Supabase : RLS activée et règles écrites dans `supabase/schema.sql`, testées sur un Postgres local avec des comptes simulés (inconnu, copain, orga) avant de pousser.
- Toujours **échapper** le texte qui vient de la base avant affichage (fonction `esc()` dans `js/ui.js`).
- **Chemins relatifs uniquement** (`./css/...`, jamais `/css/...`) : le site est servi sous `/joc-app/` sur GitHub Pages.
- Après ajout ou renommage d'un fichier de l'app : l'ajouter à la liste `FICHIERS` de `sw.js` **et** augmenter `VERSION`.
- Pas de traceur, pas d'analytics, pas de script chargé depuis un autre site : polices dans `assets/fonts/`, bibliothèques dans `assets/vendor/`.
- `robots: noindex` : l'app n'a pas vocation à apparaître dans Google.

## Rédaction

- Français uniquement, ton complice et festif (c'est entre copains), tutoiement dans l'app.
- **Jamais de tiret cadratin** (le caractère U+2014), ni dans le code, ni dans les textes, ni dans les messages. Tiret simple `-` ou point médian `·`.
- Code : noms de variables et commentaires en français, comme le code existant.

## Charte (issue du logo `assets/logo.png`)

| Rôle | Variable CSS | Valeur |
|---|---|---|
| Vert | `--joc-vert` | `#10b866` |
| Rouge | `--joc-rouge` | `#ee1c25` |
| Bleu ciel | `--joc-ciel` | `#1ea6d8` |
| Bleu | `--joc-bleu` | `#0b6cc0` |
| Jaune / or | `--joc-jaune` | `#f8b803` |
| Orange (équipe orange) | `--joc-orange` | `#ff8a1f` |
| Violet (foulards équipe orange) | `--joc-violet` | `#7b3fa0` |
| Crème (lettres du logo, fond) | `--joc-creme` | `#fffbea` |
| Encre (contours) | `--joc-encre` | `#1b1533` |

- **Titres** : Lilita One (ronde, épaisse, comme les lettres du logo), en crème cerclée d'encre avec ombre décalée.
- **Texte** : Nunito.
- **Effet "autocollant"** : contour encre 3 px, coins arrondis, ombre dure décalée de 4 px sans flou. Les éléments cliquables "s'enfoncent" au toucher.
- **Motif signature** : les 5 rayures diagonales du logo (vert, rouge, ciel, bleu, jaune), en bandeau sous l'en-tête et devant les titres de section.
- Couleurs d'équipe : un des noms ci-dessus (vert, rouge, ciel, bleu, jaune, orange, violet) ou un code `#hex`. Les 4 équipes 2026 : bleu, jaune, orange (foulards violets), vert.

## Structure

```
index.html              Page unique (en-tête, zone d'affichage, barre d'onglets ; onglet Orga réservé aux orgas)
manifest.webmanifest    Fiche d'installation (nom, icônes, couleurs)
sw.js                   Service worker : hors connexion + installation
css/style.css           Toute la charte et la mise en page
js/config.js            Réglages : adresse et clé Supabase, barème
js/data.js              Lecture/écriture Supabase (ou démo), calcul du classement, copie locale
js/ui.js                Outils d'affichage partagés (esc, couleurs, portraits, messages)
js/ecrans.js            Écrans de consultation (accueil, classement, épreuves, équipes, présents, fiches)
js/compte.js            Connexion, inscription avec le code, profil
js/orga.js              Espace orga (menu, résultats, épreuves, participants, équipes, infos)
js/gestion.js           Gestion CAJOC (programme, tâches, courses, budget, paiements, spectateurs, t-shirts, niveaux, nouvelle édition)
js/buzzer.js            Buzzer en direct (joueurs, pilotage orga, grand écran)
js/records.js           Records, exploits, étoiles et niveaux des profils
js/inscription.js       Je viens aux JOC, Mon compte JOC (paiements), suivi orga des inscriptions
js/app.js               Navigation, connexion, rafraîchissement, actions
assets/vendor/          supabase-js auto-hébergé
supabase/schema.sql     Base de données, sécurité, données de départ
.github/workflows/      Réveil automatique de Supabase
data/demo/*.csv         Données fictives du mode démo
docs/supabase.md        Mise en place de Supabase pas à pas
```

## Feuille de route

- Quiz en direct : questions sur grand écran, **une réponse par équipe** depuis les téléphones (décision de Guillaume, à affiner).
- Noms des 4 équipes et correspondance numéro d'équipe (feuille « Nouvelles équipes ») -> couleur : à confirmer par Guillaume.
- Podium et titres de l'édition 2026 à ajouter dans l'historique (à fournir par Guillaume).
- Suggestion automatique d'équipes équilibrées à partir des niveaux.

## Tester

- En local : `python3 -m http.server` à la racine, puis `http://localhost:8000` (vue mobile du navigateur).
- Vérifier au minimum : les 5 onglets (+ onglet ⭐ Orga, visible des seuls orgas), une fiche équipe, une fiche épreuve, l'espace orga et ses modules de gestion, aucune erreur dans la console, rendu à 360 px de large.
- Parcours connectés : on ne peut pas joindre Supabase depuis l'environnement de Claude ; les tester avec un faux client Supabase injecté dans le navigateur (Playwright) et le SQL sur Postgres local.
