import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, ArrowRight, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success('Account created! Welcome to PaperlessFamily.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your secure family document vault in under 60 seconds."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Susritha Sharma"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-1.5 border-black bg-cream text-xs font-bold text-black focus:outline-none shadow-neo-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
            Password (min 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-1.5 border-black bg-cream text-xs font-bold text-black focus:outline-none shadow-neo-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border-1.5 border-black bg-cream text-xs font-bold text-black focus:outline-none shadow-neo-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="neo-btn w-full flex items-center justify-center gap-2 py-3 px-4 bg-lime text-black text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-70 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Vault...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Account</span>
            </>
          )}
        </button>

        {/* Login Link */}
        <div className="text-center pt-2">
          <p className="text-xs font-bold text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-purple hover:underline inline-flex items-center gap-1">
              <span>Sign in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
