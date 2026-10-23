import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Megaphone,
  Tag,
  Calendar,
  Layers,
  RefreshCw,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { Post } from '../types/bizmunity';
import { PostCard } from './PostCard';
import { useAuth } from '../context/AuthContext';

interface FeedViewProps {
  posts: Post[];
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  loading: boolean;
  onRefresh: () => void;
  onOpenCreatePost: () => void;
  onCommunityClick: (communityId: string) => void;
  onAuthorClick: (authorId: string) => void;
  onOpenAuth: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  likedPostIds,
  savedPostIds,
  loading,
  onRefresh,
  onOpenCreatePost,
  onCommunityClick,
  onAuthorClick,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'announcements' | 'offers' | 'events' | 'trending'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredPosts = useMemo(() => {
    if (filter === 'announcements') {
      return posts.filter((p) => p.type === 'announcement');
    }
    if (filter === 'offers') {
      return posts.filter((p) => p.type === 'offer');
    }
    if (filter === 'events') {
      return posts.filter((p) => p.type === 'event');
    }
    if (filter === 'trending') {
      return [...posts].sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0)));
    }
    return posts;
  }, [posts, filter]);

  return (
    <div className="space-y-4">
      {/* Feed Controls & Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Feed
          </button>

          <button
            onClick={() => setFilter('trending')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              filter === 'trending'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Trending
          </button>

          <button
            onClick={() => setFilter('announcements')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              filter === 'announcements'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            Announcements
          </button>

          <button
            onClick={() => setFilter('offers')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              filter === 'offers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Offers
          </button>

          <button
            onClick={() => setFilter('events')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              filter === 'events'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Events
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Pull to Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={currentUser ? onOpenCreatePost : onOpenAuth}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Main Post Stream */}
      {loading && posts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500">Connecting to real-time Bizmunity feed...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {filter === 'all'
              ? 'No posts in feed yet'
              : `No ${filter} available right now`}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
            Be the first founder or creator to share announcements, showcase your product, or offer exclusive deals!
          </p>
          <button
            onClick={currentUser ? onOpenCreatePost : onOpenAuth}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={likedPostIds.has(post.id)}
              isSaved={savedPostIds.has(post.id)}
              onCommunityClick={onCommunityClick}
              onAuthorClick={onAuthorClick}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      )}
    </div>
  );
};
