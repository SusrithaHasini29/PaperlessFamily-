import api from './api';
import { User, ApiResponse } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const cleanEmail = email.trim().toLowerCase();

  // Try backend API first
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email: cleanEmail, password });
    if (response.data && typeof response.data === 'object' && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.user) {
        localStorage.setItem('paperless_user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    }
    throw new Error('Static host without backend');
  } catch (err: any) {
    // Static Vercel fallback: isolate session by email
    const isDemo = cleanEmail.includes('demo') || cleanEmail.includes('sharma');
    const demoToken = 'jwt-token-' + cleanEmail;
    const userName = isDemo ? 'Raj Sharma' : (cleanEmail.split('@')[0] || 'User');
    const user: User = {
      id: isDemo ? 1 : Math.abs(cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)),
      name: userName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('token', demoToken);
    localStorage.setItem('paperless_user', JSON.stringify(user));

    // Restore this user's specific family if they already created one
    const userFamilyStr = localStorage.getItem(`paperless_family_${cleanEmail}`);
    if (userFamilyStr) {
      localStorage.setItem('paperless_family', userFamilyStr);
    } else {
      localStorage.removeItem('paperless_family');
    }

    return {
      success: true,
      message: 'Signed in successfully',
      data: {
        token: demoToken,
        user,
      },
    };
  }
};

export const register = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', { name, email: cleanEmail, password });
    if (response.data && typeof response.data === 'object' && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.user) {
        localStorage.setItem('paperless_user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    }
    throw new Error('Static host without backend');
  } catch (err: any) {
    const demoToken = 'jwt-token-' + cleanEmail;
    const user: User = {
      id: Math.abs(cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) || Date.now(),
      name: name.trim() || 'User',
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('token', demoToken);
    localStorage.setItem('paperless_user', JSON.stringify(user));
    // New user starts without a family space until they create or join one
    localStorage.removeItem('paperless_family');

    return {
      success: true,
      message: 'Registered successfully',
      data: {
        token: demoToken,
        user,
      },
    };
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
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
      } catch (e) {}
    }
    return {
      success: true,
      message: 'Default user',
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
