import React, { useState, useEffect } from 'react';
import { AtSign, User, Camera, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkUsernameAvailable, reserveUsernameAndCreateProfile } from '../../firebase/authService';
import { compressImage } from '../../utils/imageCompressor';
import { BizmunityLogo } from '../../components/BizmunityLogo';

interface UsernameSetupScreenProps {
  onSuccess: () => void;
}

export const UsernameSetupScreen: React.FC<UsernameSetupScreenProps> = ({ onSuccess }) => {
  const { currentUser, pendingGoogleUser, setIsNewGoogleUser } = useAuth();
  const effectiveUser = pendingGoogleUser || currentUser;

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState(effectiveUser?.displayName || '');
  const [avatar, setAvatar] = useState(effectiveUser?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message: string;
  }>({ checking: false, message: '' });

  // Realtime username check
  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean.length < 3) {
      setUsernameStatus({ checking: false, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean);
      if (res.available) {
        setUsernameStatus({
          checking: false,
          available: true,
          message: '✅ Username Available',
        });
      } else {
        setUsernameStatus({
          checking: false,
          available: false,
          message: '❌ Username Already Taken',
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.8);
      setAvatar(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUser) {
      setErrorMsg('No active user session found.');
      return;
    }

    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (!usernameStatus.available) {
      setErrorMsg('Please choose an available username.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await reserveUsernameAndCreateProfile(
        effectiveUser,
        cleanUser,
        fullName.trim(),
        effectiveUser.phoneNumber || undefined,
        avatar || undefined
      );
      setIsNewGoogleUser(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete profile setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col justify-between p-6 text-zinc-900 dark:text-white overflow-y-auto">
      <div>
        {/* Top Branding */}
        <div className="flex flex-col items-center text-center pt-2 mb-6">
          <BizmunityLogo size="lg" className="mb-3" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Claim Your Username
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Every Bizmunity member has a globally unique @username for mentions, circles, and profile identity.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-2">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-orange-500/50 overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 group-hover:border-orange-500 transition">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-zinc-400">
                    <Camera className="w-5 h-5 text-orange-500" />
                    <span className="text-[9px] font-semibold">Photo</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            <span className="text-[10px] text-zinc-400 mt-1">Optional profile photo</span>
          </div>

          {/* Username Input with Live Availability */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Choose Unique Username
              </label>
              <span className="text-[10px] text-zinc-400">e.g. @aryan, @founder</span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-xs font-bold text-zinc-400">@</div>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="aryan, founder, bizmunity"
                className="w-full pl-8 pr-10 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
              {usernameStatus.checking && (
                <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400 animate-spin" />
              )}
            </div>

            {/* Realtime Feedback */}
            {usernameStatus.message && (
              <div
                className={`mt-2 p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  usernameStatus.available
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                }`}
              >
                <span>{usernameStatus.message}</span>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aryan Tiwari"
                className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !usernameStatus.available}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2 text-xs mt-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Enter Bizmunity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-4 text-center text-[11px] text-zinc-400">
        You can update your bio and business details anytime in Settings.
      </div>
    </div>
  );
};
