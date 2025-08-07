import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from '../types';
import { usePageScale } from '../hooks/usePageScale';
import { PaginaLayout } from './PaginaLayout';
import { useConfiguracao } from '../context/ConfiguracaoContext';

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
}: PreviewProps) {
  const { config } = useConfiguracao();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const scale = usePageScale(pageWrapperRef, pageContainerRef);

  const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);
  const templateStyles = config.templateStyles[template] || {};

  // Agrupa as questões por disciplina, se aplicável
  const questoesAgrupadas: Record<string, Questao[]> = paginaQuestoes.reduce((acc, questao) => {
    const key = questao.disciplina || 'default';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(questao);
    return acc;
  }, {} as Record<string, Questao[]>);


  const renderQuestao = (questao: Questao) => (
    <div key={questao.id} className="questao-preview-item" style={{ breakInside: 'avoid-column' }}>
      <div className="prose prose-sm max-w-none">
        <div className="font-semibold text-gray-900">Questão {questao.numero}</div>
        {questao.imagemUrl && <img src={questao.imagemUrl} alt={`Imagem da questão ${questao.numero}`} className="max-w-full h-auto my-2"/>}
        <div className="enunciado"><ReactMarkdown>{questao.enunciado}</ReactMarkdown></div>
        
        {questao.tipo === 'multipla-escolha' && questao.alternativas && (
          <ol type="a" className="list-[lower-alpha] pl-5 mt-2 space-y-1">
            {questao.alternativas.map(alt => <li key={alt.id}>{alt.texto}</li>)}
          </ol>
        )}

        {questao.tipo === 'dissertativa' && questao.linhasResposta && questao.linhasResposta > 0 && (
          <div className="mt-4">
            {Array.from({ length: questao.linhasResposta }).map((_, i) => (
              <div key={i} className="linhas-resposta"></div>
            ))}
          </div>
        )}

        {questao.tipo === 'verdadeiro-falso' && questao.afirmativas && (
           <ol className="list-none p-0 mt-2 space-y-2">
              {questao.afirmativas.map(af => (
                <li key={af.id} className="flex items-start">
                  <span className="mr-2 font-mono">( )</span>
                  <span>{af.texto}</span>
                </li>
              ))}
           </ol>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full">
      <div className="preview-container" ref={pageContainerRef}>
        <PaginaLayout
          ref={pageWrapperRef}
          cabecalhoProps={paginaAtual === 1 ? { template, disciplina, serie, turma } : undefined}
          rodapeProps={{ paginaAtual, totalPaginas }}
          style={{
            ...templateStyles,
            transform: `scale(${scale})`, transformOrigin: 'center center' 
          }}
        >
          <div className={usarDuasColunas ? 'page-content-duas-colunas' : ''}>
            {Object.entries(questoesAgrupadas).map(([nomeDisciplina, grupoQuestoes]) => (
                <div key={nomeDisciplina} style={{ breakInside: 'avoid-column' }}>
                  {nomeDisciplina !== 'default' && (
                    <h3 className="text-lg font-bold text-center my-4 py-2 border-y-2 border-black" style={{ columnSpan: 'all' }}>
                      {nomeDisciplina.toUpperCase()}
                    </h3>
                  )}
                  {grupoQuestoes.map(renderQuestao)}
                </div>
              ))}
          </div>
        </PaginaLayout>
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