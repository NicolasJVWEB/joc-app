/*
 * Records, exploits et étoiles des profils.
 * Tout est calculé à partir des performances saisies par les orgas et de l'historique (palmarès) :
 * - record d'une discipline : la meilleure performance de tous les temps ;
 * - meilleur de l'année : la meilleure performance d'une édition ;
 * - record battu : une performance qui dépasse le record d'avant ;
 * - étoiles (0 à 5) selon les participations, titres et exploits.
 */
(function () {
  const { esc, pluriel } = window.JOC_UI;

  const NIVEAUX = ["Recrue", "Copaing", "Habitué·e", "Pilier", "Champion·ne", "Légende"];
  const SEUILS = [1, 3, 6, 10, 16]; // points pour gagner la 1re, 2e... 5e étoile
  const estParticipation = (titre) => /^(Équipe|Participant)/.test(titre);

  const cache = new WeakMap();

  // valeur a meilleure que b ?
  const meilleure = (a, b, plusGrand) => (plusGrand ? a > b : a < b);
  const format = (v, unite) => `${String(Math.round(v * 100) / 100).replace(".", ",")}${unite ? " " + unite : ""}`;

  function calculer(d) {
    if (cache.has(d)) return cache.get(d);
    const stats = Object.fromEntries(d.participants.map((p) => [p.id, {
      participations: p.palmares.filter((l) => estParticipation(l.titre)).length,
      titres: p.palmares.filter((l) => !estParticipation(l.titre)),
      records: [], meilleurs: {}, recordsBattus: {},
    }]));
    const disciplines = {};

    const parDiscipline = {};
    d.performances.forEach((x) => { (parDiscipline[x.discipline] = parDiscipline[x.discipline] || []).push(x); });
    Object.entries(parDiscipline).forEach(([nom, liste]) => {
      const plusGrand = liste[liste.length - 1].plusGrandGagne;
      const tries = [...liste].sort((a, b) => a.annee - b.annee || (plusGrand ? b.valeur - a.valeur : a.valeur - b.valeur));
      // Record de tous les temps
      const record = tries.reduce((m, x) => (!m || meilleure(x.valeur, m.valeur, plusGrand) ? x : m), null);
      disciplines[nom] = { record, plusGrand, nb: liste.length };
      if (stats[record.participantId]) stats[record.participantId].records.push(record);
      // Meilleur de chaque année
      const annees = [...new Set(tries.map((x) => x.annee))];
      annees.forEach((annee) => {
        const top = tries.filter((x) => x.annee === annee).reduce((m, x) => (!m || meilleure(x.valeur, m.valeur, plusGrand) ? x : m), null);
        const s = stats[top.participantId];
        if (s) (s.meilleurs[nom] = s.meilleurs[nom] || []).push(annee);
      });
      // Records battus, dans l'ordre chronologique
      let reference = null;
      tries.forEach((x) => {
        if (reference && meilleure(x.valeur, reference.valeur, plusGrand) && stats[x.participantId]) {
          stats[x.participantId].recordsBattus[nom] = (stats[x.participantId].recordsBattus[nom] || 0) + 1;
        }
        if (!reference || meilleure(x.valeur, reference.valeur, plusGrand)) reference = x;
      });
    });

    Object.values(stats).forEach((s) => {
      const nbMeilleurs = Object.values(s.meilleurs).reduce((t, a) => t + a.length, 0);
      const nbBattus = Object.values(s.recordsBattus).reduce((t, n) => t + n, 0);
      s.points = s.participations + 3 * s.titres.length + 3 * s.records.length + nbMeilleurs + nbBattus;
      s.etoiles = SEUILS.filter((seuil) => s.points >= seuil).length;
      s.niveau = NIVEAUX[s.etoiles];
    });

    const resultat = { stats, disciplines };
    cache.set(d, resultat);
    return resultat;
  }

  // ---------- Affichage ----------

  // Photo entourée d'étoiles (profil)
  function aureole(portraitHtml, etoiles) {
    const angles = Array.from({ length: etoiles }, (_, i) => (i - (etoiles - 1) / 2) * 34); // arc centré au-dessus de la photo
    return `<div class="aureole">${portraitHtml}${angles.map((a) => `<i style="--angle:${a}deg">⭐</i>`).join("")}</div>`;
  }

  function badgeNiveau(s) {
    return `<p class="niveau"><span class="niveau__etoiles">${"★".repeat(s.etoiles)}<span>${"★".repeat(5 - s.etoiles)}</span></span> ${esc(s.niveau)}</p>`;
  }

  // Petites étoiles à côté d'un nom dans les listes
  function mini(d, id) {
    const s = calculer(d).stats[id];
    return s && s.etoiles ? ` <span class="mini-etoiles" title="${esc(s.niveau)}">${"⭐".repeat(s.etoiles)}</span>` : "";
  }

  // Bloc « Exploits » d'un profil
  function exploits(d, id) {
    const { stats, disciplines } = calculer(d);
    const s = stats[id];
    if (!s) return "";
    const lignes = [];
    const ligne = (emoji, texte) => lignes.push(`<li><span>${emoji}</span><div>${texte}</div></li>`);
    s.records.forEach((r) => ligne("👑", `<strong>Record · ${esc(r.discipline)}</strong> : ${format(r.valeur, r.unite)} (${r.annee})`));
    Object.entries(s.meilleurs).forEach(([nom, annees]) => {
      if (annees.length > 1) ligne("🔥", `<strong>${annees.length}× meilleur·e · ${esc(nom)}</strong> (${annees.join(", ")})`);
      else if (!s.records.some((r) => r.discipline === nom)) ligne("🥇", `Meilleur·e de l'année · ${esc(nom)} (${annees[0]})`);
    });
    Object.entries(s.recordsBattus).forEach(([nom, n]) => ligne("💥", `Record battu${n > 1 ? ` ${n} fois` : ""} · ${esc(nom)}`));
    s.titres.forEach((t) => ligne("🏆", `${esc(t.titre)} (${t.annee})`));
    const resume = [s.participations ? pluriel(s.participations, "édition") : "", s.titres.length ? pluriel(s.titres.length, "trophée") : "",
      s.records.length ? pluriel(s.records.length, "record") : ""].filter(Boolean).join(" · ");
    return `
      <h2 class="titre-section">Exploits</h2>
      ${resume ? `<p class="aide">${resume}</p>` : ""}
      ${lignes.length ? `<ul class="palmares exploits">${lignes.join("")}</ul>` : `<div class="carte vide"><p>Pas encore d'exploit. Les JOC ${esc(d.infos.annee || "")} t'attendent ! 💪</p></div>`}
    `;
  }

  // Tableau d'honneur des records (écran légende)
  function tableauRecords(d) {
    const { disciplines } = calculer(d);
    const noms = Object.keys(disciplines).sort((a, b) => a.localeCompare(b));
    if (!noms.length) return "";
    return `
      <h2 class="titre-section">Les records</h2>
      <ul class="palmares exploits">${noms.map((nom) => {
        const r = disciplines[nom].record;
        const p = d.participants.find((x) => x.id === r.participantId);
        return `<li><span>👑</span><div><strong>${esc(nom)}</strong> : ${format(r.valeur, r.unite)} · ${p ? `<a href="#/participant/${encodeURIComponent(p.id)}">${esc(p.surnom || p.prenom)}</a>` : "?"} (${r.annee})</div></li>`;
      }).join("")}</ul>
    `;
  }

  window.JOC_RECORDS = { calculer, aureole, badgeNiveau, mini, exploits, tableauRecords, format };
})();
