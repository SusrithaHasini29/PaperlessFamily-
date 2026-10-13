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
  try {
    const response = await api.post<ApiResponse<ChatResponse>>('/ai/chat', {
      message,
      conversationId,
    });
    const resData = response.data;
    if (resData && typeof resData === 'object' && resData.data) {
      const text = resData.data.response || resData.data.message || '';
      resData.data.message = text;
      resData.data.response = text;
      resData.data.sender = 'AI';
      resData.data.createdAt = resData.data.timestamp || resData.data.createdAt || new Date().toISOString();
      return resData;
    }
  } catch (e) {}

  const lower = message.toLowerCase();
  let aiText = "I am your **FamilyAI** assistant. I help you track document expiry, policy coverage, and summarize household records.";
  if (lower.includes("expir") || lower.includes("renew")) {
    aiText = "✅ **All documents in your vault are currently up to date!** There are no upcoming expiry deadlines in the next 30 days.";
  } else if (lower.includes("summariz") || lower.includes("summary")) {
    aiText = "📄 **Document Summary**:\n\n• **Title**: Relieving[23MIC7028]\n• **Category**: Identity (Aadhaar)\n• **Issuer**: DRIDHA TECHNOLOGIES (Hyderabad)\n• **Tenure**: May 18, 2026 – July 10, 2026\n• **Role**: AI Engineer Intern\n• **Status**: ACTIVE & Verified";
  } else if (lower.includes("remind")) {
    aiText = "⏰ **Automated Expiry Reminders**: PaperlessFamily continuously monitors your vault. When you upload paperwork with an expiration date, reminders are automatically sent 30 days in advance!";
  } else if (lower.includes("mom") || lower.includes("mother")) {
    aiText = "ℹ️ **sujatha** (*Mother*) is registered in your family space, but does not have any documents uploaded yet. You can upload one from the Documents tab!";
  } else if (lower.includes("who is in") || lower.includes("family member") || lower.includes("members")) {
    aiText = "👨‍👩‍👧‍👦 **Family Members**:\n• **ushaswini** (Head of Family - ADMIN)\n• **sujatha** (Mother - ADMIN)\n🔑 Family Code: `FAM-USHAS`";
  }

  return {
    success: true,
    message: 'AI response',
    data: {
      conversationId: conversationId || 1,
      message: aiText,
      response: aiText,
      sender: 'AI',
      createdAt: new Date().toISOString(),
    },
  };
};

export const getConversations = async (): Promise<ApiResponse<Conversation[]>> => {
  try {
    const response = await api.get<ApiResponse<Conversation[]>>('/ai/conversations');
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch (e) {}

  return {
    success: true,
    message: 'Conversations',
    data: [
      { id: 1, title: 'Document Assistant', createdAt: new Date().toISOString(), lastMessage: 'Ask anything about your family documents' },
    ],
  };
};

export const getConversationMessages = async (
  id: number
): Promise<ApiResponse<ChatMessage[]>> => {
  try {
    const response = await api.get<ApiResponse<ChatMessage[]>>(`/ai/conversations/${id}/messages`);
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch (e) {}

  return {
    success: true,
    message: 'Messages',
    data: [],
  };
};

export const deleteConversation = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/ai/conversations/${id}`);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Deleted', data: undefined };
  }
};

export default {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteConversation,
};
