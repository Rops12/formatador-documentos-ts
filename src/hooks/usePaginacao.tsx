import React, { useState, useLayoutEffect, useRef, ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types';

const PAGE_HEIGHT_PX = 1122.8; 
const PAGE_PADDING_Y_PX = 56.7 * 2;
const MARGEM_ENTRE_QUESTOES_PX = 16;
// Aumentamos o buffer para garantir que não haja sobreposição
const BUFFER_SEGURANCA_PX = 40; 

interface PaginacaoResult {
  paginas: Questao[][];
  MedidorDeAltura: ReactElement;
}

export const usePaginacao = (
  questoes: Questao[],
  headerRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>
): PaginacaoResult => {
  const [paginas, setPaginas] = useState<Questao[][]>([[]]);
  const refs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useLayoutEffect(() => {
    const calcularPaginas = () => {
      const allRefsReady = questoes.every(q => refs.current[q.id]);
      if (!questoes.length || !footerRef.current || !headerRef.current || !allRefsReady) {
        if (questoes.length > 0) {
            const timeoutId = setTimeout(calcularPaginas, 50);
            return () => clearTimeout(timeoutId);
        }
        // Se não há questões, define uma página em branco e para
        setPaginas([[]]);
        return;
      }

      const headerHeight = headerRef.current.offsetHeight;
      const footerHeight = footerRef.current.offsetHeight;

      const MAX_CONTENT_HEIGHT_PAG_1 = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX - headerHeight - footerHeight - BUFFER_SEGURANCA_PX;
      const MAX_CONTENT_HEIGHT_OUTRAS = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX - footerHeight - BUFFER_SEGURANCA_PX;

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
      
      if (novasPaginas.length === 0 && questoes.length > 0) {
        // Se há questões mas nenhuma página foi criada (ex: uma única questão muito grande),
        // garante que ela vá para a primeira página.
        setPaginas([questoes]);
      } else {
        setPaginas(novasPaginas);
      }
    };

    const timeoutId = setTimeout(calcularPaginas, 150);
    return () => clearTimeout(timeoutId);
  }, [questoes, headerRef, footerRef]);

  const MedidorDeAltura = (
    <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1, width: '18cm' }}>
      {questoes.map(q => (
        <div key={q.id} ref={el => { refs.current[q.id] = el; }}>
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