export interface User {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
  createdAt: string;
}

export interface Family {
  id: number;
  familyName: string;
  familyCode: string;
  createdAt: string;
  memberCount: number;
}

export interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  relationship: string;
  role: 'ADMIN' | 'MEMBER';
  documentCount: number;
  joinedAt: string;
}

export interface Document {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  ownerName: string;
  ownerId: number;
  familyId: number;
  familyCode?: string;
  userEmail?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  issueDate?: string;
  expiryDate?: string;
  description?: string;
  extractedText?: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  uploadedAt: string;
  uploadedBy: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  sender: 'USER' | 'AI';
  message: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  lastMessage?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  totalMembers: number;
  expiringSoon: number;
  storageUsed: string;
}

export interface Invitation {
  id: number;
  email: string;
  relationship: string;
  status: string;
  familyName: string;
  invitedBy: string;
  createdAt: string;
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
  relationship: string;
  role: string;
  familyName: string;
  familyCode: string;
  joinedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Category {
  name: string;
  icon: string;
  subcategories: string[];
}
