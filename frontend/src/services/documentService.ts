import api from './api';
import { Document, DashboardStats, Category, ApiResponse } from '../types';

export interface DocumentQueryParams {
  familyId?: number;
  category?: string;
  ownerId?: number;
  search?: string;
  sort?: string;
}

// In-memory session cache for fast instant previews
const memoryBlobCache = new Map<number, Blob>();

// ==========================================
// User & Family Scoping Helpers
// ==========================================
const getCurrentUserEmail = (): string => {
  try {
    const userStr = localStorage.getItem('paperless_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.email) return u.email.trim().toLowerCase();
    }
  } catch {}
  return 'default';
};

const getActiveFamilyCode = (): string => {
  const email = getCurrentUserEmail();
  try {
    const famStr =
      localStorage.getItem(`paperless_family_${email}`) ||
      localStorage.getItem('paperless_family');
    if (famStr) {
      const f = JSON.parse(famStr);
      if (f.familyCode) return f.familyCode.trim().toUpperCase();
    }
  } catch {}
  return '';
};

// Global event broadcaster so sidebar storage and document views update in real-time
export const notifyVaultUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('paperless_vault_updated'));
  }
};

/**
 * Strips any base64 dataUrl or binary blobs from the metadata object
 * so localStorage NEVER exceeds browser quota (5MB limit).
 */
const cleanDocMetadata = (doc: any): Document => {
  if (!doc || typeof doc !== 'object') return null as any;
  const { dataUrl, fileContent, base64, buffer, ...clean } = doc;
  return {
    ...clean,
    id: Number(clean.id) || Date.now(),
    fileSize: Number(clean.fileSize) || 0,
    status: clean.status || 'ACTIVE',
  } as Document;
};

export const getStoredDocuments = (): Document[] => {
  // Purge any old unscoped global storage to prevent leakage across logins
  try {
    localStorage.removeItem('paperless_stored_documents');
  } catch {}

  const email = getCurrentUserEmail();
  const famCode = getActiveFamilyCode();

  const collectedDocs: Document[] = [];
  const seenIds = new Set<number>();

  const loadFromKey = (key: string) => {
    try {
      const storedStr = localStorage.getItem(key);
      if (storedStr) {
        const list = JSON.parse(storedStr);
        if (Array.isArray(list)) {
          let hasHeavyData = false;
          for (const item of list) {
            if (item && item.id) {
              if (item.dataUrl || item.base64) hasHeavyData = true;
              if (item.id !== 13 && !(item.name || '').includes('Relieving[23MIC7028]')) {
                if (!seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  collectedDocs.push(cleanDocMetadata(item));
                }
              }
            }
          }
          // Self-heal: rewrite clean array to clear out any wasted quota
          if (hasHeavyData) {
            localStorage.setItem(key, JSON.stringify(collectedDocs));
          }
        }
      }
    } catch {}
  };

  // 1. Load from family key if code exists
  if (famCode) {
    loadFromKey(`paperless_docs_fam_${famCode}`);
  }

  // 2. Also load from user-specific key
  loadFromKey(`paperless_docs_usr_${email}`);

  return collectedDocs;
};

export const saveStoredDocuments = (docs: Document[]) => {
  const cleanedDocs = docs.map(cleanDocMetadata).filter(Boolean);
  const email = getCurrentUserEmail();
  const famCode = getActiveFamilyCode();

  // 1. Save to family key if available
  if (famCode) {
    try {
      localStorage.setItem(`paperless_docs_fam_${famCode}`, JSON.stringify(cleanedDocs));
    } catch (e) {
      console.warn('Could not save to family key:', e);
    }
  }

  // 2. ALWAYS save to user key as well (double guarantee!)
  try {
    localStorage.setItem(`paperless_docs_usr_${email}`, JSON.stringify(cleanedDocs));
  } catch (e) {
    console.warn('Could not save to user key:', e);
  }
};

/**
 * When a user creates or joins a family AFTER already uploading some docs,
 * migrate their email-scoped docs into the new family-code key.
 */
