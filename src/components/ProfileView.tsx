import React, { useState } from 'react';
import {
  User,
  AtSign,
  Mail,
  Phone,
  Calendar,
  Award,
  Users,
  Bookmark,
  Edit3,
  Camera,
  X,
  CheckCircle,
  Loader2,
  ExternalLink,
  Flame,
  Clock,
} from 'lucide-react';
import { UserProfile, Post, Community, RewardHistory } from '../types/bizmunity';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/authService';
import { compressImage } from '../utils/imageCompressor';
import { PostCard } from './PostCard';

interface ProfileViewProps {
  userPosts: Post[];
  savedPosts: Post[];
  communities: Community[];
  joinedCommunityIds: string[];
  rewardHistory: RewardHistory[];
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  onCommunityClick: (communityId: string) => void;
  onOpenCreatePost: () => void;
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userPosts,
  savedPosts,
  communities,
  joinedCommunityIds,
  rewardHistory,
  likedPostIds,
  savedPostIds,
  onCommunityClick,
  onOpenCreatePost,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'communities' | 'rewards'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit profile form state
  const [name, setName] = useState(userProfile?.name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm">
        <User className="w-14 h-14 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
          Sign In to Access Your Bizmunity Profile
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
          Connect with businesses, track your loyalty points, manage communities, and share announcements.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 300, 300, 0.85);
      setAvatar(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await updateUserProfile(currentUser.uid, {
        name,
        bio,
        phone,
        avatar,
      });
      setShowEditModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const myJoinedCommunities = communities.filter((c) => joinedCommunityIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 relative" />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative w-24 sm:w-28 h-24 sm:h-28 rounded-2xl border-4 border-white dark:border-zinc-900 bg-white dark:bg-zinc-800 shadow-md overflow-hidden shrink-0 group">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-2xl text-orange-600">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                  {userProfile?.name || currentUser.displayName || 'Bizmunity Member'}
                </h1>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold font-mono">
                  @{userProfile?.username || 'member'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setName(userProfile?.name || '');
                setBio(userProfile?.bio || '');
                setPhone(userProfile?.phone || '');
                setAvatar(userProfile?.avatar || '');
                setShowEditModal(true);
              }}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl mb-4">
            {userProfile?.bio || 'Building connections and driving growth on Bizmunity.'}
          </p>

          {/* User metadata row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-zinc-500 dark:text-zinc-400 mb-5">
            {userProfile?.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {userProfile.email}
              </span>
            )}
            {userProfile?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {userProfile.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Joined{' '}
              {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" /> {userProfile?.streakDays || 1} Days Active
            </span>
          </div>

          {/* Profile Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="text-base font-extrabold text-zinc-900 dark:text-white block">
                {userProfile?.followersCount || 0}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Followers</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="text-base font-extrabold text-zinc-900 dark:text-white block">
                {userProfile?.followingCount || 0}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Following</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="text-base font-extrabold text-orange-600 dark:text-orange-400 block">
                {userProfile?.loyaltyPoints || 0}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Loyalty Points</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="text-base font-extrabold text-zinc-900 dark:text-white block">
                {userProfile?.joinedCommunitiesCount || myJoinedCommunities.length || 0}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Communities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'posts'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          My Posts ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'saved'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Saved Bookmarks ({savedPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('communities')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'communities'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Joined Communities ({myJoinedCommunities.length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'rewards'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          My Rewards ({rewardHistory.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400">
              You haven't posted yet. Share your thoughts or business updates!
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={likedPostIds.has(post.id)}
                isSaved={savedPostIds.has(post.id)}
                onCommunityClick={onCommunityClick}
                onOpenAuth={onOpenAuth}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedPosts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400">
              No saved posts. Bookmark posts from your feed to view them later.
            </div>
          ) : (
            savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={likedPostIds.has(post.id)}
                isSaved={true}
                onCommunityClick={onCommunityClick}
                onOpenAuth={onOpenAuth}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myJoinedCommunities.length === 0 ? (
            <div className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400">
              You haven't joined any communities yet. Browse communities and join circles that fit your business!
            </div>
          ) : (
            myJoinedCommunities.map((c) => (
              <div
                key={c.id}
                onClick={() => onCommunityClick(c.id)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                    {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">{c.name}</h4>
                    <p className="text-[11px] text-zinc-400">@{c.handle}</p>
                  </div>
                </div>
                <span className="text-xs text-orange-500 font-bold">View →</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-3">
          {rewardHistory.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400">
              No rewards redeemed yet.
            </div>
          ) : (
            rewardHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{item.rewardTitle}</h4>
                  <p className="text-zinc-400">Redeemed {new Date(item.redeemedAt).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Edit Your Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <div className="p-2 mb-3 bg-red-50 text-red-600 rounded">{errorMsg}</div>}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* Avatar upload */}
              <div>
                <label className="block font-semibold mb-1">Avatar Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    {avatar ? (
                      <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                        U
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100">
                    <Camera className="w-3.5 h-3.5 inline mr-1" /> Change Avatar
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Bio / Headline</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Founder, creator, or business description..."
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
