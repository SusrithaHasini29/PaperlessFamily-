import React, { useState } from 'react';
import { Users, PlusCircle, ArrowRight, ShieldCheck, HeartHandshake, Key } from 'lucide-react';
import * as familyService from '../services/familyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CreateFamilyProps {
  onSuccess?: () => void;
}

export const CreateFamily: React.FC<CreateFamilyProps> = ({ onSuccess }) => {
  const { refreshFamily } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error('Please enter a family name');
      return;
    }
    setLoading(true);
    try {
      const res = await familyService.createFamily(familyName.trim());
      if (res && res.data) {
        toast.success(`Family "${res.data.familyName}" created successfully!`);
        await refreshFamily();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create family space');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyCode.trim()) {
      toast.error('Please enter the family invite code');
      return;
    }
    setLoading(true);
    try {
      const res = await familyService.joinFamily(familyCode.trim().toUpperCase());
      if (res && res.data) {
        toast.success(`Joined "${res.data.familyName}"!`);
        await refreshFamily();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid family code or failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="neo-box p-6 sm:p-8 bg-white text-center shadow-neo-lg space-y-5">
        {/* Top Icon */}
        <div className="w-16 h-16 rounded-2xl bg-lime border-1.5 border-black shadow-neo-sm mx-auto flex items-center justify-center text-black">
          <Users className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Header */}
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded bg-cream border border-black text-[10px] font-black uppercase tracking-wider mb-2">
            HOUSEHOLD SPACE SETUP
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Your Family Space is Waiting
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md mx-auto mt-1">
            Create a private vault for your household or join an existing family using a secret code.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="grid grid-cols-2 p-1 bg-cream rounded-xl border-1.5 border-black max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              mode === 'create'
                ? 'bg-black text-white shadow-neo-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Create Space
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              mode === 'join'
                ? 'bg-black text-white shadow-neo-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Join with Code
          </button>
        </div>

        {/* Create Space Form */}
        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-left">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Family Name
              </label>
              <input
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. Sharma Family"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-cream border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm placeholder-gray-500"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                You will become the Family Admin and receive a shareable invite code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-btn w-full py-3 bg-lime text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating...' : 'Create Family Space'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        ) : (
          /* Join Space Form */
          <form onSubmit={handleJoin} className="space-y-4 pt-2 text-left">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Enter Family Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  required
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FAM-8X29K"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold bg-cream border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm uppercase tracking-wider"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                Ask your family admin for the unique invite code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-btn w-full py-3 bg-cyan text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Connecting...' : 'Join Family Space'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateFamily;
