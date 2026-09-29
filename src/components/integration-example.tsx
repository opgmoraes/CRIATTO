'use client';

import React, { useState } from 'react';
import { AdvancedGenerationModal } from '@/components/advanced-generation-modal';

/**
 * EXEMPLO DE INTEGRAÇÃO COMPLETA
 * 
 * Este arquivo mostra como usar o modal gerador com seu editor
 * Copie a lógica para seu componente principal
 */

interface GeneratedSlide {
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
}

export function EditorWithAdvancedGeneration() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GeneratedSlide[][]>([]);
  const [toastMessage, setToastMessage] = useState('');

  // Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Gera com IA usando o novo modal
  const handleGenerate = async (config: any, briefing: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefing,
          colors: config.colors,
          template: config.template,
          fonts: config.fonts,
          articleUrl: config.articleUrl,
          autoImages: config.autoImages,
          imageSource: config.imageSource,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSlides(data.slides);
        setGenerationHistory((prev) => [data.slides, ...prev.slice(0, 4)]); // Guarda últimas 5
        showToast(`✅ ${data.slides.length} slides gerados com sucesso!`);
        setShowModal(false);
      } else {
        showToast('❌ Erro ao gerar slides');
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast('❌ Erro na requisição');
    } finally {
      setIsLoading(false);
    }
  };

  // Aplica um slide gerado ao editor (seu canvas)
  const applySlideToEditor = (slide: GeneratedSlide) => {
    // Aqui você vai integrar com seu editor/canvas
    console.log('Aplicando slide ao editor:', slide);

    // Exemplo: mandar para seu editor
    // window.editorInstance.loadSlide({
    //   headline: slide.headline,
    //   body: slide.body,
    //   background: slide.colors.bg,
    //   textColor: slide.colors.text,
    //   accentColor: slide.colors.accent,
    //   headlineFont: slide.fonts.headline,
    //   bodyFont: slide.fonts.body,
    //   image: slide.image,
    // });

    showToast('Slide carregado no editor!');
  };

  // Recarrega uma geração anterior
  const reloadFromHistory = (historySlides: GeneratedSlide[]) => {
    setSlides(historySlides);
    showToast('Geração anterior carregada');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 mb-6 items-center">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium flex items-center gap-2"
        >
          ✨ Gerar com IA (Pro)
        </button>

        {slides.length > 0 && (
          <div className="text-sm text-gray-600">
            {slides.length} slides gerados
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Slides Gerados */}
        <div className="col-span-2">
          {slides.length > 0 ? (
            <div>
              <h3 className="text-lg font-bold mb-4">📋 Slides Gerados</h3>
              <div className="space-y-3">
                {slides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition"
                    style={{
                      backgroundColor: slide.colors.bg,
                      color: slide.colors.text,
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail da imagem */}
                      {slide.image && (
                        <img
                          src={slide.image}
                          alt={slide.imageAlt}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}

                      {/* Conteúdo */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4
                              className="font-bold text-lg"
                              style={{ fontFamily: slide.fonts.headline }}
                            >
                              {slide.headline}
                            </h4>
                            <p
                              className="text-sm mt-1 opacity-90"
                              style={{ fontFamily: slide.fonts.body }}
                            >
                              {slide.body}
                            </p>
                            {slide.cta && (
                              <button
                                className="mt-2 px-3 py-1 rounded text-sm font-medium"
                                style={{ backgroundColor: slide.colors.accent }}
                              >
                                {slide.cta}
                              </button>
                            )}
                          </div>

                          {/* Info Badge */}
                          <div className="text-xs opacity-60">
                            Slide {idx + 1}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-300 border-opacity-20">
                          <button
                            onClick={() => applySlideToEditor(slide)}
                            className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            📐 Aplicar ao Editor
                          </button>
                          <button
                            onClick={() => {
                              // Copiar JSON para clipboard (útil pra debug)
                              navigator.clipboard.writeText(JSON.stringify(slide, null, 2));
                              showToast('JSON copiado');
                            }}
                            className="text-xs px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                          >
                            📋 Copiar JSON
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
              <p className="text-lg font-medium">Nenhum slide gerado ainda</p>
              <p className="text-sm mt-1">Clique em "Gerar com IA" para começar</p>
            </div>
          )}
        </div>

        {/* Right: Histórico */}
        <div>
          <h3 className="text-lg font-bold mb-4">📚 Histórico</h3>

          {generationHistory.length > 0 ? (
            <div className="space-y-2">
              {generationHistory.map((historySlides, idx) => (
                <button
                  key={idx}
                  onClick={() => reloadFromHistory(historySlides)}
                  className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left text-sm transition"
                >
                  <div className="font-medium">Geração {idx + 1}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {historySlides.length} slides
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {historySlides[0]?.template}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              Histórico vazio
            </div>
          )}
        </div>
      </div>

      {/* Modal Gerador */}
      <AdvancedGenerationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Para usar este componente:
 * 
 * import { EditorWithAdvancedGeneration } from '@/components/integration-example';
 * 
 * export default function Page() {
 *   return <EditorWithAdvancedGeneration />;
 * }
 */
