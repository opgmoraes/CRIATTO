'use client';

import React, { useState } from 'react';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoSelect: (logoData: {
    url: string;
    file: File;
    positioning: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    opacity: number;
    size: 'small' | 'medium' | 'large';
  }) => void;
  currentLogo?: string;
}

export function LogoUploadModal({
  isOpen,
  onClose,
  onLogoSelect,
  currentLogo,
}: LogoUploadModalProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(currentLogo || '');
  const [positioning, setPositioning] = useState<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('top-left');
  const [opacity, setOpacity] = useState(100);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Valida tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
      }

      // Valida tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande (máx 5MB)');
        return;
      }

      setLogoFile(file);

      // Preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!logoFile || !logoPreview) {
      alert('Selecione uma logo');
      return;
    }

    onLogoSelect({
      url: logoPreview,
      file: logoFile,
      positioning,
      opacity: opacity / 100,
      size,
    });

    onClose();
  };

  const getPositionClass = () => {
    const positionMap: Record<string, string> = {
      'top-left': 'top-3 left-3',
      'top-center': 'top-3 left-1/2 -translate-x-1/2',
      'top-right': 'top-3 right-3',
      'bottom-left': 'bottom-3 left-3',
      'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
      'bottom-right': 'bottom-3 right-3',
    };
    return positionMap[positioning] || '';
  };

  const getSizeClass = () => {
    const sizeMap: Record<string, string> = {
      'small': 'w-12 h-12',
      'medium': 'w-20 h-20',
      'large': 'w-32 h-32',
    };
    return sizeMap[size] || '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex justify-between items-center text-white">
          <h2 className="text-2xl font-bold">🎨 Upload da Logo</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div>
            <label className="block text-sm font-medium mb-2">Selecione sua Logo</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
              <div className="text-center">
                <div className="text-4xl mb-2">📤</div>
                <p className="font-medium text-gray-700">Clique ou arraste sua logo aqui</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG ou SVG (máx 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview + Settings */}
          {logoPreview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <label className="block text-sm font-medium mb-2">Preview nos Slides</label>
                <div
                  className="w-full aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg relative flex items-center justify-center border border-gray-200"
                >
                  {/* Simula um slide */}
                  <div className="text-center text-gray-400">
                    <p className="text-lg font-semibold">Seu Slide Aqui</p>
                    <p className="text-sm opacity-75">Conteúdo principal</p>
                  </div>

                  {/* Logo Preview */}
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className={`absolute ${getSizeClass()} ${getPositionClass()} object-contain bg-white rounded p-1 border border-gray-200`}
                    style={{ opacity: opacity / 100 }}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {/* Tamanho */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tamanho</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as const).map((sizeOpt) => (
                      <button
                        key={sizeOpt}
                        onClick={() => setSize(sizeOpt)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          size === sizeOpt
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sizeOpt === 'small' ? '📦 P' : sizeOpt === 'medium' ? '📦 M' : '📦 G'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posicionamento */}
                <div>
                  <label className="block text-sm font-medium mb-2">Posição</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'top-left' as const, label: '↖️' },
                      { val: 'top-center' as const, label: '⬆️' },
                      { val: 'top-right' as const, label: '↗️' },
                      { val: 'bottom-left' as const, label: '↙️' },
                      { val: 'bottom-center' as const, label: '⬇️' },
                      { val: 'bottom-right' as const, label: '↘️' },
                    ].map((pos) => (
                      <button
                        key={pos.val}
                        onClick={() => setPositioning(pos.val)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          positioning === pos.val
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacidade */}
                <div>
                  <label className="block text-sm font-medium mb-2">Opacidade</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">{opacity}%</span>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  💡 A logo será adicionada a <strong>todos os slides</strong> gerados
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!logoPreview}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
          >
            ✅ Confirmar Logo
          </button>
        </div>
      </div>
    </div>
  );
}
