import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  File,
  Image as ImageIcon,
} from 'lucide-react';
import { FamilyMember } from '../types';
import * as documentService from '../services/documentService';
import * as familyService from '../services/familyService';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  Identity: ['Aadhaar', 'PAN', 'Passport', 'Driving Licence', 'Voter ID'],
  Education: ['Certificate', 'Marksheet', 'Degree', 'Course Document'],
  Medical: ['Medical Report', 'Prescription', 'Health Record'],
  Finance: ['Bank Document', 'Tax Document', 'Loan'],
  Insurance: ['Health Insurance', 'Life Insurance', 'Vehicle Insurance'],
  Property: ['Property Document', 'Rental Agreement'],
  Vehicle: ['RC', 'Insurance', 'PUC'],
  Bills: ['Electricity', 'Water', 'Internet', 'Mobile'],
  Other: ['Other'],
};

const CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES);

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCategory?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'Identity',
}) => {
  const { user, family } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [subcategory, setSubcategory] = useState(
    CATEGORY_SUBCATEGORIES[defaultCategory]?.[0] || 'Other'
  );
  const [ownerId, setOwnerId] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');

  // Upload progress & UI states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const isDemo = user?.email === 'demo@paperlessfamily.com';
    const fallbackMembers: FamilyMember[] = isDemo
      ? [
          { id: 1, userId: 1, name: 'Raj Sharma', email: 'raj@sharma.com', relationship: 'Father', role: 'ADMIN', documentCount: 12, joinedAt: '2024-01-10' },
          { id: 2, userId: 2, name: 'Priya Sharma', email: 'priya@sharma.com', relationship: 'Mother', role: 'MEMBER', documentCount: 16, joinedAt: '2024-01-12' },
        ]
      : [
          {
            id: user?.id || 1,
            userId: user?.id || 1,
            name: user?.name || 'Self',
            email: user?.email || '',
            relationship: 'Head of Family',
            role: 'ADMIN',
            documentCount: 0,
            joinedAt: user?.createdAt || new Date().toISOString(),
          },
        ];

    if (family?.id) {
      familyService
        .getFamilyMembers(family.id)
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setMembers(res.data);
            const currentMember = res.data.find((m) => m.userId === user?.id) || res.data[0];
            if (currentMember) {
              setOwnerId(String(currentMember.id));
              setOwnerName(currentMember.name);
            }
          } else {
            setMembers(fallbackMembers);
            setOwnerId(String(fallbackMembers[0].id));
            setOwnerName(fallbackMembers[0].name);
          }
        })
        .catch(() => {
          setMembers(fallbackMembers);
          setOwnerId(String(fallbackMembers[0].id));
          setOwnerName(fallbackMembers[0].name);
        });
    } else {
      setMembers(fallbackMembers);
      setOwnerId(String(fallbackMembers[0].id));
      setOwnerName(fallbackMembers[0].name);
    }
  }, [family?.id, user?.id, user?.name, user?.email]);

  useEffect(() => {
    setCategory(defaultCategory);
    setSubcategory(CATEGORY_SUBCATEGORIES[defaultCategory]?.[0] || 'Other');
  }, [defaultCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    setSubcategory(CATEGORY_SUBCATEGORIES[newCat]?.[0] || 'Other');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      toast.error('Allowed file formats: PDF, JPG, JPEG, PNG');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!name) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setName(cleanName.replace(/[_-]/g, ' '));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a document name.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', name.trim());
    formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    if (ownerId) formData.append('ownerId', ownerId);
    if (ownerName) formData.append('ownerName', ownerName);
    if (issueDate) formData.append('issueDate', issueDate);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (description) formData.append('description', description.trim());

    try {
      setUploadProgress(60);
      await documentService.uploadDocument(formData);
      setUploadProgress(100);
      toast.success('Document uploaded successfully to the vault!');

      setTimeout(() => {
        setIsUploading(false);
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      }, 200);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(err?.response?.data?.message || 'Failed to upload document. Please check file type and size.');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setName('');
    setCategory(defaultCategory);
    setSubcategory(CATEGORY_SUBCATEGORIES[defaultCategory]?.[0] || 'Other');
    setIssueDate('');
    setExpiryDate('');
    setDescription('');
    setUploadProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="neo-box w-full max-w-xl bg-white p-5 sm:p-6 shadow-neo-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-1.5 border-black mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lime border border-black flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-black stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              Upload Family Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-cream border border-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Drag & Drop Area */}
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-1.5 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-black bg-lime/20'
                  : selectedFile
                  ? 'border-black bg-cream'
                  : 'border-black/50 bg-cream/40 hover:bg-cream'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-lime border border-black flex items-center justify-center">
                    <FileText className="w-5 h-5 text-black" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-black text-black truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-gray-500 font-bold">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-black mx-auto stroke-[1.8]" />
                  <p className="font-black text-black text-xs">
                    Drag and drop file here, or <span className="text-purple underline">browse</span>
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold">
                    Supports PDF, JPG, JPEG, PNG (up to 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Name */}
          <div>
            <label className="block font-bold uppercase text-gray-700 mb-1">Document Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mom's Passport"
              className="w-full px-3 py-2 bg-cream border-1.5 border-black rounded-lg focus:outline-none"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-gray-700 mb-1">Type / Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none cursor-pointer"
              >
                {(CATEGORY_SUBCATEGORIES[category] || ['Other']).map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner Selector */}
          <div>
            <label className="block font-bold uppercase text-gray-700 mb-1">Document Owner</label>
            <select
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                const mem = members.find((m) => String(m.id) === e.target.value);
                if (mem) setOwnerName(mem.name);
              }}
              className="w-full px-3 py-2 font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.name} ({m.relationship || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Date & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-gray-700 mb-1">
                Expiry Date <span className="text-pink">(For Alerts)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold uppercase text-gray-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Original physical copy stored in study safe drawer"
              className="w-full px-3 py-2 font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none resize-none"
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span>Encrypting & Uploading</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded bg-cream border border-black overflow-hidden">
                <div
                  className="h-full bg-lime transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="neo-btn px-5 py-2 font-black uppercase rounded-lg bg-lime text-black"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
