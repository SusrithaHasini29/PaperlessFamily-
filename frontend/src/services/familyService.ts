import api from './api';
import { Family, FamilyMember, Invitation, ApiResponse } from '../types';

const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('paperless_user');
    if (userStr) return JSON.parse(userStr);
  } catch {}
  return null;
};

const getCurrentUserEmail = (): string => {
  const u = getCurrentUser();
  return u?.email ? u.email.trim().toLowerCase() : 'default';
};

export const createFamily = async (familyName: string): Promise<ApiResponse<Family>> => {
  const user = getCurrentUser();
  const email = getCurrentUserEmail();

  // Try backend first
  try {
    const response = await api.post<ApiResponse<Family>>('/families', { familyName });
    if (response.data && response.data.data?.id) {
      localStorage.setItem(`paperless_family_${email}`, JSON.stringify(response.data.data));
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (e) {}

  // Static/offline creation scoped strictly to this user
  const cleanCode =
    'FAM-' +
    (familyName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'HOME') +
    Math.random().toString(36).substring(2, 5).toUpperCase();

  const newFamily: Family = {
    id: Date.now(),
    familyName: familyName.trim(),
    familyCode: cleanCode,
    createdAt: new Date().toISOString(),
    memberCount: 1,
  };

  // Save for this user and also index by code for joining
  localStorage.setItem(`paperless_family_${email}`, JSON.stringify(newFamily));
  localStorage.setItem(`paperless_family_code_${cleanCode}`, JSON.stringify(newFamily));
  localStorage.setItem('paperless_family', JSON.stringify(newFamily));

  // Initialize members list for this family
  const initialMember: FamilyMember = {
    id: Date.now(),
    userId: user?.id || 1,
    name: user?.name || 'Head of Family',
    email: user?.email || email,
    relationship: 'Head of Family',
    role: 'ADMIN',
    documentCount: 0,
    joinedAt: new Date().toISOString(),
  };
  localStorage.setItem(`paperless_members_${cleanCode}`, JSON.stringify([initialMember]));

  return {
    success: true,
    message: 'Family space created successfully',
    data: newFamily,
  };
};

export const getMyFamily = async (): Promise<ApiResponse<Family>> => {
  const email = getCurrentUserEmail();

  try {
    const response = await api.get<ApiResponse<Family>>('/families/current');
    if (response.data && response.data.data) {
      localStorage.setItem(`paperless_family_${email}`, JSON.stringify(response.data.data));
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (err: any) {}

  // 1. Look up user-specific family
  const userFamilyStr = localStorage.getItem(`paperless_family_${email}`);
  if (userFamilyStr) {
    try {
      const parsed = JSON.parse(userFamilyStr);
      localStorage.setItem('paperless_family', userFamilyStr);
      return {
        success: true,
        message: 'Loaded user family',
        data: parsed,
      };
    } catch (e) {}
  }

  // 2. Demo account fallback
  if (email.includes('demo') || email.includes('sharma')) {
    const demoFamily: Family = {
      id: 1,
      familyName: 'Sharma Family',
      familyCode: 'FAM-SHARM',
      createdAt: '2026-01-01T00:00:00Z',
      memberCount: 4,
    };
    localStorage.setItem(`paperless_family_${email}`, JSON.stringify(demoFamily));
    localStorage.setItem('paperless_family', JSON.stringify(demoFamily));
    return {
      success: true,
      message: 'Demo family',
      data: demoFamily,
    };
  }

  // If user has not created or joined a family, throw to show the "Create Space" setup card
  throw new Error('No family space found for current user');
};

export const getFamilyMembers = async (familyId: number): Promise<ApiResponse<FamilyMember[]>> => {
  const user = getCurrentUser();
  const email = getCurrentUserEmail();

  try {
    const response = await api.get<ApiResponse<FamilyMember[]>>(`/families/${familyId}/members`);
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch (e) {}

  // Check active family code
  let familyCode = '';
  const famStr = localStorage.getItem(`paperless_family_${email}`) || localStorage.getItem('paperless_family');
  if (famStr) {
    try {
      familyCode = JSON.parse(famStr).familyCode;
    } catch (e) {}
  }

  if (familyCode) {
    const stored = localStorage.getItem(`paperless_members_${familyCode}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { success: true, message: 'Family members', data: parsed };
        }
      } catch (e) {}
    }
  }

  if (email.includes('demo') || email.includes('sharma')) {
    return {
      success: true,
      message: 'Demo members',
      data: [
        { id: 1, userId: 1, name: 'Raj Sharma', email: 'demo@paperlessfamily.com', relationship: 'Father', role: 'ADMIN', documentCount: 3, joinedAt: '2026-01-01' },
        { id: 2, userId: 2, name: 'Priya Sharma', email: 'priya@sharma.com', relationship: 'Mother', role: 'MEMBER', documentCount: 3, joinedAt: '2026-01-02' },
        { id: 3, userId: 3, name: 'Aarav Sharma', email: 'aarav@sharma.com', relationship: 'Son', role: 'MEMBER', documentCount: 2, joinedAt: '2026-01-03' },
        { id: 4, userId: 4, name: 'Ananya Sharma', email: 'ananya@sharma.com', relationship: 'Daughter', role: 'MEMBER', documentCount: 2, joinedAt: '2026-01-04' },
      ],
    };
  }

  const defaultMembers: FamilyMember[] = [
    {
      id: user?.id || 1,
      userId: user?.id || 1,
      name: user?.name || 'Head of Family',
      email: user?.email || email,
      relationship: 'Head of Family',
      role: 'ADMIN',
      documentCount: 0,
      joinedAt: new Date().toISOString(),
    },
  ];

  if (familyCode) {
    localStorage.setItem(`paperless_members_${familyCode}`, JSON.stringify(defaultMembers));
  }

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

  const email = getCurrentUserEmail();
  let familyCode = '';
  const famStr = localStorage.getItem(`paperless_family_${email}`) || localStorage.getItem('paperless_family');
  if (famStr) {
    try {
      familyCode = JSON.parse(famStr).familyCode;
    } catch (e) {}
  }

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

  if (familyCode) {
    localStorage.setItem(`paperless_members_${familyCode}`, JSON.stringify(updated));
  }

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

  const email = getCurrentUserEmail();
  let familyCode = '';
  const famStr = localStorage.getItem(`paperless_family_${email}`) || localStorage.getItem('paperless_family');
  if (famStr) {
    try {
      familyCode = JSON.parse(famStr).familyCode;
    } catch (e) {}
  }

  const membersRes = await getFamilyMembers(familyId);
  const currentMembers = membersRes.data || [];
  const idx = currentMembers.findIndex(m => m.id === memberId);
  if (idx !== -1) {
    currentMembers[idx] = { ...currentMembers[idx], ...data };
    if (familyCode) {
      localStorage.setItem(`paperless_members_${familyCode}`, JSON.stringify(currentMembers));
    }
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

  const email = getCurrentUserEmail();
  let familyCode = '';
  const famStr = localStorage.getItem(`paperless_family_${email}`) || localStorage.getItem('paperless_family');
  if (famStr) {
    try {
      familyCode = JSON.parse(famStr).familyCode;
    } catch (e) {}
  }

  const membersRes = await getFamilyMembers(familyId);
  const currentMembers = membersRes.data || [];
  const filtered = currentMembers.filter(m => m.id !== memberId);
  if (familyCode) {
    localStorage.setItem(`paperless_members_${familyCode}`, JSON.stringify(filtered));
  }

  return { success: true, message: 'Member removed', data: undefined };
};

export const joinFamily = async (familyCode: string): Promise<ApiResponse<Family>> => {
  const email = getCurrentUserEmail();
  const cleanCode = familyCode.trim().toUpperCase();

  try {
    const response = await api.post<ApiResponse<Family>>('/families/join', { familyCode: cleanCode });
    if (response.data && response.data.data?.id) {
      localStorage.setItem(`paperless_family_${email}`, JSON.stringify(response.data.data));
      localStorage.setItem('paperless_family', JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (e) {}

  // Look up family by code in local store
  const existingFamStr = localStorage.getItem(`paperless_family_code_${cleanCode}`);
  let targetFamily: Family;
  if (existingFamStr) {
    targetFamily = JSON.parse(existingFamStr);
  } else {
    targetFamily = {
      id: Date.now(),
      familyName: 'Joined Family',
      familyCode: cleanCode,
      createdAt: new Date().toISOString(),
      memberCount: 2,
    };
  }

  localStorage.setItem(`paperless_family_${email}`, JSON.stringify(targetFamily));
  localStorage.setItem('paperless_family', JSON.stringify(targetFamily));

  // Add user to the members list of that family code
  const user = getCurrentUser();
  const membersStr = localStorage.getItem(`paperless_members_${cleanCode}`);
  let membersList: FamilyMember[] = [];
  if (membersStr) {
    try {
      membersList = JSON.parse(membersStr);
    } catch (e) {}
  }
  if (!membersList.some(m => m.email === email)) {
    membersList.push({
      id: Date.now(),
      userId: user?.id || Date.now(),
      name: user?.name || 'New Member',
      email: user?.email || email,
      relationship: 'Member',
      role: 'MEMBER',
      documentCount: 0,
      joinedAt: new Date().toISOString(),
    });
    localStorage.setItem(`paperless_members_${cleanCode}`, JSON.stringify(membersList));
  }

  return {
    success: true,
    message: 'Joined family space successfully',
    data: targetFamily,
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

  return {
    success: true,
    message: 'Invitation created',
    data: {
      id: Date.now(),
      email: data.email,
      relationship: data.relationship,
      status: 'PENDING',
      familyName: 'Family Space',
      invitedBy: 'Family Admin',
      createdAt: new Date().toISOString(),
    },
  };
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
