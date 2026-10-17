/*
 * Lecture des données : Google Sheet (ou fichiers de démo) -> objets JS.
 * Garde une copie locale pour fonctionner hors connexion.
 */
(function () {
  const CFG = window.JOC_CONFIG;
  const CLE_CACHE = "joc-donnees-v1";

  // Découpe un texte CSV en lignes et colonnes (gère les guillemets).
  function lireCSV(texte) {
    const lignes = [];
    let ligne = [], champ = "", entreGuillemets = false;
    for (let i = 0; i < texte.length; i++) {
      const c = texte[i];
      if (entreGuillemets) {
        if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
        else if (c === '"') entreGuillemets = false;
        else champ += c;
      } else if (c === '"') entreGuillemets = true;
      else if (c === ",") { ligne.push(champ); champ = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texte[i + 1] === "\n") i++;
        ligne.push(champ); lignes.push(ligne); ligne = []; champ = "";
      } else champ += c;
    }
    if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }

    const nonVides = lignes.filter((l) => l.some((v) => v.trim() !== ""));
    if (!nonVides.length) return [];
    const entetes = nonVides[0].map((e) => normaliser(e));
    return nonVides.slice(1).map((l) => {
      const objet = {};
      entetes.forEach((e, j) => { if (e) objet[e] = (l[j] || "").trim(); });
      return objet;
    });
  }

  // "Équipe " -> "equipe" : les en-têtes du Sheet peuvent avoir accents et majuscules.
  function normaliser(texte) {
    return texte.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function urlOnglet(onglet) {
    if (!CFG.sheetId) return `./data/demo/${onglet.toLowerCase()}.csv`;
    return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(CFG.sheetId)}` +
      `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(onglet)}&_=${Date.now()}`;
  }

  async function chargerOnglet(onglet) {
    const reponse = await fetch(urlOnglet(onglet), { cache: "no-store" });
    if (!reponse.ok) throw new Error(`Onglet "${onglet}" introuvable (${reponse.status})`);
    return lireCSV(await reponse.text());
  }

  function pointsPourRang(rang) {
    const r = parseInt(rang, 10);
    if (!r || r < 1) return 0;
    return CFG.bareme[r - 1] ?? 1;
  }

  // Assemble les onglets bruts en un modèle prêt à afficher.
  function construire(brut) {
    const infos = {};
    brut.infos.forEach((l) => { if (l.cle) infos[normaliser(l.cle)] = l.valeur || ""; });

    const equipes = brut.equipes.filter((e) => e.id).map((e) => ({
      id: e.id,
      nom: e.nom || e.id,
      couleur: e.couleur || "",
      emoji: e.emoji || "🏅",
      membres: (e.membres || "").split(",").map((m) => m.trim()).filter(Boolean),
    }));

    const epreuves = brut.epreuves.filter((e) => e.id).map((e) => ({
      id: e.id,
      ordre: parseFloat(e.ordre) || 999,
      nom: e.nom || e.id,
      emoji: e.emoji || "🏁",
      horaire: e.horaire || "",
      lieu: e.lieu || "",
      description: e.description || "",
      statut: normaliser(e.statut || "a_venir").replace(/[\s-]+/g, "_"),
    })).sort((a, b) => a.ordre - b.ordre);

    const scores = brut.scores.filter((s) => s.epreuve && s.equipe).map((s) => ({
      epreuve: s.epreuve,
      equipe: s.equipe,
      rang: parseInt(s.rang, 10) || null,
      points: s.points !== "" && s.points != null && !isNaN(parseFloat(s.points))
        ? parseFloat(s.points)
        : pointsPourRang(s.rang),
    }));

    const classement = equipes.map((eq) => {
      const sesScores = scores.filter((s) => s.equipe === eq.id);
      return {
        ...eq,
        total: sesScores.reduce((somme, s) => somme + s.points, 0),
        victoires: sesScores.filter((s) => s.rang === 1).length,
        jouees: sesScores.length,
      };
    }).sort((a, b) => b.total - a.total || b.victoires - a.victoires || a.nom.localeCompare(b.nom));

    // Ex aequo : même total = même place
    classement.forEach((eq, i) => {
      eq.place = i > 0 && eq.total === classement[i - 1].total ? classement[i - 1].place : i + 1;
    });

    return { infos, equipes, epreuves, scores, classement };
  }

  async function charger() {
    const o = CFG.onglets;
    const [infos, equipes, epreuves, scores] = await Promise.all(
      [o.infos, o.equipes, o.epreuves, o.scores].map(chargerOnglet)
    );
    const brut = { infos, equipes, epreuves, scores };
    try { localStorage.setItem(CLE_CACHE, JSON.stringify({ date: Date.now(), brut })); } catch (e) {}
    return { modele: construire(brut), date: Date.now(), horsLigne: false };
  }

  function depuisCache() {
    try {
      const sauve = JSON.parse(localStorage.getItem(CLE_CACHE));
      if (sauve && sauve.brut) return { modele: construire(sauve.brut), date: sauve.date, horsLigne: true };
    } catch (e) {}
    return null;
  }

  window.JOC_DATA = { charger, depuisCache, estDemo: !CFG.sheetId };
})();
