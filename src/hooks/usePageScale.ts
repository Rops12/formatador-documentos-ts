import { useState, useLayoutEffect, RefObject } from 'react';

// Aceita RefObjects que podem ser nulos
export const usePageScale = (
  pageRef: RefObject<HTMLDivElement | null>, 
  containerRef: RefObject<HTMLDivElement | null>
) => {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;
    
    if (!container || !page) {
      return;
    }

    const calculateScale = () => {
      const currentContainer = containerRef.current;
      const currentPage = pageRef.current;

      if (!currentPage || !currentContainer) return;

      const containerWidth = currentContainer.offsetWidth;
      const containerHeight = currentContainer.offsetHeight;
      
      const pageWidth = currentPage.offsetWidth;
      const pageHeight = currentPage.offsetHeight;

      if (pageWidth === 0 || pageHeight === 0) return;

      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;

      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
    
  }, [pageRef, containerRef]);

  return scale;
};