/*
 * Écrans de consultation : accueil, classement, épreuves, équipes, fiches.
 * Chaque écran reçoit les données (d) et renvoie du HTML.
 */
(function () {
  const CFG = window.JOC_CONFIG;
  const { esc, styleCouleur, statut, pts, pluriel, vide, place, portrait, nomAffiche } = window.JOC_UI;
  const E = (window.JOC_ECRANS = window.JOC_ECRANS || {});

  const equipeParId = (d, id) => d.classement.find((e) => e.id === id);
  const epreuveParId = (d, id) => d.epreuves.find((e) => e.id === id);

  function ligneClassement(eq) {
    return `
      <a class="carte ligne" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
        <span class="ligne__place">${place(eq.place)}</span>
        <span class="pastille">${esc(eq.emoji)}</span>
        <span class="ligne__texte"><strong>${esc(eq.nom)}</strong><small>${pluriel(eq.victoires, "victoire")} · ${pluriel(eq.jouees, "épreuve")}</small></span>
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

  function ligneParticipant(p, d) {
    const eq = equipeParId(d, p.equipeId);
    return `
      <a class="carte ligne" href="#/participant/${encodeURIComponent(p.id)}" style="${eq ? styleCouleur(eq.couleur) : ""}">
        ${portrait(p)}
        <span class="ligne__texte"><strong>${esc(nomAffiche(p))}</strong><small>${p.age ? `${p.age} ans` : ""}${p.age && p.devise ? " · " : ""}${esc(p.devise)}</small></span>
        <span class="presence ${p.present ? "presence--oui" : ""}" title="${p.present ? "Présent" : "Absent"}"></span>
      </a>`;
  }

  const TYPES_PROGRAMME = { epreuve: "🎯", repas: "🍽️", moment: "✨" };

  // "2027-07-03" -> "Samedi 3 juillet"
  function nomJour(jour) {
    const date = new Date(jour + "T12:00:00");
    if (isNaN(date)) return jour;
    const texte = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  // Prochain moment du programme (à partir de maintenant)
  function prochainAuProgramme(d) {
    const maintenant = new Date();
    return d.programme.find((l) => new Date(`${l.jour}T${l.heure || "23:59"}:00`) >= maintenant) || null;
  }

  function ligneProgramme(l, d, prochain, avecLien = true) {
    const ep = l.epreuveId ? d.epreuves.find((e) => e.id === l.epreuveId) : null;
    const contenu = `
      <span class="programme__heure">${esc(l.heure || "")}</span>
      <span class="programme__pastille programme__pastille--${esc(l.type)}">${ep ? esc(ep.emoji) : TYPES_PROGRAMME[l.type] || "✨"}</span>
      <span class="ligne__texte"><strong>${esc(l.titre)}</strong>${l.lieu ? `<small>${esc(l.lieu)}</small>` : ""}</span>
      ${ep ? statut(ep.statut) : ""}`;
    const classes = `programme__ligne ${prochain ? "programme__ligne--prochain" : ""}`;
    return ep && avecLien
      ? `<a class="${classes}" href="#/epreuve/${encodeURIComponent(ep.id)}">${contenu}</a>`
      : `<div class="${classes}">${contenu}</div>`;
  }

  E.programme = (d) => {
    if (!d.programme.length) {
      return `<h1 class="titre-page">Programme</h1>${vide("Le programme arrive bientôt.")}
        <a class="bouton bouton--secondaire" href="#/epreuves">Voir les épreuves</a>`;
    }
    const prochain = prochainAuProgramme(d);
    const jours = [...new Set(d.programme.map((l) => l.jour))];
    return `
      <h1 class="titre-page">Programme</h1>
      ${jours.map((jour) => `
        <h2 class="titre-section">${esc(nomJour(jour))}</h2>
        <div class="carte programme">
          ${d.programme.filter((l) => l.jour === jour).map((l) => ligneProgramme(l, d, prochain && prochain.id === l.id)).join("")}
        </div>`).join("")}
      <a class="bouton bouton--secondaire" href="#/epreuves">Toutes les épreuves</a>
      <p class="aide">Les horaires peuvent bouger d'une heure. Les trous, c'est du temps libre : douche, sieste, apéro !</p>
    `;
  };

  E.accueil = (d) => {
    const { infos, epreuves, classement, participants, moi } = d;
    const enCours = epreuves.filter((e) => e.statut === "en_cours");
    const prochaine = epreuves.find((e) => e.statut === "a_venir");
    const faites = epreuves.filter((e) => e.statut === "terminee").length;
    const presents = participants.filter((p) => p.present).length;

    return `
      <section class="hero">
        <img class="hero__logo" src="./assets/logo.png" alt="Logo JOC" width="180" height="181">
        <h1 class="titre-sticker">${esc(CFG.nom)}</h1>
        <p class="hero__sous">${[infos.edition, infos.annee].filter(Boolean).map(esc).join(" · ")}</p>
        ${infos.dates || infos.lieu ? `<p class="hero__infos">${[infos.dates, infos.lieu].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
      </section>

      ${moi ? `<a class="carte salut" href="#/moi">${portrait(moi)}<span><span>Salut <strong>${esc(moi.surnom || moi.prenom)}</strong> !</span><small>${moi.equipeId ? `Équipe ${esc(equipeParId(d, moi.equipeId)?.nom || "")}` : "Pas encore d'équipe"}</small></span></a>` : ""}

      ${infos.annonce ? `<div class="carte annonce"><span class="annonce__icone">📣</span><p>${esc(infos.annonce)}</p></div>` : ""}

      <div class="compteur">
        <div class="compteur__case"><strong>${faites}/${epreuves.length}</strong><span>épreuves jouées</span></div>
        <a class="compteur__case" href="#/presents"><strong>${presents}/${participants.length}</strong><span>présents</span></a>
        <div class="compteur__case"><strong>${classement.length}</strong><span>équipes</span></div>
      </div>

      ${prochainAuProgramme(d) ? `<h2 class="titre-section">Prochain au programme</h2>
        <a class="carte programme" href="#/programme">${ligneProgramme(prochainAuProgramme(d), d, false, false)}</a>` : ""}
      ${enCours.length ? `<h2 class="titre-section">En ce moment</h2>${enCours.map(carteEpreuve).join("")}` : ""}
      ${prochaine ? `<h2 class="titre-section">Prochaine épreuve</h2>${carteEpreuve(prochaine)}` : ""}

      <a class="bouton bouton--secondaire" href="#/buzzer">🔔 Le buzzer</a>

      <h2 class="titre-section">Top 3</h2>
      ${classement.length ? classement.slice(0, 3).map(ligneClassement).join("") : vide("Aucune équipe pour l'instant.")}
      <a class="bouton" href="#/classement">Voir tout le classement</a>
      <a class="bouton bouton--secondaire" href="#/historique">🏛️ La légende des JOC</a>
    `;
  };

  // Historique de toutes les éditions, à partir des lignes d'historique (palmarès) de chacun
  E.historique = (d) => {
    const lignes = d.participants.flatMap((p) => p.palmares.map((l) => ({ ...l, p })));
    const annees = [...new Set(lignes.map((l) => l.annee))].sort((a, b) => b - a);
    return `
      <a class="retour" href="#/">← Accueil</a>
      <h1 class="titre-page">La légende des JOC</h1>
      ${annees.length ? annees.map((annee) => {
        const deLAnnee = lignes.filter((l) => l.annee === annee);
        const joueurs = new Set(deLAnnee.map((l) => l.p.id)).size;
        const titres = deLAnnee.filter((l) => !/^(Équipe|Participant)/.test(l.titre));
        const parEquipe = {};
        deLAnnee.filter((l) => /^(Équipe|Participant)/.test(l.titre)).forEach((l) => {
          const groupe = /^Équipe/.test(l.titre) ? l.titre : "Équipe 🎉 Les autres copaings";
          (parEquipe[groupe] = parEquipe[groupe] || []).push(l.p);
        });
        return `
          <h2 class="titre-section">JOC ${esc(annee)} <small class="sous-total">${joueurs} copaings</small></h2>
          ${titres.length ? `<ul class="palmares">${titres.map((l) => `<li><span>🏅</span>${esc(l.p.surnom || l.p.prenom)} · ${esc(l.titre)}</li>`).join("")}</ul>` : ""}
          ${Object.entries(parEquipe).map(([titre, membres]) => `
            <details class="carte details"><summary><strong>${esc(titre.replace(/^Équipe /, ""))}</strong> · ${membres.length}</summary>
              <p>${membres.map((m) => `<a href="#/participant/${encodeURIComponent(m.id)}">${esc(m.surnom || m.prenom)}</a>`).join(" · ")}</p>
            </details>`).join("")}`;
      }).join("") : vide("L'histoire s'écrit cette année !")}
    `;
  };

  E.classement = (d) => {
    const { classement } = d;
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
  };

  E.epreuves = (d) => {
    if (!d.epreuves.length) return `<h1 class="titre-page">Épreuves</h1>${vide("Le programme arrive bientôt.")}`;
    return `<a class="retour" href="#/programme">← Programme</a><h1 class="titre-page">Épreuves</h1>${d.epreuves.map(carteEpreuve).join("")}`;
  };

  E.epreuve = (d, id) => {
    const ep = epreuveParId(d, id);
    if (!ep) return vide("Épreuve introuvable.");
    const resultats = d.scores.filter((s) => s.epreuve === ep.id)
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
      ${d.moi?.estAdmin ? `<a class="bouton bouton--orga" href="#/orga/scores/${encodeURIComponent(ep.id)}">✏️ Saisir les résultats</a>` : ""}
      <h2 class="titre-section">Résultats</h2>
      ${resultats.length ? resultats.map((s) => {
        const eq = equipeParId(d, s.equipe) || { nom: s.equipe, emoji: "❔", id: s.equipe };
        return `
          <a class="carte ligne" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
            <span class="ligne__place">${s.rang ? place(s.rang) : "-"}</span>
            <span class="pastille">${esc(eq.emoji)}</span>
            <span class="ligne__texte"><strong>${esc(eq.nom)}</strong></span>
            <span class="ligne__pts">+${s.points}<small>pts</small></span>
          </a>`;
      }).join("") : vide("Pas encore de résultats.")}
    `;
  };

  E.equipes = (d) => {
    if (!d.classement.length) return `<h1 class="titre-page">Équipes</h1>${vide("Les équipes arrivent bientôt.")}`;
    const sansEquipe = d.participants.filter((p) => !p.equipeId);
    return `
      <h1 class="titre-page">Équipes</h1>
      <div class="grille">
        ${d.equipes.map((e) => equipeParId(d, e.id)).map((eq) => `
          <a class="carte tuile" href="#/equipe/${encodeURIComponent(eq.id)}" style="${styleCouleur(eq.couleur)}">
            <span class="tuile__emoji">${esc(eq.emoji)}</span>
            <strong>${esc(eq.nom)}</strong>
            <small>${eq.membres.filter((m) => m.present).length}/${eq.membres.length} présents</small>
          </a>`).join("")}
      </div>
      <a class="bouton bouton--secondaire" href="#/presents">Qui est là ?</a>
      ${sansEquipe.length ? `<h2 class="titre-section">Sans équipe</h2>${sansEquipe.map((p) => ligneParticipant(p, d)).join("")}` : ""}
    `;
  };

  E.equipe = (d, id) => {
    const eq = equipeParId(d, id);
    if (!eq) return vide("Équipe introuvable.");
    const sesScores = d.scores.filter((s) => s.equipe === eq.id);
    return `
      <a class="retour" href="#/equipes">← Équipes</a>
      <div class="carte fiche fiche--equipe" style="${styleCouleur(eq.couleur)}">
        <span class="fiche__emoji">${esc(eq.emoji)}</span>
        <h1 class="titre-page">${esc(eq.nom)}</h1>
        <p class="fiche__rang">${eq.place <= 3 ? place(eq.place) + " " : ""}${eq.place}<sup>${eq.place === 1 ? "re" : "e"}</sup> place · ${pts(eq.total)}</p>
      </div>
      <h2 class="titre-section">Membres</h2>
      ${eq.membres.length ? eq.membres.map((p) => ligneParticipant(p, d)).join("") : vide("Personne pour l'instant.")}
      <h2 class="titre-section">Parcours</h2>
      ${sesScores.length ? sesScores.map((s) => {
        const ep = epreuveParId(d, s.epreuve) || { nom: s.epreuve, emoji: "🏁", id: s.epreuve };
        return `
          <a class="carte ligne" href="#/epreuve/${encodeURIComponent(ep.id)}">
            <span class="pastille">${esc(ep.emoji)}</span>
            <span class="ligne__texte"><strong>${esc(ep.nom)}</strong><small>${s.rang ? `${s.rang}${s.rang === 1 ? "er" : "e"}` : "Classement à venir"}</small></span>
            <span class="ligne__pts">+${s.points}<small>pts</small></span>
          </a>`;
      }).join("") : vide("Pas encore de résultats pour cette équipe.")}
    `;
  };

  E.presents = (d) => {
    const presents = d.participants.filter((p) => p.present);
    const absents = d.participants.filter((p) => !p.present);
    return `
      <h1 class="titre-page">Qui est là ?</h1>
      <div class="compteur compteur--2">
        <div class="compteur__case"><strong>${presents.length}</strong><span>présents</span></div>
        <div class="compteur__case"><strong>${absents.length}</strong><span>pas encore là</span></div>
      </div>
      ${d.moi ? `<button class="bouton ${d.moi.present ? "bouton--secondaire" : ""}" data-action="basculer-presence">${d.moi.present ? "Je ne suis plus là" : "✋ Je suis là !"}</button>` : ""}
      <h2 class="titre-section">Présents</h2>
      ${presents.length ? presents.map((p) => ligneParticipant(p, d)).join("") : vide("Personne pour l'instant.")}
      <h2 class="titre-section">Pas encore là</h2>
      ${absents.length ? absents.map((p) => ligneParticipant(p, d)).join("") : vide("Tout le monde est là ! 🎉")}
    `;
  };

  // Fiche d'un participant (aussi utilisée pour "Moi")
  E.participant = (d, id) => {
    const p = d.participants.find((x) => x.id === id);
    if (!p) return vide("Participant introuvable.");
    const eq = equipeParId(d, p.equipeId);
    const estMoi = d.moi && d.moi.id === p.id;
    return `
      ${estMoi ? "" : `<a class="retour" href="javascript:history.back()">← Retour</a>`}
      <div class="carte fiche fiche--profil" style="${eq ? styleCouleur(eq.couleur) : ""}">
        ${portrait(p, "portrait--xl")}
        <h1 class="titre-page">${esc(p.prenom)}${p.nom ? " " + esc(p.nom) : ""}</h1>
        ${p.surnom ? `<p class="fiche__surnom">« ${esc(p.surnom)} »</p>` : ""}
        <p class="fiche__meta">${[p.age ? `${p.age} ans` : "", eq ? `${esc(eq.emoji)} ${esc(eq.nom)}` : "Sans équipe"].filter(Boolean).join(" · ")}</p>
        <span class="statut ${p.present ? "statut--present" : "statut--fini"}">${p.present ? "Présent" : "Pas encore là"}</span>
        ${p.devise ? `<p class="fiche__devise">${esc(p.devise)}</p>` : ""}
        ${p.estAdmin ? `<p class="badge-orga">⭐ Orga</p>` : ""}
      </div>
      <h2 class="titre-section">Historique</h2>
      ${p.palmares.length ? `<ul class="palmares">${p.palmares.map((l) => `<li><span>${esc(l.annee)}</span>${esc(l.titre)}</li>`).join("")}</ul>` : vide("Première édition ? La légende commence maintenant !")}
    `;
  };
})();
