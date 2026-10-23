import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Building2,
  Users,
  Send,
  Loader2,
  Award,
  Sparkles,
} from 'lucide-react';
import { UserProfile, Post, Community } from '../types/bizmunity';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  getUserPosts,
  getUserCommunities,
  toggleFollowUser,
  sendDirectMessage,
} from '../firebase/firestoreService';

interface ScannedProfileModalProps {
  userId: string;
  onClose: () => void;
  onOpenCommunity?: (communityId: string) => void;
}

export const ScannedProfileModal: React.FC<ScannedProfileModalProps> = ({
  userId,
  onClose,
  onOpenCommunity,
}) => {
  const { currentUser, userProfile: myProfile } = useAuth();
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Direct Message Modal
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const profile = await getUserProfile(userId);
        if (isMounted) setTargetProfile(profile);

        const [userPosts, userComms] = await Promise.all([
          getUserPosts(userId),
          getUserCommunities(userId),
        ]);
        if (isMounted) {
          setPosts(userPosts);
          setCommunities(userComms);
        }
      } catch (err) {
        console.error('Failed to load scanned user:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleToggleFollow = async () => {
    if (!currentUser || !targetProfile) return;
    setFollowLoading(true);
    try {
      const newState = await toggleFollowUser(currentUser.uid, targetProfile.uid);
      setIsFollowing(newState);
      setTargetProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: Math.max(0, prev.followersCount + (newState ? 1 : -1)),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !msgText.trim()) return;
    setMsgSending(true);
    try {
      await sendDirectMessage(currentUser.uid, userId, msgText.trim());
      setMsgSentSuccess(true);
      setMsgText('');
      setTimeout(() => {
        setMsgSentSuccess(false);
        setShowMsgBox(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-xs text-orange-600 dark:text-orange-400">
            Scanned Member Profile
          </span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="text-xs text-zinc-400">Loading user profile...</span>
          </div>
        ) : !targetProfile ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            User profile not found. The user may not have finished setup.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Top Identity Card */}
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md shrink-0 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={targetProfile.avatar || '/1000075340-Picsart-BackgroundRemover.png'}
                  alt={targetProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-zinc-900 dark:text-white truncate">
                  {targetProfile.name}
                </h3>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  @{targetProfile.username}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                  <span>
                    <strong className="text-zinc-900 dark:text-white">{targetProfile.followersCount}</strong>{' '}
                    Followers
                  </span>
                  <span>
                    <strong className="text-zinc-900 dark:text-white">{targetProfile.followingCount}</strong>{' '}
                    Following
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {targetProfile.bio && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
                {targetProfile.bio}
              </p>
            )}

            {/* Action Buttons: Follow & Message */}
            {currentUser?.uid !== targetProfile.uid && (
              <div className="flex gap-2">
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isFollowing
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowMsgBox(!showMsgBox)}
                  className="flex-1 py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition"
                >
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span>Message</span>
                </button>
              </div>
            )}

            {/* Message Box Dropdown */}
            {showMsgBox && (
              <form onSubmit={handleSendMessage} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl space-y-2">
                <input
                  type="text"
                  required
                  placeholder={`Send direct note to @${targetProfile.username}...`}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={msgSending || !msgText.trim()}
                  className="w-full py-2 bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {msgSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : msgSentSuccess ? (
                    <span>Sent Successfully! ✓</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Note</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Communities */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                <Users className="w-3.5 h-3.5 text-orange-500" />
                <span>Circles &amp; Communities ({communities.length})</span>
              </div>
              {communities.length === 0 ? (
                <p className="text-[11px] text-zinc-400">No public circles yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {communities.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onOpenCommunity?.(c.id)}
                      className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 rounded-2xl flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-xs">
                          {c.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-zinc-900 dark:text-white leading-tight">
                            {c.name}
                          </p>
                          <span className="text-[10px] text-zinc-400">@{c.handle}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400">{c.memberCount} members</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Posts */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Recent Posts ({posts.length})</span>
              </div>
              {posts.length === 0 ? (
                <p className="text-[11px] text-zinc-400">No posts shared yet.</p>
              ) : (
                <div className="space-y-2">
                  {posts.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl"
                    >
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-3">
                        {p.content}
                      </p>
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
