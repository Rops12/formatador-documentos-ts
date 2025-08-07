import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types';
import { usePaginacao } from '../hooks/usePaginacao';
import { usePageScale } from '../hooks/usePageScale';
import { PaginaLayout } from './PaginaLayout'; // Importamos nosso novo layout

interface PreviewProps {
  questoes: Questao[];
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
  isPrinting?: boolean; // Adicionamos esta prop para o modo de geração de PDF
}

function Preview({ questoes, template, disciplina, serie, turma, isPrinting = false }: PreviewProps) {
  const [paginaVisivel, setPaginaVisivel] = useState(0);
  
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const scale = usePageScale(pageWrapperRef, pageContainerRef);

  const { paginas, MedidorDeAltura } = usePaginacao(questoes, headerRef, footerRef);

  const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);

  const renderPaginas = () => (
    paginas.map((paginaQuestoes, index) => (
      <PaginaLayout
        key={index}
        cabecalhoProps={index === 0 ? { template, disciplina, serie, turma } : undefined}
        rodapeProps={{ paginaAtual: index + 1, totalPaginas: paginas.length }}
      >
        <div className={usarDuasColunas ? 'page-content-duas-colunas' : ''}>
          {paginaQuestoes.map(questao => (
            <div key={questao.id} className="questao-preview-item">
              <div className="prose prose-sm max-w-none">
                <div className="font-semibold text-gray-900">Questão {questao.numero}</div>
                <div className="enunciado"><ReactMarkdown>{questao.enunciado}</ReactMarkdown></div>
                {questao.tipo === 'multipla-escolha' && questao.alternativas && (
                  <ol type="a" className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                    {questao.alternativas.map(alt => <li key={alt.id}>{alt.texto}</li>)}
                  </ol>
                )}
              </div>
            </div>
          ))}
        </div>
      </PaginaLayout>
    ))
  );

  if (isPrinting) {
    return <>{renderPaginas()}</>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Medidor de altura invisível para o hook usePaginacao */}
      {MedidorDeAltura}
      
      {/* Elementos invisíveis para medir o cabeçalho e rodapé */}
      <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1 }}>
          <header ref={headerRef} className="border-b border-gray-300 pb-2 mb-4 flex-shrink-0">Cabeçalho Teste</header>
          <footer ref={footerRef} className="border-t border-gray-300 pt-2 mt-auto text-xs text-gray-500 flex-shrink-0">Rodapé Teste</footer>
      </div>

      <div className="preview-container" ref={pageContainerRef}>
        <div ref={pageWrapperRef} style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          {paginas.length > 0 && renderPaginas()[paginaVisivel]}
        </div>
      </div>

      {paginas.length > 1 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          <button onClick={() => setPaginaVisivel(p => Math.max(0, p - 1))} disabled={paginaVisivel === 0} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">Anterior</button>
          <span>Página {paginaVisivel + 1} de {paginas.length}</span>
          <button onClick={() => setPaginaVisivel(p => Math.min(paginas.length - 1, p + 1))} disabled={paginaVisivel === paginas.length - 1} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">Próxima</button>
        </div>
      )}
    </div>
  );
}

export default Preview;