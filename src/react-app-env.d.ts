/// <reference types="react-scripts" />

// Adicione o código abaixo para corrigir o problema com react-icons
declare module 'react-icons/fi' {
  import { IconType } from 'react-icons';
  const icon: IconType;
  export = icon;
}