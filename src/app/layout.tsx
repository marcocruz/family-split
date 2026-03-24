import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilySplit - Control de Gastos Compartidos",
  description: "Controla y divide los gastos de tu familia de forma fácil y transparente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
