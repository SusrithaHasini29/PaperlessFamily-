import api from './api';
import { User, ApiResponse } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

// Generate a stable numeric ID from an email string (deterministic hash)
const emailToId = (email: string): number => {
  let hash = 5381;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) + hash) ^ email.charCodeAt(i);
  }
  return Math.abs(hash) % 9000000 + 1000000; // Always 7-digit positive number
};

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

    // Try to restore an existing registered user profile for this email
    const existingUserStr = localStorage.getItem(`paperless_registered_user_${cleanEmail}`);
    let user: User;

    if (existingUserStr) {
      try {
        user = JSON.parse(existingUserStr);
      } catch {
        user = buildDefaultUser(cleanEmail);
      }
    } else {
      user = buildDefaultUser(cleanEmail);
    }

    const demoToken = 'jwt-token-' + cleanEmail;
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
      data: { token: demoToken, user },
    };
  }
};

const buildDefaultUser = (cleanEmail: string): User => {
  const isDemo = cleanEmail.includes('demo') || cleanEmail.includes('sharma');
  const displayName = isDemo ? 'Raj Sharma' : (cleanEmail.split('@')[0] || 'User');
  return {
    id: emailToId(cleanEmail),
    name: displayName,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
  };
};

export const register = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'User';

  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', { name: cleanName, email: cleanEmail, password });
    if (response.data && typeof response.data === 'object' && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.user) {
        localStorage.setItem('paperless_user', JSON.stringify(response.data.data.user));
        // Save registration profile for future logins
        localStorage.setItem(`paperless_registered_user_${cleanEmail}`, JSON.stringify(response.data.data.user));
      }
      return response.data;
    }
    throw new Error('Static host without backend');
  } catch (err: any) {
    const user: User = {
      id: emailToId(cleanEmail),
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    const demoToken = 'jwt-token-' + cleanEmail;
    localStorage.setItem('token', demoToken);
    localStorage.setItem('paperless_user', JSON.stringify(user));
    // Save registration profile so future logins restore the real name
    localStorage.setItem(`paperless_registered_user_${cleanEmail}`, JSON.stringify(user));
    // New user starts without a family space until they create or join one
    localStorage.removeItem('paperless_family');

    return {
      success: true,
      message: 'Registered successfully',
      data: { token: demoToken, user },
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
    // Last resort: return anonymous user; they'll need to log in
    return {
      success: false,
      message: 'Not authenticated',
      data: {
        id: 0,
        name: 'Guest',
        email: '',
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
