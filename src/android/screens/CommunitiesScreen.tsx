import React, { useState } from 'react';
import { Users, Plus, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { Community } from '../../types/bizmunity';
import { useAuth } from '../../context/AuthContext';
import { joinCommunity, leaveCommunity } from '../../firebase/firestoreService';

interface CommunitiesScreenProps {
  communities: Community[];
  joinedCommunityIds: string[];
  onSelectCommunity: (community: Community) => void;
  onOpenCreateCommunity: () => void;
  onOpenAuth: () => void;
}

const CATEGORIES = [
  'All',
  'Tech & Startups',
  'Creators & Media',
  'Retail & E-commerce',
  'Local Business',
  'Health & Fitness',
  'Finance & Crypto',
];

export const CommunitiesScreen: React.FC<CommunitiesScreenProps> = ({
  communities,
  joinedCommunityIds,
  onSelectCommunity,
  onOpenCreateCommunity,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');
  const [selectedCat, setSelectedCat] = useState('All');

  const joinedSet = new Set(joinedCommunityIds);

  const filtered = communities.filter((c) => {
    if (activeTab === 'joined' && !joinedSet.has(c.id)) return false;
    if (selectedCat !== 'All' && c.category !== selectedCat) return false;
    return true;
  });

  const handleToggleJoin = async (e: React.MouseEvent, c: Community) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (joinedSet.has(c.id)) {
      await leaveCommunity(c.id);
    } else {
      await joinCommunity(c.id, c.name);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
      {/* Top Bar */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Circles & Communities
          </h2>

          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'joined'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              Joined ({joinedCommunityIds.length})
            </button>
          </div>
        </div>

        {/* Category horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-semibold py-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                selectedCat === cat
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
            <Users className="w-10 h-10 text-orange-500/60 mx-auto" />
            <p className="font-bold text-zinc-700 dark:text-zinc-300">
              {activeTab === 'joined'
                ? "You haven't joined any circles yet"
                : 'No communities in this category'}
            </p>
            <p className="text-[11px]">
              Explore communities or create a private/public circle for your brand!
            </p>
          </div>
        ) : (
          filtered.map((comm) => {
            const isMember = joinedSet.has(comm.id);
            return (
              <div
                key={comm.id}
                onClick={() => onSelectCommunity(comm)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500 transition shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-sm">
                    {comm.logoUrl ? (
                      <img src={comm.logoUrl} alt={comm.name} className="w-full h-full object-cover" />
                    ) : (
                      comm.name.charAt(0)
                    )}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                      {comm.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">@{comm.handle} · {comm.category}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {comm.description || 'Verified Bizmunity Community'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleToggleJoin(e, comm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      isMember
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {isMember ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button to Create Community */}
      <button
        onClick={currentUser ? onOpenCreateCommunity : onOpenAuth}
        className="absolute bottom-4 right-4 w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-orange-500/35 hover:scale-105 active:scale-95 transition-transform z-30"
        aria-label="Create Community"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