export const migrateDocsToFamilyKey = (): void => {
  try {
    const email = getCurrentUserEmail();
    const famCode = getActiveFamilyCode();
    if (!famCode) return;

    const userKey = `paperless_docs_usr_${email}`;
    const famKey = `paperless_docs_fam_${famCode}`;

    const userDocsStr = localStorage.getItem(userKey);
    if (!userDocsStr) return;

    const userDocs: Document[] = JSON.parse(userDocsStr);
    if (!Array.isArray(userDocs) || userDocs.length === 0) return;

    const famDocsStr = localStorage.getItem(famKey);
    const famDocs: Document[] = famDocsStr ? JSON.parse(famDocsStr) : [];
    const existingIds = new Set(famDocs.map((d) => d.id));

    const newDocs = userDocs.filter((d) => !existingIds.has(d.id));
    if (newDocs.length > 0) {
      const merged = [...newDocs.map(cleanDocMetadata), ...famDocs.map(cleanDocMetadata)];
      localStorage.setItem(famKey, JSON.stringify(merged));
    }
  } catch {}
};

// ==========================================
// IndexedDB Local Vault Storage for Files
// ==========================================
const DB_NAME = 'paperless_vault_db';
const STORE_NAME = 'document_files';

const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeFileInDb = async (id: number, buffer: ArrayBuffer, type: string, name: string): Promise<void> => {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, buffer, type, name }, id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Could not store file in IndexedDB:', err);
  }
};

