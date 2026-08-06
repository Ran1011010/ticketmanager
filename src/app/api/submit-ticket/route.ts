import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Numeración de tickets: mismo esquema TCK-#### usado en la migración
// histórica desde Trello (scripts/number-historical-tickets.mjs), continuada
// desde TCK-1446. El próximo número se calcula consultando GLPI (fuente de
// verdad) por el código más alto ya usado en la descripción de los tickets.
const TICKET_CODE_PREFIX = "TCK";
const TICKET_CODE_PAD = 4;

// Se resuelve una sola vez por proceso: el id de campo de "content" en GLPI
// no cambia en runtime.
let glpiContentFieldId: number | null = null;

async function initGlpiSession(): Promise<string> {
  const { GLPI_APP_TOKEN, GLPI_USER_TOKEN, GLPI_URL } = process.env;

  if (!GLPI_APP_TOKEN || !GLPI_USER_TOKEN) {
    throw new Error("Configuracion faltante con variables GLPI de entorno");
  }

  const sessionRes = await fetch(`${GLPI_URL}/apirest.php/initSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      Authorization: `user_token ${GLPI_USER_TOKEN}`,
    },
  });

  const sessionData = await sessionRes.json();

  if (!sessionData.session_token) {
    throw new Error("No se pudo obtener session_token");
  }

  return sessionData.session_token;
}

async function getGlpiContentFieldId(sessionToken: string): Promise<number> {
  if (glpiContentFieldId !== null) return glpiContentFieldId;

  const { GLPI_APP_TOKEN, GLPI_USER_TOKEN, GLPI_URL } = process.env;

  const res = await fetch(
    `${GLPI_URL}/apirest.php/listSearchOptions/Ticket?session_token=${sessionToken}`,
    {
      headers: {
        "App-Token": GLPI_APP_TOKEN!,
        Authorization: `user_token ${GLPI_USER_TOKEN}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`No se pudieron obtener las opciones de búsqueda de GLPI: ${await res.text()}`);
  }

  const options: Record<string, { field?: string; table?: string }> = await res.json();

  const entry =
    Object.entries(options).find(
      ([, value]) => value?.field === "content" && value?.table === "glpi_tickets"
    ) ?? Object.entries(options).find(([, value]) => value?.field === "content");

  if (!entry) {
    throw new Error("No se encontró el campo 'content' en las opciones de búsqueda de GLPI.");
  }

  glpiContentFieldId = Number(entry[0]);
  return glpiContentFieldId;
}

async function getNextTicketCode(sessionToken: string): Promise<string> {
  const { GLPI_APP_TOKEN, GLPI_USER_TOKEN, GLPI_URL } = process.env;
  const contentFieldId = await getGlpiContentFieldId(sessionToken);
  const codeRegex = new RegExp(`${TICKET_CODE_PREFIX}-(\\d+)`, "g");

  let maxNumber = 0;
  let start = 0;
  const pageSize = 1000;

  while (true) {
    const url = new URL(`${GLPI_URL}/apirest.php/search/Ticket`);
    url.searchParams.set("session_token", sessionToken);
    url.searchParams.set("criteria[0][field]", String(contentFieldId));
    url.searchParams.set("criteria[0][searchtype]", "contains");
    url.searchParams.set("criteria[0][value]", `${TICKET_CODE_PREFIX}-`);
    url.searchParams.set("forcedisplay[0]", String(contentFieldId));
    url.searchParams.set("range", `${start}-${start + pageSize - 1}`);

    const res = await fetch(url.toString(), {
      headers: {
        "App-Token": GLPI_APP_TOKEN!,
        Authorization: `user_token ${GLPI_USER_TOKEN}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error consultando el último código de ticket en GLPI: ${await res.text()}`);
    }

    const result = await res.json();
    const rows: Record<string, unknown>[] = result.data ?? [];

    for (const row of rows) {
      const content = String(row[contentFieldId] ?? "");
      for (const match of content.matchAll(codeRegex)) {
        maxNumber = Math.max(maxNumber, Number(match[1]));
      }
    }

    const totalCount = Number(result.totalcount ?? rows.length);
    start += pageSize;
    if (rows.length === 0 || start >= totalCount) break;
  }

  return `${TICKET_CODE_PREFIX}-${String(maxNumber + 1).padStart(TICKET_CODE_PAD, "0")}`;
}

async function sendEmail(
  ticketCode: string,
  email: string,
  issue: string,
  contract: string,
  type: string,
  day: string,
  hour: string,
  imageUrl?: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.GOOGLE_PASS,
    },
  });

  const sendTicketEmail = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER_TO,
    subject: `Nueva incidencia de ${email}`,
    text: `\nCorreo: ${email}
           \nContrato: ${contract}
           \nTipo: ${type}
           \nDescripcion: ${issue}
           \nDía: ${day}
           \nHora: ${hour}
           \nImagen: ${imageUrl ? imageUrl : "No se adjuntó imagen"}`,

  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Incidencia enviada",
    text: `Hola!
           \nTu ticket ${ticketCode} ha sido enviado con éxito.
           \nEl equipo de soporte se pondrá en contacto contigo lo antes posible.`,
  });

  transporter.close();
}

