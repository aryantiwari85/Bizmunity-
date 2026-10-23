import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Bell,
  QrCode,
  Plus,
  RefreshCw,
  Layers,
  TrendingUp,
  Megaphone,
  Tag,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Check,
  PlusCircle,
  Search,
  X,
  ArrowLeft,
  Users,
  User,
  FileText,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Post, Community, NotificationItem, UserProfile } from '../../types/bizmunity';
import { useAuth } from '../../context/AuthContext';
import { toggleLikePost, toggleSavePost, deletePost } from '../../firebase/firestoreService';
import { BizmunityLogo } from '../../components/BizmunityLogo';
import { matchesQuery } from '../../utils/bizmunityLogic';

interface FeedScreenProps {
  posts: Post[];
  communities: Community[];
  creators?: UserProfile[];
  notifications: NotificationItem[];
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  loading: boolean;
  onRefresh: () => void;
  onOpenCreatePost: () => void;
  onOpenNotifications: () => void;
  onOpenQR: () => void;
  onCommunityClick: (communityId: string) => void;
  onPostClick?: (post: Post) => void;
  onCreatorClick?: (userId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenAuth: () => void;
}

const TRENDING_SEARCH_TAGS = [
  '#AIMarketing',
  '#BootstrappedFounders',
  '#CoffeeLovers',
  '#TechStartups',
  '#CreatorEconomy',
  '#LocalBusiness',
  '#LoyaltyPerks',
];

export const FeedScreen: React.FC<FeedScreenProps> = ({
  posts,
  communities,
  creators = [],
  notifications,
  likedPostIds,
  savedPostIds,
  loading,
  onRefresh,
  onOpenCreatePost,
  onOpenNotifications,
  onOpenQR,
  onCommunityClick,
  onPostClick,
  onCreatorClick,
  onOpenComments,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'trending' | 'announcements' | 'offers' | 'events'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Search State in Feed
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'communities' | 'posts' | 'creators'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handlePullRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredPosts = useMemo(() => {
    if (filter === 'announcements') return posts.filter((p) => p.type === 'announcement');
    if (filter === 'offers') return posts.filter((p) => p.type === 'offer');
    if (filter === 'events') return posts.filter((p) => p.type === 'event');
    if (filter === 'trending') {
      return [...posts].sort(
        (a, b) => (b.likesCount || 0) + (b.commentsCount || 0) - ((a.likesCount || 0) + (a.commentsCount || 0))
      );
    }
    return posts;
  }, [posts, filter]);

  // Search results
  const searchCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communities.slice(0, 5);
    return communities.filter((c) =>
      matchesQuery(searchQuery, c.name, c.handle, c.description, c.category, c.location)
    );
  }, [communities, searchQuery]);