const getFileFromDb = async (id: number): Promise<Blob | null> => {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const res = req.result;
        if (!res) {
          resolve(null);
          return;
        }
        if (res instanceof Blob) {
          resolve(res);
        } else if (res.buffer) {
          resolve(new Blob([res.buffer], { type: res.type || 'application/pdf' }));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const deleteFileFromDb = async (id: number): Promise<void> => {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {}
};

// ==========================================
// Base Initial Documents for Demo Users Only
// ==========================================
const getBaseDocuments = (): Document[] => {
  const email = getCurrentUserEmail();
  const isDemo = email.includes('demo') || email.includes('sharma');

  if (isDemo) {
    return [
      {
        id: 1,
        name: 'Driving Licence',
        category: 'Identity',
        subcategory: 'Driving Licence',
        ownerName: 'Raj Sharma',
        ownerId: 1,
        familyId: 1,
        fileName: 'Driving_Licence.pdf',
        fileType: 'application/pdf',
        fileSize: 245000,
        expiryDate: '2027-03-15',
        status: 'ACTIVE',
        uploadedAt: '2026-01-10',
        uploadedBy: 'Raj Sharma',
        description: 'Official driving licence issued by Ministry of Road Transport.',
      },
      {
        id: 2,
        name: 'Vehicle Insurance',
        category: 'Insurance',
        subcategory: 'Vehicle Insurance',
        ownerName: 'Raj Sharma',
        ownerId: 1,
        familyId: 1,
        fileName: 'Vehicle_Insurance.pdf',
        fileType: 'application/pdf',
        fileSize: 180000,
        expiryDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
        status: 'EXPIRING_SOON',
        uploadedAt: '2026-01-12',
        uploadedBy: 'Raj Sharma',
        description: 'Comprehensive car insurance coverage.',
      },
      {
        id: 4,
        name: 'Passport',
        category: 'Identity',
        subcategory: 'Passport',
        ownerName: 'Priya Sharma',
        ownerId: 2,
        familyId: 1,
        fileName: 'Passport.pdf',
        fileType: 'application/pdf',
        fileSize: 520000,
        expiryDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
        status: 'EXPIRING_SOON',
        uploadedAt: '2026-01-05',
        uploadedBy: 'Priya Sharma',
        description: 'Republic of India 36-page passport booklet.',
      },
      {
        id: 7,
        name: 'College ID',
        category: 'Education',
        subcategory: 'Degree',
        ownerName: 'Aarav Sharma',
        ownerId: 3,
        familyId: 1,
        fileName: 'College_ID.pdf',
        fileType: 'application/pdf',
        fileSize: 120000,
        expiryDate: '2027-07-31',
        status: 'ACTIVE',
        uploadedAt: '2026-01-15',
        uploadedBy: 'Aarav Sharma',
        description: 'Undergraduate student identification card.',
      },
    ];
  }

  // Real user accounts start with an EMPTY vault
  return [];
};

// ==========================================
// Document Operations
// ==========================================

export const getDocuments = async (params?: DocumentQueryParams): Promise<ApiResponse<Document[]>> => {
  // 1. Try backend API first (if a real Spring Boot server is active)
  try {
    const queryParams: Record<string, any> = { ...params };
    const response = await api.get<ApiResponse<Document[]>>('/documents', { params: queryParams });
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch {}

  // 2. Static Vercel deployment: load from robust client-side storage
  migrateDocsToFamilyKey();

  const email = getCurrentUserEmail();
  const isDemo = email.includes('demo') || email.includes('sharma');
  const baseDocs = isDemo ? getBaseDocuments() : [];
  const storedDocs = getStoredDocuments();

  // Combine stored docs and base demo docs
  const combined = [...storedDocs];
  const existingIds = new Set(storedDocs.map((d) => d.id));
  for (const b of baseDocs) {
    if (!existingIds.has(b.id)) {
      combined.push(b);
    }
  }

  // Apply filters
  let filtered = [...combined];
  if (params?.category && params.category !== 'All') {
    filtered = filtered.filter((d) => (d.category || '').toLowerCase() === params.category!.toLowerCase());
  }
  if (params?.ownerId) {
    filtered = filtered.filter((d) => d.ownerId === params.ownerId);
  }
  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q) ||
        (d.ownerName || '').toLowerCase().includes(q) ||
        (d.subcategory || '').toLowerCase().includes(q)
    );
  }

  // Apply sorting
  if (params?.sort === 'newest' || !params?.sort) {
    filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  } else if (params?.sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  } else if (params?.sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (params?.sort === 'expiry') {
    filtered.sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  }

  return { success: true, message: 'Documents loaded successfully', data: filtered };
};

export const getDocument = async (id: number): Promise<ApiResponse<Document>> => {
  // 1. Try backend
  try {
    const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    if (response.data && typeof response.data === 'object' && response.data.data?.id) {
      return response.data;
    }
  } catch {}

  // 2. Check stored documents
  migrateDocsToFamilyKey();
  const storedDocs = getStoredDocuments();
  const found = storedDocs.find((d) => d.id === id);
  if (found) {
    return { success: true, message: 'Document found', data: found };
  }

  // 3. Fallback to full list (includes demo docs if demo)
  const docsRes = await getDocuments();
  const doc = (docsRes.data || []).find((d) => d.id === id);
  if (doc) {
    return { success: true, message: 'Document found', data: doc };
  }

  throw new Error('Document not found in current vault');
};

export const uploadDocument = async (formData: FormData): Promise<ApiResponse<Document>> => {
  // 1. Try backend API first
  try {
    const response = await api.post<ApiResponse<Document>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data && typeof response.data === 'object' && response.data.data?.id) {
      notifyVaultUpdated();
      return response.data;
    }
  } catch {}

  // 2. Offline / Vercel fallback: persist into local storage
  const name = (formData.get('name') as string) || 'New Document';
  const category = (formData.get('category') as string) || 'Identity';
  const subcategory = (formData.get('subcategory') as string) || '';
  const ownerName = (formData.get('ownerName') as string) || getCurrentUserEmail().split('@')[0] || 'Self';
  const ownerId = Number(formData.get('ownerId')) || 1;
  const issueDate = (formData.get('issueDate') as string) || '';
  const expiryDate = (formData.get('expiryDate') as string) || '';
  const description = (formData.get('description') as string) || '';
  const file = formData.get('file') as File | null;

  // Calculate status
  let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
  if (expiryDate) {
    const exp = new Date(expiryDate).getTime();
    const now = Date.now();
    if (exp < now) {
      status = 'EXPIRED';
    } else if (exp < now + 30 * 24 * 60 * 60 * 1000) {
      status = 'EXPIRING_SOON';
    }
  }

  // Use timestamp as a reliable unique ID
  const docId = Date.now();
  const fileName = file ? file.name : `${name}.pdf`;
  const fileType = file ? file.type : 'application/pdf';
  // Ensure non-zero file size for accurate storage tracking
  const fileSize = file && file.size > 0 ? file.size : 185000;

  // Process and store the binary file safely in memory cache and IndexedDB
  if (file) {
    try {
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer], { type: fileType || 'application/pdf' });
      // 1. Store in memory cache for instant preview
      memoryBlobCache.set(docId, blob);
      // 2. Store in IndexedDB as ArrayBuffer (survives page reload, no 5MB limit!)
      await storeFileInDb(docId, buffer, fileType, fileName);
    } catch (err) {
      console.warn('Failed to process file binary:', err);
    }
  }

  // Get current user to tag the uploader correctly
  let uploadedBy = ownerName;
  try {
    const u = localStorage.getItem('paperless_user');
    if (u) {
      const parsed = JSON.parse(u);
      if (parsed.name) uploadedBy = parsed.name;
    }
  } catch {}

  // Get the current family ID from localStorage
  let familyId = 1;
  try {
    const f = localStorage.getItem('paperless_family');
    if (f) {
      const parsed = JSON.parse(f);
      if (parsed.id) familyId = parsed.id;
    }
  } catch {}

  // Build clean document metadata (WITHOUT giant dataUrl string!)
  const newDoc: Document = {
    id: docId,
    name,
    category,
    subcategory: subcategory || undefined,
    ownerName,
    ownerId,
    familyId,
    fileName,
    fileType,
    fileSize,
    issueDate: issueDate || undefined,
    expiryDate: expiryDate || undefined,
    description: description || undefined,
    status,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };

  // Persist clean metadata into localStorage
  const existing = getStoredDocuments();
  saveStoredDocuments([newDoc, ...existing]);

  // Broadcast event across the application so sidebar storage and lists update immediately
  notifyVaultUpdated();

  return {
    success: true,
    message: 'Document uploaded and securely saved to your vault!',
    data: newDoc,
  };
};

