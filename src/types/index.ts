// Define a estrutura de uma única alternativa em uma questão de múltipla escolha
export interface Alternativa {
  id: number;
  texto: string;
}

// Define a estrutura principal de uma questão
export interface Questao {
  id: number;
  numero: number;
  tipo: 'dissertativa' | 'multipla-escolha'; // Usamos um "union type" para tipos exatos
  enunciado: string;
  alternativas?: Alternativa[]; // A '?' indica que esta propriedade é opcional
  respostaCorreta?: number;     // Também opcional
}