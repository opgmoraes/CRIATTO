'use client';

import React, { useState } from 'react';

interface GenerationConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  template: 'template-01' | 'template-02' | 'minimalist' | 'vibrant';
  fonts: {
    headline: string;
    body: string;
  };
  articleUrl?: string;
  autoImages: boolean;
  imageSource: 'unsplash' | 'pexels' | 'pixabay';
}

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: GenerationConfig, briefing: string) => void;
  isLoading: boolean;
}

const defaultColors = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F7B801',
  background: '#FFFFFF',
};

const templateOptions = [
  { id: 'template-01', name: '✨ Product Showcase', desc: 'SaaS moderno, headlines grandes' },
  { id: 'template-02', name: '📸 Photo + Typography', desc: 'Fotografia em destaque, texto elegante' },
  { id: 'minimalist', name: '□ Minimalista', desc: 'Limpo, espaço negativo, foco no conteúdo' },
  { id: 'vibrant', name: '🎨 Vibrante', desc: 'Cores vivas, energético, moderno' },
];

const fontOptions = {
  headline: ['Inter', 'Montserrat', 'Playfair Display', 'Poppins', 'DM Serif Display'],
  body: ['Inter', 'Open Sans', 'Lato', 'Source Sans Pro', 'Roboto'],
};

export function AdvancedGenerationModal({ isOpen, onClose, onGenerate, isLoading }: GenerationModalProps) {
  const [briefing, setBriefing] = useState('');
  const [colors, setColors] = useState(defaultColors);
  const [template, setTemplate] = useState<'template-01' | 'template-02' | 'minimalist' | 'vibrant'>('template-01');
  const [fonts, setFonts] = useState({ headline: 'Inter', body: 'Lato' });
  const [articleUrl, setArticleUrl] = useState('');
  const [autoImages, setAutoImages] = useState(true);
  const [imageSource, setImageSource] = useState<'unsplash' | 'pexels' | 'pixabay'>('unsplash');
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate(
      { colors, template, fonts, articleUrl: articleUrl || undefined, autoImages, imageSource },
      briefing
    );
  };

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-3 mb-3">
      <label className="w-24 text-sm font-medium">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 rounded cursor-pointer"
      />
      <span className="text-xs text-gray-500 font-mono">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">✨ Gerar com IA (Pro)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  step === s
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 1 ? '📝 Briefing' : s === 2 ? '🎨 Design' : '🖼️ Imagens'}
              </button>
            ))}
          </div>

          {/* Step 1: Briefing & URL */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Seu briefing para o carrossel</label>
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  placeholder="Ex: Vou lançar um novo produto de skincare, preciso de 5 slides destacando os benefícios principais. Público-alvo: mulheres 25-35 anos."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Link de artigo/matéria (opcional)</label>
                <input
                  type="url"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://seu-blog.com/artigo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A IA vai extrair o conteúdo e usar como base para gerar o carrossel
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Design */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-bold mb-3">Template</label>
                <div className="grid grid-cols-2 gap-3">
                  {templateOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTemplate(opt.id as any)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        template === opt.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{opt.name}</div>
                      <div className="text-xs text-gray-600">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-bold mb-3">Paleta de Cores</label>
                <ColorPicker
                  label="Primária"
                  value={colors.primary}
                  onChange={(v) => handleColorChange('primary', v)}
                />
                <ColorPicker
                  label="Secundária"
                  value={colors.secondary}
                  onChange={(v) => handleColorChange('secondary', v)}
                />
                <ColorPicker
                  label="Destaque"
                  value={colors.accent}
                  onChange={(v) => handleColorChange('accent', v)}
                />
                <ColorPicker
                  label="Fundo"
                  value={colors.background}
                  onChange={(v) => handleColorChange('background', v)}
                />
                <button
                  onClick={() => setColors(defaultColors)}
                  className="text-sm text-orange-500 hover:text-orange-600 mt-2"
                >
                  ↺ Restaurar padrão
                </button>
              </div>

              {/* Fonts */}
              <div>
                <label className="block text-sm font-bold mb-3">Tipografia</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Headlines</label>
                    <select
                      value={fonts.headline}
                      onChange={(e) => setFonts((p) => ({ ...p, headline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {fontOptions.headline.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Corpo</label>
                    <select
                      value={fonts.body}
                      onChange={(e) => setFonts((p) => ({ ...p, body: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {fontOptions.body.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 A IA vai gerar descrições de imagens baseado no seu briefing e procurar em bancos grátis.
                  Você pode editar depois no editor!
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoImages}
                    onChange={(e) => setAutoImages(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Gerar imagens automaticamente</span>
                </label>
              </div>

              {autoImages && (
                <div>
                  <label className="block text-sm font-medium mb-2">Banco de imagens preferido</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['unsplash', 'pexels', 'pixabay'] as const).map((source) => (
                      <button
                        key={source}
                        onClick={() => setImageSource(source)}
                        className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                          imageSource === source
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {source === 'unsplash' && '📷 Unsplash'}
                        {source === 'pexels' && '🖼️ Pexels'}
                        {source === 'pixabay' && '✨ Pixabay'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Voltar
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Próximo →
              </button>
            )}
          </div>

          {step === 3 && (
            <button
              onClick={handleGenerate}
              disabled={!briefing.trim() || isLoading}
              className="px-8 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? '⏳ Gerando...' : '✨ Gerar Carrossel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