export const updateDocument = async (id: number, data: Partial<Document>): Promise<ApiResponse<Document>> => {
  try {
    const response = await api.put<ApiResponse<Document>>(`/documents/${id}`, data);
    if (response.data && response.data.data?.id) {
      notifyVaultUpdated();
      return response.data;
    }
  } catch {}

  const existing = getStoredDocuments();
  const idx = existing.findIndex((d) => d.id === id);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], ...data };
    saveStoredDocuments(existing);
    notifyVaultUpdated();
    return { success: true, message: 'Document updated', data: existing[idx] };
  }
  return { success: true, message: 'Updated', data: data as Document };
};

export const deleteDocument = async (id: number): Promise<ApiResponse<void>> => {
  try {
    await api.delete<ApiResponse<void>>(`/documents/${id}`);
  } catch {}

  // Delete from in-memory cache
  memoryBlobCache.delete(id);

  // Delete from user's scoped storage
  const existing = getStoredDocuments();
  const filtered = existing.filter((d) => d.id !== id);
  saveStoredDocuments(filtered);

  // Delete from IndexedDB
  await deleteFileFromDb(id);

  // Broadcast update so storage and grid refresh immediately
  notifyVaultUpdated();

  return { success: true, message: 'Deleted', data: undefined };
};

export const getExpiringDocuments = async (): Promise<ApiResponse<Document[]>> => {
  try {
    const response = await api.get<ApiResponse<Document[]>>('/documents/expiring');
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch {}

  const docsRes = await getDocuments();
  const expiring = (docsRes.data || []).filter((d) => d.status === 'EXPIRING_SOON' || d.status === 'EXPIRED');
  return { success: true, message: 'Expiring documents', data: expiring };
};

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  try {
    const response = await api.get<ApiResponse<DashboardStats>>('/documents/stats');
    if (response.data && typeof response.data === 'object' && response.data.data?.totalDocuments !== undefined) {
      return response.data;
    }
  } catch {}

  const docsRes = await getDocuments();
  const docs = docsRes.data || [];
  const expiringCount = docs.filter((d) => d.status === 'EXPIRING_SOON' || d.status === 'EXPIRED').length;
  const totalBytes = docs.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);

  return {
    success: true,
    message: 'Dashboard stats',
    data: {
      totalDocuments: docs.length,
      totalMembers: 1,
      expiringSoon: expiringCount,
      storageUsed: `${sizeMb} MB`,
    },
  };
};

