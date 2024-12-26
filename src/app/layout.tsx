import './globals.css'

export const metadata = {
  title: "Plataforma de Tickets",
  description: "Sistema para reportar incidencias.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-100 text-gray-900">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
