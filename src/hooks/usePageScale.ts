import { useState, useLayoutEffect, RefObject } from 'react';

// 1. Tipamos os argumentos do hook. Eles devem ser "RefObjects" para elementos HTML.
export const usePageScale = (
  pageRef: RefObject<HTMLDivElement>, 
  containerRef: RefObject<HTMLDivElement>
) => {
  const [scale, setScale] = useState(1);

  // useLayoutEffect é usado aqui para garantir que a medição ocorra
  // depois que o DOM foi pintado, evitando "flickering".
  useLayoutEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;

    // Se os elementos não existem, não fazemos nada.
    if (!container || !page) {
      return;
    }

    const calculateScale = () => {
      // Re-referenciamos os elementos dentro da função por segurança
      const currentContainer = containerRef.current;
      const currentPage = pageRef.current;

      if (!currentPage || !currentContainer) return;

      const containerWidth = currentContainer.offsetWidth;
      const containerHeight = currentContainer.offsetHeight;
      
      const pageWidth = currentPage.offsetWidth;
      const pageHeight = currentPage.offsetHeight;
      
      // Evita divisão por zero se o elemento ainda não tiver dimensões
      if (pageWidth === 0 || pageHeight === 0) return;

      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;

      // Usamos a menor escala para garantir que a página inteira caiba
      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };

    calculateScale(); // Calcula a escala inicial

    // O ResizeObserver recalcula a escala sempre que o tamanho do contêiner mudar
    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(container);

    // Função de limpeza para desconectar o observador e evitar memory leaks
    return () => resizeObserver.disconnect();
    
  }, [pageRef, containerRef]); // Roda o efeito se as refs mudarem

  return scale;
};