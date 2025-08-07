import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

// Importações do dnd-kit para arrastar e soltar
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Ícones
import { FiEdit, FiTrash2, FiCheck, FiX, FiPlusCircle, FiMove } from 'react-icons/fi';

// Importando nossos tipos! Esta é a base da segurança do TypeScript.
import { Questao, Alternativa } from '../types';

// 1. Interface de Props: Definimos um "contrato" para nosso componente.
// Ele DEVE receber essas props com esses tipos exatos.
interface QuestaoEditorProps {
  questao: Questao;
  idQuestaoEditando: number | null;
  onExcluir: (id: number) => void;
  onIniciarEdicao: (id: number | null) => void;
  onSalvarEdicao: (id: number, novosDados: Questao) => void;
}

// 2. Tipando o Componente: Usamos a interface para garantir que as props estão corretas.
function QuestaoEditor({ questao, onExcluir, idQuestaoEditando, onIniciarEdicao, onSalvarEdicao }: QuestaoEditorProps) {
  
  // 3. Tipando o Estado: useState<Questao> garante que `dadosTemporarios` sempre terá o formato de uma Questao.
  const [dadosTemporarios, setDadosTemporarios] = useState<Questao>(questao);
  
  // Sincroniza o estado temporário se a prop `questao` mudar externamente (ex: reordenação)
  useEffect(() => { 
    setDadosTemporarios(questao); 
  }, [questao]);

  const isEditing = idQuestaoEditando === questao.id;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: questao.id });

  // Estilo para a animação de arrastar
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // --- Funções de Manipulação (Handlers) ---
  // Note que o TypeScript infere a maioria dos tipos dos eventos (como 'e' em onChange),
  // mas podemos ser explícitos se quisermos.

  const handleSalvarClick = () => { 
    onSalvarEdicao(questao.id, dadosTemporarios); 
  };

  const handleCancelarClick = () => { 
    setDadosTemporarios(questao); // Restaura os dados originais
    onIniciarEdicao(null); 
  };
  
  const handleEnunciadoChange = (enunciado: string) => { 
    setDadosTemporarios(prev => ({ ...prev, enunciado })); 
  };

  const handleAlternativaChange = (altId: number, novoTexto: string) => { 
    setDadosTemporarios(prev => ({
      ...prev,
      alternativas: prev.alternativas?.map(alt => 
        alt.id === altId ? { ...alt, texto: novoTexto } : alt
      )
    }));
  };
  
  const handleAdicionarAlternativa = () => { 
    const novaAlternativa: Alternativa = { id: Date.now(), texto: 'Nova Alternativa' };
    setDadosTemporarios(prev => ({
      ...prev,
      alternativas: [...(prev.alternativas || []), novaAlternativa]
    }));
  };

  const handleRemoverAlternativa = (altId: number) => { 
    setDadosTemporarios(prev => ({
      ...prev,
      alternativas: prev.alternativas?.filter(alt => alt.id !== altId)
    }));
  };

  const handleMarcarCorreta = (altId: number) => { 
    setDadosTemporarios(prev => ({ ...prev, respostaCorreta: altId })); 
  };

  // --- Renderização do Modo de Edição ---
  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-500 rounded-lg p-4 mb-4 shadow-lg transition-all duration-300">
        <p className="font-bold text-gray-700 mb-2">Editando Questão {questao.numero}</p>
        
        <label className="font-semibold text-sm text-gray-600">Enunciado:</label>
        <div className="editor-container mt-1">
          <SimpleMDE 
            value={dadosTemporarios.enunciado} 
            onChange={handleEnunciadoChange} 
            options={{ autofocus: true, spellChecker: false, toolbar: ["bold", "italic", "|", "unordered-list", "ordered-list"], minHeight: "100px" }} 
          />
        </div>

        {questao.tipo === 'multipla-escolha' && (
          <div className="mt-4">
            <label className="font-semibold text-sm text-gray-600">Alternativas:</label>
            <div className="space-y-2 mt-1">
              {dadosTemporarios.alternativas?.map((alt, index) => (
                <div key={alt.id} className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name={`resposta-correta-${questao.id}`} 
                    checked={dadosTemporarios.respostaCorreta === alt.id} 
                    onChange={() => handleMarcarCorreta(alt.id)}
                    className="form-radio h-5 w-5 text-blue-600"
                  />
                  <span className="font-mono text-sm text-gray-500">{String.fromCharCode(65 + index)})</span>
                  <input 
                    type="text" 
                    value={alt.texto} 
                    onChange={(e) => handleAlternativaChange(alt.id, e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <button onClick={() => handleRemoverAlternativa(alt.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleAdicionarAlternativa} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-3">
              <FiPlusCircle size={16} />
              Adicionar Alternativa
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={handleCancelarClick} className="flex items-center gap-2 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">
            <FiX size={16} /> Cancelar
          </button>
          <button onClick={handleSalvarClick} className="flex items-center gap-2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600">
            <FiCheck size={16} /> Salvar
          </button>
        </div>
      </div>
    );
  }

  // --- Renderização do Modo de Visualização ---
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 relative group">
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button {...listeners} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded cursor-grab">
            <FiMove size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onIniciarEdicao(questao.id); }} className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-gray-200 rounded">
            <FiEdit size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onExcluir(questao.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded">
            <FiTrash2 size={16} />
          </button>
        </div>
        <div onClick={() => onIniciarEdicao(questao.id)} className="cursor-pointer">
          <p className="font-bold text-gray-700 mb-2">Questão {questao.numero}</p>
          <div className="prose prose-sm max-w-none text-gray-800 pointer-events-none">
            <ReactMarkdown>{questao.enunciado}</ReactMarkdown>
            {questao.tipo === 'multipla-escolha' && questao.alternativas && (
              <ul className="list-none p-0 mt-2">
                {questao.alternativas.map((alt, index) => (
                  <li key={alt.id} className={questao.respostaCorreta === alt.id ? 'font-bold' : ''}>
                    {String.fromCharCode(65 + index)}) {alt.texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestaoEditor;