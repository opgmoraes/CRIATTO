"use client";

import { useState } from "react";
import { EditSlidesModal } from "@/components/edit-slides-modal";
import { LogoUploadModal } from "@/components/logo-upload-modal";

interface Slide {
  id: string;
  template: string;
  headline: string;
  body: string;
  cta?: string;
  image?: string;
  imageAlt?: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  logo?: {
    url: string;
    positioning:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right";
    opacity: number;
    size: "small" | "medium" | "large";
  };
}

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [logo, setLogo] = useState<any>(null);

  // Salvar slides editados
  const handleSaveSlides = (editedSlides: Slide[]) => {
    const slidesWithLogo = editedSlides.map((slide) => ({
      ...slide,
      logo: logo
        ? {
            url: logo.url,
            positioning: logo.positioning,
            opacity: logo.opacity,
            size: logo.size,
          }
        : undefined,
    }));
    setSlides(slidesWithLogo);
  };

  // Regenerar um slide individual
  const handleRegenerateSingle = async (slideIndex: number) => {
    setIsRegenerating(true);
    try {
      const currentSlide = slides[slideIndex];

      const response = await fetch("/api/regenerate-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing: "Regenerar slide",
          slideIndex,
          totalSlides: slides.length,
          colors: {
            bg: currentSlide.colors.bg,
            primary: currentSlide.colors.text,
            accent: currentSlide.colors.accent,
          },
          fonts: currentSlide.fonts,
          template: currentSlide.template,
        }),
      });

      if (!response.ok) throw new Error("Erro ao regenerar");

      const data = await response.json();

      const regeneratedSlide = logo
        ? {
            ...data.slide,
            logo: {
              url: logo.url,
              positioning: logo.positioning,
              opacity: logo.opacity,
              size: logo.size,
            },
          }
        : data.slide;

      return regeneratedSlide;
    } catch (error) {
      console.error("Regenerate error:", error);
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  };

  // Adicionar logo
  const handleLogoSelect = (logoData: any) => {
    const newLogo = {
      url: logoData.url,
      positioning: logoData.positioning,
      opacity: logoData.opacity,
      size: logoData.size,
    };

    setLogo(newLogo);

    if (slides.length > 0) {
      const updated = slides.map((slide) => ({
        ...slide,
        logo: newLogo,
      }));
      setSlides(updated);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900">
      {/* Header com Botões */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-white text-2xl font-bold">🎨 AI Carousel Studio</h1>

        {slides.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition"
            >
              ✏️ Editar Slides
            </button>

            <button
              onClick={() => setShowLogoModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition"
            >
              🎨 {logo ? "Trocar" : "Adicionar"} Logo
            </button>
          </div>
        )}
      </div>

      {/* Editor HTML (seu iframe original) */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="/editor.html"
          title="AI Carousel Studio"
          style={{
            border: "none",
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>

      {/* Modais */}
      <EditSlidesModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        slides={slides}
        onSave={handleSaveSlides}
        onRegenerateSingle={handleRegenerateSingle}
        isRegenerating={isRegenerating}
      />

      <LogoUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onLogoSelect={handleLogoSelect}
        currentLogo={logo?.url}
      />
    </div>
  );
}
