import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, issue, contract } = await req.json();

    if (!name || !email || !issue || !contract) {
      return NextResponse.json({ message: "Todos los campos son obligatorios." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.GOOGLE_PASS,
      },
    });

    const enviado = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'javiera.paez@tpfingenieria.cl',
      subject: "Nueva incidencia",
      text: `Nombre: ${name}\nCorreo: ${email}\nContrato: ${contract}\nIncidencia: ${issue}`,
    });

    return NextResponse.json({ message: "Incidencia enviada con éxito." });
  } catch (error) {
    console.error("Error al procesar el ticket:", error);
    return NextResponse.json({ message: error }, { status: 500 });
  }
}
