import React from 'react';
import { Home, Compass, Award, User, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AndroidTab = 'feed' | 'explore' | 'communities' | 'loyalty' | 'profile';

interface AndroidBottomNavProps {
  currentTab: AndroidTab;
  onSelectTab: (tab: AndroidTab) => void;
  onOpenScanner?: () => void;
  unreadCount?: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
  unreadCount = 0,
}) => {
  const { userProfile } = useAuth();

  return (
    <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 z-40 select-none pb-safe">
      <nav className="flex items-center justify-around h-14 px-2">
        {/* 1. Feed Tab */}
        <button
          onClick={() => onSelectTab('feed')}
          className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
        >
          <div
            className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
              currentTab === 'feed'
                ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Home
              className={`w-5 h-5 transition-transform duration-150 ${
                currentTab === 'feed' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
              currentTab === 'feed'
                ? 'font-bold text-orange-600 dark:text-orange-400'
                : 'font-medium text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Feed
          </span>
        </button>

        {/* 2. Explore Tab */}
        <button
          onClick={() => onSelectTab('explore')}
          className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
        >
          <div
            className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
              currentTab === 'explore' || currentTab === 'communities'
                ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Compass
              className={`w-5 h-5 transition-transform duration-150 ${
                currentTab === 'explore' || currentTab === 'communities'
                  ? 'scale-110 stroke-[2.5]'
                  : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
              currentTab === 'explore' || currentTab === 'communities'
                ? 'font-bold text-orange-600 dark:text-orange-400'
                : 'font-medium text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Explore
          </span>
        </button>

        {/* 3. Middle Floating Action Button: QR Scanner */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <button
            onClick={onOpenScanner}
            className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/35 hover:scale-105 active:scale-95 transition-transform z-20 group"
            aria-label="Scan QR Code"
            title="Scan QR Code"
          >
            <QrCode className="w-6 h-6 stroke-[2.2] group-hover:rotate-6 transition-transform" />
          </button>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold text-orange-600 dark:text-orange-400">
            Scan
          </span>
        </div>

        {/* 4. Rewards Tab */}
        <button
          onClick={() => onSelectTab('loyalty')}
          className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
        >
          <div
            className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
              currentTab === 'loyalty'
                ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Award
              className={`w-5 h-5 transition-transform duration-150 ${
                currentTab === 'loyalty' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
              }`}
            />
            {(userProfile?.loyaltyPoints || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-zinc-950" />
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
              currentTab === 'loyalty'
                ? 'font-bold text-orange-600 dark:text-orange-400'
                : 'font-medium text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Rewards
          </span>
        </button>

        {/* 5. Profile Tab */}
        <button
          onClick={() => onSelectTab('profile')}
          className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
        >
          <div
            className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
              currentTab === 'profile'
                ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {userProfile?.avatar ? (
              <div
                className={`w-5 h-5 rounded-full overflow-hidden border-2 ${
                  currentTab === 'profile' ? 'border-orange-500' : 'border-transparent'
                }`}
              >
                <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <User
                className={`w-5 h-5 transition-transform duration-150 ${
                  currentTab === 'profile' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                }`}
              />
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
              currentTab === 'profile'
                ? 'font-bold text-orange-600 dark:text-orange-400'
                : 'font-medium text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Profile
          </span>
        </button>
      </nav>

      {/* Android Gesture Navigation Home Indicator Pill */}
      <div className="w-full flex justify-center py-1">
        <div className="w-28 h-1 bg-zinc-300 dark:bg-zinc-700/80 rounded-full" />
      </div>
    </div>
  );
};
