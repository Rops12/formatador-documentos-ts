import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import SimpleMdeEditor from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Questao, Alternativa, Afirmativa } from '../types';

interface QuestaoEditorProps {
  questao: Questao;
  idQuestaoEditando: number | null;
  onExcluir: (id: number) => void;
  onIniciarEdicao: (id: number | null) => void;
  onSalvarEdicao: (id: number, novosDados: Questao) => void;
}

function QuestaoEditor({ questao, onExcluir, idQuestaoEditando, onIniciarEdicao, onSalvarEdicao }: QuestaoEditorProps) {
  
  const [dadosTemporarios, setDadosTemporarios] = useState<Questao>(questao);
  
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSalvarClick = () => { 
    onSalvarEdicao(questao.id, dadosTemporarios); 
  };

  const handleCancelarClick = () => { 
    setDadosTemporarios(questao);
    onIniciarEdicao(null); 
  };
  
  const handleEnunciadoChange = (enunciado: string) => { 
    setDadosTemporarios(prev => ({ ...prev, enunciado })); 
  };

  // --- Handlers para Imagem ---
  const handleImagemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDadosTemporarios(prev => ({ ...prev, imagemUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverImagem = () => {
    setDadosTemporarios(prev => ({ ...prev, imagemUrl: null }));
  };
  
  // --- Handlers para Múltipla Escolha ---
  const handleAlternativaChange = (altId: number, novoTexto: string) => { 
    setDadosTemporarios(prev => ({
      ...prev,
      alternativas: prev.alternativas?.map(alt => 
        alt.id === altId ? { ...alt, texto: novoTexto } : alt
      )
    }));
  };
  
  const handleAdicionarAlternativa = () => { 
    const novaAlternativa: Alternativa = { id: Date.now() + Math.random(), texto: 'Nova Alternativa' };
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

  // --- Handlers para Dissertativa ---
  const handleLinhasRespostaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value, 10);
    setDadosTemporarios(prev => ({ ...prev, linhasResposta: isNaN(valor) ? 0 : valor }));
  };

  // --- Handlers para Verdadeiro ou Falso ---
  const handleAdicionarAfirmativa = () => {
    const novaAfirmativa: Afirmativa = { id: Date.now() + Math.random(), texto: 'Nova afirmativa.', correta: false };
    setDadosTemporarios(prev => ({
      ...prev,
      afirmativas: [...(prev.afirmativas || []), novaAfirmativa]
    }));
  };

  const handleAfirmativaChange = (afId: number, novoTexto: string) => {
    setDadosTemporarios(prev => ({
      ...prev,
      afirmativas: prev.afirmativas?.map(af =>
        af.id === afId ? { ...af, texto: novoTexto } : af
      )
    }));
  };

  const handleMarcarAfirmativaCorreta = (afId: number, correta: boolean) => {
    setDadosTemporarios(prev => ({
      ...prev,
      afirmativas: prev.afirmativas?.map(af =>
        af.id === afId ? { ...af, correta } : af
      )
    }));
  };

  const handleRemoverAfirmativa = (afId: number) => {
    setDadosTemporarios(prev => ({
      ...prev,
      afirmativas: prev.afirmativas?.filter(af => af.id !== afId)
    }));
  };


  // --- Renderização do Modo de Edição ---
  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-500 rounded-lg p-4 mb-4 shadow-lg transition-all duration-300">
        <p className="font-bold text-gray-700 mb-2">Editando Questão {questao.numero}</p>
        
        <label className="font-semibold text-sm text-gray-600">Enunciado:</label>
        <div className="editor-container mt-1">
          <SimpleMdeEditor 
            value={dadosTemporarios.enunciado} 
            onChange={handleEnunciadoChange} 
            options={{ autofocus: true, spellChecker: false, toolbar: ["bold", "italic", "|", "unordered-list", "ordered-list"], minHeight: "100px" }} 
          />
        </div>

        {/* Uploader de Imagem */}
        <div className="mt-4">
            <label className="font-semibold text-sm text-gray-600">Imagem (Opcional):</label>
            {dadosTemporarios.imagemUrl && (
                <div className="my-2 p-2 border rounded-md">
                    <img src={dadosTemporarios.imagemUrl} alt="Preview" className="max-w-xs max-h-48" />
                </div>
            )}
            <div className="flex items-center gap-2 mt-1">
                <input type="file" accept="image/*" onChange={handleImagemChange} id={`imagem-upload-${questao.id}`} className="hidden"/>
                <label htmlFor={`imagem-upload-${questao.id}`} className="text-sm bg-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-lg hover:bg-gray-300 cursor-pointer">
                    Escolher Imagem
                </label>
                {dadosTemporarios.imagemUrl && (
                    <button onClick={handleRemoverImagem} className="text-sm text-red-600 hover:underline">Remover</button>
                )}
            </div>
        </div>


        {/* Campos por Tipo de Questão */}
        {questao.tipo === 'multipla-escolha' && (
          <div className="mt-4">
            <label className="font-semibold text-sm text-gray-600">Alternativas:</label>
            <div className="space-y-2 mt-1">
              {dadosTemporarios.alternativas?.map((alt, index) => (
                <div key={alt.id} className="flex items-center gap-2">
                  <input type="radio" name={`resposta-correta-${questao.id}`} checked={dadosTemporarios.respostaCorreta === alt.id} onChange={() => handleMarcarCorreta(alt.id)} className="form-radio h-5 w-5 text-blue-600"/>
                  <span className="font-mono text-sm text-gray-500">{String.fromCharCode(65 + index)})</span>
                  <input type="text" value={alt.texto} onChange={(e) => handleAlternativaChange(alt.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded"/>
                  <button onClick={() => handleRemoverAlternativa(alt.id)} className="p-1 text-gray-400 hover:text-red-500">X</button>
                </div>
              ))}
            </div>
            <button onClick={handleAdicionarAlternativa} className="text-sm text-blue-600 hover:text-blue-800 mt-3">Adicionar Alternativa</button>
          </div>
        )}

        {questao.tipo === 'dissertativa' && (
            <div className="mt-4">
                <label htmlFor={`linhas-resposta-${questao.id}`} className="font-semibold text-sm text-gray-600">Linhas para Resposta:</label>
                <input type="number" id={`linhas-resposta-${questao.id}`} value={dadosTemporarios.linhasResposta || 0} onChange={handleLinhasRespostaChange} className="mt-1 w-24 p-2 border border-gray-300 rounded"/>
            </div>
        )}

        {questao.tipo === 'verdadeiro-falso' && (
            <div className="mt-4">
                <label className="font-semibold text-sm text-gray-600">Afirmativas:</label>
                <div className="space-y-2 mt-1">
                    {dadosTemporarios.afirmativas?.map(af => (
                        <div key={af.id} className="flex items-center gap-2 p-2 border rounded-md">
                            <textarea value={af.texto} onChange={e => handleAfirmativaChange(af.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" rows={2}/>
                            <div className="flex flex-col items-center">
                                <label className="flex items-center gap-1 text-sm">
                                    <input type="radio" name={`vf-correta-${af.id}`} checked={af.correta === true} onChange={() => handleMarcarAfirmativaCorreta(af.id, true)} /> V
                                </label>
                                <label className="flex items-center gap-1 text-sm">
                                    <input type="radio" name={`vf-correta-${af.id}`} checked={af.correta === false} onChange={() => handleMarcarAfirmativaCorreta(af.id, false)} /> F
                                </label>
                            </div>
                            <button onClick={() => handleRemoverAfirmativa(af.id)} className="p-1 text-gray-400 hover:text-red-500 self-start">X</button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAdicionarAfirmativa} className="text-sm text-blue-600 hover:text-blue-800 mt-3">Adicionar Afirmativa</button>
            </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={handleCancelarClick} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSalvarClick} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600">Salvar</button>
        </div>
      </div>
    );
  }

  // --- Renderização do Modo de Visualização ---
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 relative group">
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button {...listeners} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded cursor-grab">Mover</button>
          <button onClick={(e) => { e.stopPropagation(); onIniciarEdicao(questao.id); }} className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-gray-200 rounded">Editar</button>
          <button onClick={(e) => { e.stopPropagation(); onExcluir(questao.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded">Excluir</button>
        </div>
        <div onClick={() => onIniciarEdicao(questao.id)} className="cursor-pointer">
          <p className="font-bold text-gray-700 mb-2">Questão {questao.numero}</p>
          <div className="prose prose-sm max-w-none text-gray-800 pointer-events-none">
            {questao.imagemUrl && <img src={questao.imagemUrl} alt={`Imagem da questão ${questao.numero}`} className="max-w-full h-auto my-2"/>}
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

            {questao.tipo === 'verdadeiro-falso' && questao.afirmativas && (
                <ul className="list-none p-0 mt-2 space-y-2">
                    {questao.afirmativas.map(af => (
                        <li key={af.id} className="flex items-start">
                            <span className="mr-2">( )</span>
                            <span className={af.correta ? 'font-bold' : ''}>{af.texto}</span>
                        </li>
                    ))}
                </ul>
            )}

            {questao.tipo === 'dissertativa' && questao.linhasResposta && questao.linhasResposta > 0 && (
                <div className="mt-4 space-y-2">
                    {Array.from({ length: questao.linhasResposta }).map((_, i) => (
                        <div key={i} className="h-6 border-b border-gray-400"></div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestaoEditor;