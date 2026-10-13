import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  FileText,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  AlertCircle,
  Eye,
  Search,
  Calendar,
  Shield,
  GraduationCap,
  HeartPulse,
  Wallet,
  ShieldCheck,
  Home,
  Car,
  Receipt,
  Folder,
  X,
  Bot,
  Users,
  UserCircle,
  Bell,
} from 'lucide-react';
import { Document } from '../types';
import * as documentService from '../services/documentService';
import DocumentCard from '../components/DocumentCard';
import UploadModal from '../components/UploadModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/SkeletonLoader';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const FILTER_TABS = [
  'All',
  'Identity',
  'Education',
  'Medical',
  'Insurance',
  'Property',
  'Vehicle',
  'Bills',
  'Other',
];

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'expiry';

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sync from query params if navigated with filter or action
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveTab(categoryParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
    const actionParam = searchParams.get('action');
    if (actionParam === 'upload') {
      setIsUploadModalOpen(true);
    }
  }, [searchParams]);

  const navigationIntent = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('ai') || q.includes('assist') || q.includes('bot') || q.includes('chat') || q.includes('ask')) {
      return {
        title: 'FamilyAI Assistant',
        desc: 'FamilyAI is your conversational assistant for asking questions about family documents.',
        path: '/ai-assistant',
        icon: Bot,
        color: 'bg-lime text-black',
        btnText: 'Open FamilyAI',
      };
    }
    if (q.includes('fam') || q.includes('member') || q.includes('relat') || q.includes('people')) {
      return {
        title: 'Family Space',
        desc: 'Manage family members, relationships, and invite codes in the Family Space.',
        path: '/family',
        icon: Users,
        color: 'bg-pink text-black',
        btnText: 'Open Family Space',
      };
    }
    if (q.includes('prof') || q.includes('account') || q.includes('user') || q.includes('pass')) {
      return {
        title: 'Profile Settings',
        desc: 'View or edit your personal profile and relationship.',
        path: '/profile',
        icon: UserCircle,
        color: 'bg-cyan text-black',
        btnText: 'Open Profile Settings',
      };
    }
    if (q.includes('notif') || q.includes('alert') || q.includes('remind')) {
      return {
        title: 'Notifications Center',
        desc: 'Review upcoming expiration reminders and alerts.',
        path: '/notifications',
        icon: Bell,
        color: 'bg-yellow-300 text-black',
        btnText: 'Open Notifications',
      };
    }
    return null;
  }, [searchQuery]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      // Always use the documentService which handles all storage logic
      // Pass no familyId so the service uses localStorage-scoped lookup
      const res = await documentService.getDocuments();
      if (res && Array.isArray(res.data)) {
        setDocuments(res.data);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
      toast.error('Failed to load documents. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []); // No deps needed - documentService reads from localStorage directly

  useEffect(() => {
    fetchDocuments();

    const handleVaultUpdated = () => {
      fetchDocuments();
    };
    window.addEventListener('paperless_vault_updated', handleVaultUpdated);
    return () => {
      window.removeEventListener('paperless_vault_updated', handleVaultUpdated);
    };
  }, [fetchDocuments]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: documents.length };
    FILTER_TABS.slice(1).forEach((tab) => {
      counts[tab] = documents.filter(
        (doc) => (doc.category || '').toLowerCase() === tab.toLowerCase()
      ).length;
    });
    return counts;
  }, [documents]);

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        if (
          activeTab !== 'All' &&
          (doc.category || '').toLowerCase() !== activeTab.toLowerCase()
        ) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = doc.name.toLowerCase().includes(q);
          const matchOwner = (doc.ownerName || '').toLowerCase().includes(q);
          const matchSubcat = (doc.subcategory || '').toLowerCase().includes(q);
          const matchDesc = (doc.description || '').toLowerCase().includes(q);
          if (!matchName && !matchOwner && !matchSubcat && !matchDesc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'expiry') {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        return 0;
      });
  }, [documents, activeTab, searchQuery, sortBy]);

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    try {
      setIsDeleting(true);
      await documentService.deleteDocument(documentToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete.id));
      toast.success(`"${documentToDelete.name}" deleted`);
      setDocumentToDelete(null);
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      toast.loading(`Downloading "${doc.name}"...`, { id: 'download' });
      const blob = await documentService.downloadDocument(doc.id);
      documentService.triggerFileDownload(blob, doc.fileName || `${doc.name}.pdf`);
      toast.success(`"${doc.name}" downloaded to your system!`, { id: 'download' });
    } catch {
      toast.error('Download failed. File content not found.', { id: 'download' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER - Clean Editorial Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-1.5 border-black/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-lime border border-black text-[10px] font-black uppercase tracking-wider mb-1.5">
            <span>FAMILY VAULT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Documents
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Search, filter, and securely inspect every household document.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="neo-btn inline-flex items-center gap-2 px-4 py-2.5 bg-lime text-black text-xs uppercase tracking-wider self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* 2. SEARCH BAR & SORT CONTROL */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && navigationIntent) {
                navigate(navigationIntent.path);
              }
            }}
            placeholder="Search documents by name, owner, or description..."
            className="w-full pl-10 pr-9 py-2 text-xs font-semibold bg-white border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm placeholder-gray-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                navigate('/documents', { replace: true });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-black rounded-full transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-black" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-white border-1.5 border-black rounded-lg text-xs font-bold text-black shadow-neo-sm focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest Uploaded</option>
            <option value="oldest">Oldest Uploaded</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="expiry">Expiry Date (Urgent First)</option>
          </select>
        </div>
      </div>

      {/* 3. CATEGORY FILTER TABS - Editorial Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab.toLowerCase() === tab.toLowerCase();
          const count = tabCounts[tab] || 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border-1.5 ${
                isActive
                  ? 'bg-black text-white border-black shadow-neo-sm'
                  : 'bg-white text-gray-700 border-black/40 hover:border-black hover:bg-cream'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-black ${
                  isActive ? 'bg-lime text-black' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. DOCUMENTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="space-y-4">
          {navigationIntent && (
            <div className="p-4 sm:p-5 bg-white border-2 border-black rounded-2xl shadow-neo-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl border-1.5 border-black flex items-center justify-center shrink-0 shadow-neo-sm ${navigationIntent.color}`}
                >
                  <navigationIntent.icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-lime border border-black">
                    LOOKING FOR A FEATURE?
                  </span>
                  <h4 className="text-sm font-black text-black mt-0.5">
                    Did you mean {navigationIntent.title}?
                  </h4>
                  <p className="text-xs text-gray-600 font-medium">
                    {navigationIntent.desc}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    navigate('/documents', { replace: true });
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border-1.5 border-black bg-cream hover:bg-gray-200 transition"
                >
                  Clear Search
                </button>
                <button
                  type="button"
                  onClick={() => navigate(navigationIntent.path)}
                  className="neo-btn px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>{navigationIntent.btnText}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          <div className="neo-box flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white shadow-neo-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-2xl bg-cream border-1.5 border-black shadow-neo-sm flex items-center justify-center text-black">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-black stroke-[2]" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-black mb-1">
              {searchQuery ? 'No matching documents' : 'No documents in this category'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-5 leading-relaxed font-medium">
              {searchQuery
                ? `No documents found matching "${searchQuery}". Clear your search or upload a new record.`
                : 'Start organizing your family documents by uploading your first record.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    navigate('/documents', { replace: true });
                  }}
                  className="neo-btn px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-cream text-black hover:bg-gray-200"
                >
                  Clear Search Filter
                </button>
              )}
              {activeTab !== 'All' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('All')}
                  className="neo-btn px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-cream"
                >
                  View All Categories
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="neo-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-lime text-black"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={(d) => navigate(`/documents/${d.id}`)}
              onDelete={(d) => setDocumentToDelete(d)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchDocuments();
          setIsUploadModalOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={!!documentToDelete}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${documentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Document"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDocumentToDelete(null)}
      />
    </div>
  );
};

export default Documents;
