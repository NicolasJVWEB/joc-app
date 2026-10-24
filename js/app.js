/*
 * Chef d'orchestre : navigation entre les écrans, connexion, rafraîchissement.
 * Adresses : #/ (accueil), #/classement, #/epreuves, #/epreuve/<id>, #/equipes, #/equipe/<id>,
 * #/presents, #/participant/<id>, #/moi, #/moi/modifier, #/orga...
 */
(function () {
  const CFG = window.JOC_CONFIG;
  const DATA = window.JOC_DATA;
  const { esc, vide, toast, profilComplet } = window.JOC_UI;
  const INSCRIPTION = window.JOC_INSCRIPTION;
  const E = window.JOC_ECRANS;
  const A = window.JOC_ACTIONS;
  const vue = document.getElementById("vue");
  const etat = document.getElementById("etat");

  let donnees = null;
  let connecte = DATA.estDemo;
  let recuperationMdp = false;
  let apercuDe = null; // orga qui regarde l'app comme un participant (lecture seule)

  // Écrans avec formulaire : le rafraîchissement automatique ne les redessine pas
  const FORMULAIRES = ["connexion", "rejoindre", "nouveau-mdp", "profil-essentiel", "moi/modifier", "orga/scores", "orga/epreuve",
    "orga/participant", "orga/equipes", "orga/infos", "orga/modifier", "orga/courses", "orga/taches",
    "orga/budget", "orga/spectateurs", "orga/paiements", "orga/niveaux", "orga/programme", "orga/edition", "buzzer", "orga/buzzer", "inscription", "orga/records"];
  const ONGLET_ACTIF = { epreuve: "programme", epreuves: "programme", equipe: "equipes", presents: "equipes", participant: "equipes", historique: "", buzzer: "programme", inscription: "" };
  // Écrans sans barre d'onglets (avant d'entrer dans l'app)
  const HORS_APP = ["connexion", "rejoindre", "nouveau-mdp", "profil-essentiel"];

  // "#/orga/scores/12" -> { cle: "orga/scores", param: "12" }
  function lireAdresse() {
    const morceaux = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const double = morceaux.slice(0, 2).join("/");
    if (morceaux.length >= 2 && E[double]) return { cle: double, param: morceaux[2] || "" };
    return { cle: morceaux[0] || "", param: morceaux[1] || "" };
  }

  // Données vues à l'écran : les miennes, ou celles d'un participant pendant un aperçu orga.
  // L'orga lit déjà tout ce que ce participant voit (fiches, inscriptions, paiements).
  function modele() {
    if (!apercuDe || !donnees?.moi?.estAdmin) return donnees;
    const p = donnees.participants.find((x) => x.id === apercuDe);
    if (!p) return donnees;
    const s = donnees.orga.suivi[p.id];
    const monPaiement = s && (s.acompte || s.solde || s.resteDu) ? { acompte: s.acompte, solde: s.solde, resteDu: s.resteDu } : null;
    return { ...donnees, moi: { ...p, estAdmin: false }, monPaiement };
  }

  // Quel écran montrer, selon la connexion et les droits
  function ecranCourant() {
    const d = modele();
    if (!DATA.estDemo) {
      if (recuperationMdp) return { cle: "nouveau-mdp", param: "" };
      if (!connecte) return { cle: "connexion", param: "" };
      if (d && !d.moi) return { cle: "rejoindre", param: "" };
      // T-shirt et régime obligatoires avant d'entrer dans l'app
      if (d && !profilComplet(d.moi)) return { cle: "profil-essentiel", param: "" };
    }
    const adresse = lireAdresse();
    if (!adresse.cle) adresse.cle = "accueil";
    if (!E[adresse.cle] || HORS_APP.includes(adresse.cle)) adresse.cle = "accueil";
    return adresse;
  }

  function afficher() {
    const { cle, param } = ecranCourant();
    const horsApp = HORS_APP.includes(cle);
    const racine = cle.split("/")[0];
    const d = modele();
    document.body.classList.toggle("sans-nav", horsApp);

    if (horsApp) vue.innerHTML = E[cle](d);
    else if (!d) return; // en attente des données
    else if (cle.startsWith("orga") && !d.moi?.estAdmin) vue.innerHTML = vide("Réservé aux orgas.");
    else if (INSCRIPTION.ECRANS_EDITION.includes(racine) && INSCRIPTION.editionVerrouillee(d)) vue.innerHTML = E.verrou(d);
    else vue.innerHTML = E[cle](d, param);
    if (d !== donnees) vue.insertAdjacentHTML("afterbegin", bandeauApercu(d.moi));

    const onglet = ONGLET_ACTIF[racine] ?? (racine === "accueil" ? "" : racine);
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("actif", a.dataset.onglet === onglet));
    // Onglet Orga : seulement pour les organisateurs
    document.querySelector(".nav__orga").hidden = !d?.moi?.estAdmin;
  }

  const bandeauApercu = (p) => `
    <div class="bandeau-apercu" role="status">
      <span>👀 Tu vois l'app comme <strong>${esc(p.surnom || p.prenom)}</strong> · rien n'est modifiable</span>
      <button class="bouton bouton--secondaire" data-action="quitter-apercu">Quitter</button>
    </div>`;

  A["quitter-apercu"] = ({ ctx }) => {
    const id = apercuDe;
    apercuDe = null;
    ctx.aller(`#/orga/participant/${encodeURIComponent(id)}`);
  };

  function majEtat(resultat) {
    const heure = new Date(resultat.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const morceaux = [];
    if (DATA.estDemo) morceaux.push("Mode démo");
    morceaux.push(resultat.horsLigne ? `Hors connexion · données de ${heure}` : `Mis à jour à ${heure}`);
    etat.textContent = morceaux.join(" · ");
    etat.classList.toggle("etat--alerte", resultat.horsLigne);
  }

  // force = redessiner même un écran de formulaire
  async function rafraichir(force) {
    try {
      if (!DATA.estDemo) connecte = !!(await DATA.auth.session());
      const resultat = connecte ? await DATA.charger() : null;
      donnees = resultat ? resultat.modele : null;
      if (resultat) majEtat(resultat); else etat.textContent = "";
      if (donnees) apresChargement(donnees);
    } catch (erreur) {
      console.warn(erreur);
      const cache = connecte ? DATA.depuisCache() : null;
      if (cache) { donnees = cache.modele; majEtat(cache); }
      else if (!donnees && connecte) {
        vue.innerHTML = vide("Impossible de charger les données. Vérifie ta connexion puis réessaie.");
        etat.textContent = "Hors connexion";
        return;
      }
    }
    const { cle } = ecranCourant();
    const enSaisie = FORMULAIRES.includes(cle) || vue.contains(document.activeElement) && document.activeElement.matches("input, textarea, select");
    if (!force && enSaisie) return;
    const y = window.scrollY;
    afficher();
    if (!force) window.scrollTo(0, y);
  }

  // Après chaque chargement : buzzer en direct + trace de passage (au plus toutes les 10 minutes)
  let derniereTrace = 0;
  function apresChargement(d) {
    window.JOC_BUZZER?.apresChargement(d);
    if (d.moi && Date.now() - derniereTrace > 10 * 60 * 1000) {
      derniereTrace = Date.now();
      DATA.ecrire.marquerVisite(d.moi.id).catch(() => {});
    }
  }

  const ctx = {
    get d() { return donnees; },
    afficher,
    rafraichir,
    toast,
    aller(adresse) {
      if (location.hash === adresse) afficher(); else location.hash = adresse;
    },
    voirComme(id) {
      apercuDe = id;
      ctx.aller("#/");
      window.scrollTo(0, 0);
    },
  };

  // Pendant un aperçu, seules ces actions restent possibles (rien n'est enregistré)
  const ACTIONS_APERCU = ["quitter-apercu", "copier"];

  async function lancer(nom, details) {
    const action = A[nom];
    if (!action) return;
    if (apercuDe && !ACTIONS_APERCU.includes(nom)) {
      toast("Aperçu : rien n'est modifiable. Quitte l'aperçu pour agir.", "alerte");
      afficher(); // remet en place une case ou une liste touchée
      return;
    }
    try { await action({ ...details, ctx }); }
    catch (erreur) { console.warn(erreur); toast(erreur.message || "Une erreur est survenue.", "alerte"); }
  }

  // Boutons et liens d'action
  vue.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.matches("input, select")) return;
    e.preventDefault();
    lancer(el.dataset.action, { el });
  });

  // Cases à cocher, listes déroulantes, envoi de photo
  vue.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches("input[data-action], select[data-action]")) lancer(el.dataset.action, { el });
  });

  // Formulaires
  vue.addEventListener("submit", async (e) => {
    const form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    const bouton = form.querySelector("[type=submit]");
    if (bouton) bouton.disabled = true;
    await lancer(form.dataset.form, { el: form, valeurs: Object.fromEntries(new FormData(form)) });
    if (bouton && bouton.isConnected) bouton.disabled = false;
  });

  window.addEventListener("hashchange", () => { afficher(); window.scrollTo(0, 0); });
  document.getElementById("rafraichir").addEventListener("click", () => rafraichir(false));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) rafraichir(false); });
  setInterval(() => { if (!document.hidden) rafraichir(false); }, CFG.rafraichissement * 1000);

  DATA.auth.surChangement((evenement) => {
    // Retour depuis le lien "mot de passe oublié" reçu par mail
    if (evenement === "PASSWORD_RECOVERY") recuperationMdp = true;
    if (location.search.includes("code=")) history.replaceState(null, "", location.pathname + location.hash);
    if (evenement === "USER_UPDATED") recuperationMdp = false;
    if (["SIGNED_IN", "SIGNED_OUT", "PASSWORD_RECOVERY", "USER_UPDATED"].includes(evenement)) {
      // Laisser la main avant de recharger (évite de bloquer la bibliothèque de connexion)
      setTimeout(() => rafraichir(true), 0);
    }
  });

  // Lien du mail ouvert dans un autre navigateur, ou expiré : on l'explique au lieu de ne rien faire
  const erreurLien = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, "")).get("error_description");
  if (erreurLien) {
    history.replaceState(null, "", location.pathname);
    setTimeout(() => toast("Ce lien ne marche pas ici. Utilise plutôt « Mot de passe oublié » et le code reçu par mail.", "alerte"), 600);
  }

  // Premier affichage : la copie locale tout de suite (si connecté), puis les données fraîches.
  (async () => {
    if (!DATA.estDemo) connecte = !!(await DATA.auth.session());
    const cache = connecte ? DATA.depuisCache() : null;
    if (cache) { donnees = cache.modele; majEtat(cache); afficher(); }
    rafraichir(true);
  })();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
  }
})();
