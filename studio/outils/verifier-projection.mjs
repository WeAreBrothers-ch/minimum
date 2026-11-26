/* Vérifie la règle « publier un film crée ou déplace la séance de sa projection »,
   sans toucher à Sanity : un faux client note ce qu'on lui demande.
   Lancer : node outils/verifier-projection.mjs */

import assert from "node:assert/strict";
import { projectionAnnoncee, synchroniserProjection } from "../actions/projection.ts";

function fauxClient(seances) {
  const journal = [];
  return {
    journal,
    fetch: async (_requete, parametres) => {
      journal.push(["fetch", parametres.film]);
      return seances;
    },
    create: async (document) => journal.push(["create", document]),
    patch: (id) => ({
      set: (champs) => ({ commit: async () => journal.push(["set", id, champs]) }),
      unset: (champs) => ({ commit: async () => journal.push(["unset", id, champs]) }),
    }),
  };
}

const film = { statuts: ["a-laffiche", "avant-premiere"], projectionDate: "2026-12-10", projectionHeure: "20:00" };

assert.deepEqual(projectionAnnoncee(film), { genre: "avant-premiere", date: "2026-12-10", heure: "20:00" });
assert.equal(projectionAnnoncee({ ...film, statuts: ["a-laffiche"] }), null, "aucune case de projection cochée");
assert.equal(projectionAnnoncee({ ...film, projectionHeure: "20h" }), null, "heure mal écrite");
assert.equal(projectionAnnoncee({ ...film, projectionDate: undefined }), null, "jour manquant");
assert.equal(projectionAnnoncee({ statuts: ["premiere", "avant-premiere"], projectionDate: "2026-12-10", projectionHeure: "20:00" })?.genre, "avant-premiere");

let client = fauxClient([]);
assert.equal(await synchroniserProjection(client, "film1", film), "creee");
assert.deepEqual(client.journal[1], ["create", { _type: "screening", film: { _type: "reference", _ref: "film1" }, date: "2026-12-10", time: "20:00", status: "disponible", evenementDuFilm: "avant-premiere" }]);

client = fauxClient([{ _id: "s1", date: "2026-12-10", time: "20:00", evenementDuFilm: "avant-premiere" }]);
assert.equal(await synchroniserProjection(client, "film1", film), "rien");
assert.equal(client.journal.length, 1, "rien n'est écrit quand rien ne change");

client = fauxClient([{ _id: "s1", date: "2026-12-09", time: "19:00", evenementDuFilm: "avant-premiere" }]);
assert.equal(await synchroniserProjection(client, "film1", film), "deplacee");
assert.deepEqual(client.journal[1], ["set", "s1", { date: "2026-12-10", time: "20:00", evenementDuFilm: "avant-premiere" }]);

client = fauxClient([{ _id: "s1", date: "2026-12-10", time: "20:00", evenementDuFilm: "avant-premiere" }]);
assert.equal(await synchroniserProjection(client, "film1", { statuts: ["a-laffiche"] }), "liberee");
assert.deepEqual(client.journal[1], ["unset", "s1", ["evenementDuFilm"]]);

client = fauxClient([]);
assert.equal(await synchroniserProjection(client, "film1", { statuts: ["a-laffiche"] }), "rien");
assert.equal(client.journal.length, 1);

console.log("Projection : 12 vérifications passées.");
