import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// Tipos e Componentes
import { Questao } from './types';
import QuestaoEditor from './components/QuestaoEditor';
import Preview from './components/Preview';

// Lógica de Drag and Drop
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Geração de PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Constantes e Funções Auxiliares ---

const disciplinasDisponiveis = ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês"];
const seriesDisponiveis = ["6º Ano", "7º Ano", "8º Ano", "9º Ano", "1º Ano EM", "2º Ano EM", "3º Ano EM"];
const turmasDisponiveis = ["A", "B", "C", "D", "E"];
const templatesDisponiveis = ['Prova Global', 'Microteste', 'Simuladinho', 'Simulado Enem', 'Simulado Tradicional', 'Atividade'];

const novaQuestaoBase = (numero: number): Omit<Questao, 'tipo' | 'enunciado'> => ({
  id: Date.now() + Math.random(), // Usar Math.random() para garantir IDs únicos
  numero: numero,
});

const novaQuestaoDissertativa = (numero: number): Questao => ({
  ...novaQuestaoBase(numero),
  tipo: 'dissertativa',
  enunciado: `Enunciado da questão dissertativa nº ${numero}.`,
});

const novaQuestaoMultiplaEscolha = (numero: number): Questao => ({
  ...novaQuestaoBase(numero),
  tipo: 'multipla-escolha',
  enunciado: `Enunciado da questão de múltipla escolha nº ${numero}.`,
  alternativas: [
    { id: Date.now() + numero + 1, texto: 'Alternativa A' },
    { id: Date.now() + numero + 2, texto: 'Alternativa B' },
    { id: Date.now() + numero + 3, texto: 'Alternativa C' },
  ],
  respostaCorreta: Date.now() + numero + 1,
});

// Componente dedicado para a renderização do PDF
const PrintLayout: React.FC<{
  questoes: Questao[];
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
}> = ({ questoes, template, disciplina, serie, turma }) => {
  const usarDuasColunas = ['Simuladinho', 'Simulado Enem', 'Simulado Tradicional'].includes(template);

  return (
    <div className="page-wrapper-print">
      <div className="page">
        <header className="border-b border-gray-300 pb-2 mb-4">
          <div className="flex justify-between items-center">
            {/* Se você tiver o logo, mantenha a tag img. Caso contrário, pode remover. */}
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
        <main className={`flex-grow ${usarDuasColunas ? 'page-content-duas-colunas' : ''}`}>
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
      </div>
    </div>
  );
};


