import api from './api';
import { ProfileData, ApiResponse, FamilyMember } from '../types';

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

export const getProfile = async (): Promise<ApiResponse<ProfileData>> => {
  const user = getCurrentUser();
  const email = getCurrentUserEmail();

  // 1. Try backend
  try {
    const response = await api.get<ApiResponse<ProfileData>>('/profile');
    if (response.data && response.data.data) {
      localStorage.setItem(`paperless_profile_${email}`, JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (e) {}

  // 2. Offline / Vercel fallback
  let relationship = 'Head of Family';
  let familyName = 'Family Space';
  let familyCode = '';

  const famStr = localStorage.getItem(`paperless_family_${email}`) || localStorage.getItem('paperless_family');
  if (famStr) {
    try {
      const parsedFam = JSON.parse(famStr);
      if (parsedFam.familyName) familyName = parsedFam.familyName;
      if (parsedFam.familyCode) familyCode = parsedFam.familyCode;
    } catch (e) {}
  }

  // Check saved profile
  const savedProfileStr = localStorage.getItem(`paperless_profile_${email}`);
  if (savedProfileStr) {
    try {
      const parsed = JSON.parse(savedProfileStr);
      return {
        success: true,
        message: 'User profile',
        data: {
          ...parsed,
          familyName: parsed.familyName || familyName,
          familyCode: parsed.familyCode || familyCode,
        },
      };
    } catch (e) {}
  }

  // Check members list for relationship
  if (familyCode) {
    try {
      const membersStr = localStorage.getItem(`paperless_members_${familyCode}`);
      if (membersStr) {
        const members: FamilyMember[] = JSON.parse(membersStr);
        const currentMember = members.find(m => m.email?.toLowerCase() === email || m.userId === user?.id);
        if (currentMember?.relationship) {
          relationship = currentMember.relationship;
        }
      }
    } catch (e) {}
  }

  const profile: ProfileData = {
    id: user?.id || 1,
    name: user?.name || 'User',
    email: user?.email || email,
    relationship,
    role: 'ADMIN',
    familyName,
    familyCode,
    joinedAt: user?.createdAt || new Date().toISOString(),
  };

  localStorage.setItem(`paperless_profile_${email}`, JSON.stringify(profile));

  return {
    success: true,
    message: 'User profile',
    data: profile,
  };
};

export const updateProfile = async (
  data: Partial<{ name: string; email: string; profileImage?: string; relationship?: string }>
): Promise<ApiResponse<ProfileData>> => {
  const user = getCurrentUser();
  const email = getCurrentUserEmail();

  // 1. Try backend
  try {
    const response = await api.put<ApiResponse<ProfileData>>('/profile', data);
    if (response.data && response.data.data) {
      localStorage.setItem(`paperless_profile_${email}`, JSON.stringify(response.data.data));
      return response.data;
    }
  } catch (e) {}

  // 2. Offline / Vercel fallback
  const curRes = await getProfile();
  const current = curRes.data;

  const updatedProfile: ProfileData = {
    ...current,
    name: data.name !== undefined ? data.name : current.name,
    relationship: data.relationship !== undefined ? data.relationship : current.relationship,
  };

  // Update profile storage
  localStorage.setItem(`paperless_profile_${email}`, JSON.stringify(updatedProfile));

  // Update paperless_user
  if (user && data.name) {
    user.name = data.name;
    localStorage.setItem('paperless_user', JSON.stringify(user));
  }

  // Update member in family members list
  if (updatedProfile.familyCode) {
    try {
      const membersStr = localStorage.getItem(`paperless_members_${updatedProfile.familyCode}`);
      if (membersStr) {
        const members: FamilyMember[] = JSON.parse(membersStr);
        const idx = members.findIndex(m => m.email?.toLowerCase() === email || m.userId === user?.id);
        if (idx !== -1) {
          if (data.name) members[idx].name = data.name;
          if (data.relationship) members[idx].relationship = data.relationship;
          localStorage.setItem(`paperless_members_${updatedProfile.familyCode}`, JSON.stringify(members));
        }
      }
    } catch (e) {}
  }

  return {
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  };
};

export default {
  getProfile,
  updateProfile,
};
