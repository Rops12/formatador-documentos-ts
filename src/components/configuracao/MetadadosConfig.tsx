// src/components/configuracao/MetadadosConfig.tsx (modificado)

import React from 'react';
import { useConfiguracao } from '../../context/ConfiguracaoContext';
import EditableList from './EditableList'; // Importe o novo componente

function MetadadosConfig() {
  const { config, updateDisciplinas, updateSeries, updateTurmas } = useConfiguracao();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Listas do Sistema</h2>
      <p className="text-sm text-gray-500 mb-6">Adicione ou remova itens que aparecerão nos menus de seleção do construtor.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <EditableList 
          titulo="Disciplinas"
          items={config.disciplinas}
          onUpdate={updateDisciplinas}
        />
        
        <EditableList 
          titulo="Séries"
          items={config.series}
          onUpdate={updateSeries}
        />

        <EditableList 
          titulo="Turmas"
          items={config.turmas}
          onUpdate={updateTurmas}
        />
        
      </div>
    </div>
  );
}

export default MetadadosConfig;