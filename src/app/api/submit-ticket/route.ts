import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function sendEmail(
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

  await transporter.sendMail({
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
           \nTu ticket ha sido enviado con éxito. 
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

  //  Crear sesion en GLPI
  const sessionRes = await fetch(`${GLPI_URL}/apirest.php/initSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      "Authorization": `user_token ${GLPI_USER_TOKEN}`,
    },
  });

  const sessionData = await sessionRes.json();

  console.log('session data ', sessionData)

  if (!sessionData.session_token) {
    throw new Error("No se pudo obtener session_token");
  }

  const sessionToken = sessionData.session_token;
  const content = `
        Correo: ${email}
        Contrato: ${contract}
        Tipo: ${type}
        Priodidad: ${priority}
        Descripcion: ${issue}
        Dia: ${day}
        Hora: ${hour}
        ${imageUrl ? `Imagen: ${imageUrl}` : ""}
        `;

  const userRes = await fetch(
    `${GLPI_URL}/apirest.php/User?searchText=${email}&session_token=${sessionToken}`,
    {
      headers: {
        "App-Token": GLPI_APP_TOKEN,
      },
    }
  );

  const users = await userRes.json()
  const userId = users[0]?.id

  // body GLPI!!!
  const body = {
    input: {
      name: `Incidencia de ${email}`,
      content,
      requesttypes_id: 1,
      urgency: Number(priority) || 3,
      _users_id_requester: {
        email: userId,
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
  console.log("glpi response: ", data)

  // Cerrar sesion glpi

  await fetch(`${GLPI_URL}/apirest.php/killSession`, {
    method: "GET",
    headers: {
      "App-Token": GLPI_APP_TOKEN,
      "Session-Token": sessionToken,
    },
  });

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

    // 1) Enviar email
    await sendEmail(email, issue, contract, type, day, hour, imageUrl);

    // 2) Crear tarjeta en Trello
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

    // 3) Crear Tickets GLPI
    await createTicketGLPI(
      email,
      issue,
      contract,
      type,
      priority,
      day,
      hour,
      imageUrl
    )


    return NextResponse.json({
      message: "Incidencia enviada y tarjeta creada con éxito.",
    });
  } catch (error) {
    console.error("Error general al procesar el ticket:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
