/*
 * Service worker : rend l'app installable et utilisable hors connexion.
 * Stratégie "réseau d'abord" : on prend toujours la version en ligne si possible,
 * sinon la copie en cache. Les données Supabase ne passent pas par ici
 * (elles ont leur propre copie locale, voir js/data.js).
 *
 * Augmenter VERSION quand on ajoute ou renomme un fichier de la liste FICHIERS.
 */
const VERSION = "joc-v12";
const FICHIERS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./assets/vendor/supabase-2.115.0.js",
  "./js/data.js",
  "./js/ui.js",
  "./js/records.js",
  "./js/ecrans.js",
  "./js/compte.js",
  "./js/orga.js",
  "./js/gestion.js",
  "./js/buzzer.js",
  "./js/inscription.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/logo.png",
  "./assets/fonts/lilita-one-latin.woff2",
  "./assets/fonts/nunito-latin.woff2",
  "./assets/icons/icon-192.png",
  "./assets/icons/favicon-48.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copie));
        }
        return reponse;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) =>
        r || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
