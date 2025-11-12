import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import mockData from '../data/mockData';
import { AUTH_ENABLED } from '../constants/featureFlags';

const AuthContext = createContext(null);
const BYPASS_STORAGE_KEY = 'financeEduAuthBypass';
const baseUser = mockData.user;

const initialState = {
  isAuthenticated: !AUTH_ENABLED,
  user: !AUTH_ENABLED ? baseUser : null,
  ready: !AUTH_ENABLED,
  bypassed: !AUTH_ENABLED,
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const isBypassQuery = params.get('auth') === 'off';
    const storedBypass = localStorage.getItem(BYPASS_STORAGE_KEY) === 'true';

    if (isBypassQuery || storedBypass) {
      localStorage.setItem(BYPASS_STORAGE_KEY, 'true');
      setState({
        isAuthenticated: true,
        user: baseUser,
        ready: true,
        bypassed: true,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      ready: true,
      bypassed: false,
    }));
  }, []);

  const login = useCallback(({ email, name }) => {
    setState({
      isAuthenticated: true,
      user: {
        ...baseUser,
        name: name || baseUser.name,
        email,
      },
      ready: true,
      bypassed: false,
    });
    localStorage.removeItem(BYPASS_STORAGE_KEY);
    return true;
  }, []);

  const register = useCallback(
    ({ email, name }) =>
      login({
        email,
        name,
      }),
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(BYPASS_STORAGE_KEY);

    if (!AUTH_ENABLED) {
      return;
    }

    setState({
      isAuthenticated: false,
      user: null,
      ready: true,
      bypassed: false,
    });
  }, []);

  const enableBypass = useCallback(() => {
    localStorage.setItem(BYPASS_STORAGE_KEY, 'true');
    setState({
      isAuthenticated: true,
      user: baseUser,
      ready: true,
      bypassed: true,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      enableBypass,
      authEnabled: AUTH_ENABLED,
    }),
    [state, login, register, logout, enableBypass]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

