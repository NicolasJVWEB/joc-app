/*
 * Espace orga (réservé aux admins) : résultats, épreuves, participants, équipes, infos.
 */
(function () {
  const DATA = window.JOC_DATA;
  const { esc, styleCouleur, statut, vide, portrait, nomAffiche, COULEURS, STATUTS } = window.JOC_UI;
  const E = (window.JOC_ECRANS = window.JOC_ECRANS || {});
  const A = (window.JOC_ACTIONS = window.JOC_ACTIONS || {});

  const retour = `<a class="retour" href="#/orga">← Espace orga</a>`;
  const optionsStatut = (actuel) => Object.entries(STATUTS)
    .map(([cle, s]) => `<option value="${cle}" ${cle === actuel ? "selected" : ""}>${s.libelle}</option>`).join("");
  const nombreOuNull = (v) => (v === "" || v == null || isNaN(parseFloat(v)) ? null : parseFloat(v));

  E.orga = (d) => {
    const taches = d.orga.taches;
    const courses = d.orga.courses;
    const s = d.orga.suivi;
    return `
    <h1 class="titre-page">Espace orga</h1>
    <h2 class="titre-section">Pendant les jeux</h2>
    <div class="grille">
      <a class="carte tuile tuile--menu" href="#/orga/buzzer"><span class="tuile__emoji">🔔</span><strong>Buzzer</strong><small>Questions en direct</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/scores"><span class="tuile__emoji">🏆</span><strong>Résultats</strong><small>Saisir les classements</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/records"><span class="tuile__emoji">👑</span><strong>Records</strong><small>${d.performances.length} perfs saisies</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/participants"><span class="tuile__emoji">✋</span><strong>Participants</strong><small>${d.participants.filter((p) => p.compteId).length}/${d.participants.length} comptes · ${d.participants.filter((p) => p.present).length} présents</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/programme"><span class="tuile__emoji">📅</span><strong>Programme</strong><small>${d.programme.length} moments</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/epreuves"><span class="tuile__emoji">🎯</span><strong>Épreuves</strong><small>${d.epreuves.length} au programme</small></a>
    </div>
    <h2 class="titre-section">Préparation (CAJOC)</h2>
    <div class="grille">
      <a class="carte tuile tuile--menu" href="#/orga/inscriptions"><span class="tuile__emoji">📝</span><strong>Inscriptions</strong><small>${Object.values(d.inscriptions).filter((r) => r.reponse === "oui").length} viennent · ${d.participants.length - Object.keys(d.inscriptions).length} sans réponse</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/taches"><span class="tuile__emoji">✅</span><strong>Tâches</strong><small>${taches.filter((t) => t.fait).length}/${taches.length} faites</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/courses"><span class="tuile__emoji">🛒</span><strong>Courses</strong><small>${courses.filter((c) => !c.achete).length} à acheter</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/budget"><span class="tuile__emoji">💶</span><strong>Budget</strong><small>Dépenses et part par personne</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/paiements"><span class="tuile__emoji">💳</span><strong>Paiements</strong><small>${d.participants.filter((p) => s[p.id] && s[p.id].solde).length}/${d.participants.length} soldes payés</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/spectateurs"><span class="tuile__emoji">👀</span><strong>Spectateurs</strong><small>${d.orga.spectateurs.length} inscrits</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/tshirts"><span class="tuile__emoji">👕</span><strong>T-shirts et repas</strong><small>Tailles, régimes, arrivées</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/niveaux"><span class="tuile__emoji">⚖️</span><strong>Équilibre</strong><small>Niveaux des équipes</small></a>
    </div>
    <h2 class="titre-section">Réglages</h2>
    <div class="grille">
      <a class="carte tuile tuile--menu" href="#/orga/equipes"><span class="tuile__emoji">🎨</span><strong>Équipes</strong><small>Noms et couleurs</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/infos"><span class="tuile__emoji">📣</span><strong>Infos</strong><small>Dates, lieu, annonce</small></a>
      <a class="carte tuile tuile--menu" href="#/orga/edition"><span class="tuile__emoji">🎆</span><strong>Nouvelle édition</strong><small>Passer à l'année suivante</small></a>
    </div>
  `;
  };

  // ---------- Résultats ----------

  E["orga/scores"] = (d, id) => {
    if (!id) {
      return `${retour}<h1 class="titre-page">Résultats</h1>
        ${d.epreuves.length ? d.epreuves.map((ep) => `
          <a class="carte ligne" href="#/orga/scores/${encodeURIComponent(ep.id)}">
            <span class="pastille pastille--grande">${esc(ep.emoji)}</span>
            <span class="ligne__texte"><strong>${esc(ep.nom)}</strong><small>${d.scores.filter((s) => s.epreuve === ep.id).length}/${d.equipes.length} équipes classées</small></span>
            ${statut(ep.statut)}
          </a>`).join("") : vide("Ajoute d'abord des épreuves.")}`;
    }
    const ep = d.epreuves.find((e) => e.id === id);
    if (!ep) return vide("Épreuve introuvable.");
    const n = d.equipes.length;
    return `
      <a class="retour" href="#/orga/scores">← Résultats</a>
      <h1 class="titre-page">${esc(ep.emoji)} ${esc(ep.nom)}</h1>
      <form class="carte formulaire" data-form="scores" data-id="${esc(ep.id)}">
        ${d.equipes.map((eq) => {
          const s = d.scores.find((x) => x.epreuve === ep.id && x.equipe === eq.id);
          return `
            <div class="saisie-score" style="${styleCouleur(eq.couleur)}">
              <span class="pastille">${esc(eq.emoji)}</span>
              <strong>${esc(eq.nom)}</strong>
              <label>Place<select name="rang-${esc(eq.id)}">
                <option value="">-</option>
                ${Array.from({ length: n }, (_, i) => `<option value="${i + 1}" ${s?.rang === i + 1 ? "selected" : ""}>${i + 1}${i ? "e" : "er"}</option>`).join("")}
              </select></label>
              <label>Points<input name="points-${esc(eq.id)}" type="number" inputmode="decimal" step="any" value="${s?.pointsSaisis ?? ""}" placeholder="auto"></label>
            </div>`;
        }).join("")}
        <p class="aide">Points vides = calcul automatique selon la place (1er 10 pts, 2e 8 pts, 3e 6 pts...). Remplis-les seulement pour un bonus ou une pénalité.</p>
        <label>Statut de l'épreuve<select name="statut">${optionsStatut(ep.statut === "a_venir" ? "terminee" : ep.statut)}</select></label>
        <button class="bouton" type="submit">Enregistrer les résultats</button>
      </form>
    `;
  };

  A.scores = async ({ el, valeurs, ctx }) => {
    const lignes = ctx.d.equipes.map((eq) => ({
      equipe_id: eq.id,
      rang: nombreOuNull(valeurs[`rang-${eq.id}`]),
      points: nombreOuNull(valeurs[`points-${eq.id}`]),
    }));
    await DATA.ecrire.enregistrerScores(el.dataset.id, lignes, valeurs.statut);
    ctx.toast("Résultats enregistrés ! 🏆");
    await ctx.rafraichir(true);
    ctx.aller("#/orga/scores");
  };

  // ---------- Épreuves ----------

  E["orga/epreuves"] = (d) => `
    ${retour}<h1 class="titre-page">Épreuves</h1>
    <a class="bouton" href="#/orga/epreuve/nouvelle">➕ Ajouter une épreuve</a>
    ${d.epreuves.map((ep) => `
      <a class="carte ligne" href="#/orga/epreuve/${encodeURIComponent(ep.id)}">
        <span class="pastille pastille--grande">${esc(ep.emoji)}</span>
        <span class="ligne__texte"><strong>${esc(ep.nom)}</strong><small>${[ep.horaire, ep.lieu].filter(Boolean).map(esc).join(" · ")}</small></span>
        ${statut(ep.statut)}
      </a>`).join("")}
  `;

  E["orga/epreuve"] = (d, id) => {
    const nouvelle = id === "nouvelle";
    const ep = nouvelle
      ? { nom: "", emoji: "🏁", horaire: "", lieu: "", description: "", statut: "a_venir", ordre: d.epreuves.length + 1 }
      : d.epreuves.find((e) => e.id === id);
    if (!ep) return vide("Épreuve introuvable.");
    return `
      <a class="retour" href="#/orga/epreuves">← Épreuves</a>
      <h1 class="titre-page">${nouvelle ? "Nouvelle épreuve" : "Modifier l'épreuve"}</h1>
      <form class="carte formulaire" data-form="epreuve" data-id="${nouvelle ? "" : esc(ep.id)}">
        <label>Nom<input name="nom" value="${esc(ep.nom)}" required></label>
        <div class="deux-colonnes">
          <label>Emoji<input name="emoji" value="${esc(ep.emoji)}" maxlength="8"></label>
          <label>Ordre<input name="ordre" type="number" inputmode="numeric" value="${esc(ep.ordre)}"></label>
        </div>
        <label>Horaire<input name="horaire" value="${esc(ep.horaire)}" placeholder="Samedi 15h"></label>
        <label>Lieu<input name="lieu" value="${esc(ep.lieu)}" placeholder="Piscine"></label>
        <label>Règles<textarea name="description" rows="3">${esc(ep.description)}</textarea></label>
        <label>Statut<select name="statut">${optionsStatut(ep.statut)}</select></label>
        <button class="bouton" type="submit">Enregistrer</button>
      </form>
      ${nouvelle ? "" : `<button class="lien lien--danger" data-action="supprimer-epreuve" data-id="${esc(ep.id)}">Supprimer cette épreuve</button>`}
    `;
  };

  A.epreuve = async ({ el, valeurs, ctx }) => {
    await DATA.ecrire.enregistrerEpreuve({
      nom: valeurs.nom.trim(),
      emoji: valeurs.emoji.trim() || "🏁",
      ordre: parseInt(valeurs.ordre, 10) || 0,
      horaire: valeurs.horaire.trim(),
      lieu: valeurs.lieu.trim(),
      description: valeurs.description.trim(),
      statut: valeurs.statut,
    }, el.dataset.id || null);
    ctx.toast("Épreuve enregistrée !");
    await ctx.rafraichir(true);
    ctx.aller("#/orga/epreuves");
  };

  A["supprimer-epreuve"] = async ({ el, ctx }) => {
    if (!confirm("Supprimer cette épreuve et ses résultats ?")) return;
    await DATA.ecrire.supprimerEpreuve(el.dataset.id);
    await ctx.rafraichir(true);
    ctx.aller("#/orga/epreuves");
  };

  // ---------- Participants et présences ----------

  const optionsEquipe = (d, actuelle) => `<option value="">Sans équipe</option>` + d.equipes
    .map((eq) => `<option value="${esc(eq.id)}" ${eq.id === actuelle ? "selected" : ""}>${esc(eq.emoji)} ${esc(eq.nom)}</option>`).join("");

  // Filtre de la liste des participants (tous, avec compte, sans compte, nouveaux)
  let filtreParticipants = "tous";
  const FILTRES = {
    tous: ["Tous", () => true],
    avec: ["✅ Compte relié", (p) => p.compteId],
    sans: ["⏳ Pas encore venu", (p) => !p.compteId],
    nouveaux: ["✨ Nouveaux", (p) => p.nouveau],
  };

  // "il y a 3 h", "hier", "le 12/03"
  function ilYa(date) {
    if (!date) return "";
    const minutes = Math.round((Date.now() - new Date(date)) / 60000);
    if (minutes < 2) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`;
    if (minutes < 48 * 60) return "hier";
    return `le ${new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
  }

  function etatCompte(p) {
    if (!p.compteId) return "⏳ Pas encore de compte";
    const morceaux = [p.nouveau ? "✨ Nouveau" : "✅ Compte relié"];
    if (p.rejointLe) morceaux.push(`inscrit ${ilYa(p.rejointLe)}`);
    if (p.derniereVisite) morceaux.push(`vu ${ilYa(p.derniereVisite)}`);
    return morceaux.join(" · ");
  }

  E["orga/participants"] = (d) => {
    const tous = d.participants;
    const relies = tous.filter((p) => p.compteId).length;
    const anciensSans = tous.filter((p) => !p.compteId).length;
    const nouveaux = tous.filter((p) => p.nouveau).length;
    const actifs = tous.filter((p) => p.derniereVisite && Date.now() - new Date(p.derniereVisite) < 24 * 3600 * 1000).length;
    const liste = tous.filter(FILTRES[filtreParticipants][1]);
    return `
    ${retour}<h1 class="titre-page">Participants</h1>
    <div class="carte suivi-comptes">
      <div class="suivi-comptes__titre"><strong>${relies}/${tous.length}</strong> ont relié leur compte</div>
      <div class="jauge"><span style="width:${tous.length ? Math.round((relies / tous.length) * 100) : 0}%"></span></div>
      <div class="compteur compteur--suivi">
        <div class="compteur__case"><strong>${anciensSans}</strong><span>pas encore venus</span></div>
        <div class="compteur__case"><strong>${nouveaux}</strong><span>nouveaux</span></div>
        <div class="compteur__case"><strong>${actifs}</strong><span>vus en 24 h</span></div>
      </div>
    </div>
    <div class="filtres">${Object.entries(FILTRES).map(([cle, [libelle]]) => `
      <button class="${cle === filtreParticipants ? "actif" : ""}" data-action="filtre-participants" data-filtre="${cle}">${libelle}</button>`).join("")}</div>
    <form class="carte formulaire formulaire--ligne" data-form="ajout-participant">
      <input name="prenom" placeholder="Ajouter un prénom" maxlength="40" required>
      <select name="equipe">${optionsEquipe(d, "")}</select>
      <button class="bouton" type="submit">➕</button>
    </form>
    <p class="aide">${tous.filter((p) => p.present).length}/${tous.length} présents · ${liste.length} affichés</p>
    ${liste.length ? liste.map((p) => `
      <div class="carte ligne ligne--orga">
        <a href="#/orga/participant/${encodeURIComponent(p.id)}">${portrait(p)}</a>
        <a class="ligne__texte" href="#/orga/participant/${encodeURIComponent(p.id)}"><strong>${esc(nomAffiche(p))}</strong><small>${etatCompte(p)}${p.estAdmin ? " · ⭐ Orga" : ""}</small></a>
        <select data-action="changer-equipe" data-id="${esc(p.id)}" aria-label="Équipe">${optionsEquipe(d, p.equipeId)}</select>
        <label class="interrupteur" title="Présent">
          <input type="checkbox" data-action="changer-presence" data-id="${esc(p.id)}" ${p.present ? "checked" : ""}><span></span>
        </label>
      </div>`).join("") : vide("Personne dans cette catégorie.")}
  `;
  };

  A["filtre-participants"] = ({ el, ctx }) => { filtreParticipants = el.dataset.filtre; ctx.afficher(); };

  A["ajout-participant"] = async ({ valeurs, ctx }) => {
    await DATA.ecrire.ajouterParticipant({ prenom: valeurs.prenom.trim(), equipe_id: valeurs.equipe || null });
    ctx.toast(`${valeurs.prenom.trim()} ajouté·e !`);
    await ctx.rafraichir(true);
  };

  A["changer-equipe"] = async ({ el, ctx }) => {
    await DATA.ecrire.majParticipant(el.dataset.id, { equipe_id: el.value || null });
    ctx.toast("Équipe mise à jour");
    await ctx.rafraichir(false);
  };

  A["changer-presence"] = async ({ el, ctx }) => {
    await DATA.ecrire.majParticipant(el.dataset.id, { present: el.checked });
    await ctx.rafraichir(false);
  };

  E["orga/participant"] = (d, id) => {
    const p = d.participants.find((x) => x.id === id);
    if (!p) return vide("Participant introuvable.");
    const estMoi = d.moi && d.moi.id === p.id;
    return `
      <a class="retour" href="#/orga/participants">← Participants</a>
      <div class="carte fiche">
        ${portrait(p, "portrait--xl")}
        <h1 class="titre-page">${esc(nomAffiche(p))}</h1>
        <p class="fiche__meta">${p.compteId ? "Compte créé" : "Pas encore de compte"}</p>
      </div>
      ${estMoi ? "" : `<button class="bouton bouton--secondaire" data-action="voir-comme" data-id="${esc(p.id)}">👀 Voir l'app comme ${esc(p.surnom || p.prenom)}</button>`}
      <h2 class="titre-section">Historique et palmarès</h2>
      ${p.palmares.length ? `<ul class="palmares">${p.palmares.map((l) => `
        <li><span>${esc(l.annee)}</span>${esc(l.titre)}<button class="lien lien--danger" data-action="supprimer-palmares" data-id="${esc(l.id)}" aria-label="Supprimer">✕</button></li>`).join("")}</ul>` : ""}
      <form class="carte formulaire" data-form="ajout-palmares" data-id="${esc(p.id)}">
        <div class="deux-colonnes">
          <label>Année<input name="annee" type="number" inputmode="numeric" value="${new Date().getFullYear()}" required></label>
          <label>Titre<input name="titre" maxlength="120" placeholder="Champion du lancer de tong" required></label>
        </div>
        <button class="bouton bouton--secondaire" type="submit">➕ Ajouter au palmarès</button>
      </form>
      <h2 class="titre-section">Droits</h2>
      <div class="carte formulaire">
        <label class="interrupteur interrupteur--texte">
          <input type="checkbox" data-action="changer-admin" data-id="${esc(p.id)}" ${p.estAdmin ? "checked" : ""} ${estMoi ? "disabled" : ""}><span></span>
          Orga (peut saisir les résultats)
        </label>
      </div>
      ${estMoi ? "" : `<button class="lien lien--danger" data-action="supprimer-participant" data-id="${esc(p.id)}">Supprimer ce participant</button>`}
    `;
  };

  // Aperçu en lecture seule de l'app telle que la voit ce participant
  A["voir-comme"] = ({ el, ctx }) => { ctx.voirComme(el.dataset.id); };

  A["ajout-palmares"] = async ({ el, valeurs, ctx }) => {
    await DATA.ecrire.ajouterPalmares(el.dataset.id, parseInt(valeurs.annee, 10), valeurs.titre.trim());
    ctx.toast("Ajouté au palmarès 🏅");
    await ctx.rafraichir(true);
  };

  A["supprimer-palmares"] = async ({ el, ctx }) => {
    if (!confirm("Retirer cette ligne du palmarès ?")) return;
    await DATA.ecrire.supprimerPalmares(el.dataset.id);
    await ctx.rafraichir(true);
  };

  A["changer-admin"] = async ({ el, ctx }) => {
    await DATA.ecrire.majParticipant(el.dataset.id, { est_admin: el.checked });
    ctx.toast(el.checked ? "Nouvel orga ⭐" : "Droits orga retirés");
    await ctx.rafraichir(true);
  };

  A["supprimer-participant"] = async ({ el, ctx }) => {
    if (!confirm("Supprimer ce participant ? Son compte ne pourra plus accéder à l'app.")) return;
    await DATA.ecrire.supprimerParticipant(el.dataset.id);
    await ctx.rafraichir(true);
    ctx.aller("#/orga/participants");
  };

  // ---------- Équipes ----------

  E["orga/equipes"] = (d) => `
    ${retour}<h1 class="titre-page">Équipes</h1>
    ${d.equipes.map((eq) => `
      <form class="carte formulaire" data-form="equipe" data-id="${esc(eq.id)}" style="${styleCouleur(eq.couleur)}">
        <div class="deux-colonnes deux-colonnes--large">
          <label>Nom<input name="nom" value="${esc(eq.nom)}" required></label>
          <label>Emoji<input name="emoji" value="${esc(eq.emoji)}" maxlength="8"></label>
        </div>
        <label>Couleur<select name="couleur">${COULEURS.map((c) => `<option value="${c}" ${c === eq.couleur ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        <button class="bouton bouton--secondaire" type="submit">Enregistrer</button>
      </form>`).join("")}
  `;

  A.equipe = async ({ el, valeurs, ctx }) => {
    await DATA.ecrire.majEquipe(el.dataset.id, { nom: valeurs.nom.trim(), emoji: valeurs.emoji.trim() || "🏅", couleur: valeurs.couleur });
    ctx.toast("Équipe enregistrée !");
    await ctx.rafraichir(true);
  };

  // ---------- Infos ----------

  E["orga/infos"] = (d) => `
    ${retour}<h1 class="titre-page">Infos</h1>
    <form class="carte formulaire" data-form="infos">
      <div class="deux-colonnes">
        <label>Édition<input name="edition" value="${esc(d.infos.edition)}"></label>
        <label>Année<input name="annee" value="${esc(d.infos.annee)}"></label>
      </div>
      <label>Dates<input name="dates" value="${esc(d.infos.dates)}" placeholder="Week-end du 4 juillet"></label>
      <label>Lieu<input name="lieu" value="${esc(d.infos.lieu)}"></label>
      <label>Annonce (affichée en jaune sur l'accueil)<textarea name="annonce" rows="3">${esc(d.infos.annonce)}</textarea></label>
      <label>Prix d'un repas spectateur (€)<input name="prix_repas_spectateur" type="number" inputmode="decimal" step="any" value="${esc(d.infos.prix_repas_spectateur || "5")}"></label>
      <fieldset class="bloc-prive">
        <legend>💳 Paiements (affiché dans « Mon compte JOC »)</legend>
        <div class="deux-colonnes deux-colonnes--egales">
          <label>Participation (€)<input name="montant_total" type="number" inputmode="decimal" step="any" value="${esc(d.infos.montant_total || "")}"></label>
          <label>Acompte (€)<input name="montant_acompte" type="number" inputmode="decimal" step="any" value="${esc(d.infos.montant_acompte || "")}"></label>
        </div>
        <label>Lien de paiement (Lydia, Paylib, cagnotte...)<input name="paiement_lien" type="url" placeholder="https://..." value="${esc(d.infos.paiement_lien || "")}"></label>
        <label>RIB / IBAN pour les virements<input name="paiement_rib" value="${esc(d.infos.paiement_rib || "")}"></label>
      </fieldset>
      <button class="bouton" type="submit">Enregistrer</button>
    </form>
  `;

  A.infos = async ({ valeurs, ctx }) => {
    await DATA.ecrire.majInfos({
      edition: valeurs.edition.trim(), annee: valeurs.annee.trim(), dates: valeurs.dates.trim(),
      lieu: valeurs.lieu.trim(), annonce: valeurs.annonce.trim(),
      prix_repas_spectateur: valeurs.prix_repas_spectateur.trim() || "5",
      montant_total: valeurs.montant_total.trim(), montant_acompte: valeurs.montant_acompte.trim(),
      paiement_lien: valeurs.paiement_lien.trim(), paiement_rib: valeurs.paiement_rib.trim(),
    });
    ctx.toast("Infos enregistrées !");
    await ctx.rafraichir(true);
  };
})();
