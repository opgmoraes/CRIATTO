import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Carousel Studio",
  description: "Ferramenta pessoal para criação de carrosséis com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="m-0 p-0 h-screen overflow-hidden bg-gray-950">
        {children}
      </body>
    </html>
  );
}
