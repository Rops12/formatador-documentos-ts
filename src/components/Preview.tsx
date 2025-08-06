import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import { Questao } from '../types';
import { usePaginacao } from '../hooks/usePaginacao';
import { usePageScale } from '../hooks/usePageScale';

// 1. Tipagem das props do Preview
interface PreviewProps {
  questoes: Questao[];
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
  isPrinting?: boolean; // Opcional, para a geração do PDF
}

// -- Componentes Internos --

const Cabecalho = React.forwardRef<HTMLElement, Omit<PreviewProps, 'questoes'>>(({ template, disciplina, serie, turma }, ref) => (
    <header ref={ref} className="border-b border-gray-300 pb-2 mb-4">
      {/* ... JSX do cabeçalho ... (copie do arquivo original se necessário) */}
    </header>
  ));
  
const Rodape = React.forwardRef<HTMLElement, { paginaAtual: number; totalPaginas: number }>(({ paginaAtual, totalPaginas }, ref) => (
    <footer ref={ref} className="border-t border-gray-300 pt-2 mt-auto text-center text-xs text-gray-500">
      <p>Nome do Colégio | Página {paginaAtual} de {totalPaginas}</p>
    </footer>
));
  
const PaginaComponent: React.FC<{
    questoes: Questao[];
    template: string;
    paginaInfo: { numero: number; total: number };
  }> = ({ questoes, template, paginaInfo }) => {
    const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);
    return (
      <div className="page flex flex-col">
        {/* Cabeçalho e Rodapé são renderizados aqui, mas os refs são gerenciados pelo Preview */}
        {paginaInfo.numero === 1 && <Cabecalho template={template} disciplina={""} serie={""} turma={""} />}
        <main className={`flex-grow overflow-hidden ${usarDuasColunas ? 'page-content-duas-colunas' : ''}`}>
          {questoes.map(questao => (
            <div key={questao.id} className="mb-4 questao-preview-item">
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
        </main>
        <Rodape paginaAtual={paginaInfo.numero} totalPaginas={paginaInfo.total} />
      </div>
    );
};

const EmptyState: React.FC = () => (
  <div className="page flex items-center justify-center text-center text-gray-500">
    <div>
      <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
      <h3 className="font-semibold text-gray-700">Pré-visualização do Documento</h3>
      <p className="text-sm mt-1">O conteúdo aparecerá aqui.</p>
    </div>
  </div>
);

// --- Componente Principal ---

function Preview({ questoes, template, disciplina, serie, turma, isPrinting = false }: PreviewProps) {
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const { paginas, MedidorDeAltura } = usePaginacao(questoes, headerRef, footerRef);
  const [paginaVisivel, setPaginaVisivel] = useState(0);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const scale = usePageScale(pageWrapperRef, pageContainerRef);

  useEffect(() => {
    if (paginaVisivel >= paginas.length && paginas.length > 0) {
      setPaginaVisivel(paginas.length - 1);
    } else if (paginas.length === 0 && paginaVisivel !== 0) {
      setPaginaVisivel(0);
    }
  }, [paginas, paginaVisivel]);

  // Se for para impressão, renderiza todas as páginas
  if (isPrinting) {
    // ... (lógica de impressão)
  }

  const paginaAtual = paginas[paginaVisivel] || [];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Medidores ocultos */}
      <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1, width: '18cm' }}>
        <Cabecalho ref={headerRef} template={template} disciplina={disciplina} serie={serie} turma={turma} />
        <Rodape ref={footerRef} paginaAtual={1} totalPaginas={1} />
        {MedidorDeAltura}
      </div>

      <div className="preview-container" ref={pageContainerRef}>
        <div className="page-wrapper" ref={pageWrapperRef} style={{ transform: `scale(${scale})`}}>
          {paginas.length > 0 ? (
            <PaginaComponent
              questoes={paginaAtual}
              template={template}
              paginaInfo={{ numero: paginaVisivel + 1, total: paginas.length }}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
       {/* ... (Controles de navegação) ... */}
    </div>
  );
}

export default Preview;