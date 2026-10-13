import React from 'react';
import { Shield, Lock, Users, Sparkles, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream text-black font-sans selection:bg-lime selection:text-black">
      {/* Left Panel - Editorial SaaS Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r-1.5 border-black p-12 flex-col justify-between relative overflow-hidden bg-grid-pattern">
        {/* Top Logo */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 bg-lime border-2 border-black px-3.5 py-1.5 rounded-xl shadow-neo-sm">
            <img src="/logo.png" alt="PaperlessFamily Logo" className="w-8 h-8 rounded-lg object-contain" />
            <div>
              <span className="text-base font-black tracking-tight text-black block leading-none">
                PAPERLESSFAMILY
              </span>
              <span className="block text-[9px] uppercase font-bold text-black/70 tracking-wider mt-0.5">
                Digital Household Vault
              </span>
            </div>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="max-w-md my-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream border-1.5 border-black shadow-neo-sm text-xs font-black uppercase tracking-wider text-black">
            <Sparkles className="w-3.5 h-3.5 text-purple" />
            <span>Secure Family Vault</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black leading-tight text-black tracking-tight">
            Every family record in one clean digital space.
          </h2>

          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            Passports, PAN cards, insurance policies, property deeds, and health reports. Instant retrieval, automated renewal alerts, and conversational family AI.
          </p>

          <div className="space-y-2.5 pt-2">
            {[
              'Bank-grade AES-256 encrypted household repository',
              'Timely expiry alerts for passports, insurance & bills',
              'Conversational FamilyAI document understanding',
              'Granular member permissions with family code sharing',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-black">
                <div className="w-5 h-5 rounded-md bg-lime border border-black flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs font-bold text-gray-600 flex items-center justify-between pt-6 border-t-1.5 border-black/10">
          <span>&copy; {new Date().getFullYear()} PaperlessFamily</span>
          <div className="flex items-center gap-1.5 text-black">
            <Lock className="w-3.5 h-3.5 text-purple" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 bg-lime border-2 border-black px-3.5 py-1.5 rounded-xl shadow-neo-sm">
            <img src="/logo.png" alt="PaperlessFamily Logo" className="w-7 h-7 rounded-md object-contain" />
            <span className="text-base font-black text-black uppercase">PAPERLESSFAMILY</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 font-medium">
              {subtitle}
            </p>
          </div>

          {/* Form Box */}
          <div className="neo-box p-6 sm:p-8 bg-white shadow-neo-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
