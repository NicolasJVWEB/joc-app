# JOC · Jeux Olympiques des Copaings

La web app officielle des JOC : classement en direct, programme des épreuves et fiches équipes, dans la poche de chaque participant.

- **Gratuite** : site statique sur GitHub Pages, données dans Supabase (offre gratuite).
- **Mobile first et installable** : sur le téléphone, "Ajouter à l'écran d'accueil" et elle se lance comme une vraie app, même avec un réseau capricieux.
- **Ton profil** : photo ou avatar rigolo, surnom, devise, palmarès.
- **Qui est là ?** : chacun signale sa présence, les orgas voient tout d'un coup d'œil.
- **En direct** : les orgas saisissent les résultats dans l'app, le classement se met à jour tout seul.

## Installer l'app sur son téléphone

- **iPhone (Safari)** : ouvrir le lien, bouton Partager, puis "Sur l'écran d'accueil".
- **Android (Chrome)** : ouvrir le lien, menu ⋮, puis "Installer l'application" ou "Ajouter à l'écran d'accueil".

## Pour les organisateurs

- Mise en place (une fois) : [docs/supabase.md](docs/supabase.md). Tant que Supabase n'est pas branché dans [js/config.js](js/config.js), l'app tourne en **mode démo** avec des données fictives.
- Ensuite tout se fait dans l'app : **Moi** > **Espace orga** (participants, présences, épreuves, résultats, équipes, infos).

## Mettre en ligne (une seule fois)

Sur GitHub : **Settings** > **Pages** > Source "Deploy from a branch" > branche `main`, dossier `/ (root)` > **Save**. L'adresse du site s'affiche après une minute : `https://guillaumebrisco-alt.github.io/joc-app/`.

## Tester en local

```
python3 -m http.server
```
puis ouvrir `http://localhost:8000`.

## Vie privée

Le dépôt est public : il ne contient aucune donnée personnelle ni aucun code. Profils et photos sont stockés dans Supabase et visibles uniquement des participants connectés avec le code JOC.

## Crédits

Polices [Lilita One](https://fonts.google.com/specimen/Lilita+One) et [Nunito](https://fonts.google.com/specimen/Nunito), licence SIL Open Font License.