async function createTrelloCard(
  email: string,
  issue: string,
  contract: string,
  type: string,
  priority: string,
  day: string,
  hour: string,
  imageUrl?: string
) {
  const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_TICKET_LIST_ID } = process.env;

  if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_TICKET_LIST_ID) {
    throw new Error("Configuración de Trello faltante en las variables de entorno.");
  }

  // 1) Crear tarjeta
  const response = await fetch(`https://api.trello.com/1/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: TRELLO_API_KEY,
      token: TRELLO_API_TOKEN,
      idList: TRELLO_TICKET_LIST_ID,
      name: `Ticket de ${email}`,
      desc: `**Correo:** ${email}
             \n**Contrato:** ${contract}
             \n**Tipo:** ${type}
             \n**Prioridad:** ${priority}
             \n**Descripcion:** ${issue}
             \n**Día:** ${day}
             \n**Hora:** ${hour}
             ${imageUrl ? `\n\n📎 Imagen adjunta: ${imageUrl}` : ""}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error al crear la tarjeta en Trello: ${error.message}`);
  }

  const card = await response.json();

  // 2) Adjuntar imagen en la tarjeta (si existe)
  if (imageUrl && card.id) {
    await fetch(
      `https://api.trello.com/1/cards/${card.id}/attachments?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          name: "Evidencia de la incidencia",
        }),
      }
    );
  }

  return card;
}

async function createTicketGLPI(
  sessionToken: string,
  ticketCode: string,
  email: string,
  issue: string,
  contract: string,
  type: string,
  priority: string,
  day: string,
  hour: string,
  imageUrl?: string
) {
  const { GLPI_APP_TOKEN, GLPI_USER_TOKEN, GLPI_URL } = process.env;

  if (!GLPI_APP_TOKEN || !GLPI_USER_TOKEN) { throw new Error("Configuracion faltante con variables GLPI de entorno") }

  const content = `
        Código: ${ticketCode}
        Correo: ${email}
        Contrato: ${contract}
        Tipo: ${type}
        Priodidad: ${priority}
        Descripcion: ${issue}
        Dia: ${day}
        Hora: ${hour}
        ${imageUrl ? `Imagen: ${imageUrl}` : ""}
        `;

  // body GLPI!!!
  const body = {
    input: {
      name: `[${ticketCode}] Incidencia de ${email}`,
      content,
      requesttypes_id: 1,
      urgency: Number(priority) || 3,
      _users_id_requester: {
        email: email,
      }
    }
  }

  const res = await fetch(`${GLPI_URL}/apirest.php/Ticket?session_token=${sessionToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Token": GLPI_APP_TOKEN,
      Authorization: `user_token ${GLPI_USER_TOKEN}`,
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error creando ticket en GLPI: ${errorText}`);
  }

  const data = await res.json()
  // console.log("glpi response: ", data)

  // Cerrar sesion glpi

  // await fetch(`${GLPI_URL}/apirest.php/killSession`, {
  //   method: "GET",
  //   headers: {
  //     "App-Token": GLPI_APP_TOKEN,
  //     "Session-Token": sessionToken,
  //   },
  // });

  return data;
}

export async function POST(req: Request) {

  let imageUrl: string | undefined;
  try {
    // Usamos FormData en lugar de req.json()
    const formData = await req.formData();

    const email = formData.get("email") as string;
    const issue = formData.get("issue") as string;
    const contract = formData.get("contract") as string;
    const type = formData.get("type") as string;
    const priority = (formData.get("priority") as string) || "3";
    const file = formData.get("image") as File | null;
    const day = new Date().toISOString().split('T')[0];
    const hour = new Date().toTimeString().split('T')[1];

    if (!email || !issue || !contract || !type) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    // verificar si existe usuario en GLPI
    // con el correo y se crea ticket en glpi


    // Subir la imagen a Cloudinary si existe
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const upload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "tickets" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      imageUrl = upload.secure_url;
    }

    // 1) Numerar el ticket (TCK-####) consultando GLPI antes de notificar/crear nada
    const glpiSessionToken = await initGlpiSession();
    const ticketCode = await getNextTicketCode(glpiSessionToken);

    // 2) Enviar email (incluyendo el código de ticket al usuario)
    await sendEmail(ticketCode, email, issue, contract, type, day, hour, imageUrl);

    // 3) Crear tarjeta en Trello
    await createTrelloCard(
      email,
      issue,
      contract,
      type,
      priority,
      day,
      hour,
      imageUrl
    );

    // 4) Crear Ticket en GLPI
    const responseglpi = await createTicketGLPI(
      glpiSessionToken,
      ticketCode,
      email,
      issue,
      contract,
      type,
      priority,
      day,
      hour,
      imageUrl
    )

    console.log("responseglpi ",responseglpi)
    return NextResponse.json({
      message: "Incidencia enviada y tarjeta creada con éxito.",
      ticketCode,
    });
  } catch (error) {
    console.error("Error general al procesar el ticket:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
