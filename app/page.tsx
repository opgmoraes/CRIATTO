// O editor (public/editor.html) contém TODAS as features (edição, regenerar slide,
// logo, templates, fontes, URL, imagens automáticas). Esta página só o hospeda.
export default function Home() {
  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 shadow-lg">
        <h1 className="text-white text-xl font-bold">🎨 AI Carousel Studio</h1>
      </div>
      <iframe
        src="/editor.html"
        title="AI Carousel Studio"
        className="flex-1 w-full border-0 block"
      />
    </div>
  );
}
