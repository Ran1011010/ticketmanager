import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, issue, contract } = await req.json();

    if (!name || !email || !issue || !contract) {
      return NextResponse.json({ message: "Todos los campos son obligatorios." }, { status: 400 });
    }

    // Aquí podrías integrar el envío de correos o la creación de tarjetas en Trello
    console.log("Datos recibidos:", { name, email, issue, contract });

    // Respuesta de éxito
    return NextResponse.json({ message: "Incidencia enviada con éxito." });
  } catch (error) {
    console.error("Error al procesar el ticket:", error);
    return NextResponse.json({ message: "Hubo un error al procesar la solicitud." }, { status: 500 });
  }
}
