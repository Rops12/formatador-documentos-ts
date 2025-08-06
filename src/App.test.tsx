import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Construtor de Avaliações/i);
  expect(headingElement).toBeInTheDocument();
});