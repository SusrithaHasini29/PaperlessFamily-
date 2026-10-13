import api from './api';
import { Document, DashboardStats, Category, ApiResponse } from '../types';

export interface DocumentQueryParams {
  familyId?: number;
  category?: string;
  ownerId?: number;
  search?: string;
  sort?: string;
}

export const getDocuments = async (params?: DocumentQueryParams): Promise<ApiResponse<Document[]>> => {
  const queryParams: Record<string, any> = { ...params };
  if (!queryParams.familyId) {
    try {
      const cachedFamily = localStorage.getItem('paperless_family');
      if (cachedFamily) {
        const parsed = JSON.parse(cachedFamily);
        if (parsed.id) queryParams.familyId = parsed.id;
      }
    } catch {}
    if (!queryParams.familyId) {
      queryParams.familyId = 1;
    }
  }
  const response = await api.get<ApiResponse<Document[]>>('/documents', { params: queryParams });
  return response.data;
};

export const getDocument = async (id: number): Promise<ApiResponse<Document>> => {
  const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
  return response.data;
};

export const uploadDocument = async (formData: FormData): Promise<ApiResponse<Document>> => {
  const response = await api.post<ApiResponse<Document>>('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateDocument = async (id: number, data: Partial<Document>): Promise<ApiResponse<Document>> => {
  const response = await api.put<ApiResponse<Document>>(`/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/documents/${id}`);
  return response.data;
};

export const getExpiringDocuments = async (): Promise<ApiResponse<Document[]>> => {
  const response = await api.get<ApiResponse<Document[]>>('/documents/expiring');
  return response.data;
};

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await api.get<ApiResponse<DashboardStats>>('/documents/stats');
  return response.data;
};

export const downloadDocument = async (id: number): Promise<Blob> => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

export const previewDocument = async (id: number): Promise<Blob> => {
  const response = await api.get(`/documents/${id}/preview`, {
    responseType: 'blob',
  });
  return response.data;
};

export const triggerFileDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response = await api.get<ApiResponse<Category[]>>('/documents/categories');
  return response.data;
};

export default {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getExpiringDocuments,
  getDashboardStats,
  downloadDocument,
  previewDocument,
  triggerFileDownload,
  getCategories,
};
