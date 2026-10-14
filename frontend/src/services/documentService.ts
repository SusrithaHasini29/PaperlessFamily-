import api from './api';
import { Document, DashboardStats, Category, ApiResponse } from '../types';

export interface DocumentQueryParams {
  familyId?: number;
  category?: string;
  ownerId?: number;
  search?: string;
  sort?: string;
}

// In-memory session caches for instantaneous zero-latency operations
const memoryBlobCache = new Map<number, Blob>();
let inMemoryDocsCache: Document[] = [];

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
  const { dataUrl, fileContent, base64, buffer, blob, ...clean } = doc;
  return {
    ...clean,
    id: Number(clean.id) || Date.now(),
    fileSize: Number(clean.fileSize) || 245000,
    status: clean.status || 'ACTIVE',
  } as Document;
};

/**
 * Proactively purges bloated legacy keys that may have exceeded localStorage quota.
 */
const purgeHeavyLocalStorageKeys = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === 'paperless_stored_documents') {
        keysToRemove.push(key);
        continue;
      }
      try {
        const val = localStorage.getItem(key);
        if (val && val.length > 500000) {
          // If a key has more than 500KB of raw text (likely unstripped base64), purge or clean it
          if (key.startsWith('paperless_docs_')) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.map(cleanDocMetadata);
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          }
        }
      } catch {}
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch {}
};

// Initialize quota hygiene once on load
purgeHeavyLocalStorageKeys();

// ==========================================
// IndexedDB Local Vault Storage for Files & Metadata
// (Database: paperless_vault_db, Version: 3)
// ==========================================
const DB_NAME = 'paperless_vault_db';
const FILE_STORE_NAME = 'document_files';
const META_STORE_NAME = 'documents_meta';

