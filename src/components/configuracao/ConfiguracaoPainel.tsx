import React from 'react';
import MetadadosConfig from './MetadadosConfig';
import LogoUploader from './LogoUploader';
import TemplateConfig from './TemplateConfig';

// 1. Definição da interface que estava em falta
interface ConfiguracaoPainelProps {
  onVoltar: () => void;
}

// 2. Agora o componente pode usar a interface sem erros
function ConfiguracaoPainel({ onVoltar }: ConfiguracaoPainelProps) {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Painel de Configuração</h1>
        <button
          onClick={onVoltar}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar ao Construtor
        </button>
      </header>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Logo da Instituição</h2>
          <LogoUploader />
          <p className="text-sm text-gray-500 mt-4">
            Faça o upload da imagem que aparecerá no cabeçalho.
          </p>
        </div>

        <MetadadosConfig />
        
        <TemplateConfig />
      </div>
    </div>
  );
}

export default ConfiguracaoPainel;