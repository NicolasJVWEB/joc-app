/*
 * Inscription à l'édition en cours (je viens / peut-être / non) et « Mon compte JOC » (paiements).
 * Côté orga : qui a répondu, qui relancer.
 */
(function () {
  const DATA = window.JOC_DATA;
  const { esc, vide, portrait, nomAffiche, toast } = window.JOC_UI;
  const E = (window.JOC_ECRANS = window.JOC_ECRANS || {});
  const A = (window.JOC_ACTIONS = window.JOC_ACTIONS || {});

  const REPONSES = {
    oui: { emoji: "🎉", libelle: "J'y serai !", court: "Vient" },
    peut_etre: { emoji: "🤔", libelle: "Peut-être", court: "Peut-être" },
    non: { emoji: "😢", libelle: "Pas cette fois", court: "Ne vient pas" },
  };
  const ARRIVEES = ["Jeudi soir", "Vendredi matin", "Vendredi midi", "Vendredi après-midi", "Vendredi soir", "Samedi"];
  const TAILLES = ["", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const euros = (n) => `${(Math.round((n || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
  const nombre = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? null : n; };

  // ---------- Cartes (accueil et profil) ----------

  function carteInscription(d) {
    if (!d.moi || !d.infos.annee) return "";
    const r = d.inscriptions[d.moi.id];
    if (!r) {
      return `
        <a class="carte appel-inscription" href="#/inscription">
          <span class="appel-inscription__emoji">🎆</span>
          <span><strong>JOC ${esc(d.infos.annee)} : tu viens ?</strong><small>${esc(d.infos.dates || "Réponds pour aider les orgas")}</small></span>
          <span class="chevron">›</span>
        </a>`;
    }
    const rep = REPONSES[r.reponse] || REPONSES.oui;
    return `
      <a class="carte ligne ligne--compacte reponse-inscription reponse-inscription--${esc(r.reponse)}" href="#/inscription">
        <span class="pastille pastille--grande">${rep.emoji}</span>
        <span class="ligne__texte"><strong>JOC ${esc(d.infos.annee)} : ${esc(rep.libelle)}</strong><small>${r.arrivee ? `Arrivée ${esc(r.arrivee.toLowerCase())} · ` : ""}Modifier ma réponse</small></span>
        <span class="chevron">›</span>
      </a>`;
  }

  // Mon compte JOC : où j'en suis de mes paiements, et comment payer
  function carteCompte(d) {
    const pm = d.monPaiement;
    const total = nombre(d.infos.montant_total);
    const acompte = nombre(d.infos.montant_acompte);
    const lien = /^https:\/\//.test(d.infos.paiement_lien || "") ? d.infos.paiement_lien : "";
    const rib = d.infos.paiement_rib || "";
    if (!pm && !total && !lien && !rib) return "";
    let reste = pm ? pm.resteDu : 0;
    if (pm && !reste && !pm.solde && total) reste = pm.acompte ? total - (acompte || 0) : total;
    const toutPaye = pm && pm.solde && !pm.resteDu;
    return `
      <h2 class="titre-section">Mon compte JOC</h2>
      <div class="carte compte-joc ${toutPaye ? "compte-joc--ok" : ""}">
        ${total ? `<p class="compte-joc__total">Participation ${esc(d.infos.annee || "")} : <strong>${euros(total)}</strong>${acompte ? ` dont ${euros(acompte)} d'acompte` : ""}</p>` : ""}
        ${pm ? `
          <div class="compte-joc__etapes">
            <span class="${pm.acompte ? "ok" : ""}">${pm.acompte ? "✅" : "⏳"} Acompte</span>
            <span class="${pm.solde ? "ok" : ""}">${pm.solde ? "✅" : "⏳"} Solde</span>
          </div>
          ${toutPaye ? `<p class="compte-joc__reste">Tout est réglé, merci ! 🙌</p>` : reste > 0 ? `<p class="compte-joc__reste">Reste à payer : <strong>${euros(reste)}</strong></p>` : ""}`
        : `<p class="aide">Les orgas n'ont pas encore ouvert ton suivi de paiement.</p>`}
        ${!toutPaye && lien ? `<a class="bouton bouton--vert" href="${esc(lien)}" target="_blank" rel="noopener">💸 Payer en ligne</a>` : ""}
        ${!toutPaye && rib ? `<p class="compte-joc__rib"><span>Virement :</span> <strong>${esc(rib)}</strong></p>
          <button class="bouton bouton--secondaire" data-action="copier" data-texte="${esc(rib)}">📋 Copier le RIB</button>` : ""}
        <p class="aide">Après ton paiement, les orgas le cochent de leur côté.</p>
      </div>`;
  }

  A.copier = async ({ el }) => {
    try { await navigator.clipboard.writeText(el.dataset.texte); toast("Copié ! 📋"); }
    catch (e) { toast("Copie impossible : sélectionne le texte à la main.", "alerte"); }
  };

  // ---------- Écran « Je m'inscris » ----------

  E.inscription = (d) => {
    if (!d.moi) return vide("Connecte-toi pour répondre.");
    const r = d.inscriptions[d.moi.id] || {};
    const arrivee = r.arrivee || d.moi.arrivee || "";
    return `
      <a class="retour" href="#/">← Accueil</a>
      <h1 class="titre-page">JOC ${esc(d.infos.annee || "")}</h1>
      ${d.infos.dates ? `<p class="aide">${esc(d.infos.dates)}${d.infos.lieu ? ` · ${esc(d.infos.lieu)}` : ""}</p>` : ""}
      <form class="carte formulaire" data-form="inscription">
        <fieldset class="choix-reponse">
          <legend>Tu viens ?</legend>
          ${Object.entries(REPONSES).map(([cle, rep]) => `
            <label><input type="radio" name="reponse" value="${cle}" ${r.reponse === cle ? "checked" : ""} required><span><b>${rep.emoji}</b>${rep.libelle}</span></label>`).join("")}
        </fieldset>
        <label>Tu arrives quand ?<select name="arrivee">
          <option value="">-</option>
          ${[...new Set([...ARRIVEES, arrivee].filter(Boolean))].map((a) => `<option ${a === arrivee ? "selected" : ""}>${esc(a)}</option>`).join("")}
        </select></label>
        <div class="deux-colonnes">
          <label>T-shirt<select name="taille">${TAILLES.map((t) => `<option value="${t}" ${t === d.moi.taille ? "selected" : ""}>${t || "-"}</option>`).join("")}</select></label>
          <label>Surnom (au dos)<input name="surnom" value="${esc(d.moi.surnom)}" maxlength="40" placeholder="La Fusée"></label>
        </div>
        <label>Régime alimentaire<input name="regime" value="${esc(d.moi.regime)}" maxlength="200" placeholder="Végé, sans gluten, pas de porc..."></label>
        <label>Un mot pour les orgas ?<textarea name="commentaire" rows="2" maxlength="300">${esc(r.commentaire || "")}</textarea></label>
        <button class="bouton" type="submit">Envoyer ma réponse</button>
      </form>
      ${carteCompte(d)}
    `;
  };

  A.inscription = async ({ valeurs, ctx }) => {
    const moi = ctx.d.moi;
    const annee = parseInt(ctx.d.infos.annee, 10);
    await DATA.ecrire.repondreInscription(moi.id, annee, {
      reponse: valeurs.reponse, arrivee: valeurs.arrivee || "", commentaire: valeurs.commentaire.trim(),
    });
    await DATA.ecrire.majFiche("fiches_privees", moi.id, { taille_tshirt: valeurs.taille || "", regime: valeurs.regime.trim(), arrivee: valeurs.arrivee || "" });
    if ((valeurs.surnom.trim() || null) !== (moi.surnom || null)) await DATA.ecrire.majParticipant(moi.id, { surnom: valeurs.surnom.trim() || null });
    toast(valeurs.reponse === "oui" ? "Trop bien, à bientôt aux JOC ! 🎉" : valeurs.reponse === "non" ? "Dommage ! On pensera à toi 😢" : "Noté ! Tiens-nous au courant 🤔");
    await ctx.rafraichir(true);
    ctx.aller("#/");
  };

  // ---------- Côté orga : suivi des réponses ----------

  let filtre = "tous";
  const FILTRES = {
    tous: "Tous", oui: "🎉 Viennent", peut_etre: "🤔 Peut-être", non: "😢 Non", sans: "⏳ Sans réponse",
  };

  E["orga/inscriptions"] = (d) => {
    const statut = (p) => (d.inscriptions[p.id] ? d.inscriptions[p.id].reponse : "sans");
    const compte = (cle) => d.participants.filter((p) => statut(p) === cle).length;
    const liste = d.participants.filter((p) => filtre === "tous" || statut(p) === filtre);
    const aRelancer = d.participants.filter((p) => ["sans", "peut_etre"].includes(statut(p)));
    return `
      <a class="retour" href="#/orga">← Espace orga</a>
      <h1 class="titre-page">Inscriptions ${esc(d.infos.annee || "")}</h1>
      <div class="compteur compteur--4">
        <div class="compteur__case"><strong>${compte("oui")}</strong><span>viennent</span></div>
        <div class="compteur__case"><strong>${compte("peut_etre")}</strong><span>peut-être</span></div>
        <div class="compteur__case"><strong>${compte("non")}</strong><span>non</span></div>
        <div class="compteur__case"><strong>${compte("sans")}</strong><span>sans réponse</span></div>
      </div>
      ${aRelancer.length ? `<button class="bouton bouton--secondaire" data-action="copier" data-texte="${esc(aRelancer.map((p) => p.surnom || p.prenom).join(", "))}">📋 Copier les ${aRelancer.length} prénoms à relancer</button>` : ""}
      <div class="filtres">${Object.entries(FILTRES).map(([cle, lib]) => `
        <button class="${cle === filtre ? "actif" : ""}" data-action="filtre-inscriptions" data-filtre="${cle}">${lib}</button>`).join("")}</div>
      ${liste.length ? liste.map((p) => {
        const r = d.inscriptions[p.id];
        return `
          <div class="carte ligne ligne--orga">
            ${portrait(p)}
            <span class="ligne__texte"><strong>${esc(nomAffiche(p))}</strong><small>${r ? [r.arrivee, r.commentaire].filter(Boolean).map(esc).join(" · ") || "Pas de précision" : p.compteId ? "Compte créé, pas encore répondu" : "Pas encore de compte"}</small></span>
            <select data-action="reponse-orga" data-id="${esc(p.id)}" aria-label="Réponse">
              <option value="">⏳</option>
              ${Object.entries(REPONSES).map(([cle, rep]) => `<option value="${cle}" ${r && r.reponse === cle ? "selected" : ""}>${rep.emoji} ${rep.court}</option>`).join("")}
            </select>
          </div>`;
      }).join("") : vide("Personne dans cette catégorie.")}
      <p class="aide">Tu peux répondre à la place de quelqu'un (par exemple s'il n'a pas de compte).</p>
    `;
  };

  A["filtre-inscriptions"] = ({ el, ctx }) => { filtre = el.dataset.filtre; ctx.afficher(); };

  A["reponse-orga"] = async ({ el, ctx }) => {
    if (!el.value) return;
    await DATA.ecrire.repondreInscription(el.dataset.id, parseInt(ctx.d.infos.annee, 10), { reponse: el.value });
    toast("Réponse enregistrée");
    await ctx.rafraichir(false);
  };

  window.JOC_INSCRIPTION = { carteInscription, carteCompte, REPONSES };
})();
