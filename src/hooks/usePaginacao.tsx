import React, { useState, useLayoutEffect, useRef, ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types';

const PAGE_HEIGHT_PX = 1122.8; 
const PAGE_PADDING_Y_PX = 56.7 * 2;
const MARGEM_ENTRE_QUESTOES_PX = 16;
const BUFFER_SEGURANCA_PX = 40; 
const ALTURA_CABECALHO_DISCIPLINA_PX = 50; // Estimativa da altura do título da disciplina

// Tipos de templates que exigem contagem de páginas em múltiplos de 4
const TEMPLATES_ESPECIAIS = ['Simulado Enem', 'Simulado Tradicional', 'Simuladinho'];

interface PaginacaoResult {
  paginas: Questao[][];
  MedidorDeAltura: ReactElement;
}

export const usePaginacao = (
  questoes: Questao[],
  template: string,
  headerRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>
): PaginacaoResult => {
  const [paginas, setPaginas] = useState<Questao[][]>([[]]);
  const refs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useLayoutEffect(() => {
    const calcularPaginas = () => {
      const allRefsReady = questoes.every(q => refs.current[q.id]);
      if (!footerRef.current || !headerRef.current || (!allRefsReady && questoes.length > 0)) {
        const timeoutId = setTimeout(calcularPaginas, 50);
        return () => clearTimeout(timeoutId);
      }

      if (questoes.length === 0) {
        setPaginas(TEMPLATES_ESPECIAIS.includes(template) ? [[], [], [], []] : [[]]);
        return;
      }

      const headerHeight = headerRef.current.offsetHeight;
      const footerHeight = footerRef.current.offsetHeight;

      const MAX_CONTENT_HEIGHT_PAG_1 = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX - headerHeight - footerHeight - BUFFER_SEGURANCA_PX;
      const MAX_CONTENT_HEIGHT_OUTRAS = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX - footerHeight - BUFFER_SEGURANCA_PX;

      const novasPaginas: Questao[][] = [];
      let paginaAtual: Questao[] = [];
      let alturaAtual = 0;
      let disciplinaAtual: string | undefined = undefined;

      questoes.forEach(questao => {
        const questaoRef = refs.current[questao.id];
        if (!questaoRef) return;
        
        let alturaQuestao = questaoRef.offsetHeight + MARGEM_ENTRE_QUESTOES_PX;
        
        // Adiciona altura extra se for uma nova disciplina
        if (TEMPLATES_ESPECIAIS.includes(template) && questao.disciplina !== disciplinaAtual) {
            alturaQuestao += ALTURA_CABECALHO_DISCIPLINA_PX;
            disciplinaAtual = questao.disciplina;
        }

        const maxContentHeight = novasPaginas.length === 0 ? MAX_CONTENT_HEIGHT_PAG_1 : MAX_CONTENT_HEIGHT_OUTRAS;
        
        if (alturaAtual + alturaQuestao > maxContentHeight && paginaAtual.length > 0) {
          novasPaginas.push(paginaAtual);
          paginaAtual = [questao];
          alturaAtual = questaoRef.offsetHeight + MARGEM_ENTRE_QUESTOES_PX + (questao.disciplina ? ALTURA_CABECALHO_DISCIPLINA_PX : 0);
        } else {
          paginaAtual.push(questao);
          alturaAtual += alturaQuestao;
        }
      });

      if (paginaAtual.length > 0) {
        novasPaginas.push(paginaAtual);
      }

      // Lógica para múltiplos de 4 nos templates especiais
      if (TEMPLATES_ESPECIAIS.includes(template)) {
        const paginasDeConteudo = novasPaginas.length;
        // +2 para capa e fundo
        const paginasNecessarias = Math.ceil((paginasDeConteudo + 2) / 4) * 4;
        const paginasEmBranco = paginasNecessarias - paginasDeConteudo - 2;

        for (let i = 0; i < paginasEmBranco; i++) {
            novasPaginas.push([]); // Adiciona páginas em branco
        }
      }
      
      setPaginas(novasPaginas.length > 0 ? novasPaginas : [[]]);
    };

    const timeoutId = setTimeout(calcularPaginas, 150);
    return () => clearTimeout(timeoutId);
  }, [questoes, template, headerRef, footerRef]);

  // Medidor de Altura agora também renderiza o título da disciplina para cálculo correto
  const MedidorDeAltura = (
    <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1, width: '18cm' }}>
      {questoes.map((q, index) => {
        const disciplinaAnterior = index > 0 ? questoes[index-1].disciplina : undefined;
        const isNovaDisciplina = TEMPLATES_ESPECIAIS.includes(template) && q.disciplina !== disciplinaAnterior;

        return (
          <div key={q.id} ref={el => { refs.current[q.id] = el; }}>
            {isNovaDisciplina && <h3 className="text-lg font-bold text-center my-4 py-2 border-y-2 border-black">{q.disciplina}</h3>}
            <div className="prose prose-sm max-w-none">
              <div className="mb-4 questao-preview-item">
                <div className="font-semibold text-gray-900">Questão {q.numero}</div>
                {q.imagemUrl && <img src={q.imagemUrl} alt="medidor" className="max-w-full h-auto"/>}
                <div className="enunciado"><ReactMarkdown>{q.enunciado}</ReactMarkdown></div>

                {q.tipo === 'multipla-escolha' && q.alternativas && (
                  <ol type="a" className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                    {q.alternativas.map(alt => <li key={alt.id}>{alt.texto}</li>)}
                  </ol>
                )}
                 {q.tipo === 'dissertativa' && q.linhasResposta && q.linhasResposta > 0 && (
                  <div className="mt-4">
                      {Array.from({ length: q.linhasResposta }).map((_, i) => (
                        <div key={i} className="linhas-resposta"></div>
                      ))}
                  </div>
                )}
                {q.tipo === 'verdadeiro-falso' && q.afirmativas && (
                  <ol className="list-none p-0 mt-2 space-y-2">
                    {q.afirmativas.map(af => <li key={af.id}>( ) {af.texto}</li>)}
                  </ol>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );

  return { paginas, MedidorDeAltura };
};