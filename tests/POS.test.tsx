import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import POS from '../src/features/pos/POS';
import { Product, Shift, Unit } from '../src/types';
import React from 'react';

const mockProducts: Product[] = [
  { id: 'p-1', name: 'Cerveja Teste', price: 10, category: 'GERAL', sellType: 'unit', isFavorite: false }
];

const mockShift: Shift = {
  id: 'shift-1',
  startTime: Date.now(),
  openedBy: 'u-1',
  status: 'open',
  cashPrimary: 100,
  cashChange: 50,
  openingCashPrimary: 100,
  openingCashChange: 50
};

const mockUnit: Unit = {
  id: 'unit-1',
  name: 'Bar Teste',
  isActive: true,
  serviceTaxEnabled: true,
  serviceTaxPercentage: 10
};

describe('POS Component', () => {
  it('deve mostrar mensagem de bar fechado se não houver turno ativo', () => {
    render(
      <POS 
        products={mockProducts}
        modifierGroups={[]}
        categoryModifiers={{}}
        openTabs={[]}
        onSaveTab={vi.fn()}
        onDeleteTab={vi.fn()}
        onCompleteSale={vi.fn()}
        activeShift={undefined} // Sem turno
        activeUnit={mockUnit}
      />
    );

    expect(screen.getByText(/Bar Fechado!/i)).toBeTruthy();
  });

  it('deve permitir abrir uma nova mesa', async () => {
    const onSaveTab = vi.fn().mockResolvedValue(undefined);
    
    render(
      <POS 
        products={mockProducts}
        modifierGroups={[]}
        categoryModifiers={{}}
        openTabs={[]}
        onSaveTab={onSaveTab}
        onDeleteTab={vi.fn()}
        onCompleteSale={vi.fn()}
        activeShift={mockShift}
        activeUnit={mockUnit}
      />
    );

    // Clica no botão de abrir mesa
    const openTabBtn = screen.getByText(/Abrir Mesa/i);
    fireEvent.click(openTabBtn);

    // Digita o nome da mesa
    const input = screen.getByPlaceholderText(/NOME OU NÚMERO DA MESA/i);
    fireEvent.change(input, { target: { value: 'MESA 10' } });
    
    // Clica em confirmar
    const confirmBtn = screen.getByText(/Confirmar/i);
    fireEvent.click(confirmBtn);

    expect(onSaveTab).toHaveBeenCalledWith(expect.objectContaining({
      name: 'MESA 10'
    }));
  });

  it('deve calcular corretamente a taxa de serviço no resumo da comanda', () => {
    const openTabs = [
      { 
        id: 'tab-1', 
        name: 'MESA 01', 
        openedAt: Date.now(), 
        items: [
          { id: 'it-1', productId: 'p-1', productName: 'Cerveja Teste', quantity: 2, unitPrice: 10, totalPrice: 20 }
        ] 
      }
    ];

    render(
      <POS 
        products={mockProducts}
        modifierGroups={[]}
        categoryModifiers={{}}
        openTabs={openTabs}
        onSaveTab={vi.fn()}
        onDeleteTab={vi.fn()}
        onCompleteSale={vi.fn()}
        activeShift={mockShift}
        activeUnit={mockUnit} // Taxa de 10% ativa
      />
    );

    // Clica na mesa para abrir o carrinho
    fireEvent.click(screen.getByText('MESA 01'));

    // Verifica se o total consumido é R$ 20,00
    // O texto no componente é formatado como moeda. 
    // Como o locale pode variar no ambiente de teste, vamos buscar pelo valor.
    expect(screen.getAllByText(/20,00/).length).toBeGreaterThan(0);
    
    // Se clicarmos em "Fechar Conta", ele deve levar ao painel de pagamento com a taxa calculada
    fireEvent.click(screen.getByText(/Fechar Conta/i));
    
    // Na tela de pagamento, deve aparecer a taxa de serviço (R$ 2,00) e o total (R$ 22,00)
    expect(screen.getAllByText(/2,00/).length).toBeGreaterThan(0); // Taxa
    expect(screen.getAllByText(/22,00/).length).toBeGreaterThan(0); // Total final
  });
});
