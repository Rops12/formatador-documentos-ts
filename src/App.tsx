import React, { useState, useRef, useEffect, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import { Questao } from './types';
import QuestaoEditor from './components/QuestaoEditor';
import Preview from './components/Preview';
import { PaginaLayout, Cabecalho, Rodape } from './components/PaginaLayout';
import { usePaginacao } from './hooks/usePaginacao';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { useConfiguracao } from './context/ConfiguracaoContext';
import ConfiguracaoPainel from './components/configuracao/ConfiguracaoPainel';

// --- Constantes e Funções Auxiliares ---
const TEMPLATES_SIMULADO = ['Simulado Enem', 'Simulado Tradicional', 'Simuladinho'];
const templatesDisponiveis = ['Prova Global', 'Microteste', 'Atividade', ...TEMPLATES_SIMULADO];

const novaQuestaoBase = (numero: number, disciplina?: string): Omit<Questao, 'tipo' | 'enunciado'> => ({ id: Date.now() + Math.random(), numero, disciplina });
const novaQuestaoDissertativa = (numero: number, disciplina?: string): Questao => ({ ...novaQuestaoBase(numero, disciplina), tipo: 'dissertativa', enunciado: `Enunciado da questão dissertativa nº ${numero}.`, linhasResposta: 5 });
const novaQuestaoMultiplaEscolha = (numero: number, disciplina?: string): Questao => ({ ...novaQuestaoBase(numero, disciplina), tipo: 'multipla-escolha', enunciado: `Enunciado da múltipla escolha nº ${numero}.`, alternativas: [{ id: Date.now() + numero + 1, texto: 'Alternativa A' }, { id: Date.now() + numero + 2, texto: 'Alternativa B' }], respostaCorreta: Date.now() + numero + 1 });
const novaQuestaoVerdadeiroFalso = (numero: number, disciplina?: string): Questao => ({ ...novaQuestaoBase(numero, disciplina), tipo: 'verdadeiro-falso', enunciado: `Julgue os itens a seguir como verdadeiros (V) ou falsos (F).`, afirmativas: [{ id: Date.now() + numero + 1, texto: 'Primeira afirmativa.', correta: true }] });


function App() {
  const [isConfigMode, setIsConfigMode] = useState<boolean>(false);
  const { config } = useConfiguracao();
  const { disciplinas: disciplinasDisponiveis, series: seriesDisponiveis, turmas: turmasDisponiveis } = config;

  const [questoes, setQuestoes] = useState<Questao[]>([novaQuestaoMultiplaEscolha(1)]);
  const [disciplina, setDisciplina] = useState<string>(disciplinasDisponiveis[0]);
  const [serie, setSerie] = useState<string>(seriesDisponiveis[0]);
  const [turma, setTurma] = useState<string>(turmasDisponiveis[0]);
  const [template, setTemplate] = useState<string>(templatesDisponiveis[0]);

  // --- Estado específico para simulados ---
  const [disciplinasSimulado, setDisciplinasSimulado] = useState<string[]>(['Linguagens e Códigos']);
  const [disciplinaSimuladoAtual, setDisciplinaSimuladoAtual] = useState<string>('Linguagens e Códigos');
  
  const [idQuestaoEditando, setIdQuestaoEditando] = useState<number | null>(questoes[0].id);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [paginaVisivel, setPaginaVisivel] = useState(0);

  const isSimulado = TEMPLATES_SIMULADO.includes(template);

  // Efeitos para atualizar o estado local se os dados do contexto mudarem
  useEffect(() => {
    if (!disciplinasDisponiveis.includes(disciplina)) setDisciplina(disciplinasDisponiveis[0] || '');
  }, [disciplina, disciplinasDisponiveis]);

  useEffect(() => {
    if (!seriesDisponiveis.includes(serie)) setSerie(seriesDisponiveis[0] || '');
  }, [serie, seriesDisponiveis]);

  useEffect(() => {
    if (!turmasDisponiveis.includes(turma)) setTurma(turmasDisponiveis[0] || '');
  }, [turma, turmasDisponiveis]);

  // Ordena as questões por disciplina apenas para simulados, antes de passar para o hook de paginação
  const questoesParaPaginacao = React.useMemo(() => {
    if (isSimulado) {
      // Agrupa por disciplina
      const grouped = questoes.reduce((acc, q) => {
        const key = q.disciplina || 'Sem Disciplina';
        if (!acc[key]) acc[key] = [];
        acc[key].push(q);
        return acc;
      }, {} as Record<string, Questao[]>);
      
      // Ordena as chaves (disciplinas) com base na ordem de `disciplinasSimulado`
      const orderedDisciplinas = disciplinasSimulado.filter(d => grouped[d]);
      
      // Remonta o array de questões na ordem correta
      return orderedDisciplinas.flatMap(d => grouped[d]).map((q, i) => ({ ...q, numero: i + 1 }));
    }
    return questoes.map((q, i) => ({ ...q, numero: i + 1 }));
  }, [questoes, isSimulado, disciplinasSimulado]);

  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const { paginas, MedidorDeAltura } = usePaginacao(questoesParaPaginacao, template, headerRef, footerRef);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleAdicionarQuestao = (tipo: Questao['tipo']) => {
    const proximoNumero = questoes.length + 1;
    const disciplinaDaQuestao = isSimulado ? disciplinaSimuladoAtual : undefined;
    
    let novaQuestao: Questao;
    if (tipo === 'multipla-escolha') novaQuestao = novaQuestaoMultiplaEscolha(proximoNumero, disciplinaDaQuestao);
    else if (tipo === 'dissertativa') novaQuestao = novaQuestaoDissertativa(proximoNumero, disciplinaDaQuestao);
    else novaQuestao = novaQuestaoVerdadeiroFalso(proximoNumero, disciplinaDaQuestao);
    
    setQuestoes(prev => [...prev, novaQuestao]);
    setIdQuestaoEditando(novaQuestao.id);
  };
  
  const handleExcluirQuestao = (id: number) => {
    setQuestoes(questoes.filter(q => q.id !== id));
  };
  
  const handleSalvarEdicao = (id: number, novosDados: Questao) => {
    setQuestoes(prev => prev.map(q => (q.id === id ? novosDados : q)));
    setIdQuestaoEditando(null);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestoes((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleGerarPDF = async () => {
    if (paginas.length === 0) return;
    setIsGeneratingPdf(true);
  
    await new Promise(resolve => setTimeout(resolve, 100));
  
    const container = document.getElementById('pdf-render-container');
    if (!container) {
      setIsGeneratingPdf(false);
      return;
    }
  
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const pagesToRender = container.querySelectorAll('.page-wrapper-print');
  
    if (pagesToRender.length === 0) {
      setIsGeneratingPdf(false);
      return;
    }
  
    for (let i = 0; i < pagesToRender.length; i++) {
      const pageElement = pagesToRender[i] as HTMLElement;
      const canvas = await html2canvas(pageElement, { scale: 2, useCORS: true, logging: false });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
  
    pdf.save(`${template}-${disciplina}-${serie}${turma}.pdf`);
    setIsGeneratingPdf(false);
  };

  const TemplateButton = ({ nome }: { nome: string }) => (
    <button onClick={() => setTemplate(nome)} className={`w-full text-left p-3 rounded-lg transition-colors duration-200 text-sm ${template === nome ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
      <span>{nome}</span>
    </button>
  );

  const totalPaginasConteudo = paginas.length;
  const totalPaginasFinal = isSimulado ? totalPaginasConteudo + 2 : totalPaginasConteudo;
  const paginaAtualDisplay = isSimulado ? paginaVisivel + 1 : paginaVisivel + 1;
  const paginaAtualQuestoes = paginas[paginaVisivel] || [];

  if (isConfigMode) {
    return <ConfiguracaoPainel onVoltar={() => setIsConfigMode(false)} />;
  }

  return (
    <>
      {MedidorDeAltura}
      <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1, width: '21cm' }}>
        <div ref={headerRef}><Cabecalho template={template} disciplina={disciplina} serie={serie} turma={turma} /></div>
        <div ref={footerRef}><Rodape paginaAtual={1} totalPaginas={1} /></div>
      </div>

      <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 print:hidden">
        <header className="max-w-screen-2xl mx-auto mb-4 flex justify-end">
            <button 
              onClick={() => setIsConfigMode(true)}
              className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Configurações
            </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-screen-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
            <div className="p-6 lg:p-8">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Construtor de Avaliações</h1>
                <p className="text-gray-500 mt-2">Adicione, edite e reordene as suas questões.</p>
              </header>

              {!isSimulado && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Informações do Cabeçalho</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label htmlFor="disciplina" className="block text-sm font-medium text-gray-600">Disciplina</label><select id="disciplina" value={disciplina} onChange={e => setDisciplina(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">{disciplinasDisponiveis.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label htmlFor="serie" className="block text-sm font-medium text-gray-600">Série</label><select id="serie" value={serie} onChange={e => setSerie(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">{seriesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label htmlFor="turma" className="block text-sm font-medium text-gray-600">Turma</label><select id="turma" value={turma} onChange={e => setTurma(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">{turmasDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                </div>
              )}

              <div className="mb-8"><h2 className="text-lg font-semibold text-gray-700 mb-3">Selecione o Modelo</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{templatesDisponiveis.map(nome => <TemplateButton key={nome} nome={nome} />)}</div></div>
              
              {isSimulado && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Adicionar Questão na Disciplina:</h2>
                   <select id="disciplina-simulado" value={disciplinaSimuladoAtual} onChange={e => setDisciplinaSimuladoAtual(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                      {disciplinasDisponiveis.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                </div>
              )}
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Questões {isSimulado ? `(${disciplinaSimuladoAtual})` : ''}</h2>
                <SortableContext items={questoes.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  {questoesParaPaginacao.map((questao) => (
                    <QuestaoEditor key={questao.id} questao={questao} onExcluir={handleExcluirQuestao} idQuestaoEditando={idQuestaoEditando} onIniciarEdicao={setIdQuestaoEditando} onSalvarEdicao={handleSalvarEdicao} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <div className="mt-auto border-t p-6 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => handleAdicionarQuestao('dissertativa')} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm">+ Dissertativa</button>
                  <button onClick={() => handleAdicionarQuestao('multipla-escolha')} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm">+ Múltipla Escolha</button>
                  <button onClick={() => handleAdicionarQuestao('verdadeiro-falso')} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm">+ V ou F</button>
               </div>
              <button onClick={handleGerarPDF} disabled={isGeneratingPdf || questoes.length === 0} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:bg-blue-400">
                <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}</span>
              </button>
            </div>
          </div>
          <div className="sticky top-8 h-fit">
            <Preview
              paginaQuestoes={paginaAtualQuestoes}
              paginaAtual={paginaAtualDisplay}
              totalPaginas={totalPaginasFinal}
              onAnterior={() => setPaginaVisivel(p => Math.max(0, p - 1))}
              onProxima={() => setPaginaVisivel(p => Math.min(totalPaginasConteudo - 1, p + 1))}
              template={template}
              disciplina={disciplina}
              serie={serie}
              turma={turma}
            />
          </div>
        </div>
      </div>
      
      {isGeneratingPdf && (
        <div id="pdf-render-container" className="absolute top-0 left-0" style={{ zIndex: -10, opacity: 0 }}>
           {isSimulado && (
              <PaginaLayout rodapeProps={{ paginaAtual: 1, totalPaginas: totalPaginasFinal }} className="page-capa">
                  <h1 className="text-4xl font-bold">{template}</h1>
                  <h2 className="text-2xl mt-4">Simulado Multidisciplinar</h2>
                  <div className="mt-12 text-lg">
                      <p>Série: {serie}</p>
                      <p>Turma: {turma}</p>
                  </div>
              </PaginaLayout>
           )}

           {paginas.map((paginaQuestoes, index) => {
              const questoesAgrupadas: Record<string, Questao[]> = paginaQuestoes.reduce((acc, questao) => {
                const key = questao.disciplina || 'default';
                if (!acc[key]) acc[key] = [];
                acc[key].push(questao);
                return acc;
              }, {} as Record<string, Questao[]>);

              return (
                <PaginaLayout
                  key={index}
                  cabecalhoProps={!isSimulado ? { template, disciplina, serie, turma } : undefined}
                  rodapeProps={{ paginaAtual: isSimulado ? index + 2 : index + 1, totalPaginas: totalPaginasFinal }}
                >
                  <div className={TEMPLATES_SIMULADO.includes(template) ? 'page-content-duas-colunas' : ''}>
                    {Object.entries(questoesAgrupadas).map(([nomeDisciplina, grupoQuestoes], idx, arr) => {
                      const disciplinaAnteriorPrimeiraQuestao = index > 0 ? paginas[index - 1][paginas[index - 1].length - 1]?.disciplina : undefined;
                      const precisaTitulo = nomeDisciplina !== 'default' && (idx === 0 ? nomeDisciplina !== disciplinaAnteriorPrimeiraQuestao : true);

                      return (
                        <Fragment key={nomeDisciplina}>
                          {precisaTitulo && (
                            <h3 className="text-lg font-bold text-center my-4 py-2 border-y-2 border-black" style={{ columnSpan: 'all', breakBefore: idx > 0 ? 'column' : 'auto' }}>
                              {nomeDisciplina.toUpperCase()}
                            </h3>
                          )}
                          {grupoQuestoes.map(questao => (
                            <div key={questao.id} className="questao-preview-item" style={{ breakInside: 'avoid-column' }}>
                               <div className="prose prose-sm max-w-none">
                                <div className="font-semibold text-gray-900">Questão {questao.numero}</div>
                                {questao.imagemUrl && <img src={questao.imagemUrl} alt={`Imagem da questão ${questao.numero}`} className="max-w-full h-auto my-2"/>}
                                <div className="enunciado"><ReactMarkdown>{questao.enunciado}</ReactMarkdown></div>
                                {questao.tipo === 'multipla-escolha' && questao.alternativas && (
                                  <ol type="a" className="list-[lower-alpha] pl-5 mt-2 space-y-1">{questao.alternativas.map(alt => <li key={alt.id}>{alt.texto}</li>)}</ol>
                                )}
                                {questao.tipo === 'dissertativa' && questao.linhasResposta && questao.linhasResposta > 0 && (
                                  <div className="mt-4">{Array.from({ length: questao.linhasResposta }).map((_, i) => (<div key={i} className="linhas-resposta"></div>))}</div>
                                )}
                                {questao.tipo === 'verdadeiro-falso' && questao.afirmativas && (
                                  <ol className="list-none p-0 mt-2 space-y-2">{questao.afirmativas.map(af => (<li key={af.id} className="flex items-start"><span className="mr-2 font-mono">( )</span><span>{af.texto}</span></li>))}</ol>
                                )}
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

           {isSimulado && (
               <PaginaLayout rodapeProps={{ paginaAtual: totalPaginasFinal, totalPaginas: totalPaginasFinal }} className="page-fundo">
                    <div className="h-20 w-20 mb-8">{config.logoUrl && <img src={config.logoUrl} alt="Logo"/>}</div>
                    <h2 className="text-2xl">BOA PROVA!</h2>
               </PaginaLayout>
           )}
        </div>
      )}
    </>
  );
}

export default App;