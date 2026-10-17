# Brancher Supabase (à faire une seule fois, environ 10 minutes)

Supabase est le service gratuit qui stocke les comptes, les profils, les photos, les présences et les scores. Offre gratuite, sans carte bancaire.

## 1. Créer le compte et le projet

1. Aller sur https://supabase.com et cliquer sur **Start your project**.
2. Se connecter avec **GitHub** (le plus simple) ou un mail.
3. Cliquer sur **New project** :
   - **Name** : `joc`
   - **Database Password** : cliquer sur **Generate a password** et le garder précieusement (dans ton gestionnaire de mots de passe).
   - **Region** : choisir une région en Europe (Paris ou Francfort).
   - Laisser le reste par défaut, cliquer sur **Create new project** et attendre une à deux minutes.

## 2. Créer la base de données

1. Dans le menu de gauche : **SQL Editor**.
2. Ouvrir le fichier [`supabase/schema.sql`](../supabase/schema.sql) sur GitHub, bouton **Copy raw file** (icône de copie en haut à droite).
3. Le coller dans l'éditeur Supabase.
4. **Tout en bas du texte, remplacer les 2 codes** :
   - `CODE-COPAINGS` : le code que tu donneras à tous les copains pour créer leur compte.
   - `CODE-ORGA` : le code réservé aux organisateurs (il donne le droit de saisir les résultats).
   Choisis des codes faciles à dire mais pas devinables. Ne les écris jamais dans le dépôt GitHub (il est public).
5. Cliquer sur **Run**. Le message **Success. No rows returned** confirme que tout est en place.

## 3. Réglages de connexion

1. Menu de gauche : **Authentication**, puis **Sign In / Providers** (ou **Providers**), puis **Email**.
   - Désactiver **Confirm email**, puis **Save**. Sans ça, chaque copain devrait cliquer sur un lien reçu par mail, et l'offre gratuite n'envoie que quelques mails par heure.
2. Toujours dans **Authentication** : **URL Configuration**.
   - **Site URL** : `https://guillaumebrisco-alt.github.io/joc-app/`
   - **Redirect URLs** : cliquer sur **Add URL** et ajouter la même adresse.
   - **Save**. (Utile pour le lien « mot de passe oublié ».)

3. Toujours dans **Authentication** : **Emails** (ou **Email Templates**), modèle **Reset password** (« Reset Password »).
   Remplacer le sujet et le contenu par ceci, puis **Save** (le mail contient alors un code à 6 chiffres, à taper dans l'app : ça marche même si le mail s'ouvre dans un autre navigateur) :
   - Sujet : `JOC · Ton code pour changer de mot de passe`
   - Contenu :
     ```html
     <h2>Mot de passe oublié ?</h2>
     <p>Voici ton code, à taper dans l'app JOC :</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
     <p>Il est valable 1 heure. Si tu n'as rien demandé, ignore ce mail.</p>
     ```

## 4. Donner les clés à l'app

1. Cliquer sur le bouton **Connect** en haut de la page du projet (ou **Project Settings** > **API Keys**).
2. Copier :
   - **Project URL** (du type `https://xxxx.supabase.co`)
   - la clé **anon** ou **publishable** (elle commence par `eyJ...` ou `sb_publishable_...`). Ces deux informations sont faites pour être publiques.
   - **Ne jamais copier** la clé **service_role** ou **secret**.
3. Les envoyer à Claude, qui les placera dans `js/config.js`.

## 5. Premier test

1. Ouvrir l'app, **Créer mon compte** avec ton mail et un mot de passe.
2. Entrer le **code orga** : tu deviens organisateur.
3. Dans **Moi** > **Espace orga** > **Participants** : ajouter la liste des copains avec leur équipe.
4. Donner aux copains le lien de l'app et le **code copains**. Chacun crée son compte, retrouve son prénom dans la liste et complète son profil.

## Mettre à jour la base après une évolution de l'app

Quand Claude ajoute des fonctions (par exemple la partie gestion), il faut relancer le script :
SQL Editor > nouvelle requête > coller la dernière version de [`supabase/schema.sql`](../supabase/schema.sql) > **Run**.
Aucune donnée n'est effacée et **les codes déjà en place ne sont pas touchés** : pas besoin de les retaper.

## Importer les données du Drive (une seule fois)

Claude peut préparer un fichier `import-joc-2026.sql` avec les listes du dossier Drive « Gestion » (participants, programme, tâches, courses, budget, spectateurs). Ce fichier contient des données personnelles : il ne va **jamais** sur GitHub.
SQL Editor > nouvelle requête > coller son contenu > **Run**. S'il a déjà été lancé, il s'arrête sans rien modifier.

## Réveil automatique

L'offre gratuite met le projet en veille après 7 jours sans visite. Un robot GitHub (`.github/workflows/reveil-supabase.yml`) l'interroge tous les 3 jours pour le garder éveillé. Rien à faire de ton côté. Pour vérifier qu'il tourne : onglet **Actions** du dépôt GitHub, ligne **Réveil Supabase**.

Si jamais le projet s'est endormi quand même : sur supabase.com, ouvrir le projet et cliquer sur **Restore project**.

## Changer un code plus tard

SQL Editor, puis lancer (en remplaçant les codes) :

```sql
update reglages set code_acces = 'NOUVEAU-CODE', code_admin = 'NOUVEAU-CODE-ORGA';
```
