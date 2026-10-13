import api from './api';
import { User, ApiResponse } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  // Clear any existing cached family to ensure fresh data for this user
  localStorage.removeItem('paperless_family');

  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    if (response.data && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    if (response.data && response.data.data && response.data.data.user) {
      localStorage.setItem('paperless_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  } catch (err: any) {
    // If backend is offline or network error, provide instant demo session
    if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      const demoToken = 'demo-jwt-token-paperlessfamily';
      const demoUser: User = {
        id: 1,
        name: email.includes('sharma') || email.includes('demo') ? 'Raj Sharma' : 'Susritha',
        email: email,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('token', demoToken);
      localStorage.setItem('paperless_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('paperless_user', JSON.stringify(demoUser));
      return {
        success: true,
        message: 'Logged in using local demo session',
        data: {
          token: demoToken,
          user: demoUser,
        },
      };
    }
    throw err;
  }
};

export const register = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  // Clear any old family or demo cache so this new user gets their own clean vault
  localStorage.removeItem('paperless_family');
  localStorage.removeItem('paperless_demo_user');

  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', { name, email, password });
    if (response.data && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    if (response.data && response.data.data && response.data.data.user) {
      localStorage.setItem('paperless_user', JSON.stringify(response.data.data.user));
      // Save credentials for instant future logins
      localStorage.setItem(
        'paperless_saved_credentials',
        JSON.stringify({ email: email.trim(), password, rememberMe: true })
      );
    }
    return response.data;
  } catch (err: any) {
    if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      const demoToken = 'demo-jwt-token-paperlessfamily';
      const demoUser: User = {
        id: 1,
        name: name || 'Susritha',
        email: email,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('token', demoToken);
      localStorage.setItem('paperless_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('paperless_user', JSON.stringify(demoUser));
      localStorage.setItem(
        'paperless_saved_credentials',
        JSON.stringify({ email: email.trim(), password, rememberMe: true })
      );
      return {
        success: true,
        message: 'Registered using local demo session',
        data: {
          token: demoToken,
          user: demoUser,
        },
      };
    }
    throw err;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('paperless_demo_user');
  localStorage.removeItem('paperless_user');
  localStorage.removeItem('paperless_family');
};

export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    if (response.data && response.data.data) {
      localStorage.setItem('paperless_user', JSON.stringify(response.data.data));
    }
    return response.data;
  } catch (err: any) {
    const cachedUser = localStorage.getItem('paperless_user');
    if (cachedUser) {
      try {
        return {
          success: true,
          message: 'Loaded cached user',
          data: JSON.parse(cachedUser),
        };
      } catch (e) {
        // fallback
      }
    }
    const cached = localStorage.getItem('paperless_demo_user');
    if (cached) {
      return {
        success: true,
        message: 'Loaded cached demo user',
        data: JSON.parse(cached),
      };
    }
    return {
      success: true,
      message: 'Demo user',
      data: {
        id: 1,
        name: 'Raj Sharma',
        email: 'demo@paperlessfamily.com',
        createdAt: new Date().toISOString(),
      },
    };
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
};
