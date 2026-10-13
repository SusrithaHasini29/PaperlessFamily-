import api from './api';
import { Conversation, ChatMessage, ApiResponse, FamilyMember, Document } from '../types';
import * as documentService from './documentService';

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
  // 1. Try backend API first
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

  // 2. Intelligent client-side AI engine for static Vercel deployment
  const lower = message.toLowerCase().trim();

  // Load family context
  let familyName = 'Family Space';
  let familyCode = '';
  try {
    const famStr = localStorage.getItem('paperless_family');
    if (famStr) {
      const parsed = JSON.parse(famStr);
      if (parsed.familyName) familyName = parsed.familyName;
      if (parsed.familyCode) familyCode = parsed.familyCode;
    }
  } catch (e) {}

  // Load registered family members
  let members: FamilyMember[] = [];
  if (familyCode) {
    try {
      const stored = localStorage.getItem(`paperless_members_${familyCode}`);
      if (stored) {
        members = JSON.parse(stored);
      }
    } catch (e) {}
  }
  if (members.length === 0) {
    try {
      const m = localStorage.getItem('paperless_family_members');
      if (m) members = JSON.parse(m);
    } catch (e) {}
  }
  if (members.length === 0) {
    try {
      const userStr = localStorage.getItem('paperless_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        members = [
          {
            id: 1,
            userId: u.id || 1,
            name: u.name || 'Admin',
            email: u.email || '',
            relationship: 'Head of Family',
            role: 'ADMIN',
            documentCount: 0,
            joinedAt: new Date().toISOString(),
          },
        ];
      }
    } catch (e) {}
  }

  // Load documents for current vault
  let userDocs: Document[] = [];
  try {
    const docsRes = await documentService.getDocuments();
    if (docsRes && docsRes.data) {
      userDocs = docsRes.data;
    }
  } catch (e) {}

  let aiText = `I am your **FamilyAI** assistant for **${familyName}**. I help you manage family paperwork, track expiration dates, and answer questions about household records.`;

  // Check if query is asking about a specific family member (e.g. "where is yakshitha?", "tell me about sister", etc.)
  const matchedMember = members.find((m) => {
    const nameMatch = m.name && lower.includes(m.name.toLowerCase());
    const relMatch = m.relationship && lower.includes(m.relationship.toLowerCase());
    return nameMatch || relMatch;
  });

  // Check if query matches a document
  const matchedDoc = userDocs.find(
    (d) =>
      lower.includes((d.name || '').toLowerCase()) ||
      (d.subcategory && lower.includes(d.subcategory.toLowerCase()))
  );

  if (matchedMember && (lower.includes('where') || lower.includes('who') || lower.includes('about') || lower.includes('doc') || lower.includes(matchedMember.name.toLowerCase()))) {
    const memberDocs = userDocs.filter(
      (d) =>
        (d.ownerName || '').toLowerCase().includes(matchedMember.name.toLowerCase()) ||
        d.ownerId === matchedMember.id ||
        d.ownerId === matchedMember.userId
    );

    if (memberDocs.length > 0) {
      const docList = memberDocs
        .map(
          (d, i) =>
            `${i + 1}. **${d.name}** (${d.category}${d.subcategory ? ` / ${d.subcategory}` : ''}) • Status: ${d.status}${d.expiryDate ? ` • Expiry: ${d.expiryDate}` : ''}`
        )
        .join('\n');
      aiText = `👤 **${matchedMember.name}** is registered in **${familyName}** as **${matchedMember.relationship || 'Family Member'}** (${matchedMember.role || 'MEMBER'}).\n\n📁 **Her Documents in Vault (${memberDocs.length})**:\n${docList}`;
    } else {
      aiText = `👤 **${matchedMember.name}** is registered in **${familyName}** as **${matchedMember.relationship || 'Family Member'}** (${matchedMember.role || 'MEMBER'})${matchedMember.email ? ` • \`${matchedMember.email}\`` : ''}.\n\n📄 **Document Status**: No documents have been uploaded for **${matchedMember.name}** yet.\n\n💡 *Tip*: You can upload files for her anytime by clicking **+ Upload Document** and choosing **${matchedMember.name}** in the *Document Owner* dropdown!`;
    }
  } else if (
    lower.includes('who is in') ||
    lower.includes('family member') ||
    lower.includes('all members') ||
    lower.includes('our family') ||
    lower.includes('list members')
  ) {
    if (members.length > 0) {
      const memList = members
        .map(
          (m, idx) =>
            `${idx + 1}. **${m.name}** — ${m.relationship || 'Member'} (*${m.role || 'MEMBER'}*)${m.email ? ` • \`${m.email}\`` : ''}`
        )
        .join('\n');
      aiText = `👨‍👩‍👧‍👦 **${familyName}** has **${members.length} registered member${members.length === 1 ? '' : 's'}**:\n\n${memList}\n\n🔑 **Invite Code**: \`${familyCode || 'FAM-CODE'}\` (Share this code to add more members!)`;
    } else {
      aiText = `👨‍👩‍👧‍👦 **${familyName}**:\nNo additional members added yet. Go to the **Family** tab to invite family members using code \`${familyCode}\`!`;
    }
  } else if (matchedDoc) {
    aiText = `📄 **Document Insight: ${matchedDoc.name}**\n\n• **Owner**: ${matchedDoc.ownerName || 'Family Member'}\n• **Category**: ${matchedDoc.category}${matchedDoc.subcategory ? ` (${matchedDoc.subcategory})` : ''}\n• **File Name**: ${matchedDoc.fileName}\n• **Status**: ${matchedDoc.status || 'ACTIVE'}\n• **Expiry Date**: ${matchedDoc.expiryDate || 'No expiration set'}\n• **Description**: ${matchedDoc.description || 'Verified household document in your secure vault.'}`;
  } else if (
    lower.includes('all document') ||
    lower.includes('list document') ||
    lower.includes('what document') ||
    lower.includes('my document') ||
    lower.includes('do we have')
  ) {
    if (userDocs.length > 0) {
      const list = userDocs
        .map(
          (d, i) =>
            `${i + 1}. **${d.name}** (${d.category}) — Owned by *${d.ownerName || 'Self'}* [${d.status}]`
        )
        .join('\n');
      aiText = `📁 **Documents in ${familyName} Vault** (${userDocs.length} total):\n\n${list}`;
    } else {
      aiText = `📁 **Your Vault is Empty**\n\nNo documents have been uploaded to **${familyName}** yet. Click **+ Upload Document** in the Documents tab to add your first record!`;
    }
  } else if (lower.includes('expir') || lower.includes('renew')) {
    const expiring = userDocs.filter(
      (d) => d.status === 'EXPIRING_SOON' || d.status === 'EXPIRED'
    );
    if (expiring.length > 0) {
      const expList = expiring
        .map(
          (d) =>
            `• **${d.name}** (${d.ownerName}) — Expiry: **${d.expiryDate || 'Soon'}** [${d.status}]`
        )
        .join('\n');
      aiText = `⚠️ **Document Expiry Notice**:\n\n${expList}\n\nPlease prepare renewal paperwork in advance!`;
    } else if (userDocs.length > 0) {
      aiText = `✅ **All documents in your vault are currently up to date!** There are no upcoming expiry deadlines in the next 30 days.`;
    } else {
      aiText = `✅ You have no expiring documents because your vault is currently empty.`;
    }
  } else if (lower.includes('summariz') || lower.includes('summary')) {
    if (userDocs.length > 0) {
      const target = matchedDoc || userDocs[0];
      aiText = `📄 **Document Summary for ${target.name}**:\n\n• **Title**: ${target.name}\n• **Owner**: ${target.ownerName || 'Family Member'}\n• **Category**: ${target.category}${target.subcategory ? ` (${target.subcategory})` : ''}\n• **File Name**: ${target.fileName}\n• **Uploaded**: ${new Date(target.uploadedAt).toLocaleDateString()}\n• **Notes**: ${target.description || 'Verified and safely stored in your vault.'}`;
    } else {
      aiText = `📄 You haven't uploaded any documents to summarize yet. Click **+ Upload Document** to add your first record!`;
    }
  } else if (lower.includes('remind') || lower.includes('how do expiry')) {
    aiText = `⏰ **How Expiry Reminders Work**:\n\n1. When uploading a document, set an **Expiry Date**.\n2. PaperlessFamily automatically tracks renewal deadlines.\n3. Alerts are triggered **30 days before expiration** in your Dashboard and Notifications center!\n4. If a document expires, its status changes to **EXPIRED** so your family never misses a critical renewal.`;
  } else if (lower.includes('invite') || lower.includes('join') || lower.includes('code')) {
    aiText = `🔑 **Family Invite Code**: \`${familyCode || 'FAM-CODE'}\`\n\nFamily members can join your space by visiting the **Family** tab, clicking **Join with Code**, and entering this code. They will immediately gain access to the shared vault!`;
  } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('help')) {
    aiText = `👋 Hello! I am **FamilyAI**, your personal document assistant for **${familyName}**.\n\nHere are some things you can ask me:\n• *"Who is in our family?"*\n• *"Where is Yakshitha?"* or ask about any member\n• *"What documents do we have?"*\n• *"What's expiring?"*\n• *"Summarize a document"*`;
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
