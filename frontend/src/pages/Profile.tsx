import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Copy,
  Check,
  Calendar,
  Lock,
  Save,
  Users,
} from 'lucide-react';
import { ProfileData } from '../types';
import * as profileService from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Other',
];

export const Profile: React.FC = () => {
  const { user, family, refreshUser } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Form Fields
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await profileService.getProfile();
        if (res && res.data) {
          setProfile(res.data);
          setName(res.data.name || '');
          setRelationship(res.data.relationship || RELATIONSHIPS[0]);
        } else if (user) {
          const fallback: ProfileData = {
            id: user.id,
            name: user.name,
            email: user.email,
            relationship: 'Father',
            role: 'ADMIN',
            familyName: family?.familyName || 'Sharma Family',
            familyCode: family?.familyCode || 'FAM-8X29K',
            joinedAt: user.createdAt || new Date().toISOString(),
          };
          setProfile(fallback);
          setName(fallback.name);
          setRelationship(fallback.relationship);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, family]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await profileService.updateProfile({ name, relationship });
      await refreshUser();
      toast.success('Profile details saved!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = () => {
    const code = profile?.familyCode || family?.familyCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success('Family Code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* 1. TOP HEADER */}
      <div className="pb-2 border-b-1.5 border-black/10">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-lime border border-black text-[10px] font-black uppercase tracking-wider mb-1.5">
          <span>IDENTITY & CREDENTIALS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          Manage your personal details, household relationship, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-5 space-y-4">
          <div className="neo-box p-6 bg-white text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-lime border-1.5 border-black shadow-neo-md mx-auto flex items-center justify-center text-2xl font-black text-black">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <h3 className="text-base font-black text-black">{name || user?.name}</h3>
              <p className="text-xs text-gray-600 font-medium">{profile?.email || user?.email}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cream border border-black">
                {relationship}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple text-white border border-black">
                {profile?.role || 'Admin'}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200 text-left space-y-2 text-xs font-semibold text-gray-600">
              <div className="flex items-center justify-between">
                <span>Family Space:</span>
                <span className="font-bold text-black">{profile?.familyName || family?.familyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Family Code:</span>
                <button
                  onClick={handleCopyCode}
                  className="font-mono font-bold text-black hover:text-purple flex items-center gap-1"
                >
                  <span>{profile?.familyCode || family?.familyCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Member Since:</span>
                <span className="font-bold text-black">
                  {formatDate(profile?.joinedAt || user?.createdAt, 'dd MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-7">
          <div className="neo-box p-6 bg-white space-y-4">
            <div className="pb-3 border-b-1.5 border-black">
              <h3 className="text-sm font-black text-black uppercase tracking-wider">
                Edit Information
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-semibold bg-cream border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-700 mb-1">
                  Email Address (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full px-3.5 py-2.5 font-semibold bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-700 mb-1">
                  Relationship to Family
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-bold bg-cream border-1.5 border-black rounded-xl focus:outline-none shadow-neo-sm cursor-pointer"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="neo-btn inline-flex items-center gap-2 px-5 py-2.5 bg-lime text-black text-xs font-black uppercase tracking-wider rounded-xl"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
