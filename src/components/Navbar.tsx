import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Bell,
  PlusCircle,
  Award,
  Users,
  Compass,
  Calendar,
  Home,
  LogOut,
  User,
  Bookmark,
  QrCode,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/authService';
import { NotificationItem } from '../types/bizmunity';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../firebase/firestoreService';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenCreatePost: () => void;
  onOpenQRArch: () => void;
  notifications: NotificationItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenCreatePost,
  onOpenQRArch,
  notifications,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logoutUser();
  };

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'loyalty', label: 'Loyalty & Rewards', icon: Award },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('feed')}
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                  Bizmunity
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:block -mt-1">
                Business & Creator Network
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <button
              onClick={() => setCurrentTab('explore')}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Future QR Architecture Info Button */}
            <button
              onClick={onOpenQRArch}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Future QR Architecture"
              aria-label="QR Architecture"
            >
              <QrCode className="w-5 h-5" />
            </button>

            {currentUser ? (
              <>
                {/* Create Post Button */}
                <button
                  onClick={onOpenCreatePost}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-orange-500/20 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Post</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setShowProfileMenu(false);
                    }}
                    className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifs.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-white">
                            Notifications
                          </span>
                          {unreadNotifs.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              {unreadNotifs.length} new
                            </span>
                          )}
                        </div>
                        {unreadNotifs.length > 0 && (
                          <button
                            onClick={() => markAllNotificationsAsRead(notifications)}
                            className="text-[11px] text-orange-600 dark:text-orange-400 font-medium hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-zinc-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => markNotificationAsRead(item.id)}
                              className={`p-3.5 text-xs transition cursor-pointer flex gap-3 ${
                                item.read
                                  ? 'bg-transparent text-zinc-600 dark:text-zinc-400'
                                  : 'bg-orange-50/50 dark:bg-orange-950/20 text-zinc-900 dark:text-white'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
                                {item.actorAvatar ? (
                                  <img
                                    src={item.actorAvatar}
                                    alt={item.actorName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">
                                    {item.actorName.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                  {item.message}
                                </p>
                                <span className="text-[10px] text-zinc-400 mt-1 block">
                                  {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar & Points Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifMenu(false);
                    }}
                    className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition"
                  >
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                      <Award className="w-3.5 h-3.5" />
                      <span>{userProfile?.loyaltyPoints || 0}</span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
                      {userProfile?.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt={userProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userProfile?.name?.charAt(0) || 'U'
                      )}
                    </div>
                  </button>

                  {/* Profile Menu Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">
                          {userProfile?.name || currentUser.displayName || 'Bizmunity Member'}
                        </p>
                        <p className="text-zinc-400 truncate">@{userProfile?.username || 'member'}</p>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                      >
                        <User className="w-4 h-4 text-zinc-400" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('loyalty');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                      >
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Loyalty Points ({userProfile?.loyaltyPoints || 0})</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                      >
                        <Bookmark className="w-4 h-4 text-zinc-400" />
                        Saved Posts
                      </button>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-orange-500/20 transition"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}

            {currentUser && (
              <button
                onClick={() => {
                  onOpenCreatePost();
                  setMobileMenuOpen(false);
                }}
                className="mt-2 w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Create Post
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
