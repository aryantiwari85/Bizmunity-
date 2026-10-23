import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Settings,
  X,
  UploadCloud,
  CheckCircle,
  Loader2,
  Trash2,
  BarChart2,
  Tag,
  Megaphone,
  Award,
} from 'lucide-react';
import { Community, Post, Offer, Reward } from '../types/bizmunity';
import { useAuth } from '../context/AuthContext';
import {
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
} from '../firebase/firestoreService';
import { compressImage } from '../utils/imageCompressor';

interface CommunitiesViewProps {
  communities: Community[];
  joinedCommunityIds: string[];
  onSelectCommunity?: (communityId: string) => void;
  onOpenAuth: () => void;
  onOpenCreatePost: () => void;
}

const CATEGORIES = [
  'All',
  'Tech & Startups',
  'Creators & Media',
  'Retail & E-commerce',
  'Local Business',
  'Health & Fitness',
  'Finance & Crypto',
  'Food & Hospitality',
];

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  communities,
  joinedCommunityIds,
  onSelectCommunity,
  onOpenAuth,
  onOpenCreatePost,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);

  // Community creation state
  const [commName, setCommName] = useState('');
  const [commHandle, setCommHandle] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commCategory, setCommCategory] = useState('Tech & Startups');
  const [commRules, setCommRules] = useState('');
  const [commLogo, setCommLogo] = useState('');
  const [commCover, setCommCover] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Editing state for owner
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');

  const joinedSet = new Set(joinedCommunityIds);

  const filtered = communities.filter((c) => {
    if (selectedCategory === 'All') return true;
    return c.category === selectedCategory;
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      setCommLogo(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 400, 0.8);
      setCommCover(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!commName || !commHandle) {
      setErrorMsg('Please enter both name and handle.');
      return;
    }

    setCreating(true);
    setErrorMsg('');
    try {
      await createCommunity(
        commName,
        commHandle,
        commDesc,
        commCategory,
        commLogo || `https://api.dicebear.com/7.x/identicon/svg?seed=${commHandle}`,
        commCover || '',
        commRules
      );
      setShowCreateModal(false);
      setCommName('');
      setCommHandle('');
      setCommDesc('');
      setCommLogo('');
      setCommCover('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create community.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleJoin = async (c: Community) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const isMember = joinedSet.has(c.id);
    if (isMember) {
      await leaveCommunity(c.id);
    } else {
      await joinCommunity(c.id, c.name);
    }
  };

  const handleDelete = async (c: Community) => {
    if (confirm(`Delete community "${c.name}"? This action cannot be undone.`)) {
      await deleteCommunity(c.id);
      setActiveCommunity(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeCommunity) return;
    await updateCommunity(activeCommunity.id, {
      name: editName,
      description: editDesc,
      rules: editRules,
    });
    setActiveCommunity({
      ...activeCommunity,
      name: editName,
      description: editDesc,
      rules: editRules,
    });
    setIsEditing(false);
  };

  // If a single community detail view is active
  if (activeCommunity) {
    const isOwner = currentUser?.uid === activeCommunity.ownerId;
    const isMember = joinedSet.has(activeCommunity.id);

    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <button
          onClick={() => {
            setActiveCommunity(null);
            setIsEditing(false);
          }}
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
        >
          ← Back to All Communities
        </button>

        {/* Community Banner & Profile Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Cover image */}
          <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 relative">
            {activeCommunity.coverUrl && (
              <img
                src={activeCommunity.coverUrl}
                alt={activeCommunity.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-zinc-900 bg-white dark:bg-zinc-800 shadow-md overflow-hidden shrink-0">
                  {activeCommunity.logoUrl ? (
                    <img
                      src={activeCommunity.logoUrl}
                      alt={activeCommunity.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-orange-600">
                      {activeCommunity.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                    {activeCommunity.name}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">@{activeCommunity.handle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleJoin(activeCommunity)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${
                    isMember
                      ? 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
                  }`}
                >
                  {isMember ? 'Joined ✓' : 'Join Community'}
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setEditName(activeCommunity.name);
                        setEditDesc(activeCommunity.description);
                        setEditRules(activeCommunity.rules || '');
                      }}
                      className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      title="Edit Community Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(activeCommunity)}
                      className="p-2 border border-red-200 dark:border-red-900/50 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Delete Community"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Description & metadata */}
            {isEditing ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-3 mb-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Community Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rules</label>
                  <input
                    type="text"
                    value={editRules}
                    onChange={(e) => setEditRules(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {activeCommunity.description || 'Welcome to this community! Connect with founders, customers, and partners.'}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-500" />
                <strong className="text-zinc-900 dark:text-white">{activeCommunity.memberCount || 1}</strong> members
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Category: <strong>{activeCommunity.category}</strong></span>
              </span>
              {activeCommunity.rules && (
                <span className="hidden sm:inline-block">
                  Rules: {activeCommunity.rules}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Community Actions Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Have something to share with {activeCommunity.name}?
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Publish discussions, announcements, offers, or meetups to this community.
            </p>
          </div>
          <button
            onClick={currentUser ? onOpenCreatePost : onOpenAuth}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Post to Community
          </button>
        </div>
      </div>
    );
  }

  // Directory View
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Communities & Business Networks
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Join circles created by founders, businesses, and creators, or start your own
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create Community
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of communities */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            No communities in this category yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Be the first founder to create a community for {selectedCategory}!
          </p>
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Start This Community
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((comm) => {
            const isMember = joinedSet.has(comm.id);
            return (
              <div
                key={comm.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-base font-bold overflow-hidden shadow-sm shrink-0">
                        {comm.logoUrl ? (
                          <img src={comm.logoUrl} alt={comm.name} className="w-full h-full object-cover" />
                        ) : (
                          comm.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3
                          onClick={() => setActiveCommunity(comm)}
                          className="font-bold text-sm text-zinc-900 dark:text-white hover:text-orange-500 cursor-pointer transition"
                        >
                          {comm.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono">@{comm.handle}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {comm.category}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-4">
                    {comm.description || 'Community for founders, creators, and professionals.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <span className="text-zinc-400 font-medium">
                    <strong className="text-zinc-900 dark:text-white">{comm.memberCount || 1}</strong> members
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveCommunity(comm)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleToggleJoin(comm)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                        isMember
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                      }`}
                    >
                      {isMember ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> Start a New Community
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="p-6 overflow-y-auto space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Community Name</label>
                <input
                  type="text"
                  required
                  value={commName}
                  onChange={(e) => setCommName(e.target.value)}
                  placeholder="e.g. Bangalore AI Founders Club"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Unique Handle (@handle)</label>
                <input
                  type="text"
                  required
                  value={commHandle}
                  onChange={(e) => setCommHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. blr_founders"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={commCategory}
                  onChange={(e) => setCommCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  placeholder="What is the mission of this community? Who should join?"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Community Logo</label>
                  <label className="cursor-pointer block border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="text-[11px] text-zinc-500">
                      {commLogo ? 'Logo Uploaded ✓' : 'Upload Image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cover Banner</label>
                  <label className="cursor-pointer block border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="text-[11px] text-zinc-500">
                      {commCover ? 'Cover Uploaded ✓' : 'Upload Banner'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Community (+50 pts)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
