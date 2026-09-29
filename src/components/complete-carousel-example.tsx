'use client';

import React, { useState } from 'react';
import { AdvancedGenerationModal } from '@/components/advanced-generation-modal';
import { EditSlidesModal } from '@/components/edit-slides-modal';
import { LogoUploadModal } from '@/components/logo-upload-modal';
import { Slide } from '@/types'; // Ajuste conforme seu tipo

export default function CompleteCarouselEditor() {
  // ============= STATE =============
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [logo, setLogo] = useState<{
    url: string;
    positioning: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    opacity: number;
    size: 'small' | 'medium' | 'large';
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // ============= HANDLERS =============

  /**
   * Gerar carrossel com IA
   */
  const handleGenerate = async (config: any, briefing: string) => {
    setIsGenerating(true);
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

      if (!response.ok) throw new Error('Erro ao gerar');

      const data = await response.json();

      // Adiciona logo a todos os slides se existir
      let slidesWithLogo = data.slides;
      if (logo) {
        slidesWithLogo = data.slides.map((slide: any) => ({
          ...slide,
          logo: {
            url: logo.url,
            positioning: logo.positioning,
            opacity: logo.opacity,
            size: logo.size,
          },
        }));
      }

      setSlides(slidesWithLogo);
      setShowGenerateModal(false);
      setShowEditModal(true); // Abre editor automaticamente

      showNotification('success', '✨ Carrossel gerado! Agora edite como desejar.');
    } catch (error) {
      console.error('Generate error:', error);
      showNotification('error', '❌ Erro ao gerar carrossel');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Regenerar apenas um slide
   */
  const handleRegenerateSingle = async (slideIndex: number) => {
    setIsRegenerating(true);
    try {
      const currentSlide = slides[slideIndex];

      const response = await fetch('/api/regenerate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefing: 'Regenerar slide', // Melhore conforme necessário
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

      if (!response.ok) throw new Error('Erro ao regenerar');

      const data = await response.json();

      // Adiciona logo se existir
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

      showNotification('success', '🔄 Slide regenerado!');
      return regeneratedSlide;
    } catch (error) {
      console.error('Regenerate error:', error);
      showNotification('error', '❌ Erro ao regenerar slide');
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  };

  /**
   * Salvar slides editados
   */
  const handleSaveSlides = async (editedSlides: Slide[]) => {
    try {
      // Se tem logo, adiciona a todos
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

      // TODO: Salvar no banco de dados se necessário
      // const response = await fetch('/api/save-generation', {
      //   method: 'POST',
      //   body: JSON.stringify({ slides: slidesWithLogo }),
      // });

      showNotification('success', '✅ Slides salvos!');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('error', '❌ Erro ao salvar slides');
    }
  };

  /**
   * Adicionar/atualizar logo
   */
  const handleLogoSelect = (logoData: any) => {
    const newLogo = {
      url: logoData.url,
      positioning: logoData.positioning,
      opacity: logoData.opacity,
      size: logoData.size,
    };

    setLogo(newLogo);

    // Atualiza todos os slides existentes com a nova logo
    if (slides.length > 0) {
      const updated = slides.map((slide) => ({
        ...slide,
        logo: newLogo,
      }));
      setSlides(updated);
    }

    showNotification('success', '🎨 Logo adicionada a todos os slides!');
  };

  /**
   * Copiar JSON dos slides (útil para debug)
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(slides, null, 2));
    showNotification('success', '📋 JSON copiado!');
  };

  /**
   * Fazer download dos slides como JSON
   */
  const downloadJSON = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(slides, null, 2)));
    element.setAttribute('download', `carrossel-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('success', '⬇️ Download iniciado!');
  };

  /**
   * Notificações
   */
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ============= RENDER =============

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
            🎨 AI Carousel Studio
          </h1>
          <p className="text-gray-600">
            Gere carrosséis profissionais com IA, edite cada slide e adicione sua logo
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            ✨ Gerar Novo Carrossel
          </button>

          {slides.length > 0 && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                ✏️ Editar Slides
              </button>

              <button
                onClick={() => setShowLogoModal(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                🎨 {logo ? 'Trocar' : 'Adicionar'} Logo
              </button>

              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                📋 Copiar JSON
              </button>

              <button
                onClick={downloadJSON}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                ⬇️ Download JSON
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        {slides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-gray-500 text-sm">Slides</div>
              <div className="text-2xl font-bold">{slides.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-gray-500 text-sm">Template</div>
              <div className="text-2xl font-bold">{slides[0]?.template || '-'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-gray-500 text-sm">Fonte</div>
              <div className="text-2xl font-bold">{slides[0]?.fonts?.headline || '-'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-gray-500 text-sm">Status</div>
              <div className="text-2xl font-bold">{logo ? '✅' : '⏳'} Logo</div>
            </div>
          </div>
        )}

        {/* Slides Preview */}
        {slides.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Preview dos Slides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition"
                  style={{
                    backgroundColor: slide.colors.bg,
                    color: slide.colors.text,
                  }}
                >
                  {/* Card */}
                  <div className="aspect-square p-6 flex flex-col items-center justify-center relative">
                    {/* Imagem */}
                    {slide.image && (
                      <img
                        src={slide.image}
                        alt={slide.imageAlt}
                        className="w-24 h-24 object-cover rounded-lg mb-4"
                      />
                    )}

                    {/* Texto */}
                    <h3 className="text-lg font-bold text-center mb-2 line-clamp-2">{slide.headline}</h3>
                    <p className="text-xs text-center opacity-75 line-clamp-3 mb-4">{slide.body}</p>

                    {/* CTA */}
                    {slide.cta && (
                      <button
                        className="px-4 py-2 rounded text-white text-sm font-medium"
                        style={{ backgroundColor: slide.colors.accent }}
                      >
                        {slide.cta}
                      </button>
                    )}

                    {/* Logo */}
                    {slide.logo && (
                      <img
                        src={slide.logo.url}
                        alt="Logo"
                        className={`absolute ${getPositionClass(slide.logo.positioning)} ${getSizeClass(slide.logo.size)} object-contain p-1 bg-white rounded`}
                        style={{ opacity: slide.logo.opacity }}
                      />
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-black/10 px-4 py-2 text-xs text-center opacity-75">
                    Slide {idx + 1} de {slides.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">Nenhum carrossel ainda</h2>
            <p className="text-gray-600 mb-6">Clique em "✨ Gerar Novo Carrossel" para começar</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition font-medium inline-block"
            >
              Vamos lá! ✨
            </button>
          </div>
        )}

        {/* Modals */}
        <AdvancedGenerationModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerate}
          isLoading={isGenerating}
        />

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

        {/* Notification */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg text-white shadow-lg transition ${
              notification.type === 'success'
                ? 'bg-green-500'
                : notification.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            }`}
          >
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= HELPERS =============

function getPositionClass(positioning: string) {
  const map: Record<string, string> = {
    'top-left': 'top-3 left-3',
    'top-center': 'top-3 left-1/2 -translate-x-1/2',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-3 right-3',
  };
  return map[positioning] || '';
}

function getSizeClass(size: string) {
  const map: Record<string, string> = {
    'small': 'w-12 h-12',
    'medium': 'w-20 h-20',
    'large': 'w-32 h-32',
  };
  return map[size] || '';
}
