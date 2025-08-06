import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
// import logoColegio from '../assets/logo.svg';
import { FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import { Questao } from '../types';
import { usePaginacao } from '../hooks/usePaginacao';
import { usePageScale } from '../hooks/usePageScale';

interface PreviewProps {
  questoes: Questao[];
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
  isPrinting?: boolean;
}

type CabecalhoProps = Omit<PreviewProps, 'questoes' | 'isPrinting'>;
type RodapeProps = { paginaAtual: number; totalPaginas: number };
type PaginaComponentProps = {
    questoes: Questao[];
    paginaInfo: { numero: number; total: number };
} & CabecalhoProps;

const Cabecalho = React.forwardRef<HTMLElement, CabecalhoProps>(
  ({ template, disciplina, serie, turma }, ref) => (
    <header ref={ref} className="border-b border-gray-300 pb-2 mb-4">
      <div className="flex justify-between items-center">
        {/* <img src={logoColegio} alt="Logo do Colégio" className="h-20 w-auto" /> */}
        <div className="text-right w-full">
          <h2 className="text-xl font-bold text-blue-700">{template}</h2>
          <p className="text-sm text-gray-600">{disciplina}</p>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-2 border-t pt-2">
        <span>Aluno(a): _________________________________________</span>
        <span>Série: {serie}</span>
        <span>Turma: {turma}</span>
        <span>Data: ____/____/______</span>
      </div>
    </header>
));

const Rodape = React.forwardRef<HTMLElement, RodapeProps>(
  ({ paginaAtual, totalPaginas }, ref) => (
    <footer ref={ref} className="border-t border-gray-300 pt-2 mt-auto text-center text-xs text-gray-500">
      <p>Nome do Colégio | Página {paginaAtual} de {totalPaginas}</p>
    </footer>
));

const PaginaComponent: React.FC<PaginaComponentProps> = ({ questoes, template, disciplina, serie, turma, paginaInfo }) => {
    const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);
    return (
      <div className="page flex flex-col bg-white shadow-lg p-[1.5cm] box-border text-[10pt]">
        {paginaInfo.numero === 1 && <Cabecalho template={template} disciplina={disciplina} serie={serie} turma={turma} />}
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
  <div className="page flex items-center justify-center text-center text-gray-500 bg-white shadow-lg">
    <div>
      <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
      <h3 className="font-semibold text-gray-700">Pré-visualização do Documento</h3>
      <p className="text-sm mt-1">O conteúdo aparecerá aqui.</p>
    </div>
  </div>
);

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

  const ControlesNavegacao = () => (
    <div className="flex items-center justify-center gap-4 p-2 bg-white rounded-lg shadow-md w-fit mx-auto">
      <button 
        onClick={() => setPaginaVisivel(p => Math.max(0, p - 1))} 
        disabled={paginaVisivel === 0}
        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      ><FiChevronLeft size={20} /></button>
      <span className="font-semibold text-gray-700 text-sm">Página {paginaVisivel + 1} de {paginas.length || 1}</span>
      <button 
        onClick={() => setPaginaVisivel(p => Math.min(paginas.length - 1, p + 1))} 
        disabled={!paginas.length || paginaVisivel >= paginas.length - 1}
        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      ><FiChevronRight size={20} /></button>
    </div>
  );
  
  if (isPrinting) {
    return (
      <>
        {paginas.map((paginaQuestoes, index) => (
          <div key={index} className="page-wrapper-print">
            <PaginaComponent 
              questoes={paginaQuestoes}
              template={template}
              disciplina={disciplina}
              serie={serie}
              turma={turma}
              paginaInfo={{ numero: index + 1, total: paginas.length }}
            />
          </div>
        ))}
      </>
    );
  }

  const paginaAtual = paginas[paginaVisivel] || [];

  return (
    <div className="flex flex-col h-full w-full">
      <div style={{ position: 'absolute', opacity: 0, zIndex: -1, width: '18cm' }}>
        <Cabecalho ref={headerRef} template={template} disciplina={disciplina} serie={serie} turma={turma} />
        <Rodape ref={footerRef} paginaAtual={1} totalPaginas={1} />
        {MedidorDeAltura}
      </div>

      <div className="preview-container flex justify-center items-center p-4 sm:p-8 bg-gray-200 rounded-lg overflow-hidden" ref={pageContainerRef}>
        <div 
          className="page-wrapper w-[21cm] h-[29.7cm] flex-shrink-0" 
          ref={pageWrapperRef} 
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        >
          {paginas.length > 0 ? (
            <PaginaComponent 
              questoes={paginaAtual}
              template={template}
              disciplina={disciplina}
              serie={serie}
              turma={turma}
              paginaInfo={{ numero: paginaVisivel + 1, total: paginas.length }}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      {(paginas.length > 1) && <div className="pt-4 flex-shrink-0"><ControlesNavegacao /></div>}
    </div>
  );
}

export default Preview;