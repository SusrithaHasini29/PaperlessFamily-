import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Bot,
  Bell,
  UserCircle,
  LogOut,
  Menu,
  X,
  Shield,
  Search,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as notificationService from '../services/notificationService';
import * as documentService from '../services/documentService';
import * as familyService from '../services/familyService';
import { Document as VaultDocument, FamilyMember } from '../types';
import NotificationDropdown from '../components/NotificationDropdown';
import toast from 'react-hot-toast';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, family, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allDocs, setAllDocs] = useState<VaultDocument[]>([]);
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [storageText, setStorageText] = useState('0 MB of 10 GB');
  const [storagePercent, setStoragePercent] = useState(1);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (isMounted && res.data) {
          setUnreadCount(res.data.count || 0);
        }
      } catch (err) {
        // Silent fallback
      }
    };

    const fetchSearchDataAndStorage = async () => {
      try {
        const res = await documentService.getDocuments();
        if (!isMounted) return;
        const docs = res.data || [];
        setAllDocs(docs);

        const totalBytes = docs.reduce((acc, d) => acc + (d.fileSize || 0), 0);
        if (totalBytes === 0) {
          setStorageText('0 MB of 10 GB');
          setStoragePercent(1);
        } else if (totalBytes < 1024 * 1024) {
          setStorageText(`${(totalBytes / 1024).toFixed(1)} KB of 10 GB`);
          setStoragePercent(Math.max(1, Math.round((totalBytes / (10 * 1024 * 1024 * 1024)) * 100)));
        } else if (totalBytes < 1024 * 1024 * 1024) {
          setStorageText(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB of 10 GB`);
          setStoragePercent(Math.max(1, Math.round((totalBytes / (10 * 1024 * 1024 * 1024)) * 100)));
        } else {
          setStorageText(`${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB of 10 GB`);
          setStoragePercent(Math.max(1, Math.min(100, Math.round((totalBytes / (10 * 1024 * 1024 * 1024)) * 100))));
        }
      } catch {
        if (isMounted) {
          setStorageText('0 MB of 10 GB');
          setStoragePercent(1);
        }
      }

      try {
        const famId = family?.id || 1;
        const membersRes = await familyService.getFamilyMembers(famId);
        if (isMounted && membersRes && membersRes.data) {
          setAllMembers(membersRes.data);
        }
      } catch {
        // Silent fallback
      }
    };

    fetchUnread();
    fetchSearchDataAndStorage();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname, family?.id]);

  const handleCopyFamilyCode = () => {
    if (family?.familyCode) {
      navigator.clipboard.writeText(family.familyCode);
      setCopiedCode(true);
      toast.success('Family Code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Family', path: '/family', icon: Users },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, isAi: true },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/documents')) return 'Documents';
    if (path.startsWith('/family')) return 'Family Space';
    if (path.startsWith('/ai-assistant')) return 'FamilyAI Workspace';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/profile')) return 'Profile Settings';
    return 'PaperlessFamily';
  };

  const APP_SHORTCUTS = [
    {
      title: 'FamilyAI Assistant',
      desc: 'Chat with FamilyAI about documents & policies',
      path: '/ai-assistant',
      icon: Bot,
      color: 'bg-lime text-black',
      badge: 'FEATURE',
      keywords: ['ai', 'assistant', 'chat', 'ask', 'bot', 'familyai', 'help', 'intelligent', 'query', 'support'],
    },
    {
      title: 'Documents Vault',
      desc: 'Browse, filter, and inspect family documents',
      path: '/documents',
      icon: FileText,
      color: 'bg-purple text-white',
      badge: 'VAULT',
      keywords: ['doc', 'docs', 'document', 'documents', 'files', 'vault', 'pdf', 'records', 'archive'],
    },
    {
      title: 'Upload Document',
      desc: 'Upload an ID, policy, marksheet, or bill',
      path: '/documents?action=upload',
      icon: Sparkles,
      color: 'bg-pink text-black',
      badge: 'ACTION',
      keywords: ['upload', 'add', 'new', 'create', 'scan', 'attach'],
    },
    {
      title: 'Family Space',
      desc: 'View members, relationships, and invite codes',
      path: '/family',
      icon: Users,
      color: 'bg-cyan text-black',
      badge: 'MEMBERS',
      keywords: ['family', 'member', 'members', 'relatives', 'code', 'invite', 'people', 'tree'],
    },
    {
      title: 'Profile Settings',
      desc: 'Manage your name, relationship, and account',
      path: '/profile',
      icon: UserCircle,
      color: 'bg-cream text-black',
      badge: 'SETTINGS',
      keywords: ['profile', 'settings', 'account', 'user', 'password', 'relationship', 'role'],
    },
    {
      title: 'Notifications',
      desc: 'Check document renewal alerts and updates',
      path: '/notifications',
      icon: Bell,
      color: 'bg-pink text-black',
      badge: 'ALERTS',
      keywords: ['notification', 'notifications', 'alerts', 'expiry', 'reminders', 'bell', 'renewal'],
    },
    {
      title: 'Dashboard',
      desc: 'Household overview, storage, and statistics',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: 'bg-lime text-black',
      badge: 'PAGE',
      keywords: ['dash', 'dashboard', 'home', 'stats', 'overview'],
    },
  ];

  const trimmedSearch = searchVal.trim().toLowerCase();

  const matchedShortcuts = searchVal.trim()
    ? APP_SHORTCUTS.filter(
        (s) =>
          s.title.toLowerCase().includes(trimmedSearch) ||
          s.desc.toLowerCase().includes(trimmedSearch) ||
          s.keywords.some((k) => k.includes(trimmedSearch) || trimmedSearch.includes(k))
      )
    : [];

  const matchedMembers = searchVal.trim()
    ? allMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(trimmedSearch) ||
          (m.relationship && m.relationship.toLowerCase().includes(trimmedSearch)) ||
          (m.email && m.email.toLowerCase().includes(trimmedSearch))
      )
    : [];

  const matchedDocs = searchVal.trim()
    ? allDocs.filter(
        (d) =>
          d.name.toLowerCase().includes(trimmedSearch) ||
          (d.category && d.category.toLowerCase().includes(trimmedSearch)) ||
          (d.subcategory && d.subcategory.toLowerCase().includes(trimmedSearch)) ||
          (d.ownerName && d.ownerName.toLowerCase().includes(trimmedSearch)) ||
          (d.description && d.description.toLowerCase().includes(trimmedSearch))
      )
    : [];

  const handleSearchSubmit = () => {
    if (!searchVal.trim()) return;
    const q = searchVal.trim().toLowerCase();
    setIsSearchOpen(false);

    // 1. If high confidence shortcut match (e.g. user typed "AI ASSISTANT", "ai", "family", "profile")
    if (
      matchedShortcuts.length > 0 &&
      (matchedShortcuts[0].title.toLowerCase().includes(q) ||
        matchedShortcuts[0].keywords.some((k) => q === k || q.includes(k) || k.includes(q)))
    ) {
      navigate(matchedShortcuts[0].path);
      setSearchVal('');
      return;
    }

    // 2. If member matched and no document matched
    if (matchedMembers.length > 0 && matchedDocs.length === 0) {
      navigate('/family');
      setSearchVal('');
      return;
    }

    // 3. If exact 1 document matched
    if (matchedDocs.length === 1) {
      navigate(`/documents/${matchedDocs[0].id}`);
      setSearchVal('');
      return;
    }

    // 4. Default: search documents vault
    navigate(`/documents?search=${encodeURIComponent(searchVal.trim())}`);
  };

  return (
    <div className="min-h-screen bg-cream flex text-black font-sans selection:bg-lime selection:text-black">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Global Search Backdrop */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsSearchOpen(false)}
        />
      )}

      {/* Sidebar - Sharp black border, crisp editorial styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-white border-r-2 border-black flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo - Lime green solid header matching Image 2 */}
        <div className="p-4 bg-lime border-b-2 border-black flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <img
              src="/logo.png"
              alt="PaperlessFamily Logo"
              className="w-8 h-8 rounded-lg border-1.5 border-black object-contain bg-white shadow-neo-sm"
            />
            <span className="font-black text-sm tracking-tight text-black uppercase">
              PAPERLESSFAMILY
            </span>
          </div>
          <button
            className="lg:hidden text-black hover:bg-black/10 p-1.5 rounded-md border border-black"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto bg-grid-pattern">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-100 border-1.5 ${
                    isActive
                      ? 'bg-purple text-white border-black shadow-neo-sm'
                      : 'border-transparent text-gray-700 hover:bg-gray-100 hover:text-black hover:border-black'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-pink text-black border border-black shadow-neo-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Sidebar: Storage Used card */}
        <div className="p-3.5 border-t-2 border-black bg-cream">
          <div className="p-3 bg-white rounded-xl border-1.5 border-black shadow-neo-sm mb-3">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Storage Used
            </div>
            <div className="text-xs font-black text-black mt-0.5">
              {storageText}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full border border-black overflow-hidden mt-2">
              <div
                className="h-full bg-lime rounded-full transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="mt-2.5 w-full py-1.5 px-2 bg-white hover:bg-cream text-[11px] font-black uppercase tracking-wider text-black rounded-lg border-1.5 border-black shadow-neo-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Upgrade Plan</span>
              <span className="font-bold">→</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-gray-100 rounded-lg border-1.5 border-black shadow-neo-sm transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-black hover:bg-gray-100 rounded-lg border-1.5 border-black shadow-neo-sm"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Smart OmniSearch Input */}
            <div className="flex items-center relative w-full max-w-md z-40">
              <Search className="w-4 h-4 absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search AI, documents, members, pages..."
                className="w-full pl-10 pr-9 py-2 text-xs font-semibold bg-gray-100/90 border-1.5 border-black/30 rounded-full focus:outline-none focus:border-black focus:bg-white shadow-xs transition placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  } else if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                  }
                }}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 p-0.5 text-gray-400 hover:text-black rounded-full transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Instant Search Results Dropdown */}
              {isSearchOpen && searchVal.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-black shadow-neo-xl overflow-hidden z-50 max-h-[460px] overflow-y-auto">
                  {/* Category 1: Shortcuts & Pages */}
                  {matchedShortcuts.length > 0 && (
                    <div className="p-2 border-b border-gray-200">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Features & Navigation
                      </div>
                      <div className="space-y-1">
                        {matchedShortcuts.map((s) => {
                          const Icon = s.icon;
                          return (
                            <div
                              key={s.path}
                              onClick={() => {
                                navigate(s.path);
                                setIsSearchOpen(false);
                                setSearchVal('');
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-cream border border-transparent hover:border-black cursor-pointer transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg border border-black flex items-center justify-center shrink-0 shadow-neo-xs ${s.color}`}
                                >
                                  <Icon className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div>
                                  <div className="text-xs font-black text-black">{s.title}</div>
                                  <div className="text-[11px] text-gray-600 line-clamp-1">{s.desc}</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-lime border border-black">
                                {s.badge}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Family Members */}
                  {matchedMembers.length > 0 && (
                    <div className="p-2 border-b border-gray-200">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Family Members
                      </div>
                      <div className="space-y-1">
                        {matchedMembers.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              navigate('/family');
                              setIsSearchOpen(false);
                              setSearchVal('');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-cream border border-transparent hover:border-black cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-cyan border border-black flex items-center justify-center font-black text-xs text-black shadow-neo-xs">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-black text-black">{m.name}</div>
                                <div className="text-[11px] text-gray-600">{m.relationship || 'Member'} • {m.email}</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border border-black">
                              Family
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Documents */}
                  {matchedDocs.length > 0 && (
                    <div className="p-2 border-b border-gray-200">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Vault Documents
                      </div>
                      <div className="space-y-1">
                        {matchedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => {
                              navigate(`/documents/${doc.id}`);
                              setIsSearchOpen(false);
                              setSearchVal('');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-cream border border-transparent hover:border-black cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-pink border border-black flex items-center justify-center shrink-0 shadow-neo-xs">
                                <FileText className="w-3.5 h-3.5 text-black" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-black">{doc.name}</div>
                                <div className="text-[11px] text-gray-600 line-clamp-1">
                                  {doc.category} • {doc.ownerName}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-lime border border-black">
                              View Doc
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state & fallback */}
                  {matchedShortcuts.length === 0 &&
                    matchedMembers.length === 0 &&
                    matchedDocs.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-xs font-bold text-gray-700">
                          No quick match for "{searchVal}"
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Press Enter or click below to search the Documents vault.
                        </p>
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="mt-3 px-4 py-1.5 bg-lime text-black text-xs font-black uppercase tracking-wider rounded-lg border-1.5 border-black shadow-neo-sm hover:bg-lime/80"
                        >
                          Search Documents for "{searchVal}" →
                        </button>
                      </div>
                    )}

                  {/* Footer hint */}
                  <div className="px-3 py-2 bg-cream border-t border-black/10 flex items-center justify-between text-[10px] text-gray-600 font-bold">
                    <span>Press <kbd className="px-1 py-0.5 bg-white border border-black rounded text-[9px]">Enter</kbd> to jump</span>
                    <span>Press <kbd className="px-1 py-0.5 bg-white border border-black rounded text-[9px]">Esc</kbd> to close</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Dropdown with pink badge */}
            <NotificationDropdown />

            {/* User Dropdown matching Image 2 (black circle avatar + name) */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs border border-black">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="hidden sm:inline text-xs font-black text-black">
                  {user?.name || 'Susritha'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-black" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-neo-lg border-1.5 border-black py-1.5 z-40">
                    <div className="px-4 py-2 border-b-1.5 border-black bg-cream">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-extrabold text-black truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-black hover:bg-cream flex items-center gap-2"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/ai-assistant');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-black hover:bg-cream flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4 text-purple" />
                      <span>FamilyAI Assistant</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Upgrade Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="neo-box w-full max-w-lg bg-white p-6 shadow-neo-xl">
            <div className="flex items-center justify-between pb-3 border-b-1.5 border-black mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-lime border border-black">
                  FAMILY VAULT PLANS
                </span>
                <h3 className="text-lg font-black text-black mt-1">Upgrade Storage & Features</h3>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-1 rounded-md hover:bg-cream border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Plan 1: Free Household */}
              <div className="p-3.5 rounded-xl border-1.5 border-black bg-cream flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-black uppercase">Free Household Plan</h4>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-lime text-black border border-black">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                    10 GB Secure Vault • Unlimited Family Members • FamilyAI Assistant
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-black">$0</span>
                  <span className="text-[10px] text-gray-500 font-bold block">/ forever</span>
                </div>
              </div>

              {/* Plan 2: Family Pro */}
              <div className="p-3.5 rounded-xl border-1.5 border-black bg-white flex items-center justify-between hover:bg-cream/40 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-black uppercase">Family Vault Pro</h4>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-pink text-black border border-black">
                      Popular
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                    100 GB Encrypted Storage • Automated Document OCR • Priority AI
                  </p>
                </div>
                <button
                  onClick={() => {
                    toast.success('You have selected Family Vault Pro! 100 GB storage unlocked.');
                    setIsUpgradeModalOpen(false);
                  }}
                  className="neo-btn px-3 py-1.5 bg-lime text-black text-xs font-black uppercase tracking-wider"
                >
                  $4.99/mo
                </button>
              </div>

              {/* Plan 3: Family Unlimited */}
              <div className="p-3.5 rounded-xl border-1.5 border-black bg-white flex items-center justify-between hover:bg-cream/40 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-black uppercase">Unlimited Estate Vault</h4>
                  </div>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                    Unlimited Storage • Biometric Access • Legal Document Archival
                  </p>
                </div>
                <button
                  onClick={() => {
                    toast.success('You have selected Unlimited Estate Vault!');
                    setIsUpgradeModalOpen(false);
                  }}
                  className="neo-btn px-3 py-1.5 bg-cyan text-black text-xs font-black uppercase tracking-wider"
                >
                  $9.99/mo
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-1.5 border-black/10 flex justify-end">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
