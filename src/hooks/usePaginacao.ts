import React, { useState, useEffect, useRef, ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types'; // Importando nosso tipo!

// Constantes para as dimensões da página em pixels (aproximado para 96 DPI)
const PAGE_HEIGHT_PX = 1122.8; 
const PAGE_PADDING_Y_PX = 56.7; // 1.5cm de padding (superior + inferior)
const MARGEM_ENTRE_QUESTOES_PX = 16; // 0.42cm de margem

// 1. Tipagem para o retorno do hook
interface PaginacaoResult {
  paginas: Questao[][]; // Um array de arrays de Questao
  MedidorDeAltura: ReactElement; // O componente JSX que faz a medição
}

export const usePaginacao = (
  questoes: Questao[],
  headerRef: React.RefObject<HTMLElement>, // Tipando as refs
  footerRef: React.RefObject<HTMLElement>
): PaginacaoResult => {
  const [paginas, setPaginas] = useState<Questao[][]>([]);
  
  // 2. Tipando o objeto de refs para as questões
  const refs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const hasMeasured = useRef(false);

  useEffect(() => {
    hasMeasured.current = false;
  }, [questoes]);

  const calcularPaginas = () => {
    const allRefsReady = questoes.every(q => refs.current[q.id]);
    if (!questoes.length || !footerRef.current || !headerRef.current || !allRefsReady || hasMeasured.current) {
      return;
    }

    hasMeasured.current = true;
    const headerHeight = headerRef.current.offsetHeight;
    const footerHeight = footerRef.current.offsetHeight;

    const MAX_CONTENT_HEIGHT_PAG_1 = PAGE_HEIGHT_PX - (PAGE_PADDING_Y_PX * 2) - headerHeight - footerHeight;
    const MAX_CONTENT_HEIGHT_OUTRAS = PAGE_HEIGHT_PX - (PAGE_PADDING_Y_PX * 2) - footerHeight;

    const novasPaginas: Questao[][] = [];
    let paginaAtual: Questao[] = [];
    let alturaAtual = 0;

    questoes.forEach(questao => {
      const questaoRef = refs.current[questao.id];
      if (!questaoRef) return;

      const alturaQuestao = questaoRef.offsetHeight + MARGEM_ENTRE_QUESTOES_PX;
      const maxContentHeight = novasPaginas.length === 0 ? MAX_CONTENT_HEIGHT_PAG_1 : MAX_CONTENT_HEIGHT_OUTRAS;

      if (alturaAtual + alturaQuestao > maxContentHeight && paginaAtual.length > 0) {
        novasPaginas.push(paginaAtual);
        paginaAtual = [questao];
        alturaAtual = alturaQuestao;
      } else {
        paginaAtual.push(questao);
        alturaAtual += alturaQuestao;
      }
    });

    if (paginaAtual.length > 0) {
      novasPaginas.push(paginaAtual);
    }
    
    setPaginas(novasPaginas);
  };

  useEffect(() => {
    const timeoutId = setTimeout(calcularPaginas, 150);
    return () => clearTimeout(timeoutId);
  });

  const MedidorDeAltura = (
    <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1, width: '18cm' }}>
      {questoes.map(q => (
        <div key={q.id} ref={el => (refs.current[q.id] = el)}>
          <div className="prose prose-sm max-w-none">
            <div className="mb-4 questao-preview-item">
              <div className="font-semibold text-gray-900">Questão {q.numero}</div>
              <div className="enunciado"><ReactMarkdown>{q.enunciado}</ReactMarkdown></div>
              {q.tipo === 'multipla-escolha' && q.alternativas && (
                <ol type="a" className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                  {q.alternativas.map(alt => <li key={alt.id}>{alt.texto}</li>)}
                </ol>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return { paginas, MedidorDeAltura };
};