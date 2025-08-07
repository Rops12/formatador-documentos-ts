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
  id: Date.now() + Math.random(),
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
    if (!container) {
      setIsGeneratingPdf(false);
      return;
    }

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pagesToRender = container.querySelectorAll('.page-wrapper-print');

    for (let i = 0; i < pagesToRender.length; i++) {
      const pageElement = pagesToRender[i] as HTMLElement;

      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        width: pageElement.offsetWidth,
        height: pageElement.offsetHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
           <Preview
              questoes={questoes}
              template={template}
              disciplina={disciplina}
              serie={serie}
              turma={turma}
              isPrinting={true}
            />
        </div>
      )}
    </>
  );
}

export default App;