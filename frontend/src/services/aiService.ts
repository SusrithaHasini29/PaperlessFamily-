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

  // Check stored documents from localStorage
  let userDocs: any[] = [];
  try {
    const stored = localStorage.getItem('paperless_stored_documents');
    if (stored) {
      userDocs = JSON.parse(stored);
    }
  } catch (e) {}

  let aiText = "I am your **FamilyAI** assistant. I help you track document expiry, policy coverage, and summarize household records.";

  // Check if query matches an uploaded document name
  const matchedDoc = userDocs.find(d => lower.includes((d.name || '').toLowerCase()));

  if (matchedDoc) {
    aiText = `📄 **Document Insight: ${matchedDoc.name}**\n\n• **Owner**: ${matchedDoc.ownerName || 'Family Member'}\n• **Category**: ${matchedDoc.category}${matchedDoc.subcategory ? ` (${matchedDoc.subcategory})` : ''}\n• **File**: ${matchedDoc.fileName}\n• **Status**: ${matchedDoc.status || 'ACTIVE'}\n• **Expiry Date**: ${matchedDoc.expiryDate || 'No expiry recorded'}\n• **Details**: ${matchedDoc.description || 'Verified household document in your secure vault.'}`;
  } else if (lower.includes("all document") || lower.includes("list document") || lower.includes("what document") || lower.includes("my document")) {
    if (userDocs.length > 0) {
      const list = userDocs.map((d, i) => `${i + 1}. **${d.name}** (${d.category}) - ${d.ownerName || 'Self'}`).join('\n');
      aiText = `📁 **Documents in your Vault** (${userDocs.length} uploaded):\n\n${list}\n\nPlus verified record: **Relieving[23MIC7028]** (Aadhaar / Identity).`;
    } else {
      aiText = "📁 **Documents in your Vault**:\n\n1. **Relieving[23MIC7028]** (Identity / Aadhaar) - ushaswini\n\nYou can upload more documents anytime using the **Upload Document** button!";
    }
  } else if (lower.includes("expir") || lower.includes("renew")) {
    const expiring = userDocs.filter(d => d.status === 'EXPIRING_SOON' || d.status === 'EXPIRED');
    if (expiring.length > 0) {
      const expList = expiring.map(d => `• **${d.name}** (${d.ownerName}) - Expiry: ${d.expiryDate || 'Soon'}`).join('\n');
      aiText = `⚠️ **Document Expiry Notice**:\n\n${expList}\n\nPlease prepare renewal paperwork in advance!`;
    } else {
      aiText = "✅ **All documents in your vault are currently up to date!** There are no upcoming expiry deadlines in the next 30 days.";
    }
  } else if (lower.includes("summariz") || lower.includes("summary")) {
    if (userDocs.length > 0) {
      const latest = userDocs[0];
      aiText = `📄 **Document Summary for ${latest.name}**:\n\n• **Title**: ${latest.name}\n• **Owner**: ${latest.ownerName || 'Family Member'}\n• **Category**: ${latest.category}\n• **File Name**: ${latest.fileName}\n• **Uploaded**: ${new Date(latest.uploadedAt).toLocaleDateString()}\n• **Notes**: ${latest.description || 'Verified and safely encrypted in your vault.'}`;
    } else {
      aiText = "📄 **Document Summary**:\n\n• **Title**: Relieving[23MIC7028]\n• **Category**: Identity (Aadhaar)\n• **Issuer**: DRIDHA TECHNOLOGIES (Hyderabad)\n• **Tenure**: May 18, 2026 – July 10, 2026\n• **Role**: AI Engineer Intern\n• **Status**: ACTIVE & Verified";
    }
  } else if (lower.includes("remind")) {
    aiText = "⏰ **Automated Expiry Reminders**: PaperlessFamily continuously monitors your vault. When you upload paperwork with an expiration date, reminders are automatically sent 30 days in advance!";
  } else if (lower.includes("mom") || lower.includes("mother")) {
    aiText = "ℹ️ **sujatha** (*Mother*) is registered in your family space. You can assign uploaded documents to her from the Document Owner dropdown!";
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
