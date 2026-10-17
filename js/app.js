/*
 * Chef d'orchestre : navigation entre les écrans, connexion, rafraîchissement.
 * Adresses : #/ (accueil), #/classement, #/epreuves, #/epreuve/<id>, #/equipes, #/equipe/<id>,
 * #/presents, #/participant/<id>, #/moi, #/moi/modifier, #/orga...
 */
(function () {
  const CFG = window.JOC_CONFIG;
  const DATA = window.JOC_DATA;
  const { vide, toast } = window.JOC_UI;
  const E = window.JOC_ECRANS;
  const A = window.JOC_ACTIONS;
  const vue = document.getElementById("vue");
  const etat = document.getElementById("etat");

  let donnees = null;
  let connecte = DATA.estDemo;
  let recuperationMdp = false;

  // Écrans avec formulaire : le rafraîchissement automatique ne les redessine pas
  const FORMULAIRES = ["connexion", "rejoindre", "nouveau-mdp", "moi/modifier", "orga/scores", "orga/epreuve",
    "orga/participant", "orga/equipes", "orga/infos", "orga/modifier", "orga/courses", "orga/taches",
    "orga/budget", "orga/spectateurs", "orga/paiements", "orga/niveaux", "orga/programme", "orga/edition"];
  const ONGLET_ACTIF = { epreuve: "programme", epreuves: "programme", equipe: "equipes", presents: "equipes", participant: "equipes", historique: "" };

  // "#/orga/scores/12" -> { cle: "orga/scores", param: "12" }
  function lireAdresse() {
    const morceaux = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const double = morceaux.slice(0, 2).join("/");
    if (morceaux.length >= 2 && E[double]) return { cle: double, param: morceaux[2] || "" };
    return { cle: morceaux[0] || "", param: morceaux[1] || "" };
  }

  // Quel écran montrer, selon la connexion et les droits
  function ecranCourant() {
    if (!DATA.estDemo) {
      if (recuperationMdp) return { cle: "nouveau-mdp", param: "" };
      if (!connecte) return { cle: "connexion", param: "" };
      if (donnees && !donnees.moi) return { cle: "rejoindre", param: "" };
    }
    const adresse = lireAdresse();
    if (!adresse.cle) adresse.cle = "accueil";
    if (!E[adresse.cle] || ["connexion", "rejoindre", "nouveau-mdp"].includes(adresse.cle)) adresse.cle = "accueil";
    return adresse;
  }

  function afficher() {
    const { cle, param } = ecranCourant();
    const horsApp = ["connexion", "rejoindre", "nouveau-mdp"].includes(cle);
    document.body.classList.toggle("sans-nav", horsApp);

    if (horsApp) vue.innerHTML = E[cle](donnees);
    else if (!donnees) return; // en attente des données
    else if (cle.startsWith("orga") && !donnees.moi?.estAdmin) vue.innerHTML = vide("Réservé aux orgas.");
    else vue.innerHTML = E[cle](donnees, param);

    const racine = cle.split("/")[0];
    const onglet = ONGLET_ACTIF[racine] ?? (racine === "accueil" ? "" : racine);
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("actif", a.dataset.onglet === onglet));
  }

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

  const ctx = {
    get d() { return donnees; },
    afficher,
    rafraichir,
    toast,
    aller(adresse) {
      if (location.hash === adresse) afficher(); else location.hash = adresse;
    },
  };

  async function lancer(nom, details) {
    const action = A[nom];
    if (!action) return;
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
