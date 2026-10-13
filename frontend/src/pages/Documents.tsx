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
  const { user, family } = useAuth();

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
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    const actionParam = searchParams.get('action');
    if (actionParam === 'upload') {
      setIsUploadModalOpen(true);
    }
  }, [searchParams]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const famId = family?.id || 1;
      const res = await documentService.getDocuments({ familyId: famId });
      if (res && res.data) {
        setDocuments(res.data);
      } else if (user?.email === 'demo@paperlessfamily.com') {
        // Fallback sample data matching prompt for demo account only
        setDocuments([
          {
            id: 1,
            name: 'Passport',
            category: 'Identity',
            subcategory: 'International Travel',
            ownerName: 'Priya Sharma',
            ownerId: 2,
            familyId: 1,
            fileName: 'priya_passport.pdf',
            fileType: 'application/pdf',
            fileSize: 1840000,
            status: 'EXPIRING_SOON',
            uploadedAt: '2024-02-10T10:00:00Z',
            uploadedBy: 'Raj Sharma',
            expiryDate: '2028-08-18',
            description: 'Indian Passport 36 pages booklet',
          },
          {
            id: 2,
            name: 'Health Insurance',
            category: 'Insurance',
            subcategory: 'Family Floater',
            ownerName: 'Raj Sharma',
            ownerId: 1,
            familyId: 1,
            fileName: 'health_insurance.pdf',
            fileType: 'application/pdf',
            fileSize: 2450000,
            status: 'EXPIRING_SOON',
            uploadedAt: '2024-03-01T10:00:00Z',
            uploadedBy: 'Raj Sharma',
            expiryDate: '2027-06-30',
            description: 'Comprehensive family health insurance',
          },
          {
            id: 3,
            name: 'Aadhaar Card',
            category: 'Identity',
            subcategory: 'National ID',
            ownerName: 'Raj Sharma',
            ownerId: 1,
            familyId: 1,
            fileName: 'raj_aadhaar.pdf',
            fileType: 'application/pdf',
            fileSize: 720000,
            status: 'ACTIVE',
            uploadedAt: '2024-01-15T10:00:00Z',
            uploadedBy: 'Raj Sharma',
            description: 'UIDAI official identification card',
          },
          {
            id: 4,
            name: 'Property Document',
            category: 'Property',
            subcategory: 'Sale Deed',
            ownerName: 'Family',
            ownerId: 1,
            familyId: 1,
            fileName: 'property_deed.pdf',
            fileType: 'application/pdf',
            fileSize: 5200000,
            status: 'ACTIVE',
            uploadedAt: '2024-01-20T10:00:00Z',
            uploadedBy: 'Raj Sharma',
            description: 'Residential property registered deed',
          },
          {
            id: 5,
            name: 'Vehicle Insurance',
            category: 'Insurance',
            subcategory: 'Motor Insurance',
            ownerName: 'Raj Sharma',
            ownerId: 1,
            familyId: 1,
            fileName: 'vehicle_insurance.pdf',
            fileType: 'application/pdf',
            fileSize: 1250000,
            status: 'EXPIRING_SOON',
            uploadedAt: '2024-03-15T10:00:00Z',
            uploadedBy: 'Raj Sharma',
            expiryDate: '2026-11-15',
            description: 'Car comprehensive insurance policy',
          },
          {
            id: 6,
            name: 'Electricity Bill',
            category: 'Bills',
            subcategory: 'Utility',
            ownerName: 'Home',
            ownerId: 1,
            familyId: 1,
            fileName: 'electricity_bill.pdf',
            fileType: 'application/pdf',
            fileSize: 450000,
            status: 'ACTIVE',
            uploadedAt: '2024-04-01T10:00:00Z',
            uploadedBy: 'Raj Sharma',
            expiryDate: '2026-10-25',
            description: 'Monthly BESCOM utility receipt',
          },
        ]);
      } else {
        setDocuments([]);
      }
    } catch {
      if (user?.email !== 'demo@paperlessfamily.com') {
        setDocuments([]);
      }
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [family?.id, user?.email]);

  useEffect(() => {
    fetchDocuments();
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
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name, owner, or description..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-white border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm placeholder-gray-500"
          />
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
        <EmptyState
          title={searchQuery ? 'No matching documents' : 'No documents in this category'}
          description={
            searchQuery
              ? `No documents found matching "${searchQuery}". Try a different keyword.`
              : 'Start organizing your family documents by uploading your first record.'
          }
          actionText="Upload Document"
          onAction={() => setIsUploadModalOpen(true)}
        />
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
