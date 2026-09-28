export const metadata = {
  title: "AI Carousel Studio",
  description: "Ferramenta pessoal para criação de carrosséis com IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, height: "100vh", overflow: "hidden" }}>{children}</body>
    </html>
  );
}
