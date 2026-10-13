import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles, ArrowRight, Loader2, CheckSquare, Square, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

const SAVED_CREDS_KEY = 'paperless_saved_credentials';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials on mount or pre-populate demo credentials
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_CREDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        if (typeof parsed.rememberMe === 'boolean') setRememberMe(parsed.rememberMe);
      } else {
        // Default to demo credentials for seamless instant login
        setEmail('demo@paperlessfamily.com');
        setPassword('Demo@123');
        setRememberMe(true);
      }
    } catch {
      setEmail('demo@paperlessfamily.com');
      setPassword('Demo@123');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    // Persist or remove credentials based on Remember Me choice
    if (rememberMe) {
      localStorage.setItem(
        SAVED_CREDS_KEY,
        JSON.stringify({ email, password, rememberMe: true })
      );
    } else {
      localStorage.removeItem(SAVED_CREDS_KEY);
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(
        rememberMe
          ? 'Welcome back! Credentials remembered on this device.'
          : 'Welcome back to your family vault!'
      );
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail('demo@paperlessfamily.com');
    setPassword('Demo@123');
    setRememberMe(true);
    localStorage.setItem(
      SAVED_CREDS_KEY,
      JSON.stringify({
        email: 'demo@paperlessfamily.com',
        password: 'Demo@123',
        rememberMe: true,
      })
    );
    toast('Demo credentials loaded & saved!', { icon: '✨' });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your family's records, expiry tracking, and AI assistant."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Demo Button - prominent lime card */}
        <button
          type="button"
          onClick={handleUseDemo}
          className="w-full flex items-center justify-between p-3 rounded-xl border-1.5 border-black bg-lime text-black text-xs font-black uppercase tracking-wider shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Use Demo Account</span>
          </div>
          <span className="font-mono text-[11px] font-bold lowercase text-black/80">
            demo@paperlessfamily.com
          </span>
        </button>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-1.5 border-black bg-cream text-xs font-bold text-black focus:outline-none shadow-neo-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-black">
              Password
            </label>
            <span className="text-xs font-bold text-purple hover:underline cursor-pointer">
              Forgot?
            </span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-1.5 border-black bg-cream text-xs font-bold text-black focus:outline-none shadow-neo-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Remember Me / Save Credentials Checkbox */}
        <div
          onClick={() => setRememberMe(!rememberMe)}
          className="flex items-center justify-between p-2.5 rounded-xl border-1.5 border-black bg-cream/70 hover:bg-cream cursor-pointer transition-colors shadow-neo-sm select-none"
        >
          <div className="flex items-center gap-2">
            {rememberMe ? (
              <CheckSquare className="w-4 h-4 text-purple stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4 text-gray-400 stroke-[2]" />
            )}
            <span className="text-xs font-black text-black">
              Remember credentials on this device
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-black/20">
            <ShieldCheck className="w-3 h-3 text-lime stroke-[2.5]" />
            <span>{rememberMe ? 'Saved' : 'Off'}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="neo-btn w-full flex items-center justify-center gap-2 py-3 px-4 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Sign In to Vault</span>
            </>
          )}
        </button>

        {/* Register Link */}
        <div className="text-center pt-2">
          <p className="text-xs font-bold text-gray-600">
            Don't have a family space yet?{' '}
            <Link to="/register" className="font-extrabold text-purple hover:underline inline-flex items-center gap-1">
              <span>Create one now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
