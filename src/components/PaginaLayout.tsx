import React from 'react';

// Interfaces (sem alterações)
interface CabecalhoProps {
  template: string;
  disciplina: string;
  serie: string;
  turma: string;
}

interface RodapeProps {
  paginaAtual: number;
  totalPaginas: number;
}

interface PaginaLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cabecalhoProps?: CabecalhoProps;
  rodapeProps: RodapeProps;
}

// EXPORTAMOS o Cabecalho para poder usá-lo na medição
export const Cabecalho: React.FC<CabecalhoProps> = ({ template, disciplina, serie, turma }) => (
  <header className="border-b border-gray-300 pb-2 mb-4 flex-shrink-0">
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

// EXPORTAMOS o Rodape também
export const Rodape: React.FC<RodapeProps> = ({ paginaAtual, totalPaginas }) => (
  <footer className="border-t border-gray-300 pt-2 mt-auto text-center text-xs text-gray-500 flex-shrink-0">
    <p>Nome do Colégio | Página {paginaAtual} de {totalPaginas}</p>
  </footer>
);

export const PaginaLayout = React.forwardRef<HTMLDivElement, PaginaLayoutProps>(
  ({ children, cabecalhoProps, rodapeProps, ...rest }, ref) => {
    return (
      <div className="page-wrapper-print" {...rest} ref={ref}>
        <div className="page">
          {cabecalhoProps && <Cabecalho {...cabecalhoProps} />}
          <main className="flex-grow">
            {children}
          </main>
          <Rodape {...rodapeProps} />
        </div>
      </div>
    );
  }
);