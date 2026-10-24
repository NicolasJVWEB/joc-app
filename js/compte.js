/*
 * Compte : connexion, inscription avec le code JOC, profil.
 */
(function () {
  const DATA = window.JOC_DATA;
  const { esc, portrait, AVATARS, vide } = window.JOC_UI;
  const E = (window.JOC_ECRANS = window.JOC_ECRANS || {});
  const A = (window.JOC_ACTIONS = window.JOC_ACTIONS || {});

  // État des écrans de connexion (pas besoin de le garder après rechargement)
  const etat = { onglet: "connexion", code: "", liste: null, emailRecup: "", google: false };

  // On demande une seule fois à Supabase si la connexion Google est activée
  DATA.auth.googleDisponible().then((ok) => {
    etat.google = ok;
    if (ok && document.querySelector(".zone-google")) document.querySelector(".zone-google").innerHTML = boutonGoogle();
  });

  const LOGO_GOOGLE = `<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;
  const boutonGoogle = () => `
    <button class="bouton bouton--google" type="button" data-action="connexion-google">${LOGO_GOOGLE}<span>Continuer avec Google</span></button>
    <p class="separateur"><span>ou avec ton mail</span></p>`;

  // ---------- Connexion / création de compte ----------

  E.connexion = () => {
    if (etat.onglet === "recuperation") return ecranRecuperation();
    return `
    <section class="hero hero--compact">
      <img class="hero__logo" src="./assets/logo.png" alt="Logo JOC" width="140" height="141">
      <h1 class="titre-sticker">Bienvenue aux JOC !</h1>
    </section>
    <div class="onglets">
      <button class="${etat.onglet === "connexion" ? "actif" : ""}" data-action="onglet-connexion" data-onglet="connexion">J'ai un compte</button>
      <button class="${etat.onglet === "inscription" ? "actif" : ""}" data-action="onglet-connexion" data-onglet="inscription">Créer mon compte</button>
    </div>
    <div class="zone-google">${etat.google ? boutonGoogle() : ""}</div>
    <form class="carte formulaire" data-form="${etat.onglet}">
      <label>Mail<input type="email" name="email" autocomplete="email" required></label>
      <label>Mot de passe<input type="password" name="mdp" minlength="6" autocomplete="${etat.onglet === "connexion" ? "current-password" : "new-password"}" required></label>
      <button class="bouton" type="submit">${etat.onglet === "connexion" ? "Je me connecte" : "Je crée mon compte"}</button>
      ${etat.onglet === "connexion" ? `<button class="lien" type="button" data-action="mdp-oublie">Mot de passe oublié ?</button>` : `<p class="aide">Ensuite, il te faudra le code JOC donné par les orgas.</p>`}
    </form>
  `;
  };

  // Mot de passe oublié : code à 6 chiffres reçu par mail, à taper ici.
  // (Marche partout, même si le mail s'ouvre dans un autre navigateur que l'app.)
  function ecranRecuperation() {
    return `
      <h1 class="titre-page">Mot de passe oublié</h1>
      <form class="carte formulaire" data-form="code-recuperation">
        <p>On t'a envoyé un mail${etat.emailRecup ? ` à <strong>${esc(etat.emailRecup)}</strong>` : ""}. Recopie le <strong>code</strong> qu'il contient, puis choisis ton nouveau mot de passe.</p>
        <label>Mail<input type="email" name="email" value="${esc(etat.emailRecup)}" autocomplete="email" required></label>
        <label>Code reçu par mail<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required></label>
        <label>Nouveau mot de passe<input type="password" name="mdp" minlength="6" autocomplete="new-password" required></label>
        <button class="bouton" type="submit">Changer mon mot de passe</button>
        <p class="aide">Pas de mail ? Regarde dans les spams, puis réessaie dans quelques minutes.</p>
      </form>
      <button class="lien" data-action="renvoyer-code">Renvoyer un code</button>
      <button class="lien" data-action="onglet-connexion" data-onglet="connexion">← Retour à la connexion</button>
    `;
  }

  A["connexion-google"] = async ({ ctx }) => {
    ctx.toast("Ouverture de Google…");
    await DATA.auth.connexionGoogle(); // la page part chez Google puis revient connectée
  };

  A["onglet-connexion"] = ({ el, ctx }) => { etat.onglet = el.dataset.onglet; ctx.afficher(); };

  A.connexion = async ({ valeurs, ctx }) => {
    await DATA.auth.connexion(valeurs.email.trim(), valeurs.mdp);
    await ctx.rafraichir(true);
  };

  A.inscription = async ({ valeurs, ctx }) => {
    await DATA.auth.inscription(valeurs.email.trim(), valeurs.mdp);
    await ctx.rafraichir(true);
  };

  A["mdp-oublie"] = async ({ el, ctx }) => {
    const email = el.form.email.value.trim();
    if (!email) return ctx.toast("Écris d'abord ton mail au-dessus.", "alerte");
    await DATA.auth.motDePasseOublie(email);
    etat.emailRecup = email;
    etat.onglet = "recuperation";
    ctx.afficher();
    ctx.toast("Mail envoyé ! Recopie le code qu'il contient.");
  };

  A["renvoyer-code"] = async ({ ctx }) => {
    const champ = document.querySelector("form[data-form=code-recuperation] input[name=email]");
    const email = (champ && champ.value.trim()) || etat.emailRecup;
    if (!email) return ctx.toast("Écris d'abord ton mail.", "alerte");
    await DATA.auth.motDePasseOublie(email);
    etat.emailRecup = email;
    ctx.toast("Nouveau mail envoyé !");
  };

  A["code-recuperation"] = async ({ valeurs, ctx }) => {
    await DATA.auth.recupererAvecCode(valeurs.email.trim(), valeurs.code.replace(/\s/g, ""), valeurs.mdp);
    etat.onglet = "connexion";
    ctx.toast("Mot de passe changé, tu es connecté ! 🎉");
    await ctx.rafraichir(true);
  };

  E["nouveau-mdp"] = () => `
    <h1 class="titre-page">Nouveau mot de passe</h1>
    <form class="carte formulaire" data-form="nouveau-mdp">
      <label>Nouveau mot de passe<input type="password" name="mdp" minlength="6" autocomplete="new-password" required></label>
      <button class="bouton" type="submit">Enregistrer</button>
    </form>
  `;

  A["nouveau-mdp"] = async ({ valeurs, ctx }) => {
    await DATA.auth.changerMotDePasse(valeurs.mdp);
    ctx.toast("Mot de passe changé !");
    ctx.aller("#/");
  };

  // ---------- Rejoindre les JOC avec le code ----------

  E.rejoindre = () => {
    if (!etat.liste) {
      return `
        <h1 class="titre-page">Le code JOC</h1>
        <form class="carte formulaire" data-form="code">
          <p>Entre le code donné par les orgas pour accéder à l'app.</p>
          <label>Code<input name="code" autocomplete="off" autocapitalize="characters" required></label>
          <button class="bouton" type="submit">Valider</button>
        </form>
        <button class="lien" data-action="deconnexion">Se déconnecter</button>
      `;
    }
    return `
      <h1 class="titre-page">C'est qui ?</h1>
      <h2 class="titre-section">Déjà venu·e aux JOC ?</h2>
      <p class="aide">Retrouve ton prénom : ton profil et ton historique t'attendent.</p>
      ${etat.liste.length ? `
        <input class="filtre-noms" id="filtre-noms" type="search" placeholder="🔎 Cherche ton prénom" autocomplete="off">
        <div class="choix-noms">${etat.liste.map((p) => `
          <button class="carte choix-nom" data-action="cest-moi" data-id="${esc(p.id)}" data-recherche="${esc(`${p.prenom} ${p.surnom || ""}`.toLowerCase())}">
            <strong>${esc(p.prenom)}</strong>${p.surnom ? `<small>${esc(p.surnom)}</small>` : ""}
          </button>`).join("")}</div>` : vide("Tout le monde a déjà retrouvé son profil.")}
      <h2 class="titre-section">Première fois aux JOC ?</h2>
      <form class="carte formulaire" data-form="nouveau-participant">
        <p>Bienvenue dans la famille ! Crée ton profil en 10 secondes.</p>
        <label>Ton prénom<input name="prenom" maxlength="40" autocomplete="given-name" required></label>
        <button class="bouton" type="submit">✨ Je crée mon profil</button>
      </form>
    `;
  };

  // Filtre de la liste des prénoms pendant la frappe
  document.addEventListener("input", (e) => {
    if (e.target.id !== "filtre-noms") return;
    const texte = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".choix-nom").forEach((b) => { b.hidden = texte && !b.dataset.recherche.includes(texte); });
  });

  A.code = async ({ valeurs, ctx }) => {
    const code = valeurs.code.trim();
    etat.liste = await DATA.auth.listeARejoindre(code);
    etat.code = code;
    ctx.afficher();
  };

  A["cest-moi"] = async ({ el, ctx }) => {
    const nom = el.querySelector("strong")?.textContent || "";
    if (!confirm(`Tu confirmes que tu es ${nom} ?`)) return;
    await DATA.auth.rejoindre(etat.code, el.dataset.id, null);
    etat.liste = null;
    ctx.toast("Bienvenue ! Complète ton profil 😎");
    await ctx.rafraichir(true);
    ctx.aller("#/moi/modifier");
  };

  A["nouveau-participant"] = async ({ valeurs, ctx }) => {
    await DATA.auth.rejoindre(etat.code, null, valeurs.prenom.trim());
    etat.liste = null;
    ctx.toast("Bienvenue ! Complète ton profil 😎");
    await ctx.rafraichir(true);
    ctx.aller("#/moi/modifier");
  };

  // ---------- Mon profil ----------

  E.moi = (d) => {
    if (!d.moi) return vide("Profil introuvable.");
    return `
      ${E.participant(d, d.moi.id)}
      ${window.JOC_INSCRIPTION ? window.JOC_INSCRIPTION.carteInscription(d) + window.JOC_INSCRIPTION.carteCompte(d) : ""}
      <div class="actions">
        <a class="bouton" href="#/moi/modifier">✏️ Modifier mon profil</a>
        <button class="bouton ${d.moi.present ? "bouton--secondaire" : "bouton--vert"}" data-action="basculer-presence">${d.moi.present ? "Je ne suis plus là" : "✋ Je suis là !"}</button>
        ${d.moi.estAdmin ? `<a class="bouton bouton--orga" href="#/orga">⭐ Espace orga</a>` : ""}
        ${DATA.estDemo ? "" : `<button class="lien" data-action="deconnexion">Se déconnecter</button>`}
      </div>
    `;
  };

  E["moi/modifier"] = (d) => {
    const p = d.moi;
    if (!p) return vide("Profil introuvable.");
    return `
      <a class="retour" href="#/moi">← Mon profil</a>
      <h1 class="titre-page">Mon profil</h1>
      <div class="carte formulaire photo-profil">
        ${portrait(p, "portrait--xl")}
        <label class="bouton bouton--secondaire bouton--fichier">📷 ${p.photo ? "Changer ma photo" : "Ajouter une photo"}
          <input type="file" accept="image/*" data-action="photo" hidden>
        </label>
        ${p.photo ? `<button class="lien" data-action="retirer-photo">Retirer la photo (garder l'avatar)</button>` : ""}
      </div>
      <form class="carte formulaire" data-form="profil">
        <label>Prénom<input name="prenom" value="${esc(p.prenom)}" maxlength="40" required></label>
        <label>Nom<input name="nom" value="${esc(p.nom)}" maxlength="60"></label>
        <label>Surnom<input name="surnom" value="${esc(p.surnom)}" maxlength="40" placeholder="La Fusée, Tonton..."></label>
        <label>Âge<input name="age" type="number" inputmode="numeric" min="1" max="120" value="${p.age ?? ""}"></label>
        <label>Ta devise<input name="devise" value="${esc(p.devise)}" maxlength="140" placeholder="Une phrase qui te résume"></label>
        <fieldset class="bloc-prive">
          <legend>🔒 Pour les orgas uniquement</legend>
          <div class="deux-colonnes">
            <label>T-shirt<select name="taille">${["", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((t) => `<option value="${t}" ${t === p.taille ? "selected" : ""}>${t || "-"}</option>`).join("")}</select></label>
            <label>Arrivée<input name="arrivee" value="${esc(p.arrivee)}" maxlength="60" placeholder="Jeudi soir"></label>
          </div>
          <label>Régime alimentaire<input name="regime" value="${esc(p.regime)}" maxlength="200" placeholder="Végé, sans gluten, pas de porc..."></label>
        </fieldset>
        <fieldset class="avatars">
          <legend>Ton avatar ${p.photo ? "(si pas de photo)" : ""}</legend>
          ${AVATARS.map((a) => `<label><input type="radio" name="avatar" value="${a}" ${a === p.avatar ? "checked" : ""}><span>${a}</span></label>`).join("")}
        </fieldset>
        <button class="bouton" type="submit">Enregistrer</button>
      </form>
    `;
  };

  A.profil = async ({ valeurs, ctx }) => {
    const age = parseInt(valeurs.age, 10);
    await DATA.ecrire.majParticipant(ctx.d.moi.id, {
      prenom: valeurs.prenom.trim(),
      nom: valeurs.nom.trim() || null,
      surnom: valeurs.surnom.trim() || null,
      age: age > 0 ? age : null,
      devise: valeurs.devise.trim() || null,
      avatar: valeurs.avatar || "🙂",
    });
    await DATA.ecrire.majFiche("fiches_privees", ctx.d.moi.id, {
      taille_tshirt: valeurs.taille || "",
      arrivee: valeurs.arrivee.trim(),
      regime: valeurs.regime.trim(),
    });
    ctx.toast("Profil enregistré !");
    await ctx.rafraichir(true);
    ctx.aller("#/moi");
  };

  A.photo = async ({ el, ctx }) => {
    const fichier = el.files && el.files[0];
    if (!fichier) return;
    ctx.toast("Envoi de la photo…");
    await DATA.ecrire.envoyerPhoto(ctx.d.moi, fichier);
    ctx.toast("Photo enregistrée !");
    await ctx.rafraichir(true);
  };

  A["retirer-photo"] = async ({ ctx }) => {
    await DATA.ecrire.retirerPhoto(ctx.d.moi);
    await ctx.rafraichir(true);
  };

  A["basculer-presence"] = async ({ ctx }) => {
    const moi = ctx.d.moi;
    await DATA.ecrire.majParticipant(moi.id, { present: !moi.present });
    ctx.toast(moi.present ? "C'est noté, à plus tard !" : "Bienvenue sur le terrain ! 💪");
    await ctx.rafraichir(false);
  };

  A.deconnexion = async ({ ctx }) => {
    await DATA.auth.deconnexion();
    etat.liste = null;
    etat.onglet = "connexion";
    ctx.aller("#/");
    await ctx.rafraichir(true);
  };
})();
