// src/App.tsx

import React, { useState } from 'react';
import ProvaCreator from './workspaces/ProvaCreator';
import SimuladoCreator from './workspaces/SimuladoCreator';
import ConfiguracaoPainel from './components/configuracao/ConfiguracaoPainel';

type Modo = 'SELECAO' | 'PROVA' | 'SIMULADO' | 'CONFIG';

function App() {
  const [modo, setModo] = useState<Modo>('SELECAO');

  if (modo === 'CONFIG') {
    return <ConfiguracaoPainel onVoltar={() => setModo('SELECAO')} />;
  }

  if (modo === 'PROVA') {
    return <ProvaCreator onVoltar={() => setModo('SELECAO')} />;
  }

  if (modo === 'SIMULADO') {
    return <SimuladoCreator onVoltar={() => setModo('SELECAO')} />;
  }

  // --- TELA DE SELEÇÃO INICIAL ---
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Mecanografia</h1>
            <button 
              onClick={() => setModo('CONFIG')}
              className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Configurações
            </button>
        </header>

        <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900">O que você quer criar?</h2>
            <p className="mt-4 text-lg text-gray-600">Escolha o tipo de documento para começar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => setModo('PROVA')}
            className="group block p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-left border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-blue-600">Prova ou Atividade</h3>
            <p className="mt-2 text-gray-500">
              Ideal para avaliações de uma única disciplina, testes rápidos e atividades.
            </p>
            <p className="mt-4 font-semibold text-blue-600 group-hover:underline">Começar a criar →</p>
          </button>

          <button 
            onClick={() => setModo('SIMULADO')}
            className="group block p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-left border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-green-600">Simulado</h3>
            <p className="mt-2 text-gray-500">
              Perfeito para avaliações completas com múltiplos cadernos e disciplinas, como simulados ENEM e vestibulares.
            </p>
            <p className="mt-4 font-semibold text-green-600 group-hover:underline">Começar a criar →</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;