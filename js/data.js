/*
 * Données de l'app : lecture et écriture dans Supabase (ou fichiers de démo).
 * Garde une copie locale pour fonctionner hors connexion.
 */
(function () {
  const CFG = window.JOC_CONFIG;
  const CLE_CACHE = "joc-donnees-v2";
  const DUREE_PHOTO = 7 * 24 * 3600; // validité des liens de photos (secondes)
  const estDemo = !(CFG.supabaseUrl && CFG.supabaseCle);

  const sb = estDemo ? null : window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseCle, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  // ---------- Mode démo : fichiers CSV ----------

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
    const entetes = nonVides[0].map((e) => e.trim());
    return nonVides.slice(1).map((l) => {
      const objet = {};
      entetes.forEach((e, j) => { if (e) objet[e] = (l[j] || "").trim(); });
      return objet;
    });
  }

  async function chargerDemo() {
    const lire = async (nom) => {
      const r = await fetch(`./data/demo/${nom}.csv`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Fichier de démo ${nom} introuvable`);
      return lireCSV(await r.text());
    };
    const [infos, equipes, epreuves, scores, participants, palmares] = await Promise.all(
      ["infos", "equipes", "epreuves", "scores", "participants", "palmares"].map(lire)
    );
    participants.forEach((p) => {
      p.present = p.present === "oui";
      p.est_admin = p.est_admin === "oui";
    });
    // En démo, "moi" = le premier participant
    return { infos, equipes, epreuves, scores, participants, palmares, photos: {}, moiId: participants[0]?.id || null };
  }

  // ---------- Supabase ----------

  async function lireTable(table, tri) {
    let requete = sb.from(table).select("*");
    if (tri) requete = requete.order(tri);
    const { data, error } = await requete;
    if (error) throw error;
    return data;
  }

  async function chargerSupabase() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const [infos, equipes, epreuves, scores, participants, palmares] = await Promise.all([
      lireTable("infos"), lireTable("equipes", "ordre"), lireTable("epreuves", "ordre"),
      lireTable("scores"), lireTable("participants", "prenom"), lireTable("palmares", "annee"),
    ]);
    // Liens temporaires vers les photos (le dossier photos est privé)
    const chemins = participants.map((p) => p.photo).filter(Boolean);
    const photos = {};
    if (chemins.length) {
      const { data } = await sb.storage.from("photos").createSignedUrls(chemins, DUREE_PHOTO);
      (data || []).forEach((d) => { if (d.signedUrl) photos[d.path] = d.signedUrl; });
    }
    const moi = participants.find((p) => p.compte_id === session.user.id);
    return { infos, equipes, epreuves, scores, participants, palmares, photos, moiId: moi ? moi.id : null };
  }

  // ---------- Modèle prêt à afficher ----------

  function pointsPourRang(rang) {
    const r = parseInt(rang, 10);
    if (!r || r < 1) return 0;
    return CFG.bareme[r - 1] ?? 1;
  }

  function construire(brut) {
    const infos = {};
    brut.infos.forEach((l) => { if (l.cle) infos[l.cle] = l.valeur || ""; });

    const participants = brut.participants.map((p) => ({
      id: String(p.id),
      compteId: p.compte_id || null,
      prenom: p.prenom || "",
      nom: p.nom || "",
      surnom: p.surnom || "",
      age: p.age ? parseInt(p.age, 10) : null,
      avatar: p.avatar || "🙂",
      photo: p.photo || "",
      photoUrl: p.photo ? brut.photos[p.photo] || "" : "",
      devise: p.devise || "",
      equipeId: p.equipe_id || "",
      present: !!p.present,
      estAdmin: !!p.est_admin,
      palmares: brut.palmares.filter((l) => String(l.participant_id) === String(p.id))
        .map((l) => ({ id: String(l.id), annee: l.annee, titre: l.titre }))
        .sort((a, b) => b.annee - a.annee),
    }));

    const equipes = brut.equipes.map((e) => ({
      id: String(e.id),
      nom: e.nom || e.id,
      couleur: e.couleur || "",
      emoji: e.emoji || "🏅",
      membres: participants.filter((p) => p.equipeId === String(e.id)),
    }));

    const epreuves = brut.epreuves.map((e) => ({
      id: String(e.id),
      ordre: parseFloat(e.ordre) || 0,
      nom: e.nom || "",
      emoji: e.emoji || "🏁",
      horaire: e.horaire || "",
      lieu: e.lieu || "",
      description: e.description || "",
      statut: e.statut || "a_venir",
    })).sort((a, b) => a.ordre - b.ordre);

    const scores = brut.scores.map((s) => {
      const saisis = s.points !== "" && s.points != null && !isNaN(parseFloat(s.points));
      return {
        epreuve: String(s.epreuve_id),
        equipe: String(s.equipe_id),
        rang: parseInt(s.rang, 10) || null,
        pointsSaisis: saisis ? parseFloat(s.points) : null,
        points: saisis ? parseFloat(s.points) : pointsPourRang(s.rang),
      };
    });

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

    const moi = participants.find((p) => p.id === String(brut.moiId)) || null;
    return { infos, equipes, epreuves, scores, classement, participants, moi };
  }

  async function charger() {
    const brut = estDemo ? await chargerDemo() : await chargerSupabase();
    if (!brut) return null; // pas connecté
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

  function viderCache() {
    try { localStorage.removeItem(CLE_CACHE); } catch (e) {}
  }

  // ---------- Écritures ----------

  function verifier({ error }) {
    if (error) throw new Error(traduireErreur(error.message));
  }

  function traduireErreur(message) {
    const m = message || "";
    if (/Invalid login credentials/i.test(m)) return "Mail ou mot de passe incorrect.";
    if (/already registered|already been registered/i.test(m)) return "Un compte existe déjà avec ce mail. Connecte-toi.";
    if (/Password should be at least/i.test(m)) return "Le mot de passe doit faire au moins 6 caractères.";
    if (/Unable to validate email|invalid email/i.test(m)) return "Adresse mail invalide.";
    if (/Email not confirmed/i.test(m)) return "Mail pas encore confirmé : clique sur le lien reçu par mail.";
    if (/rate limit/i.test(m)) return "Trop de tentatives, réessaie dans quelques minutes.";
    if (/row-level security/i.test(m)) return "Tu n'as pas les droits pour faire ça.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Pas de connexion internet.";
    return m || "Une erreur est survenue.";
  }

  function demoInterdit() {
    if (estDemo) throw new Error("Mode démo : rien n'est enregistré.");
  }

  const auth = {
    async session() {
      if (estDemo) return null;
      const { data } = await sb.auth.getSession();
      return data.session;
    },
    surChangement(rappel) {
      if (!estDemo) sb.auth.onAuthStateChange((evenement, session) => rappel(evenement, session));
    },
    async connexion(email, mdp) {
      demoInterdit();
      verifier(await sb.auth.signInWithPassword({ email, password: mdp }));
    },
    async inscription(email, mdp) {
      demoInterdit();
      const r = await sb.auth.signUp({ email, password: mdp, options: { emailRedirectTo: urlSite() } });
      verifier(r);
      if (!r.data.session) throw new Error("Compte créé : confirme ton mail avec le lien reçu, puis connecte-toi.");
    },
    async deconnexion() {
      viderCache();
      if (!estDemo) await sb.auth.signOut();
    },
    async motDePasseOublie(email) {
      demoInterdit();
      verifier(await sb.auth.resetPasswordForEmail(email, { redirectTo: urlSite() }));
    },
    async changerMotDePasse(mdp) {
      demoInterdit();
      verifier(await sb.auth.updateUser({ password: mdp }));
    },
    async listeARejoindre(code) {
      demoInterdit();
      const r = await sb.rpc("liste_a_rejoindre", { p_code: code });
      verifier(r);
      return r.data;
    },
    async rejoindre(code, participantId, prenom) {
      demoInterdit();
      verifier(await sb.rpc("rejoindre", { p_code: code, p_participant: participantId || null, p_prenom: prenom || null }));
    },
  };

  function urlSite() {
    return location.origin + location.pathname;
  }

  // Réduit une photo à 480 px et la convertit en JPEG avant envoi.
  function reduirePhoto(fichier) {
    return new Promise((resoudre, rejeter) => {
      const img = new Image();
      img.onload = () => {
        const taille = 480;
        const cote = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = taille;
        // Recadrage carré au centre
        canvas.getContext("2d").drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, taille, taille);
        URL.revokeObjectURL(img.src);
        canvas.toBlob((blob) => (blob ? resoudre(blob) : rejeter(new Error("Photo illisible"))), "image/jpeg", 0.85);
      };
      img.onerror = () => rejeter(new Error("Format de photo non reconnu. Essaie une capture d'écran de la photo."));
      img.src = URL.createObjectURL(fichier);
    });
  }

  const ecrire = {
    async majParticipant(id, champs) {
      demoInterdit();
      verifier(await sb.from("participants").update(champs).eq("id", id));
    },
    async ajouterParticipant(champs) {
      demoInterdit();
      verifier(await sb.from("participants").insert(champs));
    },
    async supprimerParticipant(id) {
      demoInterdit();
      verifier(await sb.from("participants").delete().eq("id", id));
    },
    async envoyerPhoto(participant, fichier) {
      demoInterdit();
      const { data: { session } } = await sb.auth.getSession();
      const blob = await reduirePhoto(fichier);
      const chemin = `${session.user.id}/photo-${Date.now()}.jpg`;
      verifier(await sb.storage.from("photos").upload(chemin, blob, { contentType: "image/jpeg" }));
      verifier(await sb.from("participants").update({ photo: chemin }).eq("id", participant.id));
      if (participant.photo) await sb.storage.from("photos").remove([participant.photo]);
    },
    async retirerPhoto(participant) {
      demoInterdit();
      verifier(await sb.from("participants").update({ photo: null }).eq("id", participant.id));
      if (participant.photo) await sb.storage.from("photos").remove([participant.photo]);
    },
    async enregistrerEpreuve(champs, id) {
      demoInterdit();
      verifier(id ? await sb.from("epreuves").update(champs).eq("id", id) : await sb.from("epreuves").insert(champs));
    },
    async supprimerEpreuve(id) {
      demoInterdit();
      verifier(await sb.from("epreuves").delete().eq("id", id));
    },
    // lignes : [{ equipe_id, rang, points }] ; une ligne sans rang ni points efface le score
    async enregistrerScores(epreuveId, lignes, statut) {
      demoInterdit();
      const aGarder = lignes.filter((l) => l.rang != null || l.points != null)
        .map((l) => ({ epreuve_id: epreuveId, ...l }));
      const aEffacer = lignes.filter((l) => l.rang == null && l.points == null).map((l) => l.equipe_id);
      if (aGarder.length) verifier(await sb.from("scores").upsert(aGarder));
      if (aEffacer.length) verifier(await sb.from("scores").delete().eq("epreuve_id", epreuveId).in("equipe_id", aEffacer));
      verifier(await sb.from("epreuves").update({ statut }).eq("id", epreuveId));
    },
    async majEquipe(id, champs) {
      demoInterdit();
      verifier(await sb.from("equipes").update(champs).eq("id", id));
    },
    async majInfos(valeurs) {
      demoInterdit();
      verifier(await sb.from("infos").upsert(Object.entries(valeurs).map(([cle, valeur]) => ({ cle, valeur }))));
    },
    async ajouterPalmares(participantId, annee, titre) {
      demoInterdit();
      verifier(await sb.from("palmares").insert({ participant_id: participantId, annee, titre }));
    },
    async supprimerPalmares(id) {
      demoInterdit();
      verifier(await sb.from("palmares").delete().eq("id", id));
    },
  };

  window.JOC_DATA = { charger, depuisCache, viderCache, estDemo, auth, ecrire };
})();
