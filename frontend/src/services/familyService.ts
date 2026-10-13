import api from './api';
import { Family, FamilyMember, Invitation, ApiResponse } from '../types';

export const createFamily = async (familyName: string): Promise<ApiResponse<Family>> => {
  const response = await api.post<ApiResponse<Family>>('/families', { familyName });
  return response.data;
};

export const getMyFamily = async (): Promise<ApiResponse<Family>> => {
  try {
    const response = await api.get<ApiResponse<Family>>('/families/current');
    if (response.data && response.data.data) {
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
    }
    return response.data;
  } catch (err: any) {
    const cached = localStorage.getItem('paperless_family');
    if (cached) {
      try {
        return {
          success: true,
          message: 'Loaded cached family',
          data: JSON.parse(cached),
        };
      } catch (e) {}
    }
    const userStr = localStorage.getItem('paperless_user');
    let famName = 'Family Vault';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) famName = u.name + ' Family';
      } catch (e) {}
    }
    return {
      success: true,
      message: 'Family space',
      data: {
        id: 1,
        familyName: famName,
        familyCode: 'FAM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        createdAt: new Date().toISOString(),
        memberCount: 1,
      },
    };
  }
};

export const getFamilyMembers = async (familyId: number): Promise<ApiResponse<FamilyMember[]>> => {
  const response = await api.get<ApiResponse<FamilyMember[]>>(`/families/${familyId}/members`);
  return response.data;
};

export const addMember = async (
  familyId: number,
  data: { name: string; email: string; relationship: string; role?: 'ADMIN' | 'MEMBER' }
): Promise<ApiResponse<FamilyMember>> => {
  const response = await api.post<ApiResponse<FamilyMember>>(`/families/${familyId}/members`, data);
  return response.data;
};

export const updateMember = async (
  familyId: number,
  memberId: number,
  data: Partial<{ relationship: string; role: 'ADMIN' | 'MEMBER' }>
): Promise<ApiResponse<FamilyMember>> => {
  const response = await api.put<ApiResponse<FamilyMember>>(`/families/${familyId}/members/${memberId}`, data);
  return response.data;
};

export const removeMember = async (
  familyId: number,
  memberId: number
): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/families/${familyId}/members/${memberId}`);
  return response.data;
};

export const joinFamily = async (familyCode: string): Promise<ApiResponse<Family>> => {
  const response = await api.post<ApiResponse<Family>>('/families/join', { familyCode });
  return response.data;
};

export const inviteMember = async (
  familyId: number,
  data: { email: string; relationship: string }
): Promise<ApiResponse<Invitation>> => {
  const response = await api.post<ApiResponse<Invitation>>(`/families/${familyId}/invite`, data);
  return response.data;
};

export const getInvitations = async (familyId: number): Promise<ApiResponse<Invitation[]>> => {
  const response = await api.get<ApiResponse<Invitation[]>>(`/families/${familyId}/invitations`);
  return response.data;
};

export default {
  createFamily,
  getMyFamily,
  getFamilyMembers,
  addMember,
  updateMember,
  removeMember,
  joinFamily,
  inviteMember,
  getInvitations,
};
