import api from './api';
import { Conversation, ChatMessage, ApiResponse } from '../types';

export interface ChatResponse {
  conversationId: number;
  message?: string;
  response?: string;
  sender?: 'AI';
  createdAt?: string;
  timestamp?: string;
}

export const sendMessage = async (
  message: string,
  conversationId?: number
): Promise<ApiResponse<ChatResponse>> => {
  const response = await api.post<ApiResponse<ChatResponse>>('/ai/chat', {
    message,
    conversationId,
  });
  const resData = response.data;
  if (resData && resData.data) {
    const text = resData.data.response || resData.data.message || '';
    resData.data.message = text;
    resData.data.response = text;
    resData.data.sender = 'AI';
    resData.data.createdAt = resData.data.timestamp || resData.data.createdAt || new Date().toISOString();
  }
  return resData;
};

export const getConversations = async (): Promise<ApiResponse<Conversation[]>> => {
  const response = await api.get<ApiResponse<Conversation[]>>('/ai/conversations');
  return response.data;
};

export const getConversationMessages = async (
  id: number
): Promise<ApiResponse<ChatMessage[]>> => {
  const response = await api.get<ApiResponse<ChatMessage[]>>(`/ai/conversations/${id}/messages`);
  return response.data;
};

export const deleteConversation = async (id: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/ai/conversations/${id}`);
  return response.data;
};

export default {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteConversation,
};
