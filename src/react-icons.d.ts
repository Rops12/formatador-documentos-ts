// Conteúdo para src/react-icons.d.ts

// Este arquivo serve como um "patch" para resolver um problema de
// incompatibilidade de tipos entre o @types/react e o react-icons.
// Estamos re-declarando os ícones que usamos, garantindo que o TypeScript
// os entenda como componentes JSX válidos do tipo IconType.

import { IconType } from 'react-icons';

declare module 'react-icons/fi' {
  export const FiFileText: IconType;
  export const FiDownload: IconType;
  export const FiPlusCircle: IconType;
  export const FiType: IconType;
  export const FiBookOpen: IconType;
  export const FiLoader: IconType;
  export const FiEdit: IconType;
  export const FiTrash2: IconType;
  export const FiCheck: IconType;
  export const FiX: IconType;
  export const FiMove: IconType;
  export const FiChevronLeft: IconType;
  export const FiChevronRight: IconType;
}