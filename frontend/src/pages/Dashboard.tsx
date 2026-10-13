import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  AlertTriangle,
  HardDrive,
  Bot,
  Shield,
  HeartPulse,
  Home,
  GraduationCap,
  Car,
  Receipt,
  Send,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as documentService from '../services/documentService';
import * as familyService from '../services/familyService';
import { Document, DashboardStats, Category, FamilyMember } from '../types';
import { formatDate, getGreeting, getInitials, getAvatarColor, getDaysUntilExpiry } from '../utils/helpers';

export const Dashboard: React.FC = () => {
  const { user, family } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [, setLoading] = useState<boolean>(true);

  // Quick AI input state
  const [aiPrompt, setAiPrompt] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const famId = family?.id || 1;
        const [statsRes, docsRes, expiringRes, catRes, membersRes] = await Promise.allSettled([
          documentService.getDashboardStats(),
          documentService.getDocuments({ familyId: famId, sort: 'newest' }),
          documentService.getExpiringDocuments(),
          documentService.getCategories(),
          family?.id ? familyService.getFamilyMembers(family.id) : Promise.reject(),
        ]);

        if (isMounted) {
          const isDemo = user?.email === 'demo@paperlessfamily.com';

          if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
            setStats(statsRes.value.data);
          } else if (isDemo) {
            setStats({
              totalDocuments: 128,
              totalMembers: 6,
              expiringSoon: 4,
              storageUsed: '2.4 GB',
            });
          } else {
            setStats({
              totalDocuments: 0,
              totalMembers: 1,
              expiringSoon: 0,
              storageUsed: '0 MB',
            });
          }

          if (docsRes.status === 'fulfilled' && docsRes.value?.data) {
            setRecentDocs(docsRes.value.data.slice(0, 4));
          } else if (isDemo) {
            setRecentDocs([
              {
                id: 1,
                name: 'Passport',
                category: 'Identity',
                ownerName: 'Priya Sharma',
                ownerId: 2,
                familyId: 1,
                fileName: 'passport.pdf',
                fileType: 'pdf',
                fileSize: 1200000,
                status: 'ACTIVE',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj Sharma',
                expiryDate: '2028-08-18',
              },
              {
                id: 2,
                name: 'Health Insurance',
                category: 'Insurance',
                ownerName: 'Raj Sharma',
                ownerId: 1,
                familyId: 1,
                fileName: 'health_ins.pdf',
                fileType: 'pdf',
                fileSize: 850000,
                status: 'EXPIRING_SOON',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj Sharma',
                expiryDate: '2025-01-15',
              },
              {
                id: 3,
                name: 'Aadhaar Card',
                category: 'Identity',
                ownerName: 'Raj Sharma',
                ownerId: 1,
                familyId: 1,
                fileName: 'aadhaar.pdf',
                fileType: 'pdf',
                fileSize: 450000,
                status: 'ACTIVE',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj Sharma',
                expiryDate: '2030-12-12',
              },
              {
                id: 4,
                name: 'Property Document',
                category: 'Property',
                ownerName: 'Home',
                ownerId: 1,
                familyId: 1,
                fileName: 'property.pdf',
                fileType: 'pdf',
                fileSize: 3200000,
                status: 'ACTIVE',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj Sharma',
                expiryDate: '2030-08-20',
              },
            ]);
          } else {
            setRecentDocs([]);
          }

          if (expiringRes.status === 'fulfilled' && expiringRes.value?.data) {
            setExpiringDocs(expiringRes.value.data.slice(0, 4));
          } else if (isDemo) {
            setExpiringDocs([
              {
                id: 101,
                name: 'Passport',
                ownerName: 'Priya Sharma',
                category: 'Identity',
                familyId: 1,
                ownerId: 2,
                fileName: 'passport.pdf',
                fileType: 'pdf',
                fileSize: 1000,
                status: 'EXPIRING_SOON',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj',
                expiryDate: new Date(Date.now() + 86400000 * 18).toISOString(),
              },
              {
                id: 102,
                name: 'Vehicle Insurance',
                ownerName: 'Raj Sharma',
                category: 'Insurance',
                familyId: 1,
                ownerId: 1,
                fileName: 'vehicle_ins.pdf',
                fileType: 'pdf',
                fileSize: 1000,
                status: 'EXPIRING_SOON',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj',
                expiryDate: new Date(Date.now() + 86400000 * 32).toISOString(),
              },
              {
                id: 103,
                name: 'Health Insurance',
                ownerName: 'Priya Sharma',
                category: 'Insurance',
                familyId: 1,
                ownerId: 2,
                fileName: 'health_ins.pdf',
                fileType: 'pdf',
                fileSize: 1000,
                status: 'EXPIRING_SOON',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj',
                expiryDate: new Date(Date.now() + 86400000 * 28).toISOString(),
              },
              {
                id: 104,
                name: 'Electricity Bill',
                ownerName: 'Home',
                category: 'Bills',
                familyId: 1,
                ownerId: 1,
                fileName: 'electricity_bill.pdf',
                fileType: 'pdf',
                fileSize: 1000,
                status: 'EXPIRING_SOON',
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'Raj',
                expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(),
              },
            ]);
          } else {
            setExpiringDocs([]);
          }

          if (catRes.status === 'fulfilled' && catRes.value?.data && catRes.value.data.length > 0) {
            setCategories(catRes.value.data);
          } else {
            setCategories([
              { name: 'Identity', icon: 'Shield', subcategories: ['Aadhaar', 'PAN', 'Passport'] },
              { name: 'Education', icon: 'GraduationCap', subcategories: ['Certificates', 'Marksheets'] },
              { name: 'Medical', icon: 'HeartPulse', subcategories: ['Prescriptions', 'Reports'] },
              { name: 'Insurance', icon: 'ShieldCheck', subcategories: ['Health', 'Life', 'Motor'] },
              { name: 'Property', icon: 'Home', subcategories: ['Deeds', 'Tax'] },
              { name: 'Vehicle', icon: 'Car', subcategories: ['RC', 'PUC'] },
              { name: 'Bills', icon: 'Receipt', subcategories: ['Utility', 'Internet'] },
              { name: 'Other', icon: 'FileText', subcategories: ['General'] },
            ]);
          }

          if (membersRes.status === 'fulfilled' && membersRes.value?.data && membersRes.value.data.length > 0) {
            setMembers(membersRes.value.data);
          } else if (isDemo) {
            setMembers([
              { id: 1, userId: 1, name: 'Raj Sharma', email: 'raj@sharma.com', relationship: 'Father', role: 'ADMIN', documentCount: 12, joinedAt: '2024-01-10' },
              { id: 2, userId: 2, name: 'Priya Sharma', email: 'priya@sharma.com', relationship: 'Mother', role: 'MEMBER', documentCount: 16, joinedAt: '2024-01-12' },
              { id: 3, userId: 3, name: 'Aarav Sharma', email: 'aarav@sharma.com', relationship: 'Son', role: 'MEMBER', documentCount: 8, joinedAt: '2024-01-15' },
              { id: 4, userId: 4, name: 'Ananya Sharma', email: 'ananya@sharma.com', relationship: 'Daughter', role: 'MEMBER', documentCount: 6, joinedAt: '2024-01-15' },
            ]);
          } else {
            setMembers([
              {
                id: user?.id || 1,
                userId: user?.id || 1,
                name: user?.name || 'Head of Family',
                email: user?.email || '',
                relationship: 'Head of Family',
                role: 'ADMIN',
                documentCount: 0,
                joinedAt: user?.createdAt || new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [family]);

  const handleQuickAsk = (question: string) => {
    navigate('/ai-assistant', { state: { initialQuery: question } });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. PINK WELCOME BANNER (Matching Image 2) */}
      <div className="p-6 sm:p-7 bg-pink rounded-2xl border-2 border-black shadow-neo relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Doodle Stars / Scribbles */}
        <div className="absolute top-3 right-52 text-black/40 text-xl font-bold select-none hidden lg:block">
          ✦
        </div>
        <div className="absolute bottom-3 left-80 text-black/40 text-sm select-none hidden lg:block">
          ⚡
        </div>

        <div className="z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight leading-tight">
            {getGreeting()}, {user?.name || 'Friend'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-black/85 font-extrabold mt-1">
            Here's what's happening with your family documents.
          </p>
        </div>

        {/* Polaroid Family Card in Lime Frame */}
        <div className="shrink-0 relative self-end md:self-center">
          <div className="w-36 h-28 sm:w-44 sm:h-32 bg-lime p-2 rounded-xl border-2 border-black shadow-neo rotate-3 hover:rotate-0 transition-transform duration-200">
            <div className="w-full h-full rounded-lg border border-black overflow-hidden bg-slate-900 relative flex items-end p-2">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=500&q=80"
                alt="Family Vault"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="relative z-20 text-[10px] font-black uppercase text-lime tracking-wider">
                Family Vault
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 STATS CARDS (Matching Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents (White Card with Purple Folder Icon) */}
        <div className="p-5 bg-white rounded-xl border-2 border-black shadow-neo flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple/15 border-1.5 border-black flex items-center justify-center text-purple">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-black leading-none">
                {stats?.totalDocuments ?? (user?.email === 'demo@paperlessfamily.com' ? 128 : 0)}
              </div>
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mt-1">
                Total Documents
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Family Members (Lime Green Card) */}
        <div className="p-5 bg-lime rounded-xl border-2 border-black shadow-neo flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border-1.5 border-black flex items-center justify-center text-black">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-black leading-none">
                {stats?.totalMembers ?? (user?.email === 'demo@paperlessfamily.com' ? 6 : members.length || 1)}
              </div>
              <div className="text-[11px] font-black text-black uppercase tracking-wider mt-1">
                Family Members
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Expiring Soon (Pink Card) */}
        <div className="p-5 bg-pink rounded-xl border-2 border-black shadow-neo flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border-1.5 border-black flex items-center justify-center text-black">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-black leading-none">
                {stats?.expiringSoon ?? (user?.email === 'demo@paperlessfamily.com' ? 4 : expiringDocs.length || 0)}
              </div>
              <div className="text-[11px] font-black text-black uppercase tracking-wider mt-1">
                Expiring Soon
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Storage Used (Cyan Card) */}
        <div className="p-5 bg-cyan rounded-xl border-2 border-black shadow-neo flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border-1.5 border-black flex items-center justify-center text-black">
              <HardDrive className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-black leading-none">
                {stats?.storageUsed ?? (user?.email === 'demo@paperlessfamily.com' ? '2.4 GB' : '0 MB')}
              </div>
              <div className="text-[11px] font-black text-black uppercase tracking-wider mt-1">
                Storage Used
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: RECENT DOCUMENTS & EXPIRY ALERTS (Matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Documents Card */}
        <div className="p-5 bg-white rounded-2xl border-2 border-black shadow-neo flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b-1.5 border-black/10">
              <h2 className="text-base font-black text-black tracking-tight">
                Recent Documents
              </h2>
              <Link
                to="/documents"
                className="text-xs font-black text-black hover:text-purple flex items-center gap-1"
              >
                <span>View All</span>
                <span className="font-bold">→</span>
              </Link>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => {
                  const isExpiring = doc.status === 'EXPIRING_SOON';
                  const isExpired = doc.status === 'EXPIRED';
                  const badgeColor = isExpired
                    ? 'bg-pink text-black'
                    : isExpiring
                    ? 'bg-yellow-200 text-black'
                    : 'bg-lime text-black';
                  const statusLabel = isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-cream/60 px-2 rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl border border-black flex items-center justify-center shrink-0 bg-purple/15 text-purple">
                          <FileText className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-black truncate">
                            {doc.name}
                          </h4>
                          <p className="text-[11px] font-semibold text-gray-500 truncate">
                            {doc.ownerName || 'Family'} • {doc.category}
                            <span className="ml-2 font-medium text-gray-400">
                              {doc.expiryDate || doc.issueDate || formatDate(doc.uploadedAt)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-black rounded-md border border-black shadow-neo-sm ${badgeColor}`}
                        >
                          {statusLabel}
                        </span>
                        <button className="text-gray-400 hover:text-black p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-cream border border-black flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-xs font-black text-black">No documents uploaded yet</p>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Start building your family's digital vault.</p>
                  <button
                    onClick={() => navigate('/documents?action=upload')}
                    className="mt-3 px-3 py-1.5 bg-lime text-black text-xs font-black rounded-lg border border-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    + Upload Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expiry Alerts Card */}
        <div className="p-5 bg-white rounded-2xl border-2 border-black shadow-neo flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b-1.5 border-black/10">
              <h2 className="text-base font-black text-black tracking-tight">
                Expiry Alerts
              </h2>
              <Link
                to="/documents?filter=expiring"
                className="text-xs font-black text-black hover:text-purple flex items-center gap-1"
              >
                <span>View All</span>
                <span className="font-bold">→</span>
              </Link>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {expiringDocs.length > 0 ? (
                expiringDocs.map((doc) => {
                  const days = getDaysUntilExpiry(doc.expiryDate);
                  const isRed = days !== 9999 && days <= 15;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate('/notifications')}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-cream/60 px-2 rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl border border-black flex items-center justify-center shrink-0 ${
                            isRed ? 'bg-pink/30 text-pink-600' : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-black truncate">
                            {doc.name} {doc.ownerName ? `• ${doc.ownerName}` : ''}
                          </h4>
                          <p
                            className={`text-[11px] font-extrabold ${
                              isRed ? 'text-red-500' : 'text-amber-600'
                            }`}
                          >
                            {days !== 9999
                              ? days < 0
                                ? 'Expired'
                                : `Expires in ${days} days`
                              : 'Renewal due soon'}
                          </p>
                        </div>
                      </div>

                      <button className="text-gray-400 hover:text-black p-1 shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-lime/40 border border-black flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  </div>
                  <p className="text-xs font-black text-black">All caught up!</p>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">No documents expiring soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM TWO-COLUMN SPLIT (Matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Document Categories & Family Members */}
        <div className="lg:col-span-7 space-y-5">
          {/* Document Categories (8 clean cards) */}
          <div className="p-5 bg-white rounded-2xl border-2 border-black shadow-neo">
            <h2 className="text-base font-black text-black tracking-tight mb-4">
              Document Categories
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Identity', icon: Shield, bg: 'bg-purple/15 text-purple' },
                { name: 'Education', icon: GraduationCap, bg: 'bg-cyan text-black' },
                { name: 'Medical', icon: HeartPulse, bg: 'bg-pink text-black' },
                { name: 'Insurance', icon: Shield, bg: 'bg-amber-100 text-amber-700' },
                { name: 'Property', icon: Home, bg: 'bg-emerald-100 text-emerald-700' },
                { name: 'Vehicle', icon: Car, bg: 'bg-purple/15 text-purple' },
                { name: 'Bills', icon: Receipt, bg: 'bg-yellow-100 text-yellow-700' },
                { name: 'Other', icon: FileText, bg: 'bg-gray-100 text-gray-700' },
              ].map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(`/documents?category=${encodeURIComponent(cat.name)}`)}
                    className="p-3 rounded-xl border-1.5 border-black bg-white hover:bg-cream flex flex-col items-center justify-center gap-2 shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all text-center"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl border border-black flex items-center justify-center ${cat.bg}`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-black text-black">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Family Members Card */}
          <div className="p-5 bg-white rounded-2xl border-2 border-black shadow-neo bg-grid-pattern">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-black text-black tracking-tight">
                  Family Members
                </h2>
                <p className="text-xs text-gray-600 font-semibold mt-0.5">
                  Manage your family members and their documents.
                </p>
              </div>

              <button
                onClick={() => navigate('/family?action=add')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple text-white text-xs font-black uppercase tracking-wider rounded-xl border-1.5 border-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all self-start sm:self-auto"
              >
                <span>+ Add Member</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {members.map((m, idx) => (
                <div
                  key={m.id || idx}
                  onClick={() => navigate('/family')}
                  className="p-3.5 rounded-xl border-1.5 border-black bg-white shadow-neo-sm flex flex-col items-center text-center cursor-pointer hover:bg-cream transition relative"
                >
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-black">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <div
                    className={`w-11 h-11 rounded-full border-1.5 border-black flex items-center justify-center font-black text-xs mb-2 ${getAvatarColor(
                      m.name
                    )}`}
                  >
                    {getInitials(m.name)}
                  </div>
                  <h4 className="text-xs font-black text-black truncate w-full">
                    {m.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-gray-500">
                    {m.relationship || m.role || 'Member'}
                  </p>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">
                    {m.documentCount ?? 0} {m.documentCount === 1 ? 'document' : 'documents'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): FamilyAI + Purple Banner Card (Matching Image 2) */}
        <div className="lg:col-span-5 space-y-5">
          {/* FamilyAI Assistant Card */}
          <div className="p-5 bg-white rounded-2xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b-1.5 border-black/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan border border-black flex items-center justify-center text-black">
                    <Bot className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="text-sm font-black text-black">
                    FamilyAI
                  </h3>
                </div>
                <button className="text-gray-400 hover:text-black">
                  <span className="font-bold text-xs">•••</span>
                </button>
              </div>

              {/* Bot Welcome Bubble */}
              <div className="mt-4 p-3 bg-cream rounded-xl border border-black/20 text-xs font-semibold text-black leading-relaxed flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-cyan border border-black flex items-center justify-center text-[10px] shrink-0 font-bold">
                  🤖
                </div>
                <div>
                  <p>Hi! I'm FamilyAI 👋 How can I help you today?</p>
                  <span className="text-[9px] text-gray-400 font-bold block mt-1">Ready to assist</span>
                </div>
              </div>

              {/* Quick Action Chips */}
              <div className="flex flex-wrap gap-1.5 my-3.5">
                {[
                  'Find a document',
                  "What's expiring?",
                  'Summarize a document',
                  'Show all documents',
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAsk(action)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-black bg-white hover:bg-lime text-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar with paperclip and purple send button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (aiPrompt.trim()) {
                  handleQuickAsk(aiPrompt.trim());
                }
              }}
              className="flex items-center gap-2 p-1.5 bg-cream rounded-xl border-1.5 border-black shadow-neo-sm mt-2"
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask anything about your family's documents..."
                className="flex-1 bg-transparent px-2.5 py-1 text-xs font-semibold text-black placeholder-gray-500 focus:outline-none"
              />
              <button
                type="button"
                className="p-1.5 text-gray-500 hover:text-black transition"
                title="Attach Document"
              >
                <span className="text-xs">📎</span>
              </button>
              <button
                type="submit"
                className="p-2 rounded-lg bg-purple text-white border border-black hover:bg-purple/90 transition shadow-neo-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Purple Graphic Card with Sticker (Matching Image 2 bottom-right) */}
          <div className="p-6 bg-purple rounded-2xl border-2 border-black shadow-neo relative overflow-hidden flex items-center justify-between min-h-[160px]">
            {/* Doodle lines */}
            <div className="text-black/30 font-bold text-sm absolute top-3 left-4 select-none">
              //
            </div>

            {/* Pink Sticker */}
            <div className="z-10 p-3 bg-pink rounded-xl border-2 border-black shadow-neo -rotate-6 max-w-[150px]">
              <span className="text-xs font-black uppercase tracking-tight text-black leading-tight block">
                SIMPLE.
                <br />
                SECURE.
                <br />
                TOGETHER.
              </span>
            </div>

            {/* Stacked Documents Graphic */}
            <div className="relative z-0 opacity-90 right-2">
              <div className="w-24 h-32 bg-white rounded-lg border-2 border-black shadow-neo rotate-12 flex flex-col p-2 space-y-1">
                <div className="w-8 h-1.5 bg-black rounded" />
                <div className="w-full h-1 bg-gray-300 rounded" />
                <div className="w-full h-1 bg-gray-300 rounded" />
                <div className="w-3/4 h-1 bg-gray-300 rounded" />
              </div>
              <div className="w-24 h-32 bg-black rounded-lg border-2 border-black absolute top-2 right-4 -rotate-6 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
