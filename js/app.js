/*
 * Affichage de l'app : navigation entre les écrans et rendu HTML.
 * Écrans : #/ (accueil), #/classement, #/epreuves, #/epreuve/<id>, #/equipes, #/equipe/<id>
 */
(function () {
  const CFG = window.JOC_CONFIG;
  const DATA = window.JOC_DATA;
  const vue = document.getElementById("vue");
  const etat = document.getElementById("etat");
  let donnees = null;

  const COULEURS = ["vert", "rouge", "ciel", "bleu", "jaune"];
  const STATUTS = {
    en_cours: { libelle: "En cours", classe: "statut--live" },
    a_venir: { libelle: "À venir", classe: "statut--avenir" },
    terminee: { libelle: "Terminée", classe: "statut--fini" },
  };
  const MEDAILLES = ["🥇", "🥈", "🥉"];

  // Toujours échapper ce qui vient du Sheet avant de l'afficher.
  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Couleur d'équipe : un nom de la charte (vert, rouge...) ou un code #hex.
  function styleCouleur(couleur) {
    const c = (couleur || "").toLowerCase().trim();
    if (COULEURS.includes(c)) return `--equipe: var(--joc-${c})`;
    if (/^#[0-9a-f]{3,8}$/.test(c)) return `--equipe: ${c}`;
    return "";
  }

  function statut(s) {
    const st = STATUTS[s] || STATUTS.a_venir;
    return `<span class="statut ${st.classe}">${st.libelle}</span>`;
  }

  function equipeParId(id) { return donnees.classement.find((e) => e.id === id); }
  function epreuveParId(id) { return donnees.epreuves.find((e) => e.id === id); }
  function pts(n) { return `${n} pt${Math.abs(n) > 1 ? "s" : ""}`; }

  function vide(message) {
    return `<div class="carte vide"><p>${message}</p></div>`;
  }

  // ---------- Écrans ----------

  function ecranAccueil() {
    const { infos, epreuves, classement } = donnees;
    const enCours = epreuves.filter((e) => e.statut === "en_cours");
    const prochaine = epreuves.find((e) => e.statut === "a_venir");
    const faites = epreuves.filter((e) => e.statut === "terminee").length;

    return `
      <section class="hero">
        <img class="hero__logo" src="./assets/logo.png" alt="Logo JOC" width="180" height="181">
        <h1 class="titre-sticker">${esc(CFG.nom)}</h1>
        <p class="hero__sous">${[infos.edition, infos.annee].filter(Boolean).map(esc).join(" · ")}</p>
        ${infos.dates || infos.lieu ? `<p class="hero__infos">${[infos.dates, infos.lieu].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
      </section>

      ${infos.annonce ? `<div class="carte annonce"><span class="annonce__icone">📣</span><p>${esc(infos.annonce)}</p></div>` : ""}

      <div class="compteur">
        <div class="compteur__case"><strong>${faites}</strong><span>épreuve${faites > 1 ? "s" : ""} jouée${faites > 1 ? "s" : ""}</span></div>
        <div class="compteur__case"><strong>${epreuves.length - faites}</strong><span>à jouer</span></div>
        <div class="compteur__case"><strong>${classement.length}</strong><span>équipes</span></div>
      </div>

      ${enCours.length ? `<h2 class="titre-section">En ce moment</h2>${enCours.map(carteEpreuve).join("")}` : ""}
      ${prochaine ? `<h2 class="titre-section">Prochaine épreuve</h2>${carteEpreuve(prochaine)}` : ""}

      <h2 class="titre-section">Top 3</h2>
      ${classement.length ? classement.slice(0, 3).map(ligneClassement).join("") : vide("Aucune équipe pour l'instant.")}
      <a class="bouton" href="#/classement">Voir tout le classement</a>
    `;
  }

  function ecranClassement() {
    const { classement } = donnees;
    if (!classement.length) return `<h1 class="titre-page">Classement</h1>${vide("Aucune équipe pour l'instant.")}`;
    const podium = classement.slice(0, 3);
    // Ordre visuel du podium : 2e, 1er, 3e
    // (la hauteur de marche suit la position, le chiffre affiché suit la place réelle, ex aequo compris)
    const ordre = [[podium[1], 2], [podium[0], 1], [podium[2], 3]].filter(([eq]) => eq);
    return `
      <h1 class="titre-page">Classement</h1>
      <div class="podium">
        ${ordre.map(([eq, marche]) => `
          <a class="podium__marche podium__marche--${marche}" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
            <span class="podium__emoji">${esc(eq.emoji)}</span>
            <span class="podium__nom">${esc(eq.nom)}</span>
            <span class="podium__bloc"><span class="podium__place">${eq.place}</span><span class="podium__pts">${pts(eq.total)}</span></span>
          </a>`).join("")}
      </div>
      ${classement.map(ligneClassement).join("")}
    `;
  }

  function ligneClassement(eq) {
    return `
      <a class="carte ligne" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
        <span class="ligne__place">${eq.place <= 3 ? MEDAILLES[eq.place - 1] : eq.place}</span>
        <span class="pastille">${esc(eq.emoji)}</span>
        <span class="ligne__texte"><strong>${esc(eq.nom)}</strong><small>${eq.victoires} victoire${eq.victoires > 1 ? "s" : ""} · ${eq.jouees} épreuve${eq.jouees > 1 ? "s" : ""}</small></span>
        <span class="ligne__pts">${eq.total}<small>pts</small></span>
      </a>`;
  }

  function carteEpreuve(ep) {
    return `
      <a class="carte ligne" href="#/epreuve/${encodeURIComponent(ep.id)}">
        <span class="pastille pastille--grande">${esc(ep.emoji)}</span>
        <span class="ligne__texte"><strong>${esc(ep.nom)}</strong><small>${[ep.horaire, ep.lieu].filter(Boolean).map(esc).join(" · ")}</small></span>
        ${statut(ep.statut)}
      </a>`;
  }

  function ecranEpreuves() {
    const { epreuves } = donnees;
    if (!epreuves.length) return `<h1 class="titre-page">Épreuves</h1>${vide("Le programme arrive bientôt.")}`;
    return `<h1 class="titre-page">Épreuves</h1>${epreuves.map(carteEpreuve).join("")}`;
  }

  function ecranEpreuve(id) {
    const ep = epreuveParId(id);
    if (!ep) return vide("Épreuve introuvable.");
    const resultats = donnees.scores.filter((s) => s.epreuve === ep.id)
      .sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99) || b.points - a.points);
    return `
      <a class="retour" href="#/epreuves">← Épreuves</a>
      <div class="carte fiche">
        <span class="fiche__emoji">${esc(ep.emoji)}</span>
        <h1 class="titre-page">${esc(ep.nom)}</h1>
        ${statut(ep.statut)}
        <p class="fiche__meta">${[ep.horaire, ep.lieu].filter(Boolean).map(esc).join(" · ")}</p>
        ${ep.description ? `<p>${esc(ep.description)}</p>` : ""}
      </div>
      <h2 class="titre-section">Résultats</h2>
      ${resultats.length ? resultats.map((s) => {
        const eq = equipeParId(s.equipe) || { nom: s.equipe, emoji: "❔", id: s.equipe };
        return `
          <a class="carte ligne" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
            <span class="ligne__place">${s.rang && s.rang <= 3 ? MEDAILLES[s.rang - 1] : (s.rang ?? "-")}</span>
            <span class="pastille">${esc(eq.emoji)}</span>
            <span class="ligne__texte"><strong>${esc(eq.nom)}</strong></span>
            <span class="ligne__pts">+${s.points}<small>pts</small></span>
          </a>`;
      }).join("") : vide("Pas encore de résultats.")}
    `;
  }

  function ecranEquipes() {
    const { classement } = donnees;
    if (!classement.length) return `<h1 class="titre-page">Équipes</h1>${vide("Les équipes arrivent bientôt.")}`;
    const triees = [...classement].sort((a, b) => a.nom.localeCompare(b.nom));
    return `
      <h1 class="titre-page">Équipes</h1>
      <div class="grille">
        ${triees.map((eq) => `
          <a class="carte tuile" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
            <span class="tuile__emoji">${esc(eq.emoji)}</span>
            <strong>${esc(eq.nom)}</strong>
            <small>${eq.membres.length} membre${eq.membres.length > 1 ? "s" : ""}</small>
          </a>`).join("")}
      </div>
    `;
  }

  function ecranEquipe(id) {
    const eq = equipeParId(id);
    if (!eq) return vide("Équipe introuvable.");
    const sesScores = donnees.scores.filter((s) => s.equipe === eq.id);
    return `
      <a class="retour" href="#/equipes">← Équipes</a>
      <div class="carte fiche fiche--equipe" style="${styleCouleur(eq.couleur)}">
        <span class="fiche__emoji">${esc(eq.emoji)}</span>
        <h1 class="titre-page">${esc(eq.nom)}</h1>
        <p class="fiche__rang">${eq.place <= 3 ? MEDAILLES[eq.place - 1] + " " : ""}${eq.place}<sup>${eq.place === 1 ? "re" : "e"}</sup> place · ${pts(eq.total)}</p>
        ${eq.membres.length ? `<ul class="membres">${eq.membres.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
      </div>
      <h2 class="titre-section">Parcours</h2>
      ${sesScores.length ? sesScores.map((s) => {
        const ep = epreuveParId(s.epreuve) || { nom: s.epreuve, emoji: "🏁", id: s.epreuve };
        return `
          <a class="carte ligne" href="#/epreuve/${encodeURIComponent(ep.id)}">
            <span class="pastille">${esc(ep.emoji)}</span>
            <span class="ligne__texte"><strong>${esc(ep.nom)}</strong><small>${s.rang ? `${s.rang}${s.rang === 1 ? "er" : "e"}` : "Classement à venir"}</small></span>
            <span class="ligne__pts">+${s.points}<small>pts</small></span>
          </a>`;
      }).join("") : vide("Pas encore de résultats pour cette équipe.")}
    `;
  }

  // ---------- Navigation ----------

  const ROUTES = {
    "": ecranAccueil,
    classement: ecranClassement,
    epreuves: ecranEpreuves,
    epreuve: ecranEpreuve,
    equipes: ecranEquipes,
    equipe: ecranEquipe,
  };
  const ONGLET_ACTIF = { epreuve: "epreuves", equipe: "equipes" };

  function afficher() {
    const [, page = "", param = ""] = location.hash.split("/");
    const rendu = ROUTES[page] || ecranAccueil;
    if (donnees) vue.innerHTML = rendu(decodeURIComponent(param));
    const onglet = ONGLET_ACTIF[page] ?? page;
    document.querySelectorAll(".nav a").forEach((a) => {
      a.classList.toggle("actif", a.dataset.onglet === onglet);
    });
  }

  function majEtat(resultat) {
    const heure = new Date(resultat.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const morceaux = [];
    if (DATA.estDemo) morceaux.push("Mode démo");
    morceaux.push(resultat.horsLigne ? `Hors connexion · données de ${heure}` : `Mis à jour à ${heure}`);
    etat.textContent = morceaux.join(" · ");
    etat.classList.toggle("etat--alerte", resultat.horsLigne);
  }

  async function rafraichir(changementEcran) {
    try {
      const resultat = await DATA.charger();
      donnees = resultat.modele;
      majEtat(resultat);
    } catch (erreur) {
      console.warn(erreur);
      const cache = DATA.depuisCache();
      if (cache) { donnees = cache.modele; majEtat(cache); }
      else if (!donnees) {
        vue.innerHTML = vide("Impossible de charger les données. Vérifie ta connexion puis réessaie.");
        etat.textContent = "Hors connexion";
        return;
      }
    }
    // Pendant un rafraîchissement automatique, on garde la position de défilement.
    const y = window.scrollY;
    afficher();
    if (!changementEcran) window.scrollTo(0, y);
  }

  window.addEventListener("hashchange", () => { afficher(); window.scrollTo(0, 0); });
  document.getElementById("rafraichir").addEventListener("click", () => rafraichir(false));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) rafraichir(false); });
  setInterval(() => { if (!document.hidden) rafraichir(false); }, CFG.rafraichissement * 1000);

  // Premier affichage : la copie locale tout de suite, puis les données fraîches.
  const cache = DATA.depuisCache();
  if (cache) { donnees = cache.modele; majEtat(cache); afficher(); }
  rafraichir(true);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
  }
})();