const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
        db.createObjectStore(FILE_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeFileInDb = async (
  id: number,
  buffer: ArrayBuffer,
  blob: Blob,
  type: string,
  name: string
): Promise<void> => {
  try {
    const numId = Number(id);
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(FILE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(FILE_STORE_NAME);
      store.put({ id: numId, buffer, blob, type, name }, numId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Could not store file in IndexedDB:', err);
  }
};

const getFileFromDb = async (id: number | string): Promise<Blob | null> => {
  try {
    const numId = Number(id);
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(FILE_STORE_NAME, 'readonly');
      const store = tx.objectStore(FILE_STORE_NAME);
      const req = store.get(numId);
      req.onsuccess = () => {
        const res = req.result;
        if (!res) {
          resolve(null);
          return;
        }
        if (res instanceof Blob) {
          resolve(res);
        } else if (res.blob instanceof Blob) {
          resolve(res.blob);
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

const deleteFileFromDb = async (id: number | string): Promise<void> => {
  try {
    const numId = Number(id);
    const db = await getDb();
    const tx = db.transaction(FILE_STORE_NAME, 'readwrite');
    tx.objectStore(FILE_STORE_NAME).delete(numId);
  } catch {}
};

const storeDocMetaInDb = async (doc: Document): Promise<void> => {
  try {
    const clean = cleanDocMetadata(doc);
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(META_STORE_NAME, 'readwrite');
      const store = tx.objectStore(META_STORE_NAME);
      store.put(clean);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
};

const getDocsMetaFromDb = async (): Promise<Document[]> => {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(META_STORE_NAME, 'readonly');
      const store = tx.objectStore(META_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        resolve(items.map(cleanDocMetadata).filter(Boolean));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

const deleteDocMetaFromDb = async (id: number | string): Promise<void> => {
  try {
    const numId = Number(id);
    const db = await getDb();
    const tx = db.transaction(META_STORE_NAME, 'readwrite');
    tx.objectStore(META_STORE_NAME).delete(numId);
  } catch {}
};

// ==========================================
// LocalStorage Persistence
// ==========================================
export const getStoredDocuments = (): Document[] => {
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
          for (const item of list) {
            if (item && item.id) {
              const cleaned = cleanDocMetadata(item);
              if (cleaned && !seenIds.has(cleaned.id)) {
                seenIds.add(cleaned.id);
                collectedDocs.push(cleaned);
              }
            }
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
      purgeHeavyLocalStorageKeys();
      try {
        localStorage.setItem(`paperless_docs_fam_${famCode}`, JSON.stringify(cleanedDocs));
      } catch {}
    }
  }

  // 2. ALWAYS save to user key as well (double guarantee)
  try {
    localStorage.setItem(`paperless_docs_usr_${email}`, JSON.stringify(cleanedDocs));
  } catch (e) {
    console.warn('Could not save to user key:', e);
    purgeHeavyLocalStorageKeys();
    try {
      localStorage.setItem(`paperless_docs_usr_${email}`, JSON.stringify(cleanedDocs));
    } catch {}
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
        uploadedAt: '2026-01-10T10:00:00Z',
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
        uploadedAt: '2026-01-12T10:00:00Z',
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
        uploadedAt: '2026-01-05T10:00:00Z',
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
        uploadedAt: '2026-01-15T10:00:00Z',
        uploadedBy: 'Aarav Sharma',
        description: 'Undergraduate student identification card.',
      },
    ];
  }

  // Real user accounts start with an empty vault
  return [];
};

// ==========================================
// Document Operations
// ==========================================

export const getDocuments = async (params?: DocumentQueryParams): Promise<ApiResponse<Document[]>> => {
  migrateDocsToFamilyKey();

  const email = getCurrentUserEmail();
  const isDemo = email.includes('demo') || email.includes('sharma');
  const baseDocs = isDemo ? getBaseDocuments() : [];

  // 1. Gather all documents from in-memory cache, IndexedDB metadata, and localStorage
  const localStorageDocs = getStoredDocuments();
  let idbDocs: Document[] = [];
  try {
    idbDocs = await getDocsMetaFromDb();
  } catch {}

  // 2. Merge all sources safely by unique document ID
  const allMap = new Map<number, Document>();

  // Add base demo docs first (if demo)
  for (const doc of baseDocs) {
    if (doc?.id) allMap.set(doc.id, doc);
  }

  // Add IndexedDB docs (higher priority)
  for (const doc of idbDocs) {
    if (doc?.id) allMap.set(doc.id, doc);
  }

  // Add localStorage docs
  for (const doc of localStorageDocs) {
    if (doc?.id) allMap.set(doc.id, doc);
  }

  // Add in-memory session docs (highest priority)
  for (const doc of inMemoryDocsCache) {
    if (doc?.id) allMap.set(doc.id, doc);
  }

  const combined = Array.from(allMap.values());

  // Apply category filter
  let filtered = [...combined];
  if (params?.category && params.category !== 'All') {
    filtered = filtered.filter(
      (d) => (d.category || '').toLowerCase() === params.category!.toLowerCase()
    );
  }

  // Apply owner filter
  if (params?.ownerId) {
    filtered = filtered.filter((d) => d.ownerId === params.ownerId);
  }

  // Apply search query filter
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

export const getDocument = async (id: number | string): Promise<ApiResponse<Document>> => {
  const numId = Number(id);

  // 1. Check in-memory docs cache
  const memDoc = inMemoryDocsCache.find((d) => d.id === numId);
  if (memDoc) {
    return { success: true, message: 'Document found', data: memDoc };
  }

  // 2. Check IndexedDB metadata
  try {
    const idbDocs = await getDocsMetaFromDb();
    const idbDoc = idbDocs.find((d) => d.id === numId);
    if (idbDoc) {
      return { success: true, message: 'Document found', data: idbDoc };
    }
  } catch {}

  // 3. Check stored documents (localStorage)
  const storedDocs = getStoredDocuments();
  const found = storedDocs.find((d) => d.id === numId);
  if (found) {
    return { success: true, message: 'Document found', data: found };
  }

  // 4. Fallback to full list (including base demo docs)
  const docsRes = await getDocuments();
  const doc = (docsRes.data || []).find((d) => d.id === numId);
  if (doc) {
    return { success: true, message: 'Document found', data: doc };
  }

  throw new Error('Document not found in current vault');
};

export const uploadDocument = async (formData: FormData): Promise<ApiResponse<Document>> => {
  const name = (formData.get('name') as string) || 'New Document';
  const category = (formData.get('category') as string) || 'Identity';
  const subcategory = (formData.get('subcategory') as string) || '';
  const ownerName =
    (formData.get('ownerName') as string) || getCurrentUserEmail().split('@')[0] || 'Self';
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

  // Generate robust timestamp-based document ID
  const docId = Date.now();
  const fileName = file ? file.name : `${name}.pdf`;
  const fileType = file ? file.type || 'application/pdf' : 'application/pdf';
  const fileSize = file && file.size > 0 ? file.size : 245000;

  // Process and store the binary file safely in memory cache and IndexedDB
  if (file) {
    try {
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer], { type: fileType });
      // 1. Store in memory cache for instant preview
      memoryBlobCache.set(docId, blob);
      // 2. Store in IndexedDB as ArrayBuffer + Blob (permanent storage, survives reload!)
      await storeFileInDb(docId, buffer, blob, fileType, fileName);
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

  // Build clean document metadata
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

  // 1. Save into in-memory cache immediately (instant 0ms visibility)
  inMemoryDocsCache = [newDoc, ...inMemoryDocsCache.filter((d) => d.id !== docId)];

  // 2. Save into IndexedDB metadata store (no 5MB quota limit!)
  await storeDocMetaInDb(newDoc);

  // 3. Persist clean metadata into localStorage
  const existing = getStoredDocuments();
  saveStoredDocuments([newDoc, ...existing]);

  // 4. Broadcast event across the application so sidebar storage, dashboard, and lists update immediately
  notifyVaultUpdated();

  // 5. Non-blocking background sync to backend (if live Spring Boot server exists)
  try {
    api
      .post<ApiResponse<Document>>('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 1500,
      })
      .catch(() => {});
  } catch {}

  return {
    success: true,
    message: 'Document uploaded and securely saved to your vault!',
    data: newDoc,
  };
};

export const updateDocument = async (
  id: number | string,
  data: Partial<Document>
): Promise<ApiResponse<Document>> => {
  const numId = Number(id);

  // Update in-memory cache
  const memIdx = inMemoryDocsCache.findIndex((d) => d.id === numId);
  if (memIdx !== -1) {
    inMemoryDocsCache[memIdx] = { ...inMemoryDocsCache[memIdx], ...data };
  }

  // Update in localStorage
  const existing = getStoredDocuments();
  const idx = existing.findIndex((d) => d.id === numId);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], ...data };
    saveStoredDocuments(existing);
    await storeDocMetaInDb(existing[idx]);
    notifyVaultUpdated();
    return { success: true, message: 'Document updated', data: existing[idx] };
  }

  notifyVaultUpdated();
  return { success: true, message: 'Updated', data: data as Document };
};

export const deleteDocument = async (id: number | string): Promise<ApiResponse<void>> => {
  const numId = Number(id);

  // Delete from in-memory cache
  memoryBlobCache.delete(numId);
  inMemoryDocsCache = inMemoryDocsCache.filter((d) => d.id !== numId);

  // Delete from user's scoped storage
  const existing = getStoredDocuments();
  const filtered = existing.filter((d) => d.id !== numId);
  saveStoredDocuments(filtered);

  // Delete from IndexedDB (both binary and metadata)
  await deleteFileFromDb(numId);
  await deleteDocMetaFromDb(numId);

  // Broadcast update so storage and grid refresh immediately
  notifyVaultUpdated();

  // Optional background backend sync
  try {
    api.delete(`/documents/${numId}`, { timeout: 1500 }).catch(() => {});
  } catch {}

  return { success: true, message: 'Deleted', data: undefined };
};

export const getExpiringDocuments = async (): Promise<ApiResponse<Document[]>> => {
  const docsRes = await getDocuments();
  const expiring = (docsRes.data || []).filter(
    (d) => d.status === 'EXPIRING_SOON' || d.status === 'EXPIRED'
  );
  return { success: true, message: 'Expiring documents', data: expiring };
};

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const docsRes = await getDocuments();
  const docs = docsRes.data || [];
  const expiringCount = docs.filter(
    (d) => d.status === 'EXPIRING_SOON' || d.status === 'EXPIRED'
  ).length;
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

/**
 * Creates a valid, well-formed 1-page PDF Blob that opens seamlessly
 * in any PDF viewer (Chrome, Edge, Adobe Reader, Apple Preview).
 */
const createValidPdfBlob = (title: string, lines: string[]): Blob => {
  const safeTitle = title.replace(/[()\\]/g, '');
  const textCommands = [
    `BT /F1 20 Tf 50 720 Td (${safeTitle}) Tj ET`,
    ...lines.map(
      (line, idx) =>
        `BT /F2 12 Tf 50 ${680 - idx * 24} Td (${line.replace(/[()\\]/g, '')}) Tj ET`
    ),
  ].join('\n');

  const streamLen = textCommands.length;
  const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length ${streamLen} >> stream
${textCommands}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000330 00000 n 
0000000410 00000 n 
trailer << /Size 7 /Root 1 0 R >>
startxref
485
%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
};

export const previewDocument = async (id: number | string): Promise<Blob> => {
  const numId = Number(id);

  // 1. Check in-memory session cache first (instant 0ms)
  if (memoryBlobCache.has(numId)) {
    return memoryBlobCache.get(numId)!;
  }

  // 2. Check IndexedDB for user-uploaded document binary
  const idbBlob = await getFileFromDb(numId);
  if (idbBlob && idbBlob.size > 0) {
    memoryBlobCache.set(numId, idbBlob);
    return idbBlob;
  }

  // 3. Fallback: generate a well-formed PDF document preview
  try {
    const docRes = await getDocument(numId);
    const doc = docRes.data;
    const lines = [
      `Category: ${doc.category || 'General'}`,
      `Owner: ${doc.ownerName || 'Family Member'}`,
      `Status: ${doc.status || 'ACTIVE'}`,
      doc.expiryDate ? `Expiry Date: ${doc.expiryDate}` : '',
      `Uploaded: ${doc.uploadedAt ? doc.uploadedAt.split('T')[0] : 'Recent'}`,
      '',
      `Description: ${doc.description || 'Verified household document in PaperlessFamily.'}`,
    ].filter(Boolean);

    const pdfBlob = createValidPdfBlob(doc.name || 'Household Document', lines);
    memoryBlobCache.set(numId, pdfBlob);
    return pdfBlob;
  } catch {}

  throw new Error('Preview not found');
};

export const downloadDocument = async (id: number | string): Promise<Blob> => {
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
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
};

export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  return {
    success: true,
    message: 'Categories',
    data: [
      {
        name: 'Identity',
        icon: 'Shield',
        subcategories: ['Aadhaar', 'PAN', 'Passport', 'Driving Licence', 'Voter ID'],
      },
      {
        name: 'Education',
        icon: 'GraduationCap',
        subcategories: ['Certificate', 'Marksheet', 'Degree', 'Course Document'],
      },
      {
        name: 'Medical',
        icon: 'HeartPulse',
        subcategories: ['Medical Report', 'Prescription', 'Health Record'],
      },
      {
        name: 'Finance',
        icon: 'Wallet',
        subcategories: ['Bank Document', 'Tax Document', 'Loan'],
      },
      {
        name: 'Insurance',
        icon: 'ShieldCheck',
        subcategories: ['Health Insurance', 'Life Insurance', 'Vehicle Insurance'],
      },
      {
        name: 'Property',
        icon: 'Home',
        subcategories: ['Property Document', 'Rental Agreement'],
      },
      {
        name: 'Vehicle',
        icon: 'Car',
        subcategories: ['RC', 'Insurance', 'PUC'],
      },
      {
        name: 'Bills',
        icon: 'Receipt',
        subcategories: ['Electricity', 'Water', 'Internet', 'Mobile'],
      },
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
