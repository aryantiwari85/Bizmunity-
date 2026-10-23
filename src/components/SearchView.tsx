import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  Compass,
  FileText,
  Tag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Community, Post, UserProfile } from '../types/bizmunity';
import { PostCard } from './PostCard';
import { matchesQuery } from '../utils/bizmunityLogic';

interface SearchViewProps {
  communities: Community[];
  posts: Post[];
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  onCommunityClick: (communityId: string) => void;
  onAuthorClick: (authorId: string) => void;
  onOpenAuth: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  communities,
  posts,
  likedPostIds,
  savedPostIds,
  onCommunityClick,
  onAuthorClick,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'communities' | 'posts'>('all');

  const matchedCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communities.slice(0, 6);
    return communities.filter((c) =>
      matchesQuery(searchQuery, c.name, c.handle, c.description, c.category)
    );
  }, [communities, searchQuery]);

  const matchedPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts.slice(0, 10);
    return posts.filter((p) =>
      matchesQuery(searchQuery, p.content, p.authorName, p.authorUsername, p.communityName, p.type)
    );
  }, [posts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <Compass className="w-5 h-5 text-orange-500" />
          Explore Bizmunity
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Realtime search across verified communities, businesses, founders, announcements, and deals.
        </p>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search founders, communities, topics, offers..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mt-4 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setFilterType('communities')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'communities'
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Communities ({matchedCommunities.length})
          </button>
          <button
            onClick={() => setFilterType('posts')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'posts'
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Posts & Offers ({matchedPosts.length})
          </button>
        </div>
      </div>

      {/* Communities Section */}
      {(filterType === 'all' || filterType === 'communities') && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Matching Communities ({matchedCommunities.length})
          </h3>

          {matchedCommunities.length === 0 ? (
            <p className="text-xs text-zinc-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
              No matching communities found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchedCommunities.map((c) => (
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
                      <p className="text-[11px] text-zinc-400">@{c.handle} · {c.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts Section */}
      {(filterType === 'all' || filterType === 'posts') && (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            Matching Posts ({matchedPosts.length})
          </h3>

          {matchedPosts.length === 0 ? (
            <p className="text-xs text-zinc-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
              No matching posts found.
            </p>
          ) : (
            <div className="space-y-4">
              {matchedPosts.map((post) => (
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
      )}
    </div>
  );
};
