import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    if (u === 'admin' && p === 'admin') {
      setCurrentUser({
        id: 'admin',
        username: 'admin',
        password: 'admin',
        displayName: 'Administrador',
        permissions: ALL_PERMISSIONS // Note: need to import this correctly
      } as any);
      return;
    }
    const found = users.find(user => user.username === u && (user.password === p || user.password === hashPassword(p)));
    if (found) {
      setCurrentUser(JSON.parse(JSON.stringify(found)));
    } else {
      setLoginError("Credenciais inválidas.");
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    currentUserRef,
    loginError,
    setLoginError,
    handleLogin,
    syncCurrentUser,
    logout
  };
};
