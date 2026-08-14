import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { User } from '../types';
import { hashPassword } from '../services/cryptoService';
import { safeLocalStorage } from '../utils/storage';
import { ALL_PERMISSIONS } from '../constants/permissions';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const syncCurrentUser = useCallback((users: User[]) => {
    if (currentUser && users.length > 0) {
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser) {
        const currentPerms = JSON.stringify([...(currentUser.permissions || [])].sort());
        const freshPerms = JSON.stringify([...(freshUser.permissions || [])].sort());
        const currentUnits = JSON.stringify(currentUser.allowedUnits || []);
        const freshUnits = JSON.stringify(freshUser.allowedUnits || []);

        if (currentPerms !== freshPerms || currentUnits !== freshUnits) {
          console.log("Sessão atualizada com novas permissões");
          setCurrentUser(prev => prev ? ({ ...prev, ...freshUser }) : null);
        }
      }
    }
  }, [currentUser]);

  const handleLogin = useCallback((u: string, p: string, users: User[]) => {
    setLoginError(null);
    let found = users.find(user => user.username === u && (user.password === p || user.password === hashPassword(p)));
    
    // Recovery bypass: se for o admin com a senha correta, permite o login mesmo se a lista local/sync estiver vazia
    if (!found && u === 'admin' && hashPassword(p) === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9') {
      found = {
        id: 'admin-recovery',
        username: 'admin',
        password: hashPassword(p),
        displayName: 'Administrador (Resgate)',
        permissions: ALL_PERMISSIONS,
        allowedUnits: []
      } as any;
    }

    if (found) {
      const userToLogin = {
        ...found,
        permissions: found.username === 'admin' ? ALL_PERMISSIONS : (found.permissions || [])
      };
      setCurrentUser(JSON.parse(JSON.stringify(userToLogin)));
    } else {
      setLoginError("Credenciais inválidas.");
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const enableDemoMode = useCallback(() => {
    setCurrentUser({
      id: 'admin-demo',
      username: 'demo_user',
      password: '',
      displayName: 'Visitante (Demo)',
      permissions: ALL_PERMISSIONS,
      allowedUnits: ['unit-demo']
    } as any);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    currentUserRef,
    loginError,
    setLoginError,
    handleLogin,
    syncCurrentUser,
    logout,
    enableDemoMode
  };
};

export const AuthContext = createContext<{ currentUser: User | null }>({ currentUser: null });

export const useCurrentUser = () => useContext(AuthContext);

export const useIsAdmin = () => {
  const { currentUser } = useCurrentUser();
  return currentUser?.username === 'admin';
};
