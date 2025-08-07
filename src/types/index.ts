// Define a estrutura de uma afirmativa para questões de Verdadeiro ou Falso
export interface Afirmativa {
  id: number;
  texto: string;
  correta: boolean;
}

// Define a estrutura de uma única alternativa em uma questão de múltipla escolha
export interface Alternativa {
  id: number;
  texto: string;
}

// Define a estrutura principal de uma questão
export interface Questao {
  id: number;
  numero: number;
  // Adicionamos o novo tipo 'verdadeiro-falso'
  tipo: 'dissertativa' | 'multipla-escolha' | 'verdadeiro-falso';
  enunciado: string;
  
  // Propriedades opcionais para funcionalidades específicas
  imagemUrl?: string | null;      // Para adicionar imagem à questão
  disciplina?: string;            // Para agrupar questões em simulados

  // Propriedades específicas de cada tipo de questão
  alternativas?: Alternativa[];   // Apenas para 'multipla-escolha'
  respostaCorreta?: number;       // Apenas para 'multipla-escolha'
  linhasResposta?: number;        // Apenas para 'dissertativa'
  afirmativas?: Afirmativa[];     // Apenas para 'verdadeiro-falso'
}