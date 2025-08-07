import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types';
import { usePageScale } from '../hooks/usePageScale';

interface PreviewProps {
  questoes: Questao[];
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
}

const Cabecalho: React.FC<Omit<PreviewProps, 'questoes'>> = ({ template, disciplina, serie, turma }) => (
    <header className="border-b border-gray-300 pb-2 mb-4">
      <div className="flex justify-between items-center">
        <div className="h-20 w-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">Logo</div>
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
);

// Rodapé estático para o preview
const RodapePreview = () => (
    <footer className="border-t border-gray-300 pt-2 mt-auto text-center text-xs text-gray-500">
      <p>Fim do documento</p>
    </footer>
);


function Preview({ questoes, template, disciplina, serie, turma }: PreviewProps) {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const scale = usePageScale(pageWrapperRef, pageContainerRef);

  const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);

  return (
    <div className="flex flex-col h-full w-full">
      <div 
        className="preview-container bg-gray-200 rounded-lg overflow-hidden" 
        ref={pageContainerRef}
      >
        <div 
          className="page-wrapper w-[21cm] h-[29.7cm] flex-shrink-0 overflow-auto" // A rolagem vai aqui!
          ref={pageWrapperRef} 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'center center',
          }}
        >
          <div className="page bg-white shadow-lg p-[1.5cm] box-border text-[10pt]">
            <Cabecalho template={template} disciplina={disciplina} serie={serie} turma={turma} />
            <main className={`flex-grow ${usarDuasColunas ? 'page-content-duas-colunas' : ''}`}>
              {questoes.length > 0 ? questoes.map(questao => (
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
              )) : (
                <div className="flex items-center justify-center text-center text-gray-500 h-64">
                    <div>
                        <h3 className="font-semibold text-gray-700">Pré-visualização do Documento</h3>
                        <p className="text-sm mt-1">As questões aparecerão aqui.</p>
                    </div>
                </div>
              )}
            </main>
             {questoes.length > 0 && <RodapePreview />}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        O preview agora é rolável para refletir fielmente o conteúdo do PDF.
      </p>
    </div>
  );
}

export default Preview;