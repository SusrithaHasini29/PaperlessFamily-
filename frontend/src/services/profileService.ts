import api from './api';
import { ProfileData, ApiResponse } from '../types';

export const getProfile = async (): Promise<ApiResponse<ProfileData>> => {
  const response = await api.get<ApiResponse<ProfileData>>('/profile');
  return response.data;
};

export const updateProfile = async (
  data: Partial<{ name: string; email: string; profileImage?: string; relationship?: string }>
): Promise<ApiResponse<ProfileData>> => {
  const response = await api.put<ApiResponse<ProfileData>>('/profile', data);
  return response.data;
};

export default {
  getProfile,
  updateProfile,
};
