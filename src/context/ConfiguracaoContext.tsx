// src/context/ConfiguracaoContext.tsx (modificado)

import React, { createContext, useState, ReactNode, useContext } from 'react';

// 1. Detalhar mais a interface de estilos
interface TemplateStyles {
  padding: string;
  fontSize: string;
  fontFamily: string;
  // Podemos adicionar mais no futuro: headerHeight, footerHeight, etc.
}

interface Configuracoes {
  disciplinas: string[];
  series: string[];
  turmas: string[];
  logoUrl: string | null;
  templateStyles: Record<string, TemplateStyles>;
}

interface ConfiguracaoContextType {
  config: Configuracoes;
  setConfig: React.Dispatch<React.SetStateAction<Configuracoes>>;
  updateDisciplinas: (disciplinas: string[]) => void;
  updateSeries: (series: string[]) => void;
  updateTurmas: (turmas: string[]) => void;
  // 2. Adicionar função para atualizar estilos
  updateTemplateStyle: (templateName: string, newStyles: TemplateStyles) => void;
}

const initialState: Configuracoes = {
  disciplinas: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês"],
  series: ["6º Ano", "7º Ano", "8º Ano", "9º Ano", "1º Ano EM", "2º Ano EM", "3º Ano EM"],
  turmas: ["A", "B", "C", "D", "E"],
  logoUrl: null,
  // 3. Adicionar valores iniciais para os novos campos
  templateStyles: {
    'Prova Global': { padding: '1.5cm', fontSize: '10pt', fontFamily: 'Arial, sans-serif' },
    'Microteste': { padding: '1.2cm', fontSize: '11pt', fontFamily: 'Arial, sans-serif' },
    'Simuladinho': { padding: '1cm', fontSize: '9pt', fontFamily: 'Times New Roman, serif' },
    'Simulado Enem': { padding: '1cm', fontSize: '9pt', fontFamily: 'Times New Roman, serif' },
    'Simulado Tradicional': { padding: '1cm', fontSize: '9pt', fontFamily: 'Times New Roman, serif' },
    'Atividade': { padding: '1.5cm', fontSize: '10pt', fontFamily: 'Arial, sans-serif' },
  }
};

export const ConfiguracaoContext = createContext<ConfiguracaoContextType | undefined>(undefined);

export const ConfiguracaoProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Configuracoes>(initialState);

  const updateDisciplinas = (novasDisciplinas: string[]) => setConfig(prev => ({ ...prev, disciplinas: novasDisciplinas }));
  const updateSeries = (novasSeries: string[]) => setConfig(prev => ({ ...prev, series: novasSeries }));
  const updateTurmas = (novasTurmas: string[]) => setConfig(prev => ({ ...prev, turmas: novasTurmas }));
  
  // 4. Implementar a função de atualização de estilo
  const updateTemplateStyle = (templateName: string, newStyles: TemplateStyles) => {
    setConfig(prev => ({
      ...prev,
      templateStyles: {
        ...prev.templateStyles,
        [templateName]: newStyles
      }
    }));
  };

  return (
    <ConfiguracaoContext.Provider value={{ config, setConfig, updateDisciplinas, updateSeries, updateTurmas, updateTemplateStyle }}>
      {children}
    </ConfiguracaoContext.Provider>
  );
};

export const useConfiguracao = () => {
  const context = useContext(ConfiguracaoContext);
  if (context === undefined) {
    throw new Error('useConfiguracao must be used within a ConfiguracaoProvider');
  }
  return context;
};