import { describe, it, expect } from 'vitest';
import { User, UserPermission } from '../src/types';

// Função auxiliar baseada na lógica do App.tsx e dos componentes
function hasPermission(user: User | null, permission: UserPermission): boolean {
    if (!user) return false;

    // admin tem todas as permissões
    if (user.username === 'admin') return true;

    return user.permissions.includes(permission);
}

describe('Permissões de Usuário (RBAC)', () => {
    const adminUser: User = {
        id: '1',
        username: 'admin',
        displayName: 'Admin',
        permissions: ['pos'] // Mesmo com poucas perms no array, lógica de admin deve prevalecer
    };

    const operatorUser: User = {
        id: '2',
        username: 'jose',
        displayName: 'José Garçom',
        permissions: ['pos', 'open_shift', 'help_view']
    };

    const managerUser: User = {
        id: '3',
        username: 'maria',
        displayName: 'Maria Gerente',
        permissions: ['pos', 'dashboard', 'reports', 'delete_sale', 'edit_product']
    };

    it('Administrador deve ter acesso a tudo', () => {
        expect(hasPermission(adminUser, 'delete_sale')).toBe(true);
        expect(hasPermission(adminUser, 'full_reset')).toBe(true);
        expect(hasPermission(adminUser, 'manage_units')).toBe(true);
    });

    it('Operador deve ter acesso apenas às suas permissões específicas', () => {
        expect(hasPermission(operatorUser, 'pos')).toBe(true);
        expect(hasPermission(operatorUser, 'open_shift')).toBe(true);
        expect(hasPermission(operatorUser, 'delete_sale')).toBe(false);
        expect(hasPermission(operatorUser, 'dashboard')).toBe(false);
    });

    it('Gerente deve ter acesso a funções administrativas delegadas', () => {
        expect(hasPermission(managerUser, 'dashboard')).toBe(true);
        expect(hasPermission(managerUser, 'delete_sale')).toBe(true);
        expect(hasPermission(managerUser, 'full_reset')).toBe(false);
    });

    it('Usuário nulo não deve ter permissão nenhuma', () => {
        expect(hasPermission(null, 'pos')).toBe(false);
    });
});
