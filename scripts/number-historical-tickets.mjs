// Lee TODAS las tarjetas (abiertas + archivadas) del tablero de Trello,
// las ordena por fecha de creación y les asigna un identificador TCK-XXXX.
// Solo LEE de Trello; no modifica nada. Escribe un CSV local con el resultado.
//
// Uso: node --env-file=.env scripts/number-historical-tickets.mjs

import { writeFile } from "node:fs/promises";

const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_TICKET_LIST_ID } = process.env;

if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_TICKET_LIST_ID) {
  console.error(
    "Faltan variables de entorno: TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_TICKET_LIST_ID"
  );
  process.exit(1);
}

const PREFIX = "TCK";
const PAD = 4; // TCK-0001

function creationDateFromId(cardId) {
  // Los primeros 8 caracteres hex del id de Trello son un timestamp unix (segundos)
  const seconds = parseInt(cardId.substring(0, 8), 16);
  return new Date(seconds * 1000);
}

async function fetchListCards() {
  const url = new URL(
    `https://api.trello.com/1/lists/${TRELLO_TICKET_LIST_ID}/cards/all`
  );
  url.searchParams.set("key", TRELLO_API_KEY);
  url.searchParams.set("token", TRELLO_API_TOKEN);
  url.searchParams.set(
    "fields",
    "id,name,shortLink,shortUrl,idList,closed,dateLastActivity"
  );

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error de Trello (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function fetchListName() {
  const url = new URL(`https://api.trello.com/1/lists/${TRELLO_TICKET_LIST_ID}`);
  url.searchParams.set("key", TRELLO_API_KEY);
  url.searchParams.set("token", TRELLO_API_TOKEN);
  url.searchParams.set("fields", "id,name");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error de Trello (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log("Consultando tarjetas de la lista de tickets...");
  const [cards, list] = await Promise.all([fetchListCards(), fetchListName()]);

  console.log(`Lista: "${list.name}" (${list.id})`);
  console.log(`Se encontraron ${cards.length} tarjetas.`);

  const enriched = cards
    .map((card) => ({
      ...card,
      createdAt: creationDateFromId(card.id),
    }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const rows = enriched.map((card, index) => {
    const number = String(index + 1).padStart(PAD, "0");
    return {
      codigo: `${PREFIX}-${number}`,
      nombre: card.name,
      lista: list.name,
      archivada: card.closed ? "si" : "no",
      creado: card.createdAt.toISOString(),
      url: card.shortUrl,
      trello_id: card.id,
    };
  });

  const header = [
    "codigo",
    "nombre",
    "lista",
    "archivada",
    "creado",
    "url",
    "trello_id",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(",")),
  ].join("\n");

  const outPath = new URL(
    "../scripts/output/tickets-numerados.csv",
    import.meta.url
  );
  await writeFile(outPath, csv, "utf8");

  console.log(`Listo. ${rows.length} tickets numerados de ${rows[0]?.codigo} a ${rows[rows.length - 1]?.codigo}.`);
  console.log(`Archivo generado: scripts/output/tickets-numerados.csv`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
