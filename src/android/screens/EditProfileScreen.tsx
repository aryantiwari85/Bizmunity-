import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../firebase/authService';
import { compressImage } from '../../utils/imageCompressor';

interface EditProfileScreenProps {
  onSuccess: () => void;
  onGoBack: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onSuccess, onGoBack }) => {
  const { currentUser, userProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 350, 350, 0.85);
      setAvatar(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await updateUserProfile(currentUser.uid, {
        name,
        bio,
        phone,
        avatar,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top App Bar */}
      <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <button onClick={onGoBack} className="p-1 text-zinc-600 dark:text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-xs">Edit Profile</h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs pb-16">
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Avatar Picker */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-orange-500 shadow-sm flex items-center justify-center text-xl font-bold text-orange-600">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0) || 'U'
              )}
            </div>

            <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-orange-600 text-white cursor-pointer shadow-md hover:bg-orange-700">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <span className="text-[11px] text-zinc-400 mt-2">Tap to change avatar</span>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
            Username (Permanent)
          </label>
          <input
            type="text"
            disabled
            value={`@${userProfile?.username || 'member'}`}
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-mono"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-zinc-600 dark:text-zinc-400">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
            Bio / Headline
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow founders what you do..."
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-zinc-600 dark:text-zinc-400">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
};
