import React from 'react';
import { ArrowLeft, Shield, QrCode, LogOut, ExternalLink, User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/authService';
import { BizmunityLogo } from '../../components/BizmunityLogo';

interface SettingsScreenProps {
  onGoBack: () => void;
  onOpenQR: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onGoBack,
  onOpenQR,
  onLogout,
}) => {
  const { currentUser, userProfile } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logoutUser();
      onLogout();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top App Bar */}
      <div className="h-12 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <button onClick={onGoBack} className="p-1 text-zinc-600 dark:text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-xs">Settings & Privacy</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 text-xs">
        {/* Account Info Card */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Connected Account
          </span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <BizmunityLogo size="xs" showText={false} />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-zinc-900 dark:text-white">{userProfile?.name}</p>
              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">
                @{userProfile?.username}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1 text-zinc-500 text-[11px]">
            <p>UID: {currentUser?.uid}</p>
            <p>Email: {currentUser?.email || 'N/A'}</p>
          </div>
        </div>

        {/* System Settings List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm overflow-hidden">
          {/* Permanent Personal QR & Scanner Button */}
          <button
            onClick={onOpenQR}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition"
          >
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-orange-500" />
              <div>
                <span className="font-bold block text-zinc-900 dark:text-white">Permanent Personal QR Code</span>
                <span className="text-[10px] text-zinc-400">View personal QR, share, download, or scan</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Security & Firestore Rules */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div>
                <span className="font-bold block text-zinc-900 dark:text-white">Security & Rules Status</span>
                <span className="text-[10px] text-emerald-600 font-bold">Hardened & Active in Firestore</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out of Bizmunity
        </button>

        <p className="text-center text-[10px] text-zinc-400 pt-4">
          Bizmunity Android Application v2.4.0 · Realtime Firebase Firestore
        </p>
      </div>
    </div>
  );
};
