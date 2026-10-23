import React from 'react';
import { Plus, Users, ChevronRight, X, Sparkles, Building2 } from 'lucide-react';
import { Community } from '../types/bizmunity';

interface MyCommunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCommunities: Community[];
  onSelectCommunity: (community: Community) => void;
  onCreateNewCommunity: () => void;
}

export const MyCommunitiesModal: React.FC<MyCommunitiesModalProps> = ({
  isOpen,
  onClose,
  ownedCommunities,
  onSelectCommunity,
  onCreateNewCommunity,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                My Communities
              </h3>
              <p className="text-[11px] text-zinc-500">
                Select a community to open its dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Community List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-0.5">
          {ownedCommunities.map((comm) => (
            <button
              key={comm.id}
              onClick={() => {
                onClose();
                onSelectCommunity(comm);
              }}
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-zinc-200 dark:border-zinc-800/80 hover:border-orange-500/40 rounded-2xl flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                  {comm.logoUrl ? (
                    <img src={comm.logoUrl} alt={comm.name} className="w-full h-full object-cover" />
                  ) : (
                    comm.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                    {comm.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    @{comm.handle} • {comm.memberCount || 1} members
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 shrink-0 transition group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>

        {/* Create New Community Action */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => {
              onClose();
              onCreateNewCommunity();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Community</span>
          </button>
        </div>
      </div>
    </div>
  );
};
