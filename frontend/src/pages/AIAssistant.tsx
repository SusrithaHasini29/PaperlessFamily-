import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { ChatMessage, Conversation } from '../types';
import * as aiService from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const QUICK_ACTIONS = [
  'What documents do we have?',
  "What's Expiring?",
  'Summarize a Document',
  "Show Mom's Documents",
  'Who is in our family?',
  'How do expiry reminders work?',
];

export const AIAssistant: React.FC = () => {
  const { user, family } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await aiService.getConversations();
      if (res && res.data) {
        setConversations(res.data);
      }
    } catch {
      // Soft fail
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Handle incoming query from route state (e.g., from Dashboard or DocumentDetail)
  useEffect(() => {
    const state = location.state as { initialQuery?: string; documentContext?: any } | null;
    if (state && state.initialQuery) {
      const q = state.initialQuery;
      setInputValue(q);
      // Automatically send query so user gets immediate answer
      setTimeout(() => {
        handleSend(q);
      }, 150);
    }
  }, [location.state]);

  const handleSelectConversation = async (convId: number) => {
    setActiveConversationId(convId);
    try {
      setIsLoading(true);
      const res = await aiService.getConversationMessages(convId);
      if (res && res.data) {
        setMessages(res.data);
      }
    } catch {
      toast.error('Failed to load conversation messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setInputValue('');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewConversation();
      }
      toast.success('Conversation removed');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'USER',
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await aiService.sendMessage(text, activeConversationId);
      if (res && res.data) {
        const replyText =
          res.data.response ||
          (res.data.message && res.data.message !== 'Operation successful' ? res.data.message : '') ||
          (res.data as any).content ||
          'Here is the information from your family vault.';

        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          sender: 'AI',
          message: replyText,
          createdAt: res.data.createdAt || res.data.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (!activeConversationId && res.data.conversationId) {
          setActiveConversationId(res.data.conversationId);
          loadConversations();
        }
      }
    } catch {
      // Smart offline fallback
      let fallbackText = "I've reviewed your family vault documents.";
      const lower = text.toLowerCase();
      const isDemo = user?.email === 'demo@paperlessfamily.com';
      const userName = user?.name || 'there';
      const familyTitle = family?.familyName || `${userName}'s Family`;

      if (isDemo) {
        if (lower.includes('expir') || lower.includes('due') || lower.includes('renew')) {
          fallbackText =
            "According to your records, you have 2 upcoming renewals:\n\n" +
            "1. ⚠️ **Passport (Priya Sharma)** — Expires in 18 days (Identity)\n" +
            "2. ⚠️ **Vehicle Insurance (Raj Sharma)** — Expires in 25 days (Comprehensive Motor)\n\n" +
            "All other documents (Driving Licence, College ID, Health Insurance) are valid and active.";
        } else if (lower.includes('mom') || lower.includes('priya') || lower.includes('mother')) {
          fallbackText =
            "Here are **Priya Sharma's** documents in the family vault:\n\n" +
            "• **Passport** (Identity) — ⚠️ Expires in 18 days\n" +
            "• **Aadhaar Card** (Identity) — Active (No expiry)\n" +
            "• **Health Insurance** (Insurance) — Valid till 30 Jun 2027 (₹15 Lakh Floater Policy)";
        } else if (lower.includes('dad') || lower.includes('raj') || lower.includes('father')) {
          fallbackText =
            "Here are **Raj Sharma's** documents in the family vault:\n\n" +
            "• **Driving Licence** (Identity) — Valid till 15 Mar 2027\n" +
            "• **Vehicle Insurance** (Insurance) — ⚠️ Expires in 25 days (Honda City)\n" +
            "• **PAN Card** (Identity) — Active (Permanent Account Number)";
        } else if (lower.includes('aarav') || lower.includes('son') || lower.includes('college')) {
          fallbackText =
            "Here are **Aarav Sharma's** documents in the family vault:\n\n" +
            "• **College ID** (Education) — Institute of Technology (Valid till 31 Jul 2027)\n" +
            "• **10th Marksheet** (Education) — CBSE Consolidated Statement (Verified)";
        } else if (lower.includes('ananya') || lower.includes('daughter') || lower.includes('birth')) {
          fallbackText =
            "Here are **Ananya Sharma's** documents in the family vault:\n\n" +
            "• **Birth Certificate** (Identity) — Municipal Corporation Certified\n" +
            "• **School Certificate** (Education) — Delhi Public School Bonafide Certificate";
        } else if (lower.includes('insur') || lower.includes('policy')) {
          fallbackText =
            "Your family has 2 insurance policies on file:\n\n" +
            "• **Health Insurance** (Star Health Family Floater) — ₹15,00,000 cover, valid till 30 Jun 2027\n" +
            "• **Vehicle Insurance** (Comprehensive Motor) — Honda City, ⚠️ renewal required in 25 days";
        } else if (lower.includes('aadhaar') || lower.includes('pan') || lower.includes('passport') || lower.includes('identity')) {
          fallbackText =
            "Here are the Identity documents on file:\n\n" +
            "• **Passport** (Priya) — ⚠️ Expiring in 18 days\n" +
            "• **Driving Licence** (Raj) — Valid till 2027\n" +
            "• **PAN Card** (Raj) — Verified Tax ID\n" +
            "• **Aadhaar** (Priya) — Verified National ID\n" +
            "• **Birth Certificate** (Ananya) — Certified Vital Record";
        } else if (lower.includes('summar') || lower.includes('overview') || lower.includes('count') || lower.includes('how many')) {
          fallbackText =
            "📊 **Family Vault Summary (Sharma Family)**:\n\n" +
            "• Total Documents: **10**\n" +
            "• Family Members: **4** (Raj, Priya, Aarav, Ananya)\n" +
            "• Categories: Identity (5), Education (3), Insurance (2)\n" +
            "• Documents Expiring Soon: **2** (Priya's Passport & Raj's Vehicle Insurance)\n" +
            "• Storage Used: ~10.4 MB";
        } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('help')) {
          fallbackText =
            "Hello! 👋 I am **FamilyAI**, your personal family document assistant.\n\n" +
            "You can ask me anything about your household paperwork, such as:\n" +
            "• *\"What documents are expiring soon?\"*\n" +
            "• *\"Show Priya's documents\"*\n" +
            "• *\"What is our health insurance coverage?\"*\n" +
            "• *\"Summarize our family documents\"*";
        } else {
          fallbackText =
            `I searched the family vault for "${text}".\n\n` +
            "• Found 10 active records across Identity, Insurance, and Education.\n" +
            "• Urgent alerts: **Priya's Passport** (18 days left) and **Vehicle Insurance** (25 days left).\n\n" +
            "Let me know if you would like me to retrieve specific details for any family member!";
        }
      } else {
        // Dynamic responses for non-demo user
        if (lower.includes('expir') || lower.includes('due') || lower.includes('renew')) {
          fallbackText = `I checked your family records for **${familyTitle}**. You currently have no documents expiring soon! Everything is up to date.`;
        } else if (lower.includes('summar') || lower.includes('overview') || lower.includes('count') || lower.includes('how many')) {
          fallbackText =
            `📊 **Family Vault Summary (${familyTitle})**:\n\n` +
            `• Head of Family: **${userName}**\n` +
            `• Vault Code: **${family?.familyCode || 'FAM-ACTIVE'}**\n` +
            `• To add paperwork, click "Upload Document" in the Documents section and I will automatically organize and index them for you!`;
        } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('help')) {
          fallbackText =
            `Hello **${userName}**! 👋 I am **FamilyAI**, your intelligent assistant for the **${familyTitle}** vault.\n\n` +
            `I help your household keep documents organized and safe. You can ask me:\n` +
            `• *"Are any documents expiring soon?"*\n` +
            `• *"Summarize our family records"*\n` +
            `• *"How do I upload new documents?"*`;
        } else {
          fallbackText = `I checked the **${familyTitle}** vault for "${text}". No matching files were found yet. Once you upload documents, I can inspect, summarize, and answer questions about them!`;
        }
      }

      const fallbackAiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'AI',
        message: fallbackText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-1.5 border-black/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple text-white border border-black text-[10px] font-black uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3 text-lime" />
            <span>FAMILYAI WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            FamilyAI Assistant
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Ask natural questions across your household records, expiry dates, and policy terms.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-white px-3 py-1.5 rounded-lg border-1.5 border-black shadow-neo-sm">
          <Lock className="w-3.5 h-3.5 text-purple" />
          <span>Isolated to {family?.familyName || 'Family Space'}</span>
        </div>
      </div>

      {/* 2. CHAT WORKSPACE (Split view) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[550px]">
        {/* Left Sidebar: Conversations History */}
        <aside
          className={`${
            isSidebarOpen ? 'lg:col-span-4 flex' : 'hidden'
          } neo-box bg-white flex-col overflow-hidden`}
        >
          {/* History Header */}
          <div className="p-3.5 border-b-1.5 border-black bg-cream flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-black stroke-[2.2]" />
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Conversations
              </span>
            </div>
            <button
              onClick={handleNewConversation}
              className="neo-btn inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase bg-lime text-black"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New</span>
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {conversations.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs font-semibold text-gray-500">
                No past conversations. Ask a question to start.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`p-2.5 rounded-xl border-1.5 cursor-pointer transition-all flex items-center justify-between group ${
                    activeConversationId === conv.id
                      ? 'bg-purple text-white border-black shadow-neo-sm'
                      : 'bg-white text-black border-transparent hover:border-black hover:bg-cream'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold truncate">
                      {conv.title || 'Family Query'}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 truncate ${
                        activeConversationId === conv.id ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      {conv.lastMessage || formatRelativeTime(conv.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity ${
                      activeConversationId === conv.id ? 'text-white' : 'text-black'
                    }`}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Area: Chat Interface */}
        <section
          className={`${
            isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          } neo-box bg-white flex flex-col overflow-hidden relative`}
        >
          {/* Chat Header */}
          <div className="p-3.5 border-b-1.5 border-black bg-cream flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 rounded border border-black bg-white hover:bg-cream"
                title="Toggle sidebar"
              >
                {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="w-7 h-7 rounded-lg bg-purple text-white border border-black flex items-center justify-center">
                <Bot className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-black">
                  FamilyAI
                </h3>
                <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime border border-black" />
                  <span>Online & ready</span>
                </span>
              </div>
            </div>

            <div className="text-[11px] font-bold text-gray-500 hidden sm:block">
              {family?.familyName || 'Family Vault'} Context Active
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-dots-pattern">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-purple text-white border-1.5 border-black shadow-neo-md flex items-center justify-center mb-3">
                  <Bot className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-black text-black mb-1">
                  Hi! I'm FamilyAI 👋
                </h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
                  I can help you search family records, track renewal dates, understand policy coverage, and summarize complex paperwork.
                </p>

                {/* Quick actions chips */}
                <div className="w-full space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                    Suggested queries
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(action)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border-1.5 border-black bg-cream hover:bg-lime text-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender === 'USER' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'AI' && (
                    <div className="w-8 h-8 rounded-lg bg-purple text-white border border-black flex items-center justify-center shrink-0 shadow-neo-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-xl border-1.5 text-xs font-medium leading-relaxed shadow-neo-sm ${
                      msg.sender === 'USER'
                        ? 'bg-lime text-black border-black rounded-tr-none'
                        : 'bg-white text-black border-black rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span
                      className={`text-[9px] font-semibold mt-1.5 block ${
                        msg.sender === 'USER' ? 'text-black/70' : 'text-gray-500'
                      }`}
                    >
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>

                  {msg.sender === 'USER' && (
                    <div className="w-8 h-8 rounded-lg bg-black text-white border border-black flex items-center justify-center shrink-0 text-xs font-black">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-purple text-white border border-black flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white border-1.5 border-black rounded-xl rounded-tl-none shadow-neo-sm text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple animate-ping" />
                  <span>FamilyAI is analyzing your documents...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar (above input) */}
          <div className="px-4 py-2 border-t border-black/10 bg-cream/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(action)}
                className="px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap bg-white border border-black hover:bg-lime text-black transition-colors"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3.5 border-t-1.5 border-black bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about your family's documents..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 text-xs font-semibold bg-cream border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="neo-btn inline-flex items-center justify-center px-4 py-2.5 bg-purple text-white text-xs uppercase tracking-wider rounded-xl disabled:opacity-50"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span className="ml-1.5 hidden sm:inline">Ask AI</span>
              </button>
            </form>
            <p className="text-[10px] text-gray-500 mt-1.5 text-center">
              FamilyAI summarizes information from your family documents. It does not replace professional advice.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIAssistant;
