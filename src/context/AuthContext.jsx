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
import * as authApi from '../services/authApi';

const AuthContext = createContext(null);
const BYPASS_STORAGE_KEY = 'financeEduAuthBypass';
const JWT_TOKEN_KEY = 'jwt_token';
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

    // Check if there's a stored JWT token
    const storedToken = localStorage.getItem(JWT_TOKEN_KEY);
    if (storedToken) {
      // Fetch user info from API
      authApi.getCurrentUser()
        .then((userInfo) => {
          setState({
            isAuthenticated: true,
            user: {
              id: userInfo.id,
              username: userInfo.username,
              name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.username,
              email: userInfo.email || userInfo.username,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              dob: userInfo.dob,
              phone: userInfo.phone,
              roles: userInfo.roles || [],
              avatar: '👤',
              level: 1,
              points: 0,
            },
            ready: true,
            bypassed: false,
          });
        })
        .catch((error) => {
          console.error('Failed to fetch user info:', error);
          // If token is invalid, clear it
          authApi.removeToken();
          setState({
            isAuthenticated: false,
            user: null,
            ready: true,
            bypassed: false,
          });
        });
      return;
    }

    setState((prev) => ({
      ...prev,
      ready: true,
      bypassed: false,
    }));
  }, []);

  const login = useCallback(async ({ username, password, token }) => {
    try {
      let finalToken = token;

      // If no token provided, login to get token
      if (!finalToken && username && password) {
        const loginResult = await authApi.login(username, password);
        finalToken = loginResult.token;
      }

      // Save token to localStorage
      if (finalToken) {
        authApi.setToken(finalToken);
      } else {
        throw new Error('No token received');
      }

      // Fetch user info from API
      const userInfo = await authApi.getCurrentUser();

      setState({
        isAuthenticated: true,
        user: {
          id: userInfo.id,
          username: userInfo.username,
          name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.username,
          email: userInfo.email || userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          dob: userInfo.dob,
          phone: userInfo.phone,
          roles: userInfo.roles || [],
          avatar: '👤',
          level: 1,
          points: 0,
        },
        ready: true,
        bypassed: false,
      });

      localStorage.removeItem(BYPASS_STORAGE_KEY);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Đăng nhập thất bại'
      };
    }
  }, []);

  const register = useCallback(
    ({ email, name }) =>
      login({
        email,
        name,
      }),
    [login]
  );

  const logout = useCallback(async () => {
    try {
      const token = authApi.getStoredToken();
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem(BYPASS_STORAGE_KEY);
      authApi.removeToken();

      if (!AUTH_ENABLED) {
        return;
      }

      setState({
        isAuthenticated: false,
        user: null,
        ready: true,
        bypassed: false,
      });
    }
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

  const getToken = useCallback(() => {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }, []);

  const setUser = useCallback((updatedUser) => {
    setState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      enableBypass,
      getToken,
      setUser,
      authEnabled: AUTH_ENABLED,
    }),
    [state, login, register, logout, enableBypass, getToken, setUser]
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