function App() {
  // --- Estados Tipados ---
  const [questoes, setQuestoes] = useState<Questao[]>([novaQuestaoMultiplaEscolha(1)]);
  const [disciplina, setDisciplina] = useState<string>(disciplinasDisponiveis[0]);
  const [serie, setSerie] = useState<string>(seriesDisponiveis[0]);
  const [turma, setTurma] = useState<string>(turmasDisponiveis[0]);
  const [template, setTemplate] = useState<string>(templatesDisponiveis[0]);
  const [idQuestaoEditando, setIdQuestaoEditando] = useState<number | null>(questoes[0].id);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // --- Manipuladores de Eventos (Handlers) ---

  const handleAdicionarQuestao = (tipo: Questao['tipo']) => {
    const proximoNumero = questoes.length + 1;
    const novaQuestao = tipo === 'multipla-escolha' 
      ? novaQuestaoMultiplaEscolha(proximoNumero) 
      : novaQuestaoDissertativa(proximoNumero);
    setQuestoes(prevQuestoes => [...prevQuestoes, novaQuestao]);
    setIdQuestaoEditando(novaQuestao.id);
  };

  const handleExcluirQuestao = (id: number) => {
    setQuestoes(prev => 
      prev
        .filter(q => q.id !== id)
        .map((q, i) => ({ ...q, numero: i + 1 }))
    );
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
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((q, index) => ({ ...q, numero: index + 1 }));
      });
    }
  };
  
  const handleGerarPDF = async () => {
    if (questoes.length === 0) return;
    
    setIsGeneratingPdf(true);
  
    await new Promise(resolve => setTimeout(resolve, 100));
  
    const container = document.getElementById('pdf-render-container');
    const pageToRender = container?.querySelector('.page-wrapper-print') as HTMLElement;
    
    if (!pageToRender) {
      setIsGeneratingPdf(false);
      return;
    }
  
    const canvas = await html2canvas(pageToRender, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: pageToRender.scrollWidth,
      windowHeight: pageToRender.scrollHeight,
    });
  
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
  
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / pdfWidth;
    const imgHeight = canvasHeight / ratio;
  
    let heightLeft = imgHeight;
    let position = 0;
  
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
  
    while (heightLeft > 0) {
      position = -pdfHeight + (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    const fileName = `${template}-${disciplina}-${serie}${turma}.pdf`;
    pdf.save(fileName);
  
    setIsGeneratingPdf(false);
  };

  const TemplateButton = ({ nome }: { nome: string }) => {
    const isActive = template === nome;
    return (
      <button 
        onClick={() => setTemplate(nome)} 
        className={`w-full text-left p-3 rounded-lg transition-colors duration-200 text-sm ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        <span>{nome}</span>
      </button>
    );
  };

  return (
    <>
      <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-screen-2xl mx-auto w-full">
          {/* Coluna da Esquerda: Editor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
            <div className="p-6 lg:p-8">
              <header className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">Construtor de Avaliações</h1>
                  <p className="text-gray-500 mt-2">Adicione, edite e reordene as suas questões de forma modular.</p>
              </header>

              <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Informações do Cabeçalho</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="disciplina" className="block text-sm font-medium text-gray-600">Disciplina</label>
                    <select id="disciplina" value={disciplina} onChange={e => setDisciplina(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                      {disciplinasDisponiveis.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="serie" className="block text-sm font-medium text-gray-600">Série</label>
                    <select id="serie" value={serie} onChange={e => setSerie(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                      {seriesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="turma" className="block text-sm font-medium text-gray-600">Turma</label>
                    <select id="turma" value={turma} onChange={e => setTurma(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                      {turmasDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Selecione o Modelo</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {templatesDisponiveis.map(nome => <TemplateButton key={nome} nome={nome} />)}
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Questões</h2>
                  <SortableContext items={questoes.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {questoes.map((questao) => (
                      <QuestaoEditor 
                        key={questao.id} 
                        questao={questao} 
                        onExcluir={handleExcluirQuestao} 
                        idQuestaoEditando={idQuestaoEditando} 
                        onIniciarEdicao={setIdQuestaoEditando} 
                        onSalvarEdicao={handleSalvarEdicao} 
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            </div>

            <div className="mt-auto border-t p-6 space-y-4">
              <div className="flex gap-4">
                <button onClick={() => handleAdicionarQuestao('dissertativa')} disabled={isGeneratingPdf} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm disabled:opacity-50">
                  + Dissertativa
                </button>
                <button onClick={() => handleAdicionarQuestao('multipla-escolha')} disabled={isGeneratingPdf} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all text-sm disabled:opacity-50">
                  + Múltipla Escolha
                </button>
              </div>
              <button onClick={handleGerarPDF} disabled={isGeneratingPdf || questoes.length === 0} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:bg-blue-400">
                <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}</span>
              </button>
            </div>
          </div>

          <div className="sticky top-8 h-fit">
            <Preview 
              questoes={questoes} 
              template={template}
              disciplina={disciplina}
              serie={serie}
              turma={turma}
            />
          </div>
        </div>
      </div>
      
      {isGeneratingPdf && (
        <div id="pdf-render-container" className="absolute top-0 left-0" style={{ zIndex: -10, opacity: 0, backgroundColor: 'white' }}>
           <PrintLayout 
              questoes={questoes} 
              template={template}
              disciplina={disciplina}
              serie={serie}
              turma={turma}
            />
        </div>
      )}
    </>
  );
}

export default App;