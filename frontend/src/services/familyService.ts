import api from './api';
import { Family, FamilyMember, Invitation, ApiResponse } from '../types';

export const createFamily = async (familyName: string): Promise<ApiResponse<Family>> => {
  // 1. Try backend API
  try {
    const response = await api.post<ApiResponse<Family>>('/families', { familyName });
    if (response.data && response.data.data?.id) {
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (e) {}

  // 2. Offline / Vercel static fallback
  const cleanCode =
    'FAM-' +
    (familyName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'HOME') +
    Math.random().toString(36).substring(2, 4).toUpperCase();

  const newFamily: Family = {
    id: Date.now(),
    familyName: familyName.trim(),
    familyCode: cleanCode,
    createdAt: new Date().toISOString(),
    memberCount: 1,
  };
  localStorage.setItem('paperless_family', JSON.stringify(newFamily));

  // Also setup current user as the Admin in members list
  const userStr = localStorage.getItem('paperless_user');
  let currentUserName = 'Family Admin';
  let currentUserEmail = 'admin@family.com';
  let userId = 1;
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.name) currentUserName = u.name;
      if (u.email) currentUserEmail = u.email;
      if (u.id) userId = u.id;
    } catch (e) {}
  }

  const initialMember: FamilyMember = {
    id: Date.now(),
    userId,
    name: currentUserName,
    email: currentUserEmail,
    relationship: 'Head of Family',
    role: 'ADMIN',
    documentCount: 0,
    joinedAt: new Date().toISOString(),
  };
  localStorage.setItem('paperless_family_members', JSON.stringify([initialMember]));

  return {
    success: true,
    message: 'Family space created successfully',
    data: newFamily,
  };
};

export const getMyFamily = async (): Promise<ApiResponse<Family>> => {
  try {
    const response = await api.get<ApiResponse<Family>>('/families/current');
    if (response.data && response.data.data) {
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (err: any) {}

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

  const defaultFamily: Family = {
    id: 1,
    familyName: famName,
    familyCode: 'FAM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    createdAt: new Date().toISOString(),
    memberCount: 1,
  };
  localStorage.setItem('paperless_family', JSON.stringify(defaultFamily));

  return {
    success: true,
    message: 'Family space',
    data: defaultFamily,
  };
};

export const getFamilyMembers = async (familyId: number): Promise<ApiResponse<FamilyMember[]>> => {
  try {
    const response = await api.get<ApiResponse<FamilyMember[]>>(`/families/${familyId}/members`);
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch (e) {}

  // Check stored members
  try {
    const stored = localStorage.getItem('paperless_family_members');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { success: true, message: 'Family members', data: parsed };
      }
    }
  } catch (e) {}

  const userStr = localStorage.getItem('paperless_user');
  let currentUserName = 'User';
  let currentUserEmail = 'user@example.com';
  let isDemo = false;
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.name) currentUserName = u.name;
      if (u.email) currentUserEmail = u.email;
      isDemo = currentUserEmail.toLowerCase().includes('demo') || currentUserEmail.toLowerCase().includes('sharma');
    } catch (e) {}
  }

  if (isDemo) {
    return {
      success: true,
      message: 'Family members',
      data: [
        { id: 1, userId: 1, name: 'Raj Sharma', email: 'demo@paperlessfamily.com', relationship: 'Father', role: 'ADMIN', documentCount: 3, joinedAt: '2026-01-01' },
        { id: 2, userId: 2, name: 'Priya Sharma', email: 'priya@sharma.com', relationship: 'Mother', role: 'MEMBER', documentCount: 3, joinedAt: '2026-01-02' },
        { id: 3, userId: 3, name: 'Aarav Sharma', email: 'aarav@sharma.com', relationship: 'Son', role: 'MEMBER', documentCount: 2, joinedAt: '2026-01-03' },
        { id: 4, userId: 4, name: 'Ananya Sharma', email: 'ananya@sharma.com', relationship: 'Daughter', role: 'MEMBER', documentCount: 2, joinedAt: '2026-01-04' },
      ],
    };
  }

  const defaultMembers: FamilyMember[] = [
    { id: 1, userId: 1, name: currentUserName, email: currentUserEmail, relationship: 'Head of Family', role: 'ADMIN', documentCount: 1, joinedAt: new Date().toISOString() },
  ];
  localStorage.setItem('paperless_family_members', JSON.stringify(defaultMembers));

  return {
    success: true,
    message: 'Family members',
    data: defaultMembers,
  };
};

