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

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-cream flex text-black font-sans selection:bg-lime selection:text-black">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
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

        {/* Bottom Sidebar: Storage Used card matching Image 2 */}
        <div className="p-3.5 border-t-2 border-black bg-cream">
          <div className="p-3 bg-white rounded-xl border-1.5 border-black shadow-neo-sm mb-3">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Storage Used
            </div>
            <div className="text-xs font-black text-black mt-0.5">
              2.4 GB of 10 GB
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full border border-black overflow-hidden mt-2">
              <div className="h-full bg-lime w-1/4 rounded-full" />
            </div>
            <button
              onClick={() => navigate('/documents')}
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
        <header className="sticky top-0 z-30 bg-white border-b-2 border-black px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-black hover:bg-gray-100 rounded-lg border-1.5 border-black shadow-neo-sm"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Input matching Image 2 */}
            <div className="flex items-center relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 text-gray-500" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search documents, members..."
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-gray-100/80 border-1.5 border-black/20 rounded-full focus:outline-none focus:border-black focus:bg-white transition placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/documents?search=${encodeURIComponent(searchVal)}`);
                  }
                }}
              />
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
    </div>
  );
};

export default MainLayout;
