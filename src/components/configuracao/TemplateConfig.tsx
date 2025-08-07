import React, { useState, useEffect } from 'react';
import { useConfiguracao } from '../../context/ConfiguracaoContext';

const templatesDisponiveis = ['Prova Global', 'Microteste', 'Simuladinho', 'Simulado Enem', 'Simulado Tradicional', 'Atividade'];

function TemplateConfig() {
  const { config, updateTemplateStyle } = useConfiguracao();
  const [selectedTemplate, setSelectedTemplate] = useState(templatesDisponiveis[0]);
  const [currentStyles, setCurrentStyles] = useState(config.templateStyles[selectedTemplate]);

  // Atualiza o formulário quando o template selecionado muda
  useEffect(() => {
    setCurrentStyles(config.templateStyles[selectedTemplate]);
  }, [selectedTemplate, config.templateStyles]);

  const handleStyleChange = (prop: string, value: string) => {
    const newStyles = { ...currentStyles, [prop]: value };
    setCurrentStyles(newStyles);
    // Atualiza o contexto em tempo real
    updateTemplateStyle(selectedTemplate, newStyles);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Templates de Documento</h2>
      <p className="text-sm text-gray-500 mb-6">Ajuste as margens e tamanho da fonte para cada modelo.</p>

      <div className="mb-4">
        <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">
          Selecione um template para editar:
        </label>
        <select
          id="template-select"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {templatesDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="padding" className="block text-sm font-medium text-gray-600">Margens (padding)</label>
          <input
            type="text"
            id="padding"
            value={currentStyles.padding}
            onChange={(e) => handleStyleChange('padding', e.target.value)}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
            placeholder="ex: 1.5cm"
          />
        </div>
        <div>
          <label htmlFor="fontSize" className="block text-sm font-medium text-gray-600">Tamanho da Fonte</label>
          <input
            type="text"
            id="fontSize"
            value={currentStyles.fontSize}
            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
            placeholder="ex: 10pt"
          />
        </div>
      </div>
    </div>
  );
}

export default TemplateConfig;