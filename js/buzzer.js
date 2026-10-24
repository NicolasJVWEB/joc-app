/*
 * Buzzer en direct : les orgas posent une question, tous les téléphones connectés peuvent buzzer.
 * L'ordre est décidé par l'heure du serveur Supabase à l'arrivée de chaque buzz.
 * Mises à jour instantanées (temps réel) + vérification toutes les 2 secondes en secours.
 */
(function () {
  const DATA = window.JOC_DATA;
  const { esc, styleCouleur, vide, portrait, toast } = window.JOC_UI;
  const E = (window.JOC_ECRANS = window.JOC_ECRANS || {});
  const A = (window.JOC_ACTIONS = window.JOC_ACTIONS || {});

  const etat = { donnees: null, buzzer: null, buzzes: [], envoi: false, minuteur: null, arretEcoute: null };

  const surEcranBuzzer = () => /^#\/(orga\/)?buzzer/.test(location.hash);
  const estOrga = () => !!etat.donnees?.moi?.estAdmin;

  // ---------- Lecture et rafraîchissement ----------

  async function actualiser() {
    if (DATA.estDemo || !etat.donnees?.moi) return;
    try {
      const { etat: b, buzzes } = await DATA.buzzer.lire();
      const nouvelleQuestion = etat.buzzer && b.ouvert && b.manche > etat.buzzer.manche;
      etat.buzzer = b;
      etat.buzzes = buzzes;
      if (nouvelleQuestion) annoncer();
      dessiner();
    } catch (e) { console.warn(e); }
  }

  // Quand un orga ouvre une nouvelle question : tout le monde bascule sur le buzzer
  function annoncer() {
    if (estOrga() || window.JOC_INSCRIPTION?.editionVerrouillee(etat.donnees)) return;
    const enSaisie = document.activeElement && document.activeElement.matches("input, textarea, select");
    if (!surEcranBuzzer() && !enSaisie) location.hash = "#/buzzer";
    toast("🔔 Nouvelle question : à vos buzzers !");
    if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
  }

  function demarrerSuivi() {
    clearInterval(etat.minuteur);
    etat.minuteur = setInterval(() => { if (!document.hidden && surEcranBuzzer()) actualiser(); }, 2000);
  }

  // Appelé par l'app après chaque chargement des données
  function apresChargement(donnees) {
    etat.donnees = donnees;
    if (DATA.estDemo || !donnees?.moi) return;
    if (!etat.arretEcoute) {
      etat.arretEcoute = DATA.buzzer.ecouter(() => actualiser());
      actualiser();
      demarrerSuivi();
    }
  }

  // ---------- Affichage ----------

  function participant(id) { return etat.donnees?.participants.find((p) => p.id === String(id)); }
  function equipe(id) { return etat.donnees?.equipes.find((e) => e.id === id); }

  function ecart(ms) {
    return ms < 1 ? "" : `+${(ms / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
  }

  function classement(grand) {
    if (!etat.buzzes.length) return `<p class="buzzer__vide">${etat.buzzer?.ouvert ? "Personne n'a encore buzzé…" : ""}</p>`;
    const premier = new Date(etat.buzzes[0].buzz_le);
    return `<ol class="buzzer__classement ${grand ? "buzzer__classement--grand" : ""}">${etat.buzzes.map((b, i) => {
      const p = participant(b.participant_id) || { prenom: "?", avatar: "❔", photoUrl: "" };
      const eq = equipe(b.equipe_id);
      return `
        <li class="${i === 0 ? "premier" : ""}" style="${eq ? styleCouleur(eq.couleur) : ""}">
          <span class="buzzer__rang">${i === 0 ? "🥇" : i + 1}</span>
          ${portrait(p)}
          <span class="ligne__texte"><strong>${esc(p.surnom || p.prenom)}</strong><small>${eq ? `${esc(eq.emoji)} ${esc(eq.nom)}` : "Sans équipe"}</small></span>
          <span class="buzzer__ecart">${ecart(new Date(b.buzz_le) - premier)}</span>
        </li>`;
    }).join("")}</ol>`;
  }

  function vueJoueur() {
    const b = etat.buzzer;
    if (!b) return `<p class="aide">Connexion au buzzer…</p>`;
    const moi = etat.donnees.moi;
    const monRang = etat.buzzes.findIndex((x) => String(x.participant_id) === moi.id);
    const eq = equipe(moi.equipeId);
    let bouton;
    if (monRang >= 0) bouton = `<div class="buzzer-bouton buzzer-bouton--fait"><span>${monRang === 0 ? "🥇" : "✅"}</span><small>${monRang === 0 ? "Premier !" : `${monRang + 1}e`}</small></div>`;
    else if (b.ouvert) bouton = `<button class="buzzer-bouton buzzer-bouton--actif" type="button" ${etat.envoi ? "disabled" : ""}><span>BUZZ</span></button>`;
    else bouton = `<div class="buzzer-bouton buzzer-bouton--ferme"><span>⏳</span><small>Attends la question</small></div>`;
    return `
      ${b.question ? `<p class="buzzer__question">${esc(b.question)}</p>` : ""}
      <div class="buzzer__zone" style="${eq ? styleCouleur(eq.couleur) : ""}">${bouton}</div>
      ${classement(false)}
    `;
  }

  function vueOrga() {
    const b = etat.buzzer;
    if (!b) return `<p class="aide">Connexion au buzzer…</p>`;
    return `
      <div class="buzzer__statut ${b.ouvert ? "ouvert" : ""}">${b.ouvert ? `🔔 Question n°${b.manche} : buzzer OUVERT` : "⏸️ Buzzer fermé"}</div>
      ${b.question ? `<p class="buzzer__question buzzer__question--grand">${esc(b.question)}</p>` : ""}
      ${classement(true)}
      <p class="aide buzzer__compte">${etat.buzzes.length} buzz</p>
    `;
  }

  function dessiner() {
    const zone = document.getElementById("buzzer-zone");
    if (!zone || !etat.donnees) return;
    zone.innerHTML = location.hash.startsWith("#/orga/buzzer") ? vueOrga() : vueJoueur();
  }

  // ---------- Écrans ----------

  E.buzzer = (d) => {
    etat.donnees = d;
    if (DATA.estDemo) return `<h1 class="titre-page">Buzzer</h1>${vide("Le buzzer marche une fois l'app branchée pour de vrai.")}`;
    setTimeout(() => { dessiner(); actualiser(); }, 0);
    return `<h1 class="titre-page">Buzzer</h1><div id="buzzer-zone"></div>`;
  };

  E["orga/buzzer"] = (d) => {
    etat.donnees = d;
    if (DATA.estDemo) return `<a class="retour" href="#/orga">← Espace orga</a><h1 class="titre-page">Buzzer</h1>${vide("Le buzzer marche une fois l'app branchée pour de vrai.")}`;
    setTimeout(() => { dessiner(); actualiser(); }, 0);
    return `
      <a class="retour" href="#/orga">← Espace orga</a>
      <h1 class="titre-page">Buzzer</h1>
      <form class="carte formulaire" data-form="buzzer-ouvrir">
        <label>Question (facultatif, affichée sur les téléphones)<input name="question" maxlength="300" placeholder="Quelle est la capitale du Pérou ?" autocomplete="off"></label>
        <button class="bouton bouton--vert" type="submit">🔔 Nouvelle question : ouvrir le buzzer</button>
      </form>
      <div class="boutons-ligne">
        <button class="bouton bouton--secondaire" data-action="buzzer-fermer">⏸️ Fermer</button>
        <button class="bouton bouton--secondaire" data-action="buzzer-effacer">🧹 Tout effacer</button>
      </div>
      <button class="bouton bouton--orga bouton--grand-ecran" data-action="grand-ecran">🖥️ Mode grand écran</button>
      <div id="buzzer-zone"></div>
      <p class="aide">Les téléphones basculent tout seuls sur le buzzer quand tu ouvres une question. L'ordre suit l'heure d'arrivée sur le serveur.</p>
    `;
  };

  // Buzz : au moment où le doigt touche l'écran (plus rapide qu'un clic)
  document.addEventListener("pointerdown", async (e) => {
    const bouton = e.target.closest(".buzzer-bouton--actif");
    if (!bouton || etat.envoi || !etat.buzzer?.ouvert) return;
    e.preventDefault();
    etat.envoi = true;
    bouton.classList.add("enfonce");
    if (navigator.vibrate) navigator.vibrate(40);
    try {
      await DATA.buzzer.buzzer(etat.buzzer.manche, etat.donnees.moi.id);
    } catch (erreur) {
      toast(erreur.message, "alerte");
    }
    etat.envoi = false;
    await actualiser();
  });

  A["buzzer-ouvrir"] = async ({ el, valeurs }) => {
    await DATA.buzzer.ouvrir(valeurs.question.trim());
    el.reset();
    toast("Buzzer ouvert ! 🔔");
    await actualiser();
  };

  A["buzzer-fermer"] = async () => {
    await DATA.buzzer.fermer();
    await actualiser();
  };

  A["buzzer-effacer"] = async () => {
    if (!confirm("Effacer tous les buzz et fermer le buzzer ?")) return;
    await DATA.buzzer.effacer();
    await actualiser();
  };

  A["grand-ecran"] = ({ el }) => {
    const actif = document.body.classList.toggle("grand-ecran");
    el.textContent = actif ? "✕ Quitter le grand écran" : "🖥️ Mode grand écran";
    if (document.body.classList.contains("grand-ecran") && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) document.exitFullscreen();
  };

  window.addEventListener("hashchange", () => {
    if (!location.hash.startsWith("#/orga/buzzer")) document.body.classList.remove("grand-ecran");
  });

  window.JOC_BUZZER = { apresChargement };
})();
