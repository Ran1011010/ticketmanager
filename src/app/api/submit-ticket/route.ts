import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function sendEmail(name: string, email: string, issue: string, contract: string) {
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
    to: "javiera.paez@tpfingenieria.cl",
    subject: `Nueva incidencia de ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\nContrato: ${contract}\nIncidencia: ${issue}`,
  });
}

 async function createTrelloCard(name: string, email: string, issue: string, contract: string) {
  const { TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_BOARD_ID, TRELLO_TICKET_LIST_ID } = process.env;

   if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_BOARD_ID || !TRELLO_TICKET_LIST_ID) {
     throw new Error("Configuración de Trello faltante en las variables de entorno.");
   }

   const response = await fetch(`https://api.trello.com/1/cards`, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       key: TRELLO_API_KEY,
       token: TRELLO_API_TOKEN,
       idList: TRELLO_TICKET_LIST_ID,
       name: `Incidencia de ${name}`,
       desc: `**Nombre:** ${name}\n**Correo:** ${email}\n**Contrato:** ${contract}\n**Incidencia:** ${issue}`,
     }),
   });

   if (!response.ok) {
     const error = await response.json();
     throw new Error(`Error al crear la tarjeta en Trello: ${error.message}`);
   }

   return response.json();
 }

export async function POST(req: Request) {
  try {
    const { name, email, issue, contract } = await req.json();

    if (!name || !email || !issue || !contract) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    try {
      await sendEmail(name, email, issue, contract);
      console.log("Correo enviado exitosamente.");
    } catch (emailError) {
      console.error("Error al enviar el correo:", emailError);
      return NextResponse.json(
        { message: "Error al enviar el correo." },
        { status: 500 }
      );
    }

     try {
       const card = await createTrelloCard(name, email, issue, contract);
       console.log("Tarjeta creada exitosamente:", card);
     } catch (trelloError) {
       console.error("Error al crear la tarjeta en Trello:", trelloError);
       return NextResponse.json(
         { message: "Error al crear la tarjeta en Trello." },
         { status: 500 }
       );
     }

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
