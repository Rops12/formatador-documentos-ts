// src/workspaces/SimuladoCreator.tsx

import React, { useState, useRef, useMemo, Fragment } from 'react';
import { Questao } from '../types';
import QuestaoEditor from '../components/QuestaoEditor';
import Preview from '../components/Preview';
import { PaginaLayout, Rodape } from '../components/PaginaLayout';
import { usePaginacao } from '../hooks/usePaginacao';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FiPlus, FiX } from 'react-icons/fi';

import { useConfiguracao } from '../context/ConfiguracaoContext';
import ReactMarkdown from 'react-markdown';

const templatesDisponiveis = ['Simulado Enem', 'Simulado Tradicional', 'Simuladinho'];
const novaQuestaoMultiplaEscolha = (numero: number, disciplina: string): Questao => ({ id: Date.now() + Math.random(), numero, tipo: 'multipla-escolha', disciplina, enunciado: `Enunciado da múltipla escolha nº ${numero}.`, alternativas: [{ id: Date.now() + numero + 1, texto: 'Alternativa A' }, { id: Date.now() + numero + 2, texto: 'Alternativa B' }], respostaCorreta: Date.now() + numero + 1 });
const novaQuestaoDissertativa = (numero: number, disciplina: string): Questao => ({ id: Date.now() + Math.random(), numero, tipo: 'dissertativa', disciplina, enunciado: `Enunciado da questão dissertativa nº ${numero}.`, linhasResposta: 5 });
const novaQuestaoVerdadeiroFalso = (numero: number, disciplina: string): Questao => ({ id: Date.now() + Math.random(), numero, tipo: 'verdadeiro-falso', disciplina, enunciado: `Julgue os itens a seguir como verdadeiros (V) ou falsos (F).`, afirmativas: [{ id: Date.now() + numero + 1, texto: 'Primeira afirmativa.', correta: true }] });

interface SimuladoCreatorProps {
  onVoltar: () => void;
}

