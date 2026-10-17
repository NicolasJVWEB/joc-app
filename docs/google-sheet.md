# Le Google Sheet des JOC

L'app lit un Google Sheet avec **4 onglets**. Les noms d'onglets et les en-têtes de colonnes (ligne 1) doivent être écrits exactement comme ci-dessous (majuscules et accents tolérés pour les en-têtes).

Les fichiers `data/demo/*.csv` donnent un exemple complet : on peut les importer dans le Sheet pour démarrer (Fichier > Importer).

## Onglet `Infos`

Deux colonnes : `cle` et `valeur`.

| cle | valeur (exemple) |
|---|---|
| edition | 3e édition |
| annee | 2026 |
| dates | Week-end du 4 juillet |
| lieu | Quelque part dans le Sud |
| annonce | Message affiché en jaune sur l'accueil (vide = pas de message) |

## Onglet `Equipes`

| Colonne | Contenu |
|---|---|
| id | Code court et unique, sans espace : `eq1`, `eq2`... Ne plus le changer une fois les scores saisis. |
| nom | Nom affiché : `Les Requins` |
| couleur | `vert`, `rouge`, `ciel`, `bleu`, `jaune` ou un code couleur `#ff6600` |
| emoji | Un emoji : 🦈 |
| membres | Prénoms ou surnoms séparés par des virgules |

## Onglet `Epreuves`

| Colonne | Contenu |
|---|---|
| id | Code court et unique : `ep1`, `ep2`... |
| ordre | Numéro pour l'ordre d'affichage |
| nom | `Lancer de tong` |
| emoji | 🩴 |
| horaire | Texte libre : `Samedi 11h30` |
| lieu | Texte libre : `Pelouse` |
| description | Règles en une ou deux phrases |
| statut | `a_venir`, `en_cours` ou `terminee` |

## Onglet `Scores`

Une ligne par équipe et par épreuve.

| Colonne | Contenu |
|---|---|
| epreuve | L'`id` de l'épreuve (`ep1`) |
| equipe | L'`id` de l'équipe (`eq2`) |
| rang | Place obtenue : 1, 2, 3... |
| points | Facultatif. Vide = points calculés selon le rang (barème dans `js/config.js` : 10, 8, 6, 5, 4, 3, 2, puis 1). Rempli = ce nombre l'emporte (bonus, pénalité négative...). |

Le classement général est calculé automatiquement : total des points, puis nombre de victoires en cas d'égalité.

## Brancher le Sheet sur l'app

1. Créer le Google Sheet avec les 4 onglets ci-dessus.
2. Bouton **Partager** > Accès général : **Tous les utilisateurs disposant du lien**, rôle **Lecteur**.
3. Copier l'identifiant dans l'adresse du Sheet : la partie entre `/d/` et `/edit`.
   `https://docs.google.com/spreadsheets/d/`**`1AbC...xYz`**`/edit`
4. Le coller dans `js/config.js`, ligne `sheetId: ""`.

## Confidentialité

Toute personne qui connaît l'identifiant peut lire le Sheet, et cet identifiant est visible dans le dépôt public. Donc **uniquement des prénoms ou surnoms**, jamais de nom de famille, téléphone, mail ou adresse. La modification, elle, reste réservée aux personnes invitées comme éditeurs.