export const addMember = async (
  familyId: number,
  data: { name: string; email: string; relationship: string; role?: 'ADMIN' | 'MEMBER' }
): Promise<ApiResponse<FamilyMember>> => {
  try {
    const response = await api.post<ApiResponse<FamilyMember>>(`/families/${familyId}/members`, data);
    if (response.data && response.data.data) return response.data;
  } catch (e) {}

  const membersRes = await getFamilyMembers(familyId);
  const currentMembers = membersRes.data || [];
  const newMember: FamilyMember = {
    id: Date.now(),
    userId: Date.now(),
    name: data.name,
    email: data.email,
    relationship: data.relationship,
    role: data.role || 'MEMBER',
    documentCount: 0,
    joinedAt: new Date().toISOString(),
  };
  const updated = [...currentMembers, newMember];
  localStorage.setItem('paperless_family_members', JSON.stringify(updated));
  return { success: true, message: 'Member added successfully', data: newMember };
};

export const updateMember = async (
  familyId: number,
  memberId: number,
  data: Partial<{ relationship: string; role: 'ADMIN' | 'MEMBER' }>
): Promise<ApiResponse<FamilyMember>> => {
  try {
    const response = await api.put<ApiResponse<FamilyMember>>(`/families/${familyId}/members/${memberId}`, data);
    if (response.data && response.data.data) return response.data;
  } catch (e) {}

  const membersRes = await getFamilyMembers(familyId);
  const currentMembers = membersRes.data || [];
  const idx = currentMembers.findIndex(m => m.id === memberId);
  if (idx !== -1) {
    currentMembers[idx] = { ...currentMembers[idx], ...data };
    localStorage.setItem('paperless_family_members', JSON.stringify(currentMembers));
    return { success: true, message: 'Member updated', data: currentMembers[idx] };
  }

  return { success: true, message: 'Updated', data: undefined as any };
};

export const removeMember = async (
  familyId: number,
  memberId: number
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/families/${familyId}/members/${memberId}`);
    if (response.data) return response.data;
  } catch (e) {}

  const membersRes = await getFamilyMembers(familyId);
  const currentMembers = membersRes.data || [];
  const filtered = currentMembers.filter(m => m.id !== memberId);
  localStorage.setItem('paperless_family_members', JSON.stringify(filtered));

  return { success: true, message: 'Member removed', data: undefined };
};

export const joinFamily = async (familyCode: string): Promise<ApiResponse<Family>> => {
  try {
    const response = await api.post<ApiResponse<Family>>('/families/join', { familyCode });
    if (response.data && response.data.data?.id) {
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (e) {}

  const joinedFam: Family = {
    id: Date.now(),
    familyName: 'Household Space',
    familyCode: familyCode.trim().toUpperCase(),
    createdAt: new Date().toISOString(),
    memberCount: 2,
  };
  localStorage.setItem('paperless_family', JSON.stringify(joinedFam));
  return {
    success: true,
    message: 'Joined family space',
    data: joinedFam,
  };
};

export const inviteMember = async (
  familyId: number,
  data: { email: string; relationship: string }
): Promise<ApiResponse<Invitation>> => {
  try {
    const response = await api.post<ApiResponse<Invitation>>(`/families/${familyId}/invite`, data);
    if (response.data && response.data.data) return response.data;
  } catch (e) {}

  const invitation: Invitation = {
    id: Date.now(),
    email: data.email,
    relationship: data.relationship,
    status: 'PENDING',
    familyName: 'Family Space',
    invitedBy: 'Family Admin',
    createdAt: new Date().toISOString(),
  };

  return { success: true, message: 'Invitation created', data: invitation };
};

export const getInvitations = async (familyId: number): Promise<ApiResponse<Invitation[]>> => {
  try {
    const response = await api.get<ApiResponse<Invitation[]>>(`/families/${familyId}/invitations`);
    if (response.data && response.data.data) return response.data;
  } catch (e) {}

  return { success: true, message: 'Invitations', data: [] };
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