function SimuladoCreator({ onVoltar }: SimuladoCreatorProps) {
  const { config } = useConfiguracao();
  const { disciplinas: disciplinasDisponiveis, series: seriesDisponiveis, turmas: turmasDisponiveis } = config;

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [serie, setSerie] = useState<string>(seriesDisponiveis[0]);
  const [turma, setTurma] = useState<string>(turmasDisponiveis[0]);
  const [template, setTemplate] = useState<string>(templatesDisponiveis[0]);
  
  const [disciplinasSimulado, setDisciplinasSimulado] = useState<string[]>([]);
  const [disciplinaAtiva, setDisciplinaAtiva] = useState<string | null>(null);
  
  const [idQuestaoEditando, setIdQuestaoEditando] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [paginaVisivel, setPaginaVisivel] = useState(0);

  const questoesParaPaginacao = useMemo(() => {
    const questoesFiltradas = questoes.filter(q => disciplinasSimulado.includes(q.disciplina || ''));
    
    // Ordena primeiro pela ordem das abas de disciplina, depois pela ordem original
    const questoesOrdenadas = [...questoesFiltradas].sort((a, b) => {
      const indexA = disciplinasSimulado.indexOf(a.disciplina || '');
      const indexB = disciplinasSimulado.indexOf(b.disciplina || '');
      if (indexA !== indexB) return indexA - indexB;
      
      const ordemOriginalA = questoes.findIndex(q => q.id === a.id);
      const ordemOriginalB = questoes.findIndex(q => q.id === b.id);
      return ordemOriginalA - ordemOriginalB;
    });
    
    // Renumera todas as questões na ordem final
    return questoesOrdenadas.map((q, i) => ({ ...q, numero: i + 1 }));
  }, [questoes, disciplinasSimulado]);

  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const { paginas, MedidorDeAltura } = usePaginacao(questoesParaPaginacao, template, headerRef, footerRef);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleAdicionarQuestao = (tipo: Questao['tipo']) => {
    if (!disciplinaAtiva) return;
    const proximoNumero = questoes.length + 1;
    let novaQuestao: Questao;
    if (tipo === 'multipla-escolha') novaQuestao = novaQuestaoMultiplaEscolha(proximoNumero, disciplinaAtiva);
    else if (tipo === 'dissertativa') novaQuestao = novaQuestaoDissertativa(proximoNumero, disciplinaAtiva);
    else novaQuestao = novaQuestaoVerdadeiroFalso(proximoNumero, disciplinaAtiva);
    setQuestoes(prev => [...prev, novaQuestao]);
    setIdQuestaoEditando(novaQuestao.id);
  };
  
  const handleExcluirQuestao = (id: number) => setQuestoes(questoes.filter(q => q.id !== id));
  const handleSalvarEdicao = (id: number, novosDados: Questao) => {
    setQuestoes(prev => prev.map(q => (q.id === id ? novosDados : q)));
    setIdQuestaoEditando(null);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questoes.findIndex(item => item.id === active.id);
      const newIndex = questoes.findIndex(item => item.id === over.id);
      setQuestoes(arrayMove(questoes, oldIndex, newIndex));
    }
  };
  
  const handleAdicionarDisciplina = (disciplinaParaAdd: string) => {
    if (disciplinaParaAdd && !disciplinasSimulado.includes(disciplinaParaAdd)) {
      const novasDisciplinas = [...disciplinasSimulado, disciplinaParaAdd];
      setDisciplinasSimulado(novasDisciplinas);
      setDisciplinaAtiva(disciplinaParaAdd);
    }
  };

  const handleRemoverDisciplina = (disciplinaParaRemover: string) => {
    setDisciplinasSimulado(disciplinasSimulado.filter(d => d !== disciplinaParaRemover));
    setQuestoes(questoes.filter(q => q.disciplina !== disciplinaParaRemover));
    if (disciplinaAtiva === disciplinaParaRemover) {
      setDisciplinaAtiva(disciplinasSimulado[0] || null);
    }
  };
  
  const handleGerarPDF = async () => {
    if (paginas.length === 0) return;
    setIsGeneratingPdf(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    const container = document.getElementById('pdf-render-container-simulado');
    if (!container) { setIsGeneratingPdf(false); return; }

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const pagesToRender = container.querySelectorAll('.page-wrapper-print');
    
    for (let i = 0; i < pagesToRender.length; i++) {
      const pageElement = pagesToRender[i] as HTMLElement;
      const canvas = await html2canvas(pageElement, { scale: 2, useCORS: true, logging: false });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
    
    pdf.save(`${template}-${serie}${turma}.pdf`);
    setIsGeneratingPdf(false);
  };
  
  const questoesVisiveisNoEditor = useMemo(() => 
    questoes.filter(q => q.disciplina === disciplinaAtiva),
    [questoes, disciplinaAtiva]
  );
  
  const totalPaginasConteudo = paginas.length;
  const totalPaginasFinal = totalPaginasConteudo > 0 ? totalPaginasConteudo + 2 : 0;
  const paginaAtualQuestoes = paginas[paginaVisivel] || [];

  return (
    <>
      {MedidorDeAltura}
      <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -10, opacity: 0 }}><div ref={footerRef}><Rodape paginaAtual={1} totalPaginas={1} /></div></div>
      
      <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
         <header className="max-w-screen-2xl mx-auto mb-4 flex justify-end">
            <button onClick={onVoltar} className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors">
              Voltar
            </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-screen-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
            <div className="p-6 lg:p-8">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Construtor de Simulado</h1>
                <p className="text-gray-500 mt-2">Adicione disciplinas e questões para montar seu simulado.</p>
              </header>

              <div className="mb-8"><h2 className="text-lg font-semibold text-gray-700 mb-3">Modelo</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{templatesDisponiveis.map(nome => <button key={nome} onClick={() => setTemplate(nome)} className={`w-full text-left p-3 rounded-lg transition-colors duration-200 text-sm ${template === nome ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><span>{nome}</span></button>)}</div></div>

              <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Disciplinas</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {disciplinasSimulado.map(disc => (
                    <div key={disc} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full cursor-pointer ${disciplinaAtiva === disc ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-100'}`} onClick={() => setDisciplinaAtiva(disc)}>
                      <span>{disc}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoverDisciplina(disc); }} className="text-xs hover:text-red-500 rounded-full p-1 -mr-2"><FiX /></button>
                    </div>
                  ))}
                  <select onChange={(e) => handleAdicionarDisciplina(e.target.value)} value="" className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm appearance-none text-gray-600">
                    <option value="" disabled>+ Adicionar Disciplina</option>
                    {disciplinasDisponiveis.filter(d => !disciplinasSimulado.includes(d)).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><label htmlFor="serie-simulado" className="block text-sm font-medium text-gray-600">Série</label><select id="serie-simulado" value={serie} onChange={e => setSerie(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">{seriesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label htmlFor="turma-simulado" className="block text-sm font-medium text-gray-600">Turma</label><select id="turma-simulado" value={turma} onChange={e => setTurma(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">{turmasDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
              </div>
              
              {disciplinaAtiva ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Questões de {disciplinaAtiva}</h2>
                  <SortableContext items={questoesVisiveisNoEditor.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {questoesVisiveisNoEditor.map((questao) => (
                      <QuestaoEditor key={questao.id} questao={questao} onExcluir={handleExcluirQuestao} idQuestaoEditando={idQuestaoEditando} onIniciarEdicao={setIdQuestaoEditando} onSalvarEdicao={handleSalvarEdicao} />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-gray-500">Selecione ou adicione uma disciplina para começar a inserir questões.</div>
              )}
            </div>
            
            <div className="mt-auto border-t p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => handleAdicionarQuestao('dissertativa')} disabled={!disciplinaAtiva} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">+ Dissertativa</button>
                <button onClick={() => handleAdicionarQuestao('multipla-escolha')} disabled={!disciplinaAtiva} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">+ Múltipla Escolha</button>
                <button onClick={() => handleAdicionarQuestao('verdadeiro-falso')} disabled={!disciplinaAtiva} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">+ V ou F</button>
              </div>
              <button onClick={handleGerarPDF} disabled={isGeneratingPdf || questoes.length === 0} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:bg-blue-400">{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}</button>
            </div>
          </div>

          <div className="sticky top-8 h-fit">
            <Preview paginaQuestoes={paginaAtualQuestoes} paginaAtual={paginaVisivel + 1} totalPaginas={totalPaginasFinal} onAnterior={() => setPaginaVisivel(p => Math.max(0, p - 1))} onProxima={() => setPaginaVisivel(p => Math.min(totalPaginasConteudo > 0 ? totalPaginasConteudo - 1 : 0, p + 1))} template={template} disciplina="Simulado" serie={serie} turma={turma} />
          </div>
        </div>
      </div>
       
      {isGeneratingPdf && (
        <div id="pdf-render-container-simulado" className="absolute top-0 left-0" style={{ zIndex: -10, opacity: 0 }}>
           {/* Capa */}
           <PaginaLayout rodapeProps={{ paginaAtual: 1, totalPaginas: totalPaginasFinal }} className="page-capa">
              <h1 className="text-4xl font-bold">{template}</h1>
              <h2 className="text-2xl mt-4">Simulado Multidisciplinar</h2>
              <div className="mt-12 text-lg"><p>Série: {serie}</p><p>Turma: {turma}</p></div>
           </PaginaLayout>

           {/* Páginas de Conteúdo */}
           {paginas.map((paginaQuestoes, index) => {
              const questoesAgrupadas: Record<string, Questao[]> = paginaQuestoes.reduce((acc, questao) => {
                const key = questao.disciplina || 'default';
                if (!acc[key]) acc[key] = [];
                acc[key].push(questao);
                return acc;
              }, {} as Record<string, Questao[]>);

              return (
                <PaginaLayout key={index} rodapeProps={{ paginaAtual: index + 2, totalPaginas: totalPaginasFinal }}>
                  <div className="page-content-duas-colunas">
                    {Object.entries(questoesAgrupadas).map(([nomeDisciplina, grupoQuestoes], idx) => {
                      const disciplinaAnterior = index > 0 ? paginas[index - 1][paginas[index - 1].length - 1]?.disciplina : undefined;
                      const precisaTitulo = nomeDisciplina !== 'default' && (idx === 0 ? nomeDisciplina !== disciplinaAnterior : true);
                      
                      return (
                        <Fragment key={nomeDisciplina}>
                          {precisaTitulo && <h3 className="text-lg font-bold text-center my-4 py-2 border-y-2 border-black" style={{ columnSpan: 'all', breakBefore: idx > 0 ? 'column' : 'auto' }}>{nomeDisciplina.toUpperCase()}</h3>}
                          {grupoQuestoes.map(questao => (
                             <div key={questao.id} className="questao-preview-item" style={{ breakInside: 'avoid-column' }}>
                                <div className="prose prose-sm max-w-none">
                                  <div className="font-semibold text-gray-900">Questão {questao.numero}</div>
                                  {questao.imagemUrl && <img src={questao.imagemUrl} alt={`Imagem da questão ${questao.numero}`} className="max-w-full h-auto my-2"/>}
                                  <div className="enunciado"><ReactMarkdown>{questao.enunciado}</ReactMarkdown></div>
                                  {questao.tipo === 'multipla-escolha' && questao.alternativas && ( <ol type="a" className="list-[lower-alpha] pl-5 mt-2 space-y-1">{questao.alternativas.map(alt => <li key={alt.id}>{alt.texto}</li>)}</ol>)}
                                  {questao.tipo === 'dissertativa' && questao.linhasResposta && questao.linhasResposta > 0 && (<div className="mt-4">{Array.from({ length: questao.linhasResposta }).map((_, i) => (<div key={i} className="linhas-resposta"></div>))}</div>)}
                                  {questao.tipo === 'verdadeiro-falso' && questao.afirmativas && (<ol className="list-none p-0 mt-2 space-y-2">{questao.afirmativas.map(af => (<li key={af.id} className="flex items-start"><span className="mr-2 font-mono">( )</span><span>{af.texto}</span></li>))}</ol>)}
                                </div>
                            </div>
                          ))}
                        </Fragment>
                      )
                    })}
                  </div>
                </PaginaLayout>
              )
           })}

           {/* Fundo */}
           <PaginaLayout rodapeProps={{ paginaAtual: totalPaginasFinal, totalPaginas: totalPaginasFinal }} className="page-fundo">
              <div className="h-20 w-20 mb-8">{config.logoUrl && <img src={config.logoUrl} alt="Logo"/>}</div>
              <h2 className="text-2xl">BOA PROVA!</h2>
           </PaginaLayout>
        </div>
      )}
    </>
  );
}

export default SimuladoCreator;