export const previewDocument = async (id: number): Promise<Blob> => {
  // 1. Check in-memory session cache first (fastest)
  if (memoryBlobCache.has(id)) {
    return memoryBlobCache.get(id)!;
  }

  // 2. Check IndexedDB for user-uploaded document binary
  const idbBlob = await getFileFromDb(id);
  if (idbBlob && idbBlob.size > 0) {
    memoryBlobCache.set(id, idbBlob);
    return idbBlob;
  }

  // 3. Try backend preview endpoint if available
  try {
    const response = await api.get(`/documents/${id}/preview`, { responseType: 'blob' });
    if (response.data instanceof Blob && !response.data.type.includes('text/html') && response.data.size > 0) {
      memoryBlobCache.set(id, response.data);
      return response.data;
    }
  } catch {}

  // 4. Fallback: generate a lightweight informative placeholder preview for demo records
  try {
    const docRes = await getDocument(id);
    const doc = docRes.data;
    const placeholderSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
        <rect width="600" height="800" fill="#FAFAF5"/>
        <rect x="40" y="40" width="520" height="720" rx="16" fill="#FFFFFF" stroke="#111111" stroke-width="3"/>
        <rect x="60" y="60" width="120" height="30" rx="6" fill="#C8FF3D" stroke="#111111" stroke-width="2"/>
        <text x="75" y="80" font-family="sans-serif" font-weight="900" font-size="12" fill="#111111">${(doc?.category || 'DOCUMENT').toUpperCase()}</text>
        <text x="60" y="140" font-family="sans-serif" font-weight="900" font-size="28" fill="#111111">${doc?.name || 'Document'}</text>
        <text x="60" y="175" font-family="sans-serif" font-weight="600" font-size="14" fill="#666666">Owner: ${doc?.ownerName || 'Family Member'}</text>
        <text x="60" y="200" font-family="sans-serif" font-weight="600" font-size="14" fill="#666666">Status: ${doc?.status || 'ACTIVE'}</text>
        ${doc?.expiryDate ? `<text x="60" y="225" font-family="sans-serif" font-weight="600" font-size="14" fill="#666666">Expiry Date: ${doc.expiryDate}</text>` : ''}
        <line x1="60" y1="250" x2="540" y2="250" stroke="#111111" stroke-width="2" stroke-dasharray="6 6"/>
        <text x="60" y="290" font-family="sans-serif" font-weight="700" font-size="14" fill="#111111">Description / Notes:</text>
        <text x="60" y="320" font-family="sans-serif" font-weight="500" font-size="14" fill="#444444">${doc?.description || 'Verified household record.'}</text>
      </svg>
    `;
    const svgBlob = new Blob([placeholderSvg], { type: 'image/svg+xml' });
    memoryBlobCache.set(id, svgBlob);
    return svgBlob;
  } catch {}

  throw new Error('Preview not found');
};

export const downloadDocument = async (id: number): Promise<Blob> => {
  return previewDocument(id);
};

export const triggerFileDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  try {
    const response = await api.get<ApiResponse<Category[]>>('/documents/categories');
    if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch {}

  return {
    success: true,
    message: 'Categories',
    data: [
      { name: 'Identity', icon: 'Shield', subcategories: ['Aadhaar', 'PAN', 'Passport', 'Driving Licence', 'Voter ID'] },
      { name: 'Education', icon: 'GraduationCap', subcategories: ['Certificate', 'Marksheet', 'Degree', 'Course Document'] },
      { name: 'Medical', icon: 'HeartPulse', subcategories: ['Medical Report', 'Prescription', 'Health Record'] },
      { name: 'Finance', icon: 'Wallet', subcategories: ['Bank Document', 'Tax Document', 'Loan'] },
      { name: 'Insurance', icon: 'ShieldCheck', subcategories: ['Health Insurance', 'Life Insurance', 'Vehicle Insurance'] },
      { name: 'Property', icon: 'Home', subcategories: ['Property Document', 'Rental Agreement'] },
      { name: 'Vehicle', icon: 'Car', subcategories: ['RC', 'Insurance', 'PUC'] },
      { name: 'Bills', icon: 'Receipt', subcategories: ['Electricity', 'Water', 'Internet', 'Mobile'] },
      { name: 'Other', icon: 'FileText', subcategories: ['Other'] },
    ],
  };
};

export default {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getExpiringDocuments,
  getDashboardStats,
  downloadDocument,
  previewDocument,
  triggerFileDownload,
  getCategories,
  migrateDocsToFamilyKey,
  notifyVaultUpdated,
};
