/*
 * Petits outils d'affichage partagés par tous les écrans.
 */
(function () {
  const COULEURS = ["vert", "rouge", "ciel", "bleu", "jaune", "orange", "violet"];
  const STATUTS = {
    en_cours: { libelle: "En cours", classe: "statut--live" },
    a_venir: { libelle: "À venir", classe: "statut--avenir" },
    terminee: { libelle: "Terminée", classe: "statut--fini" },
  };
  const MEDAILLES = ["🥇", "🥈", "🥉"];
  const AVATARS = ["😎", "🤡", "🥸", "🦄", "🦖", "🐸", "🦩", "🐙", "🦈", "🦁", "🐻", "🐷",
    "🐔", "🦆", "👽", "🤠", "🧙", "🥷", "🦸", "👑", "🔥", "💪", "🚀", "🍕",
    "🌮", "🥑", "🍑", "🌶️", "🍺", "🧱", "🏆", "🙂"];

  // Toujours échapper ce qui vient de la base avant de l'afficher.
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

  function pts(n) { return `${n} pt${Math.abs(n) > 1 ? "s" : ""}`; }
  function pluriel(n, mot) { return `${n} ${mot}${n > 1 ? "s" : ""}`; }
  function vide(message) { return `<div class="carte vide"><p>${message}</p></div>`; }
  function place(n) { return n <= 3 ? MEDAILLES[n - 1] : n; }

  // Photo si elle existe, sinon l'avatar emoji
  function portrait(p, taille = "") {
    return p.photoUrl
      ? `<img class="portrait ${taille}" src="${esc(p.photoUrl)}" alt="" loading="lazy">`
      : `<span class="portrait portrait--emoji ${taille}">${esc(p.avatar)}</span>`;
  }

  function nomAffiche(p) {
    return p.surnom ? `${p.prenom} « ${p.surnom} »` : p.prenom;
  }

  // Infos de profil obligatoires (elles ne changent pas d'une édition à l'autre)
  const TAILLES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const REGIME_AUCUN = "Rien de spécial";
  function profilComplet(p) { return !!(p && p.taille && p.regime); }

  let minuteur = null;
  function toast(message, type = "") {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.className = `toast toast--visible ${type ? "toast--" + type : ""}`;
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { el.className = "toast"; }, 3200);
  }

  window.JOC_UI = { COULEURS, MEDAILLES, AVATARS, STATUTS, TAILLES, REGIME_AUCUN, esc, styleCouleur, statut, pts, pluriel, vide, place, portrait, nomAffiche, profilComplet, toast };
})();
