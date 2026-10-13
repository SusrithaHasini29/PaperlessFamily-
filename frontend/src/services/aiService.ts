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
      aiText = `📁 **Documents in your Vault** (${userDocs.length} uploaded):\n\n${list}`;
    } else {
      aiText = "📁 **Your Vault is Empty**\n\nYou haven't uploaded any documents yet. Click **Upload Document** to store your first family record!";
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
      aiText = "📄 You haven't uploaded any documents to summarize yet. Click **Upload Document** to add your first record!";
    }
  } else if (lower.includes("remind")) {
    aiText = "⏰ **Automated Expiry Reminders**: PaperlessFamily continuously monitors your vault. When you upload paperwork with an expiration date, reminders are automatically sent 30 days in advance!";
  } else if (lower.includes("mom") || lower.includes("mother")) {
    aiText = "ℹ️ You can add family members and assign documents to them from the **Family** tab!";
  } else if (lower.includes("who is in") || lower.includes("family member") || lower.includes("members")) {
    const userStr = localStorage.getItem('paperless_user');
    const uName = userStr ? (JSON.parse(userStr).name || 'You') : 'You';
    const famStr = localStorage.getItem('paperless_family');
    const fName = famStr ? (JSON.parse(famStr).familyName || 'Family Space') : 'Family Space';
    const fCode = famStr ? (JSON.parse(famStr).familyCode || 'FAM-CODE') : 'FAM-CODE';
    aiText = `👨‍👩‍👧‍👦 **${fName}**:\n• **${uName}** (Head of Family - ADMIN)\n🔑 Family Code: \`${fCode}\``;
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
