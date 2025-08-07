// src/components/configuracao/EditableList.tsx

import React, { useState } from 'react';
// 1. Importe os ícones e também o tipo 'IconType'
import { FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import type { IconType } from 'react-icons';

// 2. Garanta a tipagem correta para os componentes de ícone
const PlusIcon: IconType = FiPlusCircle;
const TrashIcon: IconType = FiTrash2;


interface EditableListProps {
  titulo: string;
  items: string[];
  onUpdate: (novosItems: string[]) => void;
}

function EditableList({ titulo, items, onUpdate }: EditableListProps) {
  const [novoItem, setNovoItem] = useState('');

  const handleAdicionar = () => {
    if (novoItem.trim() && !items.includes(novoItem.trim())) {
      onUpdate([...items, novoItem.trim()]);
      setNovoItem('');
    }
  };

  const handleRemover = (itemParaRemover: string) => {
    onUpdate(items.filter(item => item !== itemParaRemover));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAdicionar();
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2 text-gray-800">{titulo}</h3>
      <div className="bg-gray-50 p-3 rounded-md border max-h-48 overflow-y-auto">
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item} className="flex justify-between items-center text-gray-700 text-sm bg-white p-2 rounded border">
                <span>{item}</span>
                <button
                  onClick={() => handleRemover(item)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label={`Remover ${item}`}
                >
                  {/* 3. Use a variável com a tipagem correta */}
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum item.</p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Novo item para ${titulo}`}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          onClick={handleAdicionar}
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          disabled={!novoItem.trim()}
          aria-label={`Adicionar ${titulo}`}
        >
          {/* 4. Use a variável com a tipagem correta */}
          <PlusIcon size={20} />
        </button>
      </div>
    </div>
  );
}

export default EditableList;