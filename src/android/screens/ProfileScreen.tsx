import React, { useState } from 'react';
import {
  User,
  Settings,
  Edit3,
  Calendar,
  Flame,
  Award,
  Users,
  Bookmark,
  FileText,
  Mail,
  Phone,
  LogOut,
  QrCode,
} from 'lucide-react';
import { Post, Community, RewardHistory } from '../../types/bizmunity';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/authService';

import { BizmunityLogo } from '../../components/BizmunityLogo';

interface ProfileScreenProps {
  userPosts: Post[];
  savedPosts: Post[];
  communities: Community[];
  joinedCommunityIds: string[];
  rewardHistory: RewardHistory[];
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onOpenQR?: () => void;
  onCommunityClick: (communityId: string) => void;
  onOpenAuth: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userPosts,
  savedPosts,
  communities,
  joinedCommunityIds,
  rewardHistory,
  onOpenEditProfile,
  onOpenSettings,
  onOpenQR,
  onCommunityClick,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'communities' | 'vouchers'>('posts');

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <BizmunityLogo size="lg" className="mb-4" />
        <h2 className="text-xl font-black mb-1">Your Profile & Wallet</h2>
        <p className="text-xs text-zinc-500 max-w-xs mb-6">
          Sign in to view your followers, claim your @username, manage circles, and track loyalty perks.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full max-w-xs py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 text-xs"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const myJoinedCommunities = communities.filter((c) => joinedCommunityIds.includes(c.id));

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top Header */}
      <div className="h-12 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <span className="font-bold text-xs truncate max-w-[200px]">
          @{userProfile?.username || 'member'}
        </span>

        <div className="flex items-center gap-1">
          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 rounded-full"
              title="My QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-950 px-5 pt-4 pb-5 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-black overflow-hidden shadow-md">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <BizmunityLogo size="md" showText={false} />
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {userProfile?.name || currentUser.displayName || 'Bizmunity Member'}
                </h2>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold font-mono">
                  @{userProfile?.username || 'member'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Joined {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenEditProfile}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {userProfile?.bio || 'Building connections and growing communities on Bizmunity.'}
          </p>

          {/* Contact meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
            {userProfile?.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {userProfile.email}
              </span>
            )}
            {userProfile?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {userProfile.phone}
              </span>
            )}
          </div>
          {onOpenQR && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 dark:from-orange-500/15 dark:to-zinc-900 border border-orange-500/20 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-zinc-900 dark:text-white">Permanent Personal QR</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Scan to follow, connect, or earn</span>
                </div>
              </div>
              <button
                onClick={onOpenQR}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/25 hover:bg-orange-500 transition active:scale-95"
              >
                Show QR
              </button>
            </div>
          )}

          {/* Android Counter Stats Bar */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
            <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <span className="font-extrabold text-sm block text-zinc-900 dark:text-white">
                {userProfile?.followersCount || 0}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Followers</span>
            </div>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <span className="font-extrabold text-sm block text-zinc-900 dark:text-white">
                {userProfile?.followingCount || 0}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Following</span>
            </div>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <span className="font-extrabold text-sm block text-orange-600 dark:text-orange-400">
                {userProfile?.loyaltyPoints || 0}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Points</span>
            </div>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <span className="font-extrabold text-sm block text-amber-500 flex items-center justify-center gap-0.5">
                <Flame className="w-3 h-3 fill-current" /> {userProfile?.streakDays || 1}d
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Streak</span>
            </div>
          </div>
        </div>

        {/* Tab Row */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'posts'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-400'
            }`}
          >
            Posts ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'saved'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-400'
            }`}
          >
            Saved ({savedPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'communities'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-400'
            }`}
          >
            Circles ({myJoinedCommunities.length})
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'vouchers'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-400'
            }`}
          >
            Perks ({rewardHistory.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-3">
          {activeTab === 'posts' && (
            <div>
              {userPosts.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-8">
                  You haven't posted anything yet. Share your first business update!
                </p>
              ) : (
                userPosts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-1.5 text-xs mb-2"
                  >
                    <span className="text-[10px] text-zinc-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <p className="text-zinc-800 dark:text-zinc-200">{p.content}</p>
                    <div className="flex gap-3 text-[10px] text-zinc-400 pt-1">
                      <span>❤️ {p.likesCount || 0}</span>
                      <span>💬 {p.commentsCount || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              {savedPosts.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-8">
                  No bookmarked posts yet. Save posts from the feed to view here.
                </p>
              ) : (
                savedPosts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-1.5 text-xs mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900 dark:text-white">{p.authorName}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">@{p.authorUsername}</span>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200">{p.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="space-y-2">
              {myJoinedCommunities.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-8">
                  You haven't joined any circles yet.
                </p>
              ) : (
                myJoinedCommunities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onCommunityClick(c.id)}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs cursor-pointer hover:border-orange-500"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">{c.name}</h4>
                        <p className="text-[10px] text-zinc-400">@{c.handle}</p>
                      </div>
                    </div>
                    <span className="text-xs text-orange-500 font-bold">View</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="space-y-2">
              {rewardHistory.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-8">No redeemed perks yet.</p>
              ) : (
                rewardHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{h.rewardTitle}</h4>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(h.redeemedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
