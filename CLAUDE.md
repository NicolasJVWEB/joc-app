# CLAUDE.md · Web app des JOC

## Contexte

- **JOC = Jeux Olympiques des Copains** : un week-end de jeux par équipes entre une quarantaine d'amis, organisé chaque année. 3e édition en 2026.
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
- **Données dans un Google Sheet** que le site lit en direct (onglets publics en lecture). Structure détaillée : `docs/google-sheet.md`.
  - Lien : `js/config.js` > `sheetId`. Vide = mode démo (fichiers `data/demo/*.csv`).
  - Lecture via l'URL `gviz/tq?tqx=out:csv&sheet=<onglet>`. Le Sheet doit être partagé "Tous les utilisateurs disposant du lien : lecteur".
  - Les organisateurs saisissent les scores dans le Sheet ; l'app se met à jour toute seule (toutes les 60 s et à chaque retour sur l'app).

## Règles dures

- **Aucune donnée personnelle dans le dépôt** (il est public) : pas de nom de famille, téléphone, mail, adresse, photo de personne, date de naissance. Les données de démo sont fictives.
- **Le Sheet est lisible par quiconque a son identifiant** (qui est dans le dépôt public) : on n'y met que des prénoms ou surnoms, jamais de coordonnées. Le rappeler à Guillaume si une demande va dans ce sens.
- Toujours **échapper** le texte qui vient du Sheet avant affichage (fonction `esc()` dans `js/app.js`).
- **Chemins relatifs uniquement** (`./css/...`, jamais `/css/...`) : le site est servi sous `/joc-app/` sur GitHub Pages.
- Après ajout ou renommage d'un fichier de l'app : l'ajouter à la liste `FICHIERS` de `sw.js` **et** augmenter `VERSION`.
- Pas de traceur, pas d'analytics, pas de script tiers. Polices auto-hébergées dans `assets/fonts/`.
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
| Crème (lettres du logo, fond) | `--joc-creme` | `#fffbea` |
| Encre (contours) | `--joc-encre` | `#1b1533` |

- **Titres** : Lilita One (ronde, épaisse, comme les lettres du logo), en crème cerclée d'encre avec ombre décalée.
- **Texte** : Nunito.
- **Effet "autocollant"** : contour encre 3 px, coins arrondis, ombre dure décalée de 4 px sans flou. Les éléments cliquables "s'enfoncent" au toucher.
- **Motif signature** : les 5 rayures diagonales du logo (vert, rouge, ciel, bleu, jaune), en bandeau sous l'en-tête et devant les titres de section.
- Couleurs d'équipe : un des 5 noms ci-dessus (ou un code `#hex`) dans la colonne `couleur` du Sheet.

## Structure

```
index.html              Page unique (en-tête, zone d'affichage, barre d'onglets)
manifest.webmanifest    Fiche d'installation (nom, icônes, couleurs)
sw.js                   Service worker : hors connexion + installation
css/style.css           Toute la charte et la mise en page
js/config.js            Réglages : identifiant du Sheet, onglets, barème
js/data.js              Lecture du Sheet (CSV), calcul du classement, copie locale
js/app.js               Écrans et navigation (#/, #/classement, #/epreuves, #/equipes...)
assets/logo.png         Logo JOC
assets/icons/           Icônes d'app (192, 512, maskable, Apple, favicon)
assets/fonts/           Polices Lilita One et Nunito (licence SIL OFL)
data/demo/*.csv         Données fictives du mode démo (même format que le Sheet)
docs/google-sheet.md    Mode d'emploi du Google Sheet
```

## Tester

- En local : `python3 -m http.server` à la racine, puis `http://localhost:8000` (vue mobile du navigateur).
- Vérifier au minimum : les 4 onglets, une fiche équipe, une fiche épreuve, aucune erreur dans la console, rendu à 360 px de large.
