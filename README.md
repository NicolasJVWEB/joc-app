# JOC · Jeux Olympiques des Copaings

La web app officielle des JOC : classement en direct, programme des épreuves et fiches équipes, dans la poche de chaque participant.

- **Gratuite** : site statique sur GitHub Pages, données dans un Google Sheet.
- **Mobile first et installable** : sur le téléphone, "Ajouter à l'écran d'accueil" et elle se lance comme une vraie app, même avec un réseau capricieux.
- **En direct** : les organisateurs saisissent les scores dans le Sheet, l'app se met à jour toute seule.

## Installer l'app sur son téléphone

- **iPhone (Safari)** : ouvrir le lien, bouton Partager, puis "Sur l'écran d'accueil".
- **Android (Chrome)** : ouvrir le lien, menu ⋮, puis "Installer l'application" ou "Ajouter à l'écran d'accueil".

## Pour les organisateurs

- Saisir les équipes, épreuves et scores : voir [docs/google-sheet.md](docs/google-sheet.md).
- Brancher le Sheet : renseigner son identifiant dans [js/config.js](js/config.js). Sans identifiant, l'app tourne en **mode démo** avec des données fictives.

## Mettre en ligne (une seule fois)

Sur GitHub : **Settings** > **Pages** > Source "Deploy from a branch" > branche `main`, dossier `/ (root)` > **Save**. L'adresse du site s'affiche après une minute : `https://guillaumebrisco-alt.github.io/joc-app/`.

## Tester en local

```
python3 -m http.server
```
puis ouvrir `http://localhost:8000`.

## Vie privée

Le dépôt est public : il ne contient aucune donnée personnelle. Le Google Sheet ne contient que des prénoms ou surnoms.

## Crédits

Polices [Lilita One](https://fonts.google.com/specimen/Lilita+One) et [Nunito](https://fonts.google.com/specimen/Nunito), licence SIL Open Font License.
