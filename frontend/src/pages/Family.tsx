import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Copy,
  Check,
  UserPlus,
  Send,
  Shield,
  Edit2,
  Trash2,
  X,
  Plus,
  Mail,
  Heart,
  FileText,
  Key,
} from 'lucide-react';
import { FamilyMember } from '../types';
import * as familyService from '../services/familyService';
import { useAuth } from '../contexts/AuthContext';
import FamilyMemberCard from '../components/FamilyMemberCard';
import CreateFamily from '../components/CreateFamily';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/SkeletonLoader';
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

export const Family: React.FC = () => {
  const { user, family, refreshFamily } = useAuth();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Join Family Form
  const [joinCode, setJoinCode] = useState('');
  const [joinRelationship, setJoinRelationship] = useState(RELATIONSHIPS[0]);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);

  // Add Member Form
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRelationship, setAddRelationship] = useState(RELATIONSHIPS[0]);
  const [addRole, setAddRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState(RELATIONSHIPS[0]);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Edit Member Form
  const [editRelationship, setEditRelationship] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!family?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await familyService.getFamilyMembers(family.id);
      if (res && res.data && res.data.length > 0) {
        setMembers(res.data);
      } else if (user?.email === 'demo@paperlessfamily.com') {
        // Fallback sample data matching prompt for demo account only
        setMembers([
          {
            id: 1,
            userId: 1,
            name: 'Raj Sharma',
            email: 'raj@sharma.com',
            relationship: 'Father',
            role: 'ADMIN',
            documentCount: 12,
            joinedAt: '2024-01-10T10:00:00Z',
          },
          {
            id: 2,
            userId: 2,
            name: 'Priya Sharma',
            email: 'priya@sharma.com',
            relationship: 'Mother',
            role: 'MEMBER',
            documentCount: 16,
            joinedAt: '2024-01-12T10:00:00Z',
          },
          {
            id: 3,
            userId: 3,
            name: 'Aarav Sharma',
            email: 'aarav@sharma.com',
            relationship: 'Son',
            role: 'MEMBER',
            documentCount: 8,
            joinedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: 4,
            userId: 4,
            name: 'Ananya Sharma',
            email: 'ananya@sharma.com',
            relationship: 'Daughter',
            role: 'MEMBER',
            documentCount: 6,
            joinedAt: '2024-01-15T10:00:00Z',
          },
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
    } catch {
      if (user?.email !== 'demo@paperlessfamily.com') {
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
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  }, [family?.id, user?.email, user?.id, user?.name, user?.createdAt]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN' || members.length === 0;

  const handleCopyCode = () => {
    if (family?.familyCode) {
      navigator.clipboard.writeText(family.familyCode);
      setCopiedCode(true);
      toast.success('Family Code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Please enter a family invite code');
      return;
    }
    try {
      setIsSubmittingJoin(true);
      const res = await familyService.joinFamily(joinCode.trim().toUpperCase());
      if (res && res.data) {
        toast.success(`Successfully joined "${res.data.familyName}"!`);
        setIsJoinOpen(false);
        setJoinCode('');
        await refreshFamily();
        fetchMembers();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid family code or failed to join');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id) return;
    try {
      setIsSubmittingAdd(true);
      await familyService.addMember(family.id, {
        name: addName.trim(),
        email: addEmail.trim(),
        relationship: addRelationship,
        role: addRole,
      });
      toast.success(`${addName} added to family!`);
      setIsAddMemberOpen(false);
      setAddName('');
      setAddEmail('');
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add member');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id) return;
    try {
      setIsSubmittingInvite(true);
      await familyService.inviteMember(family.id, {
        email: inviteEmail.trim(),
        relationship: inviteRelationship,
      });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setIsInviteOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id || !editingMember) return;
    try {
      setIsSubmittingEdit(true);
      await familyService.updateMember(family.id, editingMember.id, {
        relationship: editRelationship,
        role: editRole,
      });
      toast.success('Member details updated');
      setEditingMember(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update member');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!family?.id || !memberToRemove) return;
    try {
      setIsRemoving(true);
      await familyService.removeMember(family.id, memberToRemove.id);
      toast.success(`${memberToRemove.name} removed from family`);
      setMemberToRemove(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!family) {
    return (
      <div className="py-8">
        <CreateFamily onSuccess={refreshFamily} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER - Structured Family Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b-1.5 border-black/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-lime border border-black text-[10px] font-black uppercase tracking-wider mb-1.5">
            <span>HOUSEHOLD ROSTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-2">
            <span>{family.familyName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Manage who has access to household records and documents.
          </p>
        </div>

        {/* Action buttons & Family code */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-1.5 border-black shadow-neo-sm">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Family Code:</span>
            <span className="font-mono text-xs font-black text-black">{family.familyCode}</span>
            <button
              onClick={handleCopyCode}
              title="Copy Family Code"
              className="text-black hover:text-purple p-0.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setIsJoinOpen(true)}
            className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-cream hover:bg-lime text-black text-xs font-black uppercase tracking-wider"
            title="Join an existing family using a family code"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Join Family</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="neo-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs uppercase tracking-wider"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>

              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="neo-btn inline-flex items-center gap-1.5 px-4 py-2 bg-lime text-black text-xs uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. FAMILY STATS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="neo-box p-4 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">Total Members</span>
            <div className="text-2xl font-black text-black mt-0.5">{members.length} Active</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-lime border border-black flex items-center justify-center">
            <Users className="w-5 h-5 text-black stroke-[2.2]" />
          </div>
        </div>

        <div className="neo-box p-4 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">Family Admin</span>
            <div className="text-2xl font-black text-black mt-0.5">
              {members.filter((m) => m.role === 'ADMIN').length} Admin(s)
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-pink border border-black flex items-center justify-center">
            <Shield className="w-5 h-5 text-black stroke-[2.2]" />
          </div>
        </div>

        <div className="neo-box p-4 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">Total Linked Files</span>
            <div className="text-2xl font-black text-black mt-0.5">
              {members.reduce((acc, m) => acc + (m.documentCount || 0), 0)} Documents
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan border border-black flex items-center justify-center">
            <FileText className="w-5 h-5 text-black stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. MEMBERS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              onEdit={(m) => {
                setEditingMember(m);
                setEditRelationship(m.relationship);
                setEditRole(m.role);
              }}
              onRemove={(m) => setMemberToRemove(m)}
            />
          ))}
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-white p-6 shadow-neo-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-black">
              <h3 className="text-base font-black text-black uppercase">Add Family Member</h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-md hover:bg-cream border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 text-xs font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-3 py-2 text-xs font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Relationship</label>
                  <select
                    value={addRelationship}
                    onChange={(e) => setAddRelationship(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    className="w-full px-3 py-2 text-xs font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="neo-btn px-4 py-2 text-xs font-black uppercase rounded-lg bg-lime text-black"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-white p-6 shadow-neo-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-black">
              <h3 className="text-base font-black text-black uppercase">Invite via Email</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded-md hover:bg-cream border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family.member@example.com"
                  className="w-full px-3 py-2 text-xs font-semibold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Relationship</label>
                <select
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-cream rounded-lg border border-black text-xs text-gray-600">
                <span>Or send them the invite code directly: </span>
                <span className="font-mono font-bold text-black">{family.familyCode}</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="neo-btn px-4 py-2 text-xs font-black uppercase rounded-lg bg-pink text-black"
                >
                  {isSubmittingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN FAMILY MODAL */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-white p-6 shadow-neo-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-black">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-lime border border-black flex items-center justify-center">
                  <Key className="w-4 h-4 text-black" />
                </div>
                <h3 className="text-base font-black text-black uppercase">Join a Family Space</h3>
              </div>
              <button
                onClick={() => setIsJoinOpen(false)}
                className="p-1 rounded-md hover:bg-cream border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 font-medium mb-4">
              Enter the unique code shared by your family admin (e.g.{' '}
              <span className="font-mono font-bold text-black">FAM-XXXXX</span>) to join their vault.
            </p>

            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Family Invite Code *
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FAM-8X29K"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-cream border-1.5 border-black rounded-lg uppercase tracking-wider focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Your Relationship in Household
                </label>
                <select
                  value={joinRelationship}
                  onChange={(e) => setJoinRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-cream/70 rounded-lg border border-black/30 text-[11px] text-gray-600 font-medium leading-relaxed">
                ℹ️ Joining another family vault will connect your account to all shared household documents and emergency records.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJoin}
                  className="neo-btn px-4 py-2 text-xs font-black uppercase rounded-lg bg-lime text-black"
                >
                  {isSubmittingJoin ? 'Joining...' : 'Join Family Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="neo-box w-full max-w-md bg-white p-6 shadow-neo-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-black">
              <h3 className="text-base font-black text-black uppercase">Edit {editingMember.name}</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-md hover:bg-cream border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Relationship</label>
                <select
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'ADMIN' | 'MEMBER')}
                  className="w-full px-3 py-2 text-xs font-bold bg-cream border-1.5 border-black rounded-lg focus:outline-none"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border-1.5 border-black bg-white hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="neo-btn px-4 py-2 text-xs font-black uppercase rounded-lg bg-lime text-black"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM REMOVE DIALOG */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from ${family.familyName}?`}
        confirmText="Remove Member"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
};

export default Family;
