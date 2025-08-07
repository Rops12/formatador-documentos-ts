// src/components/configuracao/LogoUploader.tsx

import React, { useRef } from 'react';
import { useConfiguracao } from '../../context/ConfiguracaoContext';

function LogoUploader() {
  const { config, setConfig } = useConfiguracao();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Usamos a API FileReader para ler o arquivo como um Data URL (Base64)
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prevConfig => ({
          ...prevConfig,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverLogo = () => {
    setConfig(prevConfig => ({
      ...prevConfig,
      logoUrl: null
    }));
    // Limpa o valor do input para permitir o re-upload do mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 bg-gray-100 border rounded-md flex items-center justify-center">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Preview da Logo" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-gray-500">Sem logo</span>
        )}
      </div>
      <div className="flex-grow">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/svg+xml"
          onChange={handleLogoChange}
          className="hidden" // Escondemos o input padrão
          id="logo-upload"
        />
        {/* Usamos um label estilizado para acionar o input */}
        <label
          htmlFor="logo-upload"
          className="cursor-pointer bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Escolher Arquivo
        </label>
        {config.logoUrl && (
          <button
            onClick={handleRemoverLogo}
            className="ml-2 text-sm text-red-600 hover:underline"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

export default LogoUploader;