import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../src/features/settings/Settings';
import { User, Unit } from '../src/types';
import React from 'react';

// Mock do módulo cloudService para não tentar sincronizar de verdade
vi.mock('../src/services/cloudService', () => ({
  syncToGitHub: vi.fn(),
}));

const mockUser: User = {
  id: 'u-1',
  username: 'admin',
  displayName: 'Admin Test',
  permissions: ['manage_units', 'manage_backup']
};

const mockUnits: Unit[] = [
  { id: 'unit-1', name: 'Bar do Teste', isActive: true, serviceTaxEnabled: false, serviceTaxPercentage: 10 }
];

describe('Settings Component', () => {
  it('deve alternar o switch de Taxa de Serviço quando clicado com unitId válido', () => {
    const onUpdateUnits = vi.fn();
    const setPenduraThreshold = vi.fn();
    const setLongDurationThreshold = vi.fn();

    render(
      <Settings 
        products={[]}
        sales={[]}
        openTabs={[]}
        users={[mockUser]}
        shifts={[]}
        units={mockUnits}
        onUpdateUnits={onUpdateUnits}
        onImport={vi.fn()}
        dbStatus="success"
        currentUser={mockUser}
        penduraThreshold={500}
        setPenduraThreshold={setPenduraThreshold}
        longDurationThreshold={4}
        setLongDurationThreshold={setLongDurationThreshold}
        activeUnitId="unit-1"
      />
    );

    // Encontra o botão pelo texto (ou parte dele)
    const switchButton = screen.getByText(/Módulo Inativo/i).closest('button');
    expect(switchButton).toBeTruthy();

    if (switchButton) {
      fireEvent.click(switchButton);
    }

    // Verifica se a função de atualização foi chamada com o novo estado (enabled: true)
    expect(onUpdateUnits).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: 'unit-1',
        serviceTaxEnabled: true
      })
    ]));
  });

  it('não deve fazer nada se activeUnitId for nulo (blindagem contra bug anterior)', () => {
    const onUpdateUnits = vi.fn();

    render(
      <Settings 
        products={[]}
        sales={[]}
        openTabs={[]}
        users={[mockUser]}
        shifts={[]}
        units={mockUnits}
        onUpdateUnits={onUpdateUnits}
        onImport={vi.fn()}
        dbStatus="success"
        currentUser={mockUser}
        penduraThreshold={500}
        setPenduraThreshold={vi.fn()}
        longDurationThreshold={4}
        setLongDurationThreshold={vi.fn()}
        activeUnitId={null} // Simulando o erro anterior
      />
    );

    const switchButton = screen.getByText(/Módulo Inativo/i).closest('button');
    if (switchButton) {
      fireEvent.click(switchButton);
    }

    // Não deve ter sido chamado pois o activeUnitId é nulo
    expect(onUpdateUnits).not.toHaveBeenCalled();
  });
});