  const searchPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts.slice(0, 10);
    return posts.filter((p) =>
      matchesQuery(searchQuery, p.content, p.authorName, p.authorUsername, p.communityName, p.type)
    );
  }, [posts, searchQuery]);

  const searchCreators = useMemo(() => {
    if (!searchQuery.trim()) return creators.slice(0, 6);
    return creators.filter((c) =>
      matchesQuery(searchQuery, c.name, c.username, c.bio, c.badge, c.location)
    );
  }, [creators, searchQuery]);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // =========================================================================
  // ACTIVE SEARCH MODE (Dedicated search view from top bar)
  // =========================================================================
  if (isSearching) {
    return (
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden select-none">
        {/* Top Search Input Bar */}
        <div className="p-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities, posts, creators..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-semibold pl-1">
            <button
              onClick={() => setSearchFilter('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                searchFilter === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSearchFilter('communities')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                searchFilter === 'communities'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Communities ({searchCommunities.length})
            </button>
            <button
              onClick={() => setSearchFilter('posts')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                searchFilter === 'posts'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Posts ({searchPosts.length})
            </button>
            <button
              onClick={() => setSearchFilter('creators')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                searchFilter === 'creators'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Creators ({searchCreators.length})
            </button>
          </div>
        </div>

        {/* Search Results Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
          {/* Trending Topics (when search is empty) */}
          {!searchQuery && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag.replace('#', ''))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-orange-600 dark:text-orange-400 font-medium hover:border-orange-500 transition active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Communities Results */}
          {(searchFilter === 'all' || searchFilter === 'communities') && (
            <div className="space-y-2.5">
              <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-500" />
                Communities ({searchCommunities.length})
              </h3>

              {searchCommunities.length === 0 ? (
                <p className="text-xs text-zinc-400 py-2">No matching communities found.</p>
              ) : (
                <div className="space-y-2">
                  {searchCommunities.map((c) => (
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

          {/* Creators & Founders Results */}
          {(searchFilter === 'all' || searchFilter === 'creators') && (
            <div className="space-y-2.5 pt-1">
              <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-500" />
                Creators & Founders ({searchCreators.length})
              </h3>

              {searchCreators.length === 0 ? (
                <p className="text-xs text-zinc-400 py-2">No matching creators found.</p>
              ) : (
                <div className="space-y-2">
                  {searchCreators.map((creator) => {
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

          {/* Posts Results */}
          {(searchFilter === 'all' || searchFilter === 'posts') && (
            <div className="space-y-2.5 pt-1">
              <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                Posts & Offers ({searchPosts.length})
              </h3>

              {searchPosts.length === 0 ? (
                <p className="text-xs text-zinc-400 py-2">No matching posts found.</p>
              ) : (
                <div className="space-y-2">
                  {searchPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => onOpenComments(post)}
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
                          <MessageCircle className="w-3 h-3 text-zinc-400" /> {post.commentsCount || 0}
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
  }

  // =========================================================================
  // NORMAL FEED SCREEN (With search bar at top of the app)
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
      {/* Android Top App Bar */}
      <div className="h-13 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center">
          <BizmunityLogo variant="horizontal" size="sm" />
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearching(true)}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Permanent Personal QR Code icon */}
          <button
            onClick={onOpenQR}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95"
            title="My QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Notifications button with unread badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tap-Friendly Top Search Bar at top of Feed */}
      <div className="px-4 py-2.5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
        <div
          onClick={() => setIsSearching(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition shadow-inner active:scale-[0.99]"
        >
          <Search className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-xs font-medium">Search communities, posts, creators...</span>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-20">
        {/* Stories / Circles Bar (Android horizontal carousel) */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 py-3 px-4 overflow-x-auto scrollbar-none flex items-center gap-3.5">
          {/* User's add circle avatar */}
          <div
            onClick={currentUser ? onOpenCreatePost : onOpenAuth}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
          >
            <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">New Post</span>
          </div>

          {/* Communities circles */}
          {communities.map((c) => (
            <div
              key={c.id}
              onClick={() => onCommunityClick(c.id)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500">
                <div className="w-13 h-13 rounded-full overflow-hidden bg-white dark:bg-zinc-900 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-xs font-bold text-orange-600">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    c.name.charAt(0)
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[60px] truncate">
                {c.name}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Chips Bar */}
        <div className="px-4 py-2.5 bg-white/70 dark:bg-zinc-950/70 backdrop-blur sticky top-0 z-20 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                filter === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('trending')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                filter === 'trending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setFilter('announcements')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                filter === 'announcements'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Announcements</span>
            </button>
            <button
              onClick={() => setFilter('offers')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                filter === 'offers'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Deals</span>
            </button>
            <button
              onClick={() => setFilter('events')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                filter === 'events'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events</span>
            </button>
          </div>

          <button
            onClick={handlePullRefresh}
            className={`p-1.5 text-zinc-400 hover:text-orange-500 rounded-full transition shrink-0 ${
              isRefreshing ? 'animate-spin text-orange-500' : ''
            }`}
            title="Refresh feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Posts Stream */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                      <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Sparkles className="w-10 h-10 text-orange-500 mx-auto opacity-70" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Feed is quiet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Be the first to share an announcement, exclusive offer, or event in your circle.
              </p>
              <button
                onClick={currentUser ? onOpenCreatePost : onOpenAuth}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Post</span>
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isLiked = likedPostIds.has(post.id);
              const isSaved = savedPostIds.has(post.id);
              const isAuthor = currentUser?.uid === post.authorId;

              return (
                <div
                  key={post.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={() => onCreatorClick?.(post.authorId)}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 cursor-pointer"
                      >
                        {post.authorAvatar ? (
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.authorName.charAt(0)
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => onCreatorClick?.(post.authorId)}
                            className="font-bold text-xs text-zinc-900 dark:text-white hover:underline cursor-pointer"
                          >
                            {post.authorName}
                          </span>
                          {post.authorRole && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {post.authorRole}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <span
                            onClick={() => post.communityId && onCommunityClick(post.communityId)}
                            className="text-orange-600 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
                          >
                            {post.communityName}
                          </span>
                          <span>·</span>
                          <span>{new Date(post.createdAt || post.timestamp || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Type Badge / Owner Actions */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        {post.type}
                      </span>

                      {isAuthor && (
                        <button
                          onClick={async () => {
                            if (confirm('Delete this post?')) {
                              await deletePost(post.id, post.communityId);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded transition"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>

                  {/* Special Offer Card inside Post */}
                  {post.offerDetails && (
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> Special Offer
                        </span>
                        {post.offerDetails.discount && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white rounded-md text-[10px] font-bold">
                            {post.offerDetails.discount}
                          </span>
                        )}
                      </div>

                      {post.offerDetails.code && (
                        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-lg border border-orange-200 dark:border-orange-900/50">
                          <code className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                            {post.offerDetails.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(post.id, post.offerDetails!.code!)}
                            className="text-[10px] font-bold text-orange-600 flex items-center gap-1 hover:underline"
                          >
                            {copiedCodeId === post.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              'Copy Code'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Special Event Card inside Post */}
                  {post.eventDetails && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                        <Calendar className="w-4 h-4" />
                        <span>{post.eventDetails.title || 'Community Event'}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                        📅 {post.eventDetails.date} {post.eventDetails.time && `· ⏰ ${post.eventDetails.time}`}
                      </p>
                      {post.eventDetails.location && (
                        <p className="text-[11px] text-zinc-500">
                          📍 {post.eventDetails.location}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Media Carousel (if any images) */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 max-h-72 bg-zinc-950 flex items-center justify-center">
                      <img
                        src={post.mediaUrls[0]}
                        alt="Media"
                        className="w-full h-full object-cover max-h-72"
                      />
                    </div>
                  )}

                  {/* Post Actions: Like, Comment, Save, Share */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-4">
                      {/* Like */}
                      <button
                        onClick={async () => {
                          if (!currentUser) return onOpenAuth();
                          await toggleLikePost(post, isLiked);
                        }}
                        className={`flex items-center gap-1 font-semibold transition ${
                          isLiked
                            ? 'text-rose-500'
                            : 'hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likesCount || 0}</span>
                      </button>

                      {/* Comment */}
                      <button
                        onClick={() => onOpenComments(post)}
                        className="flex items-center gap-1 font-semibold hover:text-zinc-900 dark:hover:text-white transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.commentsCount || 0}</span>
                      </button>

                      {/* Save */}
                      <button
                        onClick={async () => {
                          if (!currentUser) return onOpenAuth();
                          await toggleSavePost(post.id, isSaved);
                        }}
                        className={`flex items-center gap-1 font-semibold transition ${
                          isSaved ? 'text-amber-500' : 'hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Share */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Android Floating Action Button (FAB) */}
      <button
        onClick={currentUser ? onOpenCreatePost : onOpenAuth}
        className="absolute bottom-4 right-4 w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-orange-500/35 hover:scale-105 active:scale-95 transition-transform z-30"
        aria-label="Create Post"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
