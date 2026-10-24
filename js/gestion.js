/*
 * Gestion de l'événement (espace orga) : programme, tâches du CAJOC, courses, budget,
 * paiements, spectateurs, t-shirts et régimes, équilibre des équipes.
 * Remplace les fichiers "Gestion" du Drive.
 */
(function () {
  const DATA = window.JOC_DATA;
  const { esc, styleCouleur, vide, nomAffiche, TAILLES, REGIME_AUCUN } = window.JOC_UI;
  const E = (window.JOC_ECRANS = window.JOC_ECRANS || {});
  const A = (window.JOC_ACTIONS = window.JOC_ACTIONS || {});

  const retour = `<a class="retour" href="#/orga">← Espace orga</a>`;
  const euros = (n) => `${(Math.round((n || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const nombreOuNull = (v) => (v === "" || v == null || isNaN(parseFloat(String(v).replace(",", "."))) ? null : parseFloat(String(v).replace(",", ".")));
  const unique = (liste) => [...new Set(liste.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const grouper = (liste, cle) => liste.reduce((g, x) => ((g[x[cle]] = g[x[cle]] || []).push(x), g), {});
  const repasDuProgramme = (d) => d.programme.filter((l) => l.type === "repas");
  const libelleRepas = (l) => `${l.titre} (${new Date(l.jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })} ${l.heure})`;

  // ---------- Formulaires génériques ----------
  // Chaque table décrit ses champs ; le même code sert à ajouter et à modifier.

  const TABLES = {
    programme: {
      titre: "Programme", retour: "#/orga/programme",
      champs: (d) => [
        { nom: "jour", label: "Jour", type: "date", requis: true },
        { nom: "heure", label: "Heure", type: "time" },
        { nom: "titre", label: "Quoi", requis: true },
        { nom: "type", label: "Type", type: "choix", options: [["epreuve", "🎯 Épreuve"], ["repas", "🍽️ Repas"], ["moment", "✨ Moment"]] },
        { nom: "lieu", label: "Lieu" },
        { nom: "epreuve_id", label: "Épreuve liée", type: "choix", vide: true, options: d.epreuves.map((e) => [e.id, `${e.emoji} ${e.nom}`]) },
      ],
      valeurs: (l) => ({ jour: l.jour, heure: l.heure, titre: l.titre, type: l.type, lieu: l.lieu, epreuve_id: l.epreuveId }),
      liste: (d) => d.programme,
    },
    taches: {
      titre: "Tâche", retour: "#/orga/taches",
      champs: (d) => [
        { nom: "pole", label: "Pôle", suggestions: unique(d.orga.taches.map((t) => t.pole)) },
        { nom: "titre", label: "Tâche", requis: true },
        { nom: "responsable", label: "Qui s'en occupe", suggestions: unique(d.participants.map((p) => p.surnom || p.prenom)) },
        { nom: "ordre", label: "Ordre", type: "nombre" },
      ],
      valeurs: (l) => ({ pole: l.pole, titre: l.titre, responsable: l.responsable, ordre: l.ordre }),
      liste: (d) => d.orga.taches,
    },
    courses: {
      titre: "Article", retour: "#/orga/courses",
      champs: (d) => [
        { nom: "rayon", label: "Rayon", suggestions: unique(d.orga.courses.map((c) => c.rayon)) },
        { nom: "article", label: "Article", requis: true },
        { nom: "quantite", label: "Quantité", type: "nombre" },
        { nom: "unite", label: "Unité", suggestions: unique(["Unité", "Kilogramme", "Litre", ...d.orga.courses.map((c) => c.unite)]) },
        { nom: "prix_unitaire", label: "Prix unitaire (€)", type: "nombre" },
        { nom: "note", label: "Note" },
      ],
      valeurs: (l) => ({ rayon: l.rayon, article: l.article, quantite: l.quantite, unite: l.unite, prix_unitaire: l.prix, note: l.note }),
      liste: (d) => d.orga.courses,
    },
    depenses: {
      titre: "Dépense", retour: "#/orga/budget",
      champs: (d) => [
        { nom: "libelle", label: "Libellé", requis: true },
        { nom: "categorie", label: "Catégorie", suggestions: unique(["Logement", "Repas", "Boissons", "Épreuves", "Goodies", ...d.orga.depenses.map((x) => x.categorie)]) },
        { nom: "montant", label: "Montant (€)", type: "nombre", requis: true },
        { nom: "avance_par", label: "Avancé par", suggestions: unique(d.participants.map((p) => p.surnom || p.prenom)) },
      ],
      valeurs: (l) => ({ libelle: l.libelle, categorie: l.categorie, montant: l.montant, avance_par: l.avancePar }),
      liste: (d) => d.orga.depenses,
    },
    performances: {
      titre: "Performance", retour: "#/orga/records",
      champs: (d) => [
        { nom: "discipline", label: "Épreuve", requis: true, suggestions: unique([...d.performances.map((x) => x.discipline), ...d.epreuves.map((e) => e.nom)]) },
        { nom: "participant_id", label: "Qui", type: "choix", options: [...d.participants].sort((a, b) => a.prenom.localeCompare(b.prenom)).map((p) => [p.id, p.surnom ? `${p.prenom} « ${p.surnom} »` : p.prenom]) },
        { nom: "annee", label: "Année", type: "nombre", requis: true },
        { nom: "valeur", label: "Performance", type: "nombre", requis: true },
        { nom: "unite", label: "Unité", suggestions: ["m", "cm", "s", "min", "pts", "kg"] },
        { nom: "plus_grand_gagne", label: "Le record, c'est…", type: "oui-non", options: [["true", "Le plus grand (distance, points)"], ["false", "Le plus petit (chrono)"]] },
      ],
      valeurs: (l) => ({ discipline: l.discipline, participant_id: l.participantId, annee: l.annee, valeur: l.valeur, unite: l.unite, plus_grand_gagne: String(l.plusGrandGagne) }),
      liste: (d) => d.performances,
    },
    spectateurs: {
      titre: "Spectateur", retour: "#/orga/spectateurs",
      champs: (d) => [
        { nom: "nom", label: "Nom", requis: true },
        { nom: "repas", label: "Repas pris", type: "multi", options: repasDuProgramme(d).map((r) => [r.id, libelleRepas(r)]) },
        { nom: "montant", label: `Montant (€) · vide = ${esc(d.infos.prix_repas_spectateur || 5)} € par repas`, type: "nombre" },
      ],
      valeurs: (l) => ({ nom: l.nom, repas: l.repas, montant: l.montant }),
      liste: (d) => d.orga.spectateurs,
    },
  };

  function champHtml(c, valeur) {
    const v = valeur ?? "";
    const id = `champ-${c.nom}`;
    if (c.type === "choix" || c.type === "oui-non") {
      return `<label>${c.label}<select name="${c.nom}">${c.vide ? `<option value="">-</option>` : ""}${c.options
        .map(([val, lib]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(lib)}</option>`).join("")}</select></label>`;
    }
    if (c.type === "multi") {
      const choisis = (v || []).map(String);
      return `<fieldset class="cases"><legend>${c.label}</legend>${c.options.length ? c.options.map(([val, lib]) => `
        <label><input type="checkbox" name="${c.nom}" value="${esc(val)}" ${choisis.includes(String(val)) ? "checked" : ""}>${esc(lib)}</label>`).join("")
        : `<p class="aide">Ajoute d'abord des repas au programme.</p>`}</fieldset>`;
    }
    const type = { date: "date", time: "time", nombre: "number" }[c.type] || "text";
    const extra = c.type === "nombre" ? ` inputmode="decimal" step="any"` : "";
    return `<label>${c.label}<input type="${type}" name="${c.nom}" value="${esc(v)}"${extra}${c.requis ? " required" : ""}${c.suggestions ? ` list="${id}"` : ""}>
      ${c.suggestions ? `<datalist id="${id}">${c.suggestions.map((s) => `<option value="${esc(s)}">`).join("")}</datalist>` : ""}</label>`;
  }

  function formulaire(d, table, ligne) {
    const conf = TABLES[table];
    const valeurs = ligne ? conf.valeurs(ligne) : {};
    return `
      <form class="carte formulaire" data-form="ligne" data-table="${table}" data-id="${ligne ? esc(ligne.id) : ""}">
        ${conf.champs(d).map((c) => champHtml(c, valeurs[c.nom])).join("")}
        <button class="bouton" type="submit">${ligne ? "Enregistrer" : "➕ Ajouter"}</button>
      </form>`;
  }

  // Bloc repliable "Ajouter" en haut des listes
  const blocAjout = (d, table, libelle) => `
    <details class="ajout"><summary class="bouton bouton--secondaire">➕ ${libelle}</summary>${formulaire(d, table, null)}</details>`;

  // Écran de modification : #/orga/modifier/<table>~<id>
  E["orga/modifier"] = (d, param) => {
    const [table, id] = (param || "").split("~");
    const conf = TABLES[table];
    const ligne = conf && conf.liste(d).find((l) => l.id === id);
    if (!ligne) return vide("Élément introuvable.");
    return `
      <a class="retour" href="${conf.retour}">← Retour</a>
      <h1 class="titre-page">Modifier</h1>
      ${formulaire(d, table, ligne)}
      <button class="lien lien--danger" data-action="supprimer-ligne" data-table="${table}" data-id="${esc(id)}" data-retour="${conf.retour}">Supprimer</button>
    `;
  };

  const lienModif = (table, id) => `#/orga/modifier/${table}~${encodeURIComponent(id)}`;

  A.ligne = async ({ el, ctx }) => {
    const table = el.dataset.table;
    const conf = TABLES[table];
    const fd = new FormData(el);
    const champs = {};
    conf.champs(ctx.d).forEach((c) => {
      if (c.type === "multi") champs[c.nom] = fd.getAll(c.nom).map(Number);
      else if (c.type === "oui-non") champs[c.nom] = fd.get(c.nom) !== "false";
      else if (c.type === "nombre") champs[c.nom] = nombreOuNull(fd.get(c.nom));
      else {
        const v = String(fd.get(c.nom) ?? "").trim();
        champs[c.nom] = v === "" && ["time", "date", "choix"].includes(c.type) ? null : v;
      }
    });
    // Valeurs par défaut propres à certaines tables
    if (table === "courses") { champs.quantite = champs.quantite ?? 1; champs.prix_unitaire = champs.prix_unitaire ?? 0; champs.unite = champs.unite || "Unité"; }
    if (table === "taches") champs.ordre = champs.ordre ?? 0;
    if (table === "depenses") champs.montant = champs.montant ?? 0;
    if (table === "programme" && !champs.type) champs.type = "moment";
    if (table === "performances") champs.unite = champs.unite || "";
    if (table === "spectateurs" && champs.montant == null) {
      champs.montant = champs.repas.length * (nombreOuNull(ctx.d.infos.prix_repas_spectateur) ?? 5);
    }
    await DATA.ecrire.enregistrerLigne(table, champs, el.dataset.id || null);
    ctx.toast("Enregistré !");
    await ctx.rafraichir(true);
    ctx.aller(conf.retour);
  };

  A["supprimer-ligne"] = async ({ el, ctx }) => {
    if (!confirm("Supprimer définitivement ?")) return;
    await DATA.ecrire.supprimerLigne(el.dataset.table, el.dataset.id);
    await ctx.rafraichir(true);
    if (el.dataset.retour) ctx.aller(el.dataset.retour);
  };

  // Case à cocher d'une ligne (fait, acheté, remboursé, payé)
  A.cocher = async ({ el, ctx }) => {
    await DATA.ecrire.enregistrerLigne(el.dataset.table, { [el.dataset.champ]: el.checked }, el.dataset.id);
    await ctx.rafraichir(true);
  };

  // Champ du suivi orga d'un participant (paiements, niveaux)
  A.suivi = async ({ el, ctx }) => {
    const valeur = el.type === "checkbox" ? el.checked : nombreOuNull(el.value) ?? (el.dataset.champ === "reste_du" ? 0 : null);
    await DATA.ecrire.majFiche("suivi_orga", el.dataset.id, { [el.dataset.champ]: valeur });
    // Cases : on redessine (compteurs) ; champs chiffrés : on ne casse pas la saisie en cours
    await ctx.rafraichir(el.type === "checkbox");
  };

  // ---------- Programme ----------

  E["orga/programme"] = (d) => {
    const jours = [...new Set(d.programme.map((l) => l.jour))];
    return `
      ${retour}<h1 class="titre-page">Programme</h1>
      ${blocAjout(d, "programme", "Ajouter au programme")}
      ${jours.length ? jours.map((jour) => `
        <h2 class="titre-section">${esc(new Date(jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }))}</h2>
        ${d.programme.filter((l) => l.jour === jour).map((l) => `
          <a class="carte ligne ligne--compacte" href="${lienModif("programme", l.id)}">
            <span class="programme__heure">${esc(l.heure)}</span>
            <span class="ligne__texte"><strong>${esc(l.titre)}</strong><small>${[{ epreuve: "🎯 Épreuve", repas: "🍽️ Repas", moment: "✨ Moment" }[l.type], l.lieu].filter(Boolean).map(esc).join(" · ")}</small></span>
            <span class="chevron">›</span>
          </a>`).join("")}`).join("") : vide("Programme vide pour l'instant.")}
    `;
  };

  // ---------- Tâches du CAJOC ----------

  E["orga/taches"] = (d) => {
    const taches = d.orga.taches;
    const faites = taches.filter((t) => t.fait).length;
    const poles = grouper(taches, "pole");
    return `
      ${retour}<h1 class="titre-page">Tâches du CAJOC</h1>
      <div class="jauge"><span style="width:${taches.length ? Math.round((faites / taches.length) * 100) : 0}%"></span></div>
      <p class="aide">${faites}/${taches.length} tâches faites</p>
      ${blocAjout(d, "taches", "Ajouter une tâche")}
      ${Object.keys(poles).length ? Object.entries(poles).map(([pole, liste]) => `
        <h2 class="titre-section">${esc(pole || "Sans pôle")}</h2>
        <div class="carte liste-cases">
          ${liste.map((t) => `
            <div class="case-ligne ${t.fait ? "case-ligne--faite" : ""}">
              <label class="case"><input type="checkbox" data-action="cocher" data-table="taches" data-champ="fait" data-id="${esc(t.id)}" ${t.fait ? "checked" : ""}><span></span></label>
              <a class="case-ligne__texte" href="${lienModif("taches", t.id)}"><strong>${esc(t.titre)}</strong>${t.responsable ? `<small>${esc(t.responsable)}</small>` : ""}</a>
            </div>`).join("")}
        </div>`).join("") : vide("Aucune tâche pour l'instant.")}
    `;
  };

  // ---------- Courses ----------

  E["orga/courses"] = (d) => {
    const courses = d.orga.courses;
    const total = courses.reduce((s, c) => s + c.quantite * c.prix, 0);
    const reste = courses.filter((c) => !c.achete).reduce((s, c) => s + c.quantite * c.prix, 0);
    const rayons = grouper(courses, "rayon");
    return `
      ${retour}<h1 class="titre-page">Courses</h1>
      <div class="compteur compteur--2 compteur--argent">
        <div class="compteur__case"><strong>${euros(total)}</strong><span>budget courses</span></div>
        <div class="compteur__case"><strong>${euros(reste)}</strong><span>reste à acheter</span></div>
      </div>
      ${blocAjout(d, "courses", "Ajouter un article")}
      ${Object.keys(rayons).length ? Object.entries(rayons).map(([rayon, liste]) => `
        <h2 class="titre-section">${esc(rayon || "Divers")} <small class="sous-total">${euros(liste.reduce((s, c) => s + c.quantite * c.prix, 0))}</small></h2>
        <div class="carte liste-cases">
          ${liste.map((c) => `
            <div class="case-ligne ${c.achete ? "case-ligne--faite" : ""}">
              <label class="case"><input type="checkbox" data-action="cocher" data-table="courses" data-champ="achete" data-id="${esc(c.id)}" ${c.achete ? "checked" : ""}><span></span></label>
              <a class="case-ligne__texte" href="${lienModif("courses", c.id)}"><strong>${esc(c.article)}</strong><small>${esc(String(c.quantite).replace(".", ","))} ${esc(c.unite)} × ${euros(c.prix)}${c.note ? ` · ${esc(c.note)}` : ""}</small></a>
              <span class="case-ligne__montant">${euros(c.quantite * c.prix)}</span>
            </div>`).join("")}
        </div>`).join("") : vide("Liste de courses vide.")}
    `;
  };

  // ---------- Budget ----------

  E["orga/budget"] = (d) => {
    const { depenses, spectateurs } = d.orga;
    const total = depenses.reduce((s, x) => s + x.montant, 0);
    const recettes = spectateurs.reduce((s, x) => s + x.montant, 0);
    const nb = d.participants.length;
    const part = nb ? (total - recettes) / nb : 0;
    const categories = grouper(depenses, "categorie");
    // Ce qu'il reste à rembourser à chacun
    const aRembourser = Object.entries(grouper(depenses.filter((x) => !x.rembourse && x.avancePar), "avancePar"))
      .map(([qui, liste]) => [qui, liste.reduce((s, x) => s + x.montant, 0)]);
    return `
      ${retour}<h1 class="titre-page">Budget</h1>
      <div class="compteur compteur--argent">
        <div class="compteur__case"><strong>${euros(total)}</strong><span>dépenses</span></div>
        <div class="compteur__case"><strong>${euros(recettes)}</strong><span>spectateurs</span></div>
        <div class="compteur__case"><strong>${euros(part)}</strong><span>par participant (${nb})</span></div>
      </div>
      ${Object.keys(categories).length > 1 ? `<div class="carte repartition">${Object.entries(categories).map(([cat, liste]) => {
        const somme = liste.reduce((s, x) => s + x.montant, 0);
        return `<div class="repartition__ligne"><span>${esc(cat || "Autre")}</span><span class="repartition__barre"><i style="width:${total ? Math.round((somme / total) * 100) : 0}%"></i></span><strong>${euros(somme)}</strong></div>`;
      }).join("")}</div>` : ""}
      ${aRembourser.length ? `<h2 class="titre-section">À rembourser</h2><div class="carte">${aRembourser.map(([qui, somme]) => `<p class="ligne-simple"><span>${esc(qui)}</span><strong>${euros(somme)}</strong></p>`).join("")}</div>` : ""}
      <h2 class="titre-section">Dépenses</h2>
      ${blocAjout(d, "depenses", "Ajouter une dépense")}
      ${depenses.length ? `<div class="carte liste-cases">${depenses.map((x) => `
        <div class="case-ligne ${x.rembourse ? "case-ligne--faite" : ""}">
          <label class="case" title="Remboursé"><input type="checkbox" data-action="cocher" data-table="depenses" data-champ="rembourse" data-id="${esc(x.id)}" ${x.rembourse ? "checked" : ""}><span></span></label>
          <a class="case-ligne__texte" href="${lienModif("depenses", x.id)}"><strong>${esc(x.libelle)}</strong><small>${[x.categorie, x.avancePar ? `avancé par ${x.avancePar}` : ""].filter(Boolean).map(esc).join(" · ")}</small></a>
          <span class="case-ligne__montant">${euros(x.montant)}</span>
        </div>`).join("")}</div><p class="aide">Case cochée = remboursé.</p>` : vide("Aucune dépense pour l'instant.")}
    `;
  };

  // ---------- Paiements des participants ----------

  E["orga/paiements"] = (d) => {
    const s = d.orga.suivi;
    const acomptes = d.participants.filter((p) => s[p.id].acompte).length;
    const soldes = d.participants.filter((p) => s[p.id].solde).length;
    const du = d.participants.reduce((t, p) => t + (s[p.id].resteDu || 0), 0);
    return `
      ${retour}<h1 class="titre-page">Paiements</h1>
      <div class="compteur compteur--argent">
        <div class="compteur__case"><strong>${acomptes}/${d.participants.length}</strong><span>acomptes</span></div>
        <div class="compteur__case"><strong>${soldes}/${d.participants.length}</strong><span>soldes</span></div>
        <div class="compteur__case"><strong>${euros(du)}</strong><span>reste dû</span></div>
      </div>
      <div class="carte tableau">
        <div class="tableau__entete"><span>Participant</span><span>Acompte</span><span>Solde</span><span>Reste dû</span></div>
        ${d.participants.map((p) => `
          <div class="tableau__ligne">
            <span class="tableau__nom">${esc(nomAffiche(p))}</span>
            <label class="case"><input type="checkbox" data-action="suivi" data-champ="acompte_paye" data-id="${esc(p.id)}" ${s[p.id].acompte ? "checked" : ""}><span></span></label>
            <label class="case"><input type="checkbox" data-action="suivi" data-champ="solde_paye" data-id="${esc(p.id)}" ${s[p.id].solde ? "checked" : ""}><span></span></label>
            <input class="mini-champ" type="number" inputmode="decimal" step="any" value="${s[p.id].resteDu || ""}" placeholder="0" data-action="suivi" data-champ="reste_du" data-id="${esc(p.id)}" aria-label="Reste dû">
          </div>`).join("")}
      </div>
    `;
  };

  // ---------- Spectateurs ----------

  E["orga/spectateurs"] = (d) => {
    const liste = d.orga.spectateurs;
    const repas = repasDuProgramme(d);
    const total = liste.reduce((s, x) => s + x.montant, 0);
    const paye = liste.filter((x) => x.paye).reduce((s, x) => s + x.montant, 0);
    return `
      ${retour}<h1 class="titre-page">Spectateurs</h1>
      <div class="compteur compteur--argent">
        <div class="compteur__case"><strong>${liste.length}</strong><span>spectateurs</span></div>
        <div class="compteur__case"><strong>${euros(total)}</strong><span>à encaisser</span></div>
        <div class="compteur__case"><strong>${euros(paye)}</strong><span>encaissé</span></div>
      </div>
      ${repas.length ? `<div class="carte repartition">${repas.map((r) => `
        <p class="ligne-simple"><span>🍽️ ${esc(libelleRepas(r))}</span><strong>${liste.filter((x) => x.repas.includes(r.id)).length}</strong></p>`).join("")}</div>
        <p class="aide">Nombre de spectateurs à prévoir par repas.</p>` : ""}
      ${blocAjout(d, "spectateurs", "Ajouter un spectateur")}
      ${liste.length ? `<div class="carte liste-cases">${liste.map((x) => `
        <div class="case-ligne ${x.paye ? "case-ligne--faite" : ""}">
          <label class="case" title="Payé"><input type="checkbox" data-action="cocher" data-table="spectateurs" data-champ="paye" data-id="${esc(x.id)}" ${x.paye ? "checked" : ""}><span></span></label>
          <a class="case-ligne__texte" href="${lienModif("spectateurs", x.id)}"><strong>${esc(x.nom)}</strong><small>${x.repas.length} repas</small></a>
          <span class="case-ligne__montant">${euros(x.montant)}</span>
        </div>`).join("")}</div><p class="aide">Case cochée = payé.</p>` : vide("Aucun spectateur pour l'instant.")}
    `;
  };

  // ---------- T-shirts, régimes, arrivées ----------

  E["orga/tshirts"] = (d) => {
    const tailles = TAILLES;
    const parTaille = grouper(d.participants.filter((p) => p.taille), "taille");
    const sansTaille = d.participants.filter((p) => !p.taille);
    const regimes = d.participants.filter((p) => p.regime && p.regime !== REGIME_AUCUN);
    // Arrivées : celles données dans le formulaire de l'édition en cours
    const arrivees = grouper(d.participants.filter((p) => d.inscriptions[p.id]?.arrivee)
      .map((p) => ({ ...p, arrivee: d.inscriptions[p.id].arrivee })), "arrivee");
    return `
      ${retour}<h1 class="titre-page">T-shirts et repas</h1>
      <h2 class="titre-section">Commande de t-shirts</h2>
      <div class="tailles">${tailles.filter((t) => parTaille[t]).map((t) => `<div class="compteur__case"><strong>${parTaille[t].length}</strong><span>${t}</span></div>`).join("") || vide("Aucune taille renseignée.")}</div>
      ${tailles.filter((t) => parTaille[t]).map((t) => `
        <details class="carte details"><summary><strong>${t}</strong> · ${parTaille[t].length} t-shirts</summary>
          <p class="aide">Flocage dos :</p><p>${parTaille[t].map((p) => esc(p.surnom || p.prenom)).join(" · ")}</p>
        </details>`).join("")}
      ${sansTaille.length ? `<p class="aide">Taille manquante : ${sansTaille.map((p) => esc(p.prenom)).join(", ")}</p>` : ""}
      <h2 class="titre-section">Régimes alimentaires</h2>
      ${regimes.length ? `<div class="carte">${regimes.map((p) => `<p class="ligne-simple"><span>${esc(nomAffiche(p))}</span><strong>${esc(p.regime)}</strong></p>`).join("")}</div>` : vide("Aucun régime particulier.")}
      <h2 class="titre-section">Arrivées</h2>
      ${Object.keys(arrivees).length ? `<div class="carte">${Object.entries(arrivees).map(([quand, liste]) => `
        <p class="ligne-simple"><span>${esc(quand)}</span><strong>${liste.length}</strong></p>
        <p class="aide">${liste.map((p) => esc(p.surnom || p.prenom)).join(" · ")}</p>`).join("")}</div>` : vide("Aucune arrivée renseignée.")}
    `;
  };

  // ---------- Équilibre des équipes ----------

  E["orga/niveaux"] = (d) => {
    const s = d.orga.suivi;
    const moyenne = (liste) => (liste.length ? liste.reduce((a, b) => a + b, 0) / liste.length : null);
    const arrondi = (n) => (n == null ? "-" : String(Math.round(n * 10) / 10).replace(".", ","));
    const stats = d.equipes.map((eq) => {
      const sport = eq.membres.map((p) => s[p.id].sport).filter((n) => n != null);
      const culture = eq.membres.map((p) => s[p.id].culture).filter((n) => n != null);
      const global = eq.membres.map((p) => moyenne([s[p.id].sport, s[p.id].culture].filter((n) => n != null))).filter((n) => n != null);
      return { eq, sport: moyenne(sport), culture: moyenne(culture), global: moyenne(global) };
    });
    return `
      ${retour}<h1 class="titre-page">Équilibre des équipes</h1>
      <p class="aide">🔒 Visible uniquement par les orgas. Note chaque participant de 0 à 10 en sport et en culture pour équilibrer les équipes.</p>
      <div class="grille">${stats.map(({ eq, sport, culture, global }) => `
        <div class="carte tuile" style="${styleCouleur(eq.couleur)}">
          <span class="tuile__emoji">${esc(eq.emoji)}</span><strong>${esc(eq.nom)}</strong>
          <small>💪 ${arrondi(sport)} · 🧠 ${arrondi(culture)}</small>
          <small><strong>Moyenne ${arrondi(global)}</strong> · ${eq.membres.length} pers.</small>
        </div>`).join("")}</div>
      <h2 class="titre-section">Notes par participant</h2>
      <div class="carte tableau tableau--niveaux">
        <div class="tableau__entete"><span>Participant</span><span>💪 Sport</span><span>🧠 Culture</span></div>
        ${d.participants.map((p) => {
          const eq = d.equipes.find((e) => e.id === p.equipeId);
          return `
            <div class="tableau__ligne" style="${eq ? styleCouleur(eq.couleur) : ""}">
              <span class="tableau__nom tableau__nom--equipe">${esc(nomAffiche(p))}</span>
              <input class="mini-champ" type="number" inputmode="decimal" min="0" max="10" step="0.5" value="${s[p.id].sport ?? ""}" data-action="suivi" data-champ="niveau_sport" data-id="${esc(p.id)}" aria-label="Sport">
              <input class="mini-champ" type="number" inputmode="decimal" min="0" max="10" step="0.5" value="${s[p.id].culture ?? ""}" data-action="suivi" data-champ="niveau_culture" data-id="${esc(p.id)}" aria-label="Culture">
            </div>`;
        }).join("")}
      </div>
    `;
  };

  // ---------- Nouvelle édition ----------

  const ORDINAL = (n) => `${n}${n === 1 ? "re" : "e"} édition`;
  const jourLong = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // Décalage (en jours) qui pose l'ancien programme sur les nouvelles dates, en gardant les jours de la semaine
  function calculerDecalage(programme, debut) {
    const nouveau = new Date(debut + "T12:00:00Z");
    const jours = [...new Set(programme.filter((l) => l.type !== "epreuve").map((l) => l.jour))].sort();
    if (!jours.length) return 0;
    const memeJour = jours.find((j) => new Date(j + "T12:00:00Z").getUTCDay() === nouveau.getUTCDay()) || jours[0];
    return Math.round((nouveau - new Date(memeJour + "T12:00:00Z")) / 86400000);
  }

  function texteDates(debut, fin) {
    const d = new Date(debut + "T12:00:00"), f = new Date(fin + "T12:00:00");
    const jd = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" });
    const jf = f.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return `Du ${jd} au ${jf}`;
  }

  E["orga/edition"] = (d) => {
    const annee = (parseInt(d.infos.annee, 10) || new Date().getFullYear()) + 1;
    const numero = (parseInt(d.infos.edition, 10) || 0) + 1;
    return `
      ${retour}<h1 class="titre-page">Nouvelle édition</h1>
      <div class="carte">
        <p><strong>Ce que fait ce bouton :</strong></p>
        <ul class="liste-explication">
          <li>🏛️ L'édition ${esc(d.infos.annee || "")} part dans l'historique de chacun (avec son équipe).</li>
          <li>👥 Les participants et leurs profils sont gardés, mais tout le monde repasse <strong>sans équipe</strong> et <strong>pas encore là</strong>.</li>
          <li>📅 Le programme type (repas, cérémonies) est recalé sur les nouvelles dates. Les épreuves et les résultats sont retirés.</li>
          <li>✅ Tâches et 🛒 courses sont gardées mais décochées.</li>
          <li>💳 Paiements remis à zéro, 💶 dépenses et 👀 spectateurs effacés.</li>
        </ul>
      </div>
      <form class="carte formulaire" data-form="nouvelle-edition">
        <div class="deux-colonnes">
          <label>Numéro<input name="numero" type="number" inputmode="numeric" min="1" value="${numero}" required></label>
          <label>Année<input name="annee" type="number" inputmode="numeric" value="${annee}" required></label>
        </div>
        <label>Premier jour<input name="debut" type="date" required></label>
        <label>Dernier jour<input name="fin" type="date" required></label>
        <label>Pour confirmer, écris l'année<input name="confirmation" inputmode="numeric" autocomplete="off" required></label>
        <button class="bouton bouton--orga" type="submit">🎆 Lancer la nouvelle édition</button>
      </form>
    `;
  };

  A["nouvelle-edition"] = async ({ valeurs, ctx }) => {
    const annee = parseInt(valeurs.annee, 10);
    if (String(annee) !== valeurs.confirmation.trim()) return ctx.toast(`Écris ${annee} dans la case de confirmation.`, "alerte");
    if (valeurs.fin < valeurs.debut) return ctx.toast("Le dernier jour est avant le premier.", "alerte");
    const decalage = calculerDecalage(ctx.d.programme, valeurs.debut);
    const choix = {
      edition: ORDINAL(parseInt(valeurs.numero, 10)), annee, decalage,
      dates: texteDates(valeurs.debut, valeurs.fin),
    };
    if (!confirm(`Lancer les JOC ${annee} (${choix.dates}) ? L'édition actuelle part dans l'historique.`)) return;
    ctx.toast("Préparation de la nouvelle édition…");
    await DATA.ecrire.nouvelleEdition(ctx.d, choix);
    ctx.toast(`Les JOC ${annee} sont lancés ! 🎆`);
    await ctx.rafraichir(true);
    ctx.aller("#/programme");
  };

  // ---------- Records ----------

  E["orga/records"] = (d) => {
    const { disciplines } = window.JOC_RECORDS.calculer(d);
    const parDiscipline = grouper(d.performances, "discipline");
    const nom = (id) => { const p = d.participants.find((x) => x.id === id); return p ? p.surnom || p.prenom : "?"; };
    const annee = parseInt(d.infos.annee, 10) || new Date().getFullYear();
    return `
      ${retour}<h1 class="titre-page">Records</h1>
      <p class="aide">Saisis les performances (distance, chrono, points). L'app calcule seule les records, les meilleurs de chaque année et les étoiles des profils.</p>
      <details class="ajout" open><summary class="bouton bouton--secondaire">➕ Ajouter une performance</summary>${formulaire(d, "performances", null).replace('name="annee" value=""', `name="annee" value="${annee}"`)}</details>
      ${Object.keys(parDiscipline).length ? Object.entries(parDiscipline).sort(([a], [b]) => a.localeCompare(b)).map(([discipline, liste]) => {
        const r = disciplines[discipline].record;
        const plusGrand = disciplines[discipline].plusGrand;
        const tries = [...liste].sort((a, b) => b.annee - a.annee || (plusGrand ? b.valeur - a.valeur : a.valeur - b.valeur));
        return `
          <h2 class="titre-section">${esc(discipline)}</h2>
          <p class="aide">👑 Record : <strong>${window.JOC_RECORDS.format(r.valeur, r.unite)}</strong> par ${esc(nom(r.participantId))} (${r.annee})</p>
          <div class="carte liste-cases">${tries.map((x) => `
            <a class="case-ligne" href="${lienModif("performances", x.id)}">
              <span class="pastille">${x.id === r.id ? "👑" : "🏅"}</span>
              <span class="case-ligne__texte"><strong>${esc(nom(x.participantId))}</strong><small>${x.annee}</small></span>
              <span class="case-ligne__montant">${window.JOC_RECORDS.format(x.valeur, x.unite)}</span>
            </a>`).join("")}</div>`;
      }).join("") : vide("Aucune performance pour l'instant.")}
    `;
  };
})();
