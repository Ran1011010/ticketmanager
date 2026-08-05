// Lee TODAS las tarjetas (abiertas + archivadas) de la lista "Ticket Manager"
// en Trello y las exporta a un CSV local.
// Solo LEE de Trello; no modifica nada.
//
// Uso: node --env-file=.env scripts/export-tickets.mjs

import { writeFile } from "node:fs/promises";

const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_TICKET_LIST_ID } = process.env;

if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_TICKET_LIST_ID) {
  console.error(
    "Faltan variables de entorno: TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_TICKET_LIST_ID"
  );
  process.exit(1);
}





async function fetchListCards() {
  const url = new URL(
    `https://api.trello.com/1/lists/${TRELLO_TICKET_LIST_ID}/cards/all`
  );
  url.searchParams.set("key", TRELLO_API_KEY);
  url.searchParams.set("token", TRELLO_API_TOKEN);
  url.searchParams.set(
    "fields",
    "id,name,desc,closed,dateLastActivity,due,dueComplete,shortUrl,idList"
  );
  url.searchParams.set("labels", "true");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error de Trello (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function creationDateFromId(cardId) {
  // Los primeros 8 caracteres hex del id de Trello son un timestamp unix (segundos)
  const seconds = parseInt(cardId.substring(0, 8), 16);
  return new Date(seconds * 1000);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log('Consultando tarjetas de la lista "Ticket Manager"...');
  const cards = await fetchListCards();
  console.log(`Se encontraron ${cards.length} tarjetas.`);

  const rows = cards
    .map((card) => ({
      trello_id: card.id,
      nombre: card.name,
      descripcion: card.desc,
      archivada: card.closed ? "si" : "no",
      etiquetas: (card.labels ?? []).map((l) => l.name).filter(Boolean).join("; "),
      vencimiento: card.due ?? "",
      vencimiento_completado: card.due ? (card.dueComplete ? "si" : "no") : "",
      creado: creationDateFromId(card.id).toISOString(),
      ultima_actividad: card.dateLastActivity ?? "",
      url: card.shortUrl,
    }))
    .sort((a, b) => new Date(a.creado) - new Date(b.creado));

  const header = [
    "trello_id",
    "nombre",
    "descripcion",
    "archivada",
    "etiquetas",
    "vencimiento",
    "vencimiento_completado",
    "creado",
    "ultima_actividad",
    "url",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(",")),
  ].join("\n");

  const outPath = new URL("../scripts/output/tickets.csv", import.meta.url);
  await writeFile(outPath, csv, "utf8");

  console.log(`Listo. ${rows.length} tickets exportados.`);
  console.log(`Archivo generado: scripts/output/tickets.csv`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
