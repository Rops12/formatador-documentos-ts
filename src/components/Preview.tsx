import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types';
import { usePageScale } from '../hooks/usePageScale';
import { PaginaLayout } from './PaginaLayout';
import { useConfiguracao } from '../context/ConfiguracaoContext'; // Certifique-se que o caminho está correto

interface PreviewProps {
  paginaQuestoes: Questao[];
  paginaAtual: number;
  totalPaginas: number;
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
  onAnterior: () => void;
  onProxima: () => void;
  isPrinting?: boolean;
}

function Preview({
  paginaQuestoes,
  paginaAtual,
  totalPaginas,
  template,
  disciplina,
  serie,
  turma,
  onAnterior,
  onProxima,
  isPrinting = false,
}: PreviewProps) {
  const { config } = useConfiguracao();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const scale = usePageScale(pageWrapperRef, pageContainerRef);

  const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);
  
  // Busca os estilos para o template atual ou usa um objeto vazio como fallback
  const templateStyles = config.templateStyles[template] || {};

  const paginaParaRenderizar = (
    <PaginaLayout
      ref={pageWrapperRef}
      cabecalhoProps={paginaAtual === 1 ? { template, disciplina, serie, turma } : undefined}
      rodapeProps={{ paginaAtual, totalPaginas }}
      // Aplica os estilos dinâmicos vindos do contexto
      style={{
        ...templateStyles,
        ...(isPrinting ? {} : { transform: `scale(${scale})`, transformOrigin: 'center center' })
      }}
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
  );

  if (isPrinting) {
    return paginaParaRenderizar;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="preview-container" ref={pageContainerRef}>
        {paginaParaRenderizar}
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          <button onClick={onAnterior} disabled={paginaAtual === 1} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">Anterior</button>
          <span>Página {paginaAtual} de {totalPaginas}</span>
          <button onClick={onProxima} disabled={paginaAtual === totalPaginas} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">Próxima</button>
        </div>
      )}
    </div>
  );
}

export default Preview;