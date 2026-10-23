import React, { useState, useMemo } from 'react';
import { Search, Compass, Users, Tag, ArrowRight, FileText, Sparkles, X, User, Shield, MessageSquare, Heart, Award } from 'lucide-react';
import { Community, Post, UserProfile } from '../../types/bizmunity';
import { matchesQuery } from '../../utils/bizmunityLogic';

interface ExploreScreenProps {
  communities: Community[];
  posts: Post[];
  creators?: UserProfile[];
  onCommunityClick: (communityId: string) => void;
  onPostClick: (post: Post) => void;
  onCreatorClick?: (userId: string) => void;
  onOpenAuth: () => void;
}

const TRENDING_TOPICS = [
  '#AIMarketing',
  '#BootstrappedFounders',
  '#CoffeeLovers',
  '#CreatorEconomy',
  '#TechStartups',
  '#RetailBoutique',
  '#LoyaltyPerks',
  '#DirectToConsumer',
];

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  communities,
  posts,
  creators = [],
  onCommunityClick,
  onPostClick,
  onCreatorClick,
  onOpenAuth,
}) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'communities' | 'posts' | 'creators'>('all');

  const matchedCommunities = useMemo(() => {
    if (!search.trim()) return communities.slice(0, 6);
    return communities.filter((c) =>
      matchesQuery(search, c.name, c.handle, c.description, c.category, c.location)
    );
  }, [communities, search]);

  const matchedPosts = useMemo(() => {
    if (!search.trim()) return posts.slice(0, 10);
    return posts.filter((p) =>
      matchesQuery(search, p.content, p.authorName, p.authorUsername, p.communityName, p.type)
    );
  }, [posts, search]);

  const matchedCreators = useMemo(() => {
    if (!search.trim()) return creators.slice(0, 8);
    return creators.filter((c) =>
      matchesQuery(search, c.name, c.username, c.bio, c.badge, c.location)
    );
  }, [creators, search]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Search Bar Header */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities, posts, creators..."
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
              activeFilter === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('communities')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
              activeFilter === 'communities'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Communities ({matchedCommunities.length})
          </button>
          <button
            onClick={() => setActiveFilter('posts')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
              activeFilter === 'posts'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Posts ({matchedPosts.length})
          </button>
          <button
            onClick={() => setActiveFilter('creators')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
              activeFilter === 'creators'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Creators ({matchedCreators.length})
          </button>
        </div>
      </div>

      {/* Main Results Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
        {/* Trending Tags pills */}
        {!search && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Trending Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TOPICS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag.replace('#', ''))}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-orange-600 dark:text-orange-400 font-medium hover:border-orange-500 transition active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1. Communities Section */}
        {(activeFilter === 'all' || activeFilter === 'communities') && (
          <div className="space-y-2.5">
            <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-500" />
              Communities ({matchedCommunities.length})
            </h3>

            {matchedCommunities.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">No matching communities found.</p>
            ) : (
              <div className="space-y-2">
                {matchedCommunities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onCommunityClick(c.id)}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-500 transition shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          c.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1">
                          {c.name}
                          {c.verified && <Shield className="w-3 h-3 text-orange-500 fill-orange-500/20" />}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          @{c.handle} · <span className="text-orange-600 dark:text-orange-400 font-semibold">{c.category}</span>
                        </p>
                        <span className="text-[10px] text-zinc-500">
                          {c.memberCount || 1} members · {c.followerCount || 0} followers
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                        Visit
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Creators & Founders Section */}
        {(activeFilter === 'all' || activeFilter === 'creators') && (
          <div className="space-y-2.5 pt-1">
            <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              Creators & Founders ({matchedCreators.length})
            </h3>

            {matchedCreators.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">No matching creators found.</p>
            ) : (
              <div className="space-y-2">
                {matchedCreators.map((creator) => {
                  const uid = creator.uid || creator.id;
                  return (
                    <div
                      key={uid}
                      onClick={() => onCreatorClick?.(uid)}
                      className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-500 transition shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                          {creator.avatar ? (
                            <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                          ) : (
                            creator.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                              {creator.name}
                            </h4>
                            {creator.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                {creator.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            @{creator.username || 'creator'}
                          </p>
                          {creator.bio && (
                            <p className="text-[10px] text-zinc-500 line-clamp-1 max-w-[200px]">
                              {creator.bio}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreatorClick?.(uid);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-orange-500 hover:text-white transition"
                      >
                        Profile
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Posts & Deals Section */}
        {(activeFilter === 'all' || activeFilter === 'posts') && (
          <div className="space-y-2.5 pt-1">
            <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              Posts & Offers ({matchedPosts.length})
            </h3>

            {matchedPosts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">No matching posts found.</p>
            ) : (
              <div className="space-y-2">
                {matchedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onPostClick(post)}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-orange-500 transition shadow-sm space-y-2 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-[10px] overflow-hidden">
                          {post.authorAvatar ? (
                            <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                          ) : (
                            post.authorName.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-white block leading-tight">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            in {post.communityName}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        {post.type}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-zinc-400" /> {post.commentsCount || 0}
                      </span>
                      <span className="ml-auto text-[9px] text-zinc-400">
                        {new Date(post.createdAt || post.timestamp || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
