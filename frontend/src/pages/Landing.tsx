import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Bot,
  Bell,
  Lock,
  FileText,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Car,
  Receipt,
  ArrowRight,
  MoreVertical,
  Send,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream text-black font-sans selection:bg-lime selection:text-black overflow-x-hidden">
      {/* Top Navbar */}
      {/* Top Navbar matching Image 1 */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 bg-lime border-2 border-black px-3.5 py-1.5 rounded-xl shadow-neo-sm">
            <img src="/logo.png" alt="PaperlessFamily Logo" className="w-6 h-6 rounded-md object-contain" />
            <span className="font-black text-sm tracking-tight text-black uppercase">
              PAPERLESSFAMILY
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-black uppercase tracking-wider text-black">
            <a href="#features" className="hover:text-purple transition-colors">FEATURES</a>
            <a href="#how-it-works" className="hover:text-purple transition-colors">HOW IT WORKS</a>
            <a href="#security" className="hover:text-purple transition-colors">SECURITY</a>
            <a href="#assistant" className="hover:text-purple transition-colors">AI ASSISTANT</a>
            <a href="#vault" className="hover:text-purple transition-colors">CONTACT US</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-block px-3 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-cream rounded-lg transition"
            >
              SIGN IN
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-purple text-white rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center gap-1.5"
            >
              <span>GET STARTED</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* 1. HERO SECTION (Matching Image 1) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Hero Card */}
          <div className="lg:col-span-6 p-7 sm:p-9 bg-white rounded-2xl border-2 border-black shadow-neo bg-grid-pattern flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple/10 border-1.5 border-purple text-purple text-[11px] font-black uppercase tracking-wider">
                <span>A SECURE DIGITAL HOME ■</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-[1.08] uppercase">
                YOUR FAMILY.
                <br />
                YOUR DOCUMENTS.
                <br />
                <span className="bg-lime px-2 py-0.5 border-2 border-black inline-block mt-1 shadow-neo">
                  ONE SECURE HOME.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-700 font-semibold leading-relaxed max-w-lg">
                Securely organize, manage and access your family's important documents from one simple digital space.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-6">
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-3 bg-lime text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center gap-2"
              >
                <span>GET STARTED</span>
                <span>→</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-3 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center gap-2"
              >
                <span>EXPLORE DEMO</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Right Hero Card: Giant Pink Block with Floating Dashboard (Matching Image 1) */}
          <div className="lg:col-span-6 p-6 sm:p-7 bg-pink rounded-2xl border-2 border-black shadow-neo flex items-center justify-center relative overflow-hidden">
            {/* Doodle lines */}
            <div className="absolute top-3 left-4 text-black/40 font-bold select-none">//</div>

            {/* Floating Mini Dashboard Mockup */}
            <div className="w-full bg-white rounded-xl border-2 border-black shadow-neo-lg p-3 sm:p-4 text-xs font-sans">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/10">
                <div className="flex items-center gap-1.5 font-black text-[10px]">
                  <div className="w-4 h-4 rounded bg-lime border border-black flex items-center justify-center">🛡️</div>
                  <span>PaperlessFamily</span>
                </div>
                <div className="bg-cream px-3 py-1 rounded-full border border-black/20 text-[9px] text-gray-500 w-36 truncate">
                  Search documents, members...
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span>🔔</span>
                  <div className="w-4 h-4 rounded-full bg-black text-white text-[8px] flex items-center justify-center">S</div>
                </div>
              </div>

              {/* Greeting */}
              <div className="mb-2">
                <span className="font-black text-xs block text-black">Good morning, Susritha! 👋</span>
                <span className="text-[9px] text-gray-500 font-medium">Here's what's happening with your family documents.</span>
              </div>

              {/* 4 Mini Stats */}
              <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
                <div className="p-1.5 rounded border border-black bg-white">
                  <div className="text-[11px] font-black">128</div>
                  <div className="text-[7px] font-bold text-gray-500 uppercase">Documents</div>
                </div>
                <div className="p-1.5 rounded border border-black bg-lime">
                  <div className="text-[11px] font-black">6</div>
                  <div className="text-[7px] font-bold uppercase">Members</div>
                </div>
                <div className="p-1.5 rounded border border-black bg-pink">
                  <div className="text-[11px] font-black">4</div>
                  <div className="text-[7px] font-bold uppercase">Expiring</div>
                </div>
                <div className="p-1.5 rounded border border-black bg-cyan">
                  <div className="text-[11px] font-black">2.4 GB</div>
                  <div className="text-[7px] font-bold uppercase">Storage</div>
                </div>
              </div>

              {/* Mini Docs & Alerts */}
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="p-2 rounded border border-black/20 bg-cream/50 space-y-1">
                  <span className="font-black uppercase block text-[8px]">Recent Documents</span>
                  <div className="flex justify-between items-center bg-white p-1 rounded border border-black/10">
                    <span className="font-bold truncate">Passport (Priya)</span>
                    <span className="text-[7px] bg-lime px-1 rounded font-bold">Active</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-1 rounded border border-black/10">
                    <span className="font-bold truncate">Health Insurance</span>
                    <span className="text-[7px] bg-yellow-200 px-1 rounded font-bold">Soon</span>
                  </div>
                </div>

                <div className="p-2 rounded border border-black/20 bg-cream/50 space-y-1">
                  <span className="font-black uppercase block text-[8px]">Upcoming Expiry Alerts</span>
                  <div className="bg-white p-1 rounded border border-black/10 text-red-500 font-bold truncate">
                    Passport • 18 days left
                  </div>
                  <div className="bg-white p-1 rounded border border-black/10 text-amber-600 font-bold truncate">
                    Insurance • 32 days left
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FEATURES BAR (Matching Image 1) */}
        <section id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
          {/* Purple block */}
          <div className="p-5 bg-purple rounded-xl border-2 border-black shadow-neo flex flex-col justify-between text-white">
            <span className="text-sm font-black uppercase tracking-wider">
              OUR
              <br />
              FEATURES
            </span>
            <span className="text-xl font-bold mt-2">→</span>
          </div>

          {/* Feature 1 */}
          <div className="p-4 bg-white rounded-xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-lime border border-black flex items-center justify-center text-black mb-2">
              <Lock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-black">SECURE DOCUMENTS</h3>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                Bank-grade security for your important files.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-4 bg-white rounded-xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-pink border border-black flex items-center justify-center text-black mb-2">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-black">FAMILY SPACE</h3>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                Keep all your family documents organized together.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-4 bg-white rounded-xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple border border-black flex items-center justify-center text-white mb-2">
              <Bot className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-black">AI ASSISTANT</h3>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                Get instant answers about your documents.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-4 bg-white rounded-xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-lime border border-black flex items-center justify-center text-black mb-2">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-black">EXPIRY REMINDERS</h3>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                Never miss important renewal dates.
              </p>
            </div>
          </div>
        </section>

        {/* 3. DOCUMENT VAULT & FAMILYAI SECTION (Matching Image 1) */}
        <section id="vault" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (7 cols): Document Vault */}
          <div className="lg:col-span-7 p-6 bg-white rounded-2xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div>
              {/* Vault Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <h2 className="text-sm sm:text-base font-black text-black tracking-tight uppercase">
                  PAPERLESS FAMILY DOCUMENT VAULT
                </h2>
                <button
                  onClick={() => navigate('/documents')}
                  className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-cream border border-black rounded shadow-neo-sm hover:bg-lime transition"
                >
                  VIEW ALL →
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 py-3 border-b border-black/10 text-[10px] font-black uppercase">
                <span className="px-2.5 py-1 bg-black text-white rounded border border-black">ALL</span>
                {['IDENTITY', 'EDUCATION', 'MEDICAL', 'INSURANCE', 'PROPERTY', 'VEHICLE', 'BILLS'].map((tab, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-cream hover:bg-lime cursor-pointer rounded border border-black text-black transition"
                  >
                    {tab}
                  </span>
                ))}
              </div>

              {/* 6 Document Cards (2 rows x 3 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                {[
                  { title: 'AADHAAR CARD', owner: 'Raj Sharma', cat: 'Identity', date: '12 Dec 2030', status: 'Active', bg: 'bg-purple/15 text-purple', badge: 'bg-lime' },
                  { title: 'PASSPORT', owner: 'Priya Sharma', cat: 'Identity', date: '18 Aug 2028', status: 'Active', bg: 'bg-cyan text-black', badge: 'bg-lime' },
                  { title: 'PAN CARD', owner: 'Raj Sharma', cat: 'Identity', date: '05 Mar 2030', status: 'Active', bg: 'bg-pink text-black', badge: 'bg-lime' },
                  { title: 'INSURANCE', owner: 'Priya Sharma', cat: 'Insurance', date: '15 Jan 2025', status: 'Expiring Soon', bg: 'bg-amber-100 text-amber-700', badge: 'bg-yellow-200' },
                  { title: 'EDUCATION', owner: 'Aarav Sharma', cat: 'Education', date: '12 Jun 2025', status: 'Active', bg: 'bg-purple/15 text-purple', badge: 'bg-lime' },
                  { title: 'PROPERTY', owner: 'Raj Sharma', cat: 'Property', date: '20 Aug 2030', status: 'Active', bg: 'bg-emerald-100 text-emerald-700', badge: 'bg-lime' },
                ].map((doc, i) => (
                  <div
                    key={i}
                    onClick={() => navigate('/documents')}
                    className="p-3 bg-white rounded-xl border-1.5 border-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg border border-black flex items-center justify-center ${doc.bg}`}>
                          <FileText className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <h4 className="text-xs font-black text-black">{doc.title}</h4>
                      <p className="text-[10px] text-gray-500 font-semibold">{doc.owner}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{doc.cat} • {doc.date}</p>
                    </div>
                    <div className="mt-3">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded border border-black shadow-neo-sm ${doc.badge}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): FamilyAI Assistant (Matching Image 1) */}
          <div id="assistant" className="lg:col-span-5 flex flex-col">
            {/* Lime Header Box */}
            <div className="p-3.5 bg-lime rounded-t-2xl border-2 border-black border-b-0 shadow-neo">
              <h3 className="text-xs sm:text-sm font-black uppercase text-black tracking-tight">
                FAMILYAI — YOUR DOCUMENT ASSISTANT
              </h3>
            </div>

            {/* White Chat Container */}
            <div className="p-5 bg-white rounded-b-2xl border-2 border-black shadow-neo flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Bot Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan border border-black flex items-center justify-center text-xs">
                      🤖
                    </div>
                    <span className="text-xs font-black text-black">FamilyAI</span>
                  </div>
                  <span className="text-gray-400 text-xs font-bold">•••</span>
                </div>

                {/* User Message Bubble in Purple */}
                <div className="flex flex-col items-end">
                  <div className="p-2.5 bg-purple text-white rounded-xl rounded-tr-none border border-black text-xs font-bold max-w-[85%] shadow-neo-sm">
                    Which documents are expiring soon?
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 font-semibold">10:24 AM</span>
                </div>

                {/* AI Response Card */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan border border-black flex items-center justify-center text-[10px] shrink-0 font-bold">
                    🤖
                  </div>
                  <div className="p-3 bg-cream rounded-xl rounded-tl-none border border-black/20 text-xs font-medium text-black space-y-1.5 shadow-neo-sm">
                    <p className="font-bold">You have 4 documents expiring soon:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                      <li>Mom's passport - expires on 18 Aug 2028</li>
                      <li>Vehicle insurance - expires in 32 days</li>
                      <li>Health insurance - expires in 28 days</li>
                      <li>Electricity bill - expires in 5 days</li>
                    </ol>
                    <p className="text-[11px] text-gray-600 font-semibold pt-1">
                      Would you like me to set reminders for these?
                    </p>
                    <span className="text-[9px] text-gray-400 block pt-0.5 font-bold">10:24 AM</span>
                  </div>
                </div>

                {/* Quick Action Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Find a document', 'Summarize a document', "Show Mom's documents", 'Create a reminder'].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => navigate('/ai-assistant')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-black bg-cream hover:bg-lime text-black shadow-neo-sm transition"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 p-1.5 bg-cream rounded-xl border-1.5 border-black shadow-neo-sm">
                <input
                  type="text"
                  placeholder="Ask anything about your family's documents..."
                  className="flex-1 bg-transparent px-2 text-xs font-semibold text-black placeholder-gray-500 focus:outline-none"
                />
                <span className="text-gray-400 text-xs">📎</span>
                <button
                  onClick={() => navigate('/ai-assistant')}
                  className="p-1.5 bg-purple text-white rounded-lg border border-black shadow-neo-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FAMILY MEMBERS ROW (Matching Image 1) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Pink header block */}
          <div className="lg:col-span-3 p-5 bg-pink rounded-xl border-2 border-black shadow-neo flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-black tracking-tight">
                FAMILY MEMBERS
              </h3>
              <p className="text-xs text-black/80 font-bold mt-1">
                Manage your family members and their documents.
              </p>
            </div>
            <span className="text-xl font-bold mt-3">→</span>
          </div>

          {/* 4 Member Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border-2 border-black shadow-neo bg-grid-pattern">
            {[
              { initials: 'RS', name: 'Raj Sharma', role: 'Father', count: '12 documents', bg: 'bg-purple/20 text-purple' },
              { initials: 'PS', name: 'Priya Sharma', role: 'Mother', count: '16 documents', bg: 'bg-pink text-black' },
              { initials: 'AS', name: 'Aarav Sharma', role: 'Son', count: '8 documents', bg: 'bg-cyan text-black' },
              { initials: 'AN', name: 'Ananya Sharma', role: 'Daughter', count: '6 documents', bg: 'bg-pink text-black' },
            ].map((m, i) => (
              <div
                key={i}
                className="p-3 bg-white rounded-xl border border-black flex flex-col items-center text-center shadow-neo-sm"
              >
                <div className={`w-9 h-9 rounded-full border border-black flex items-center justify-center font-black text-xs mb-1.5 ${m.bg}`}>
                  {m.initials}
                </div>
                <h4 className="text-xs font-black text-black truncate w-full">{m.name}</h4>
                <p className="text-[10px] text-gray-500 font-semibold">{m.role}</p>
                <span className="text-[9px] text-gray-400 font-medium mt-0.5">{m.count}</span>
              </div>
            ))}
          </div>

          {/* Purple decorative block with notebook graphic */}
          <div className="lg:col-span-3 p-5 bg-purple rounded-xl border-2 border-black shadow-neo relative overflow-hidden flex items-center justify-center text-white">
            <div className="text-black/30 font-bold absolute top-2 left-3 text-sm select-none">✦ ✦</div>
            <div className="w-20 h-24 bg-white rounded border-2 border-black shadow-neo rotate-6 flex flex-col p-1.5 space-y-1">
              <div className="w-6 h-1 bg-black rounded" />
              <div className="w-full h-0.5 bg-gray-300 rounded" />
              <div className="w-full h-0.5 bg-gray-300 rounded" />
              <div className="w-2/3 h-0.5 bg-gray-300 rounded" />
            </div>
          </div>
        </section>

        {/* 5. SECURITY ROW (Matching Image 1) */}
        <section id="security" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Purple Header Block */}
          <div className="lg:col-span-3 p-5 bg-purple rounded-xl border-2 border-black shadow-neo flex flex-col justify-between text-white">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">
                SECURITY FIRST
              </h3>
              <p className="text-xs text-white/80 font-bold mt-1">
                Your family's documents are always protected.
              </p>
            </div>
            <span className="text-xl font-bold mt-3">→</span>
          </div>

          {/* 4 Security Feature Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border-2 border-black shadow-neo">
            {[
              { title: 'ENCRYPTED STORAGE', desc: 'Your documents are encrypted and secure.', bg: 'bg-lime' },
              { title: 'SECURE ACCESS', desc: 'Only your family members can access.', bg: 'bg-purple text-white' },
              { title: 'DATA PRIVACY', desc: 'We never share your documents with anyone.', bg: 'bg-cyan' },
              { title: 'ROLE-BASED CONTROL', desc: 'Manage who can view and edit documents.', bg: 'bg-pink' },
            ].map((sec, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-black bg-cream/40 flex flex-col justify-between">
                <div className={`w-7 h-7 rounded border border-black flex items-center justify-center text-xs mb-2 ${sec.bg}`}>
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-black leading-tight">{sec.title}</h4>
                  <p className="text-[9px] text-gray-600 font-medium mt-1 leading-snug">{sec.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pink decorative block with padlock */}
          <div className="lg:col-span-3 p-5 bg-pink rounded-xl border-2 border-black shadow-neo relative overflow-hidden flex items-center justify-center">
            <div className="text-black/30 font-bold absolute top-2 right-3 text-sm select-none">✦ ✦</div>
            <div className="w-14 h-16 rounded-xl bg-black border-2 border-black shadow-neo flex items-center justify-center text-lime text-2xl">
              🔒
            </div>
          </div>
        </section>

        {/* 6. BOTTOM CTA FULL-WIDTH BANNER (Matching Image 1) */}
        <section className="p-7 sm:p-9 bg-lime rounded-2xl border-2 border-black shadow-neo flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Doodle stars */}
          <div className="text-black/30 font-bold text-xl absolute top-3 left-1/2 select-none">
            ✦ ✧
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight uppercase leading-tight">
              GO PAPERLESS.
              <br />
              KEEP YOUR FAMILY ORGANIZED.
            </h2>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-neo hover:bg-gray-900 transition-all"
            >
              CREATE YOUR FAMILY →
            </button>

            {/* Sticker Badge in Purple */}
            <div className="p-2 bg-purple text-white rounded-xl border-2 border-black shadow-neo rotate-3 text-[10px] font-black uppercase tracking-tight text-center max-w-[130px] leading-tight hidden sm:block">
              YOUR DOCUMENTS.
              <br />
              A BRIGHTER TOMORROW.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-lime border border-black flex items-center justify-center text-black font-black text-[10px]">
              PF
            </div>
            <span className="text-black font-black uppercase">PAPERLESSFAMILY</span>
            <span>• One Secure Digital Home for Every Family Document</span>
          </div>
          <div>
            <span>© 2026 PaperlessFamily. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
