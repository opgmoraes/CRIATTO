'use client';

import React, { useState } from 'react';

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
}

interface EditSlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  onSave: (slides: Slide[]) => void;
  onRegenerateSingle: (slideIndex: number) => Promise<Slide>;
  isRegenerating: boolean;
}

export function EditSlidesModal({
  isOpen,
  onClose,
  slides,
  onSave,
  onRegenerateSingle,
  isRegenerating,
}: EditSlidesModalProps) {
  const [editedSlides, setEditedSlides] = useState<Slide[]>(slides);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentSlide = editedSlides[selectedSlideIdx];

  // Editar campo do slide atual
  const updateSlide = (field: keyof Slide, value: any) => {
    const updated = [...editedSlides];
    updated[selectedSlideIdx] = {
      ...updated[selectedSlideIdx],
      [field]: value,
    };
    setEditedSlides(updated);
  };

  // Editar cores
  const updateColor = (colorKey: 'bg' | 'text' | 'accent', value: string) => {
    const updated = [...editedSlides];
    updated[selectedSlideIdx] = {
      ...updated[selectedSlideIdx],
      colors: {
        ...updated[selectedSlideIdx].colors,
        [colorKey]: value,
      },
    };
    setEditedSlides(updated);
  };

  // Drag and drop para reordenar
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx) return;

    const updated = [...editedSlides];
    const [draggedSlide] = updated.splice(draggedIdx, 1);
    updated.splice(dropIdx, 0, draggedSlide);
    setEditedSlides(updated);
    setDraggedIdx(null);

    // Ajusta índice selecionado se necessário
    if (selectedSlideIdx === draggedIdx) {
      setSelectedSlideIdx(dropIdx);
    }
  };

  // Regenerar um slide individual
  const handleRegenerate = async () => {
    try {
      const regenerated = await onRegenerateSingle(selectedSlideIdx);
      const updated = [...editedSlides];
      updated[selectedSlideIdx] = regenerated;
      setEditedSlides(updated);
    } catch (error) {
      console.error('Erro ao regenerar:', error);
    }
  };

  // Upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateSlide('image', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Deletar slide
  const handleDeleteSlide = () => {
    if (editedSlides.length === 1) {
      alert('Você precisa ter pelo menos 1 slide!');
      return;
    }
    const updated = editedSlides.filter((_, idx) => idx !== selectedSlideIdx);
    setEditedSlides(updated);
    setSelectedSlideIdx(Math.min(selectedSlideIdx, updated.length - 1));
  };

  // Duplicar slide
  const handleDuplicateSlide = () => {
    const updated = [...editedSlides];
    const duplicated = {
      ...currentSlide,
      id: `${currentSlide.id}-copy-${Date.now()}`,
    };
    updated.splice(selectedSlideIdx + 1, 0, duplicated);
    setEditedSlides(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">✏️ Editar Slides</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex gap-6 p-6">
          {/* Left: Lista de Slides */}
          <div className="w-48 flex-shrink-0">
            <h3 className="text-sm font-bold mb-3 text-gray-700">SLIDES</h3>
            <div className="space-y-2">
              {editedSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  onClick={() => setSelectedSlideIdx(idx)}
                  className={`w-full p-3 rounded-lg border-2 transition text-left text-sm ${
                    selectedSlideIdx === idx
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${draggedIdx === idx ? 'opacity-50' : ''}`}
                  style={{
                    backgroundColor: selectedSlideIdx === idx ? '#fef3f2' : slide.colors.bg,
                    color: slide.colors.text,
                  }}
                >
                  <div className="font-medium truncate">Slide {idx + 1}</div>
                  <div className="text-xs opacity-70 truncate">{slide.headline}</div>
                </button>
              ))}
            </div>

            {/* Add Slide Button */}
            <button
              onClick={handleDuplicateSlide}
              className="w-full mt-3 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
            >
              + Duplicar
            </button>
          </div>

          {/* Right: Editor do Slide Atual */}
          {currentSlide && (
            <div className="flex-1 space-y-4">
              {/* Preview */}
              <div
                className="border border-gray-300 rounded-lg p-6 min-h-96"
                style={{
                  backgroundColor: currentSlide.colors.bg,
                  color: currentSlide.colors.text,
                }}
              >
                <div className="flex gap-4">
                  {/* Imagem */}
                  {currentSlide.image && (
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.imageAlt}
                      className="w-40 h-40 object-cover rounded"
                    />
                  )}

                  {/* Texto */}
                  <div className="flex-1">
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{ fontFamily: currentSlide.fonts.headline }}
                    >
                      {currentSlide.headline}
                    </h3>
                    <p
                      className="text-sm mb-4 opacity-90"
                      style={{ fontFamily: currentSlide.fonts.body }}
                    >
                      {currentSlide.body}
                    </p>
                    {currentSlide.cta && (
                      <button
                        className="px-4 py-2 rounded font-medium text-white"
                        style={{ backgroundColor: currentSlide.colors.accent }}
                      >
                        {currentSlide.cta}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-sm font-medium mb-1">Headline</label>
                <input
                  type="text"
                  value={currentSlide.headline}
                  onChange={(e) => updateSlide('headline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={currentSlide.body}
                  onChange={(e) => updateSlide('body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-20"
                />
              </div>

              {/* CTA */}
              <div>
                <label className="block text-sm font-medium mb-1">CTA (opcional)</label>
                <input
                  type="text"
                  value={currentSlide.cta || ''}
                  onChange={(e) => updateSlide('cta', e.target.value || undefined)}
                  placeholder="Ex: Saiba Mais"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium mb-2">Imagem</label>
                <div className="flex gap-2">
                  <label className="flex-1 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 text-center">
                    📤 Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {currentSlide.image && (
                    <button
                      onClick={() => updateSlide('image', undefined)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
                {currentSlide.image && (
                  <img
                    src={currentSlide.image}
                    alt="preview"
                    className="w-32 h-32 object-cover rounded mt-2"
                  />
                )}
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Fundo</label>
                  <input
                    type="color"
                    value={currentSlide.colors.bg}
                    onChange={(e) => updateColor('bg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Texto</label>
                  <input
                    type="color"
                    value={currentSlide.colors.text}
                    onChange={(e) => updateColor('text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Destaque</label>
                  <input
                    type="color"
                    value={currentSlide.colors.accent}
                    onChange={(e) => updateColor('accent', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
                >
                  {isRegenerating ? '⏳ Regenerando...' : '🔄 Regenerar'}
                </button>
                <button
                  onClick={handleDeleteSlide}
                  disabled={editedSlides.length === 1}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6 flex gap-3 justify-between">
          <div className="text-sm text-gray-600">
            {editedSlides.length} slides • Arraste para reordenar
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSave(editedSlides);
                onClose();
              }}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              ✅ Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
