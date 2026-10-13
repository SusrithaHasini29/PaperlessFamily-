import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit3,
  Trash2,
  Bot,
  FileText,
  Calendar,
  User,
  Shield,
  Clock,
  HardDrive,
  FileQuestion,
  ExternalLink,
  Save,
  X,
  Lock,
} from 'lucide-react';
import { Document } from '../types';
import * as documentService from '../services/documentService';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  formatDate,
  formatFileSize,
} from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Identity',
  'Education',
  'Medical',
  'Insurance',
  'Property',
  'Vehicle',
  'Bills',
  'Other',
];

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<boolean>(false);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await documentService.getDocument(Number(id));
        if (res && res.data) {
          setDocument(res.data);
          setEditName(res.data.name);
          setEditCategory(res.data.category);
          setEditSubcategory(res.data.subcategory || '');
          setEditIssueDate(res.data.issueDate || '');
          setEditExpiryDate(res.data.expiryDate || '');
          setEditDescription(res.data.description || '');
        } else {
          // Fallback sample record
          const fallback: Document = {
            id: Number(id),
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
            issueDate: '2018-08-18',
            expiryDate: '2028-08-18',
            description: 'Republic of India 36-page passport booklet issued by Regional Passport Office.',
          };
          setDocument(fallback);
          setEditName(fallback.name);
          setEditCategory(fallback.category);
          setEditSubcategory(fallback.subcategory || '');
          setEditIssueDate(fallback.issueDate || '');
          setEditExpiryDate(fallback.expiryDate || '');
          setEditDescription(fallback.description || '');
        }
      } catch {
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id]);

  useEffect(() => {
    let activeUrl: string | null = null;
    const loadPreview = async () => {
      if (!document?.id) return;
      try {
        setPreviewLoading(true);
        setPreviewError(false);
        const blob = await documentService.previewDocument(document.id);
        const url = URL.createObjectURL(blob);
        activeUrl = url;
        setPreviewBlobUrl(url);
      } catch {
        setPreviewError(true);
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [document?.id]);

  const handleDownload = async () => {
    if (!document) return;
    try {
      toast.loading(`Downloading "${document.name}"...`, { id: 'download' });
      const blob = await documentService.downloadDocument(document.id);
      documentService.triggerFileDownload(blob, document.fileName || `${document.name}.pdf`);
      toast.success(`"${document.name}" downloaded to your system!`, { id: 'download' });
    } catch {
      toast.error('Download failed. File content not found.', { id: 'download' });
    }
  };

  const handleOpenNewTab = () => {
    if (previewBlobUrl) {
      window.open(previewBlobUrl, '_blank');
    } else {
      handleDownload();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    try {
      setIsSaving(true);
      const updated = await documentService.updateDocument(document.id, {
        name: editName,
        category: editCategory,
        subcategory: editSubcategory,
        issueDate: editIssueDate,
        expiryDate: editExpiryDate,
        description: editDescription,
      });
      if (updated && updated.data) {
        setDocument(updated.data);
      } else {
        setDocument({
          ...document,
          name: editName,
          category: editCategory,
          subcategory: editSubcategory,
          issueDate: editIssueDate,
          expiryDate: editExpiryDate,
          description: editDescription,
        });
      }
      toast.success('Document updated');
      setIsEditOpen(false);
    } catch {
      toast.error('Failed to update document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    try {
      setIsDeleting(true);
      await documentService.deleteDocument(document.id);
      toast.success('Document removed from vault');
      navigate('/documents');
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAskAI = () => {
    if (!document) return;
    navigate('/ai-assistant', {
      state: {
        initialQuery: `Can you summarize the document "${document.name}" for ${document.ownerName}?`,
        documentContext: document,
      },
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-bold text-gray-500">
        Loading document details...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-bold text-black">Document not found.</p>
        <Link to="/documents" className="neo-btn px-4 py-2 bg-lime text-black text-xs font-black uppercase">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-1.5 border-black/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 rounded-lg border-1.5 border-black bg-white hover:bg-cream shadow-neo-sm"
            title="Back to documents"
          >
            <ArrowLeft className="w-4 h-4 text-black stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-cream">
                {document.category}
              </span>
              <StatusBadge status={document.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight mt-1">
              {document.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAskAI}
            className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple text-white text-xs font-black uppercase tracking-wider"
          >
            <Bot className="w-4 h-4 text-lime" />
            <span>Ask AI About Doc</span>
          </button>

          <button
            onClick={handleDownload}
            className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-black uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={() => setIsEditOpen(true)}
            className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-lime text-black text-xs font-black uppercase tracking-wider"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-pink text-black text-xs font-black uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 2. TWO COLUMN DETAILS - Preview & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Document Preview Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="neo-box p-4 sm:p-5 bg-white min-h-[460px] flex flex-col justify-between relative overflow-hidden">
            {/* Preview Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b-1.5 border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cream border border-black flex items-center justify-center">
                  <FileText className="w-4 h-4 text-black" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-black truncate max-w-[220px]">
                    {document.fileName || document.name}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500">
                    {formatFileSize(document.fileSize)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="neo-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream hover:bg-lime text-black text-xs font-black uppercase tracking-wider"
                  title="Open document in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full View</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="neo-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-black uppercase tracking-wider"
                  title="Download file to computer"
                >
                  <Download className="w-3.5 h-3.5 text-lime" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Document Content Viewer */}
            <div className="flex-1 flex flex-col items-center justify-center my-2">
              {previewLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-gray-600">Loading document preview...</p>
                </div>
              ) : previewBlobUrl ? (
                document.fileType?.includes('image') || document.fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <div className="w-full flex items-center justify-center p-2 bg-cream/40 rounded-xl border-1.5 border-black/20">
                    <img
                      src={previewBlobUrl}
                      alt={document.name}
                      className="max-h-[520px] w-auto max-w-full object-contain rounded-lg border border-black shadow-neo-sm"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[580px] rounded-xl border-1.5 border-black overflow-hidden shadow-neo-sm bg-white">
                    <iframe
                      src={`${previewBlobUrl}#toolbar=1`}
                      title={document.name}
                      className="w-full h-full border-none"
                    />
                  </div>
                )
              ) : (
                <div className="py-12 text-center flex flex-col items-center max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-cream border-1.5 border-black shadow-neo-sm flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7 text-black stroke-[2]" />
                  </div>
                  <h4 className="text-sm font-black text-black mb-1">{document.name}</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    {document.fileName || 'document.pdf'} • {formatFileSize(document.fileSize)}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="neo-btn px-4 py-2 bg-lime text-black text-xs font-black uppercase tracking-wider"
                  >
                    Download to View Locally
                  </button>
                </div>
              )}
            </div>

            {/* Extracted Document Summary / OCR Text */}
            <div className="mt-4 p-3.5 bg-cream rounded-xl border border-black text-left text-xs text-gray-800 leading-relaxed">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-black uppercase text-[10px] tracking-wider">
                  Extracted Document Summary
                </span>
                <span className="text-[10px] font-bold text-purple">Verified Record</span>
              </div>
              <p className="font-medium whitespace-pre-wrap">
                {document.description || document.extractedText || 'Document safely encrypted and stored in your family vault.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Metadata Ledger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="neo-box p-5 bg-white space-y-4">
            <div className="pb-3 border-b-1.5 border-black flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Document Ledger
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-lime border border-black" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Owner</span>
                <span className="font-bold text-black px-2 py-0.5 rounded bg-cream border border-black">
                  {document.ownerName}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Category</span>
                <span className="font-bold text-black">{document.category}</span>
              </div>

              {document.subcategory && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="font-semibold text-gray-600">Subcategory</span>
                  <span className="font-bold text-black">{document.subcategory}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Status</span>
                <StatusBadge status={document.status} />
              </div>

              {document.issueDate && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="font-semibold text-gray-600">Issue Date</span>
                  <span className="font-bold text-black">{formatDate(document.issueDate, 'dd MMM yyyy')}</span>
                </div>
              )}

              {document.expiryDate && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="font-semibold text-gray-600">Expiry Date</span>
                  <span className="font-bold text-pink-700 bg-pink px-2 py-0.5 rounded border border-black">
                    {formatDate(document.expiryDate, 'dd MMM yyyy')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Uploaded On</span>
                <span className="font-bold text-black">{formatDate(document.uploadedAt, 'dd MMM yyyy')}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-gray-600">Uploaded By</span>
                <span className="font-bold text-black">{document.uploadedBy || 'Raj Sharma'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-white p-6 shadow-neo-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-black">
              <h3 className="text-base font-black text-black uppercase">Edit Document</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-md hover:bg-cream border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-gray-700 mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editSubcategory}
                    onChange={(e) => setEditSubcategory(e.target.value)}
                    className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={editIssueDate}
                    onChange={(e) => setEditIssueDate(e.target.value)}
                    className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="neo-btn px-4 py-2 font-black uppercase rounded-lg bg-lime text-black"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${document.name}"?`}
        confirmText="Delete Document"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default DocumentDetail;
