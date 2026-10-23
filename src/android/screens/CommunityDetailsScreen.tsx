import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Users,
  Shield,
  Settings,
  Trash2,
  Tag,
  Calendar,
  QrCode,
  Share2,
  Download,
  Bookmark,
  Check,
  X,
  Award,
  Sparkles,
  Flame,
  Plus,
  RefreshCw,
  Info,
  CheckCircle2,
  Scan,
  Camera,
  Globe,
  Phone,
  MapPin,
  Store,
  ChevronDown,
  Loader2,
  Coins,
} from 'lucide-react';
import { Community, Post, Offer, Reward, EventItem, CheckInMilestone, CheckInSettings } from '../../types/bizmunity';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  joinCommunity,
  leaveCommunity,
  deleteCommunity,
  updateCommunity,
  updateCommunityCheckInSettings,
  regenerateCommunityCheckInCode,
} from '../../firebase/firestoreService';

const SETTINGS_CATEGORIES = [
  'Food & Beverages',
  'Tech & Startups',
  'Creators & Media',
  'Retail & E-commerce',
  'Local Business',
  'Health & Fitness',
  'Finance & Crypto',
  'Music & Entertainment',
  'Education & Learning',
  'Gaming & Esports',
];

interface CommunityDetailsScreenProps {
  community: Community;
  posts: Post[];
  offers?: Offer[];
  rewards?: Reward[];
  events?: EventItem[];
  isJoined: boolean;
  onGoBack: () => void;
  onOpenCreatePost: () => void;
  onOpenScanner?: () => void;
  onOpenAuth: () => void;
}

export const CommunityDetailsScreen: React.FC<CommunityDetailsScreenProps> = ({
  community,
  posts,
  offers = [],
  rewards = [],
  events = [],
  isJoined,
  onGoBack,
  onOpenCreatePost,
  onOpenScanner,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'posts' | 'deals' | 'rewards' | 'events' | 'about'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'rewards' | 'members' | 'more'>('general');
  const [editName, setEditName] = useState(community.name);
  const [editDesc, setEditDesc] = useState(community.description);
  const [editRules, setEditRules] = useState(community.rules || '');
  const [editLogo, setEditLogo] = useState(community.logoUrl || '');
  const [editCover, setEditCover] = useState(community.coverUrl || '');
  const [editCategory, setEditCategory] = useState(community.category || 'Food & Beverages');
  const [editLocation, setEditLocation] = useState(community.location || '');
  const [editWebsite, setEditWebsite] = useState(community.website || '');
  const [editPhone, setEditPhone] = useState(community.phone || '');
  const [savingSettings, setSavingSettings] = useState(false);

  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  // Check-In Settings State
  const defaultMilestones: CheckInMilestone[] = community.checkInSettings?.milestones || [
    { day: 3, reward: '30 Bonus Points', bonusPoints: 30 },
    { day: 5, reward: 'Free Coffee' },
    { day: 10, reward: '100 Bonus Points', bonusPoints: 100 },
    { day: 15, reward: '20% Discount' },
    { day: 30, reward: 'Premium Founder Perk', bonusPoints: 200 },
  ];

  const [checkInEnabled, setCheckInEnabled] = useState(community.checkInSettings?.enabled ?? true);
  const [checkInPoints, setCheckInPoints] = useState(community.checkInSettings?.pointsPerCheckIn ?? 10);
  const [streakProtection, setStreakProtection] = useState(community.checkInSettings?.streakProtection ?? false);
  const [milestones, setMilestones] = useState<CheckInMilestone[]>(defaultMilestones);
  const [newMilestoneDay, setNewMilestoneDay] = useState(7);
  const [newMilestoneReward, setNewMilestoneReward] = useState('');
  const [newMilestoneBonus, setNewMilestoneBonus] = useState(0);

  // QR modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState<'community' | 'checkin'>('community');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [localCheckInCode, setLocalCheckInCode] = useState(
    community.checkInSettings?.checkInCode || `CHK_${community.id.substring(0, 6).toUpperCase()}_01`
  );
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const isOwner = currentUser?.uid === community.ownerId;
  const communityPosts = posts.filter((p) => p.communityId === community.id);
  const communityOffers = offers.filter(
    (o) => o.communityId === community.id || o.communityName === community.name
  );
  const communityRewards = rewards.filter(
    (r) => r.communityId === community.id || r.communityName === community.name
  );
  const communityEvents = events.filter((e) => e.communityId === community.id);

  // Generate QR Code
  useEffect(() => {
    if (!showQRModal) return;

    const generateQR = async () => {
      try {
        let payload = '';

        if (qrType === 'community') {
          payload = JSON.stringify({
            type: 'community',
            communityId: community.id,
            name: community.name,
            handle: community.handle,
            url: `bizmunity://community/${community.id}`,
            timestamp: Date.now(),
          });
        } else {
          payload = JSON.stringify({
            type: 'checkin',
            communityId: community.id,
            name: community.name,
            checkInCode: localCheckInCode,
            pointsPerCheckIn: checkInPoints,
            timestamp: Date.now(),
          });
        }

        const url = await QRCode.toDataURL(payload, {
          width: 500,
          margin: 2,
          color: {
            dark: '#0A1C3E',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR:', err);
      }
    };

    generateQR();
  }, [showQRModal, qrType, community, localCheckInCode, checkInPoints]);

  const handleToggleJoin = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (isJoined) {
      await leaveCommunity(community.id);
    } else {
      await joinCommunity(community.id, community.name);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete community "${community.name}"? This cannot be undone.`)) {
      await deleteCommunity(community.id);
      onGoBack();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.9);
      setEditLogo(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 675, 0.85);
      setEditCover(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    setSavingSettings(true);
    try {
      const updatedSettings: CheckInSettings = {
        enabled: checkInEnabled,
        pointsPerCheckIn: Number(checkInPoints) || 10,
        streakProtection,
        milestones,
        checkInCode: localCheckInCode,
      };

      await updateCommunity(community.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        rules: editRules.trim(),
        category: editCategory,
        logoUrl: editLogo,
        coverUrl: editCover,
        location: editLocation.trim() || undefined,
        website: editWebsite.trim() || undefined,
        phone: editPhone.trim() || undefined,
        checkInSettings: updatedSettings,
      });

      // Update in-memory community object
      community.name = editName.trim();
      community.description = editDesc.trim();
      community.rules = editRules.trim();
      community.category = editCategory;
      community.logoUrl = editLogo;
      community.coverUrl = editCover;
      community.location = editLocation.trim();
      community.website = editWebsite.trim();
      community.phone = editPhone.trim();
      community.checkInSettings = updatedSettings;

      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update community settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestoneReward.trim() || newMilestoneDay <= 0) return;
    const updated = [
      ...milestones.filter((m) => m.day !== newMilestoneDay),
      {
        day: Number(newMilestoneDay),
        reward: newMilestoneReward.trim(),
        bonusPoints: Number(newMilestoneBonus) || undefined,
      },
    ].sort((a, b) => a.day - b.day);

    setMilestones(updated);
    setNewMilestoneReward('');
    setNewMilestoneBonus(0);
    setNewMilestoneDay(Number(newMilestoneDay) + 5);
  };

  const handleRemoveMilestone = (day: number) => {
    setMilestones(milestones.filter((m) => m.day !== day));
  };

  const handleRegenerateCheckIn = async () => {
    if (confirm('Regenerate Check-In QR? Any previously printed QR will no longer be valid.')) {
      setRegenerating(true);
      try {
        const code = await regenerateCommunityCheckInCode(community.id);
        setLocalCheckInCode(code);
      } catch (err: any) {
        alert(err.message || 'Failed to regenerate code');
      } finally {
        setRegenerating(false);
      }
    }
  };

  const handleShareQR = async () => {
    const text =
      qrType === 'community'
        ? `Join ${community.name} on Bizmunity! Scan or open: bizmunity://community/${community.id}`
        : `Check in at ${community.name} to earn daily streak rewards and bonus points! Scan QR in Bizmunity.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: community.name,
          text,
          url: window.location.href,
        });
      } catch (err) {
        console.warn(err);
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `bizmunity_${community.handle}_${qrType}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveQR = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white select-none">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        {/* Top Android App Bar */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
          <button
            onClick={() => setIsEditing(false)}
            className="p-1.5 -ml-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-xs tracking-tight text-zinc-900 dark:text-white">
            Community Settings
          </h2>
          <div className="w-6" />
        </div>

        {/* Tabs: [General] [Rewards] [Members] [More] (Matches frame 8) */}
        <div className="flex p-2 bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 gap-1.5">
          {(['general', 'rewards', 'members', 'more'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSettingsTab(t)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                settingsTab === t
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-20 space-y-4">
          {settingsTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              {/* Visual Header with Cover and Logo (Matches frame 8) */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-800">
                <div className="h-32 w-full relative">
                  <img
                    src={editCover || community.coverUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=675&fit=crop'}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-zinc-900/90 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                    title="Change Banner"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logo with Change Logo Button */}
              <div className="flex items-center gap-3 pt-1">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-full border-2 border-white dark:border-zinc-900 shadow-md overflow-hidden cursor-pointer shrink-0"
                >
                  <img
                    src={editLogo || community.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${community.handle}`}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-500" />
                    <span>Change Logo</span>
                  </button>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Square PNG or JPG recommended</span>
                </div>
              </div>

              {/* Community Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Community Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-900 dark:text-white"
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Username
                </label>
                <input
                  type="text"
                  readOnly
                  value={`@${community.handle}`}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 text-xs font-mono text-zinc-500 cursor-not-allowed"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Category
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none">
                    <Store className="w-4 h-4" />
                  </div>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-900 dark:text-white appearance-none"
                  >
                    {SETTINGS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs leading-relaxed text-zinc-900 dark:text-white resize-none"
                />
              </div>

              {/* Action Buttons: Save Changes & Delete Community (Matches frame 8) */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingSettings}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full py-3 px-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-100/50 transition active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Community</span>
                </button>
              </div>
            </div>
          )}

          {settingsTab === 'rewards' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    Daily Check-In Rewards
                  </h4>
                  <p className="text-[10px] text-zinc-500">Reward customers for daily store visits</p>
                </div>
                <input
                  type="checkbox"
                  checked={checkInEnabled}
                  onChange={(e) => setCheckInEnabled(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 rounded"
                />
              </div>

              {checkInEnabled && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Points Per Check-In
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={checkInPoints}
                      onChange={(e) => setCheckInPoints(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 font-bold text-xs text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Streak Protection</h4>
                      <p className="text-[10px] text-zinc-500">Allow 1 day miss without breaking streak</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={streakProtection}
                      onChange={(e) => setStreakProtection(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                      Milestone Rewards ({milestones.length})
                    </span>
                    {milestones.map((m) => (
                      <div
                        key={m.day}
                        className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs"
                      >
                        <span className="font-extrabold text-orange-600">Day {m.day}</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
                          {m.reward} {m.bonusPoints ? `(+${m.bonusPoints} pts)` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(m.day)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-1.5 items-center pt-1">
                      <input
                        type="number"
                        placeholder="Day"
                        value={newMilestoneDay}
                        onChange={(e) => setNewMilestoneDay(Number(e.target.value))}
                        className="w-16 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Reward title"
                        value={newMilestoneReward}
                        onChange={(e) => setNewMilestoneReward(e.target.value)}
                        className="flex-1 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddMilestone}
                        className="px-3 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingSettings}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          )}

          {settingsTab === 'members' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Community Members</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <span className="block font-black text-sm text-zinc-900 dark:text-white">{community.memberCount || 1}</span>
                    <span className="text-[10px] text-zinc-400">Total Members</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <span className="block font-black text-sm text-zinc-900 dark:text-white">{community.followerCount || 0}</span>
                    <span className="text-[10px] text-zinc-400">Followers</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs">
                    {community.ownerName?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{community.ownerName || 'Founder'}</span>
                    <span className="text-[10px] text-orange-500 font-semibold">Community Owner & Admin</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'more' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Community Rules & Guidelines
                </label>
                <textarea
                  rows={3}
                  value={editRules}
                  onChange={(e) => setEditRules(e.target.value)}
                  placeholder="• Be respectful&#10;• No spam&#10;• Business only"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs leading-relaxed text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Contact & Location</span>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3" />
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location / Address"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs"
                  />
                </div>
                <div className="relative flex items-center">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3" />
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="Website URL"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs"
                  />
                </div>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs"
                  />
                </div>
              </div>

              {/* QR settings */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Check-In QR Code</span>
                  <button
                    type="button"
                    onClick={handleRegenerateCheckIn}
                    disabled={regenerating}
                    className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate Code</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">Current code: <code className="font-mono text-zinc-600 dark:text-zinc-300">{localCheckInCode}</code></p>
              </div>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingSettings}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top Android App Bar */}
      <div className="h-12 px-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 z-20">
        <button onClick={onGoBack} className="p-1 text-zinc-600 dark:text-zinc-300">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="font-bold text-xs truncate max-w-[200px] text-zinc-900 dark:text-white">
          @{community.handle}
        </span>

        <div className="flex items-center gap-1">
          {/* QR Button */}
          <button
            onClick={() => {
              setQrType('community');
              setShowQRModal(true);
            }}
            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 rounded-lg"
            title="Community QR Codes"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Community Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Scrollable View */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Cover image banner */}
        <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 relative">
          {community.coverUrl && (
            <img src={community.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Details Container */}
        <div className="px-4 pb-4 relative bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-zinc-950 bg-orange-500 text-white flex items-center justify-center font-bold text-xl overflow-hidden shadow-md">
              {community.logoUrl ? (
                <img src={community.logoUrl} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                community.name.charAt(0)
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQrType('community');
                  setShowQRModal(true);
                }}
                className="px-3 py-2 border border-orange-500/30 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
              >
                <QrCode className="w-4 h-4" /> QR
              </button>
              <button
                onClick={handleToggleJoin}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  isJoined
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-500/25'
                }`}
              >
                {isJoined ? 'Joined' : '+ Join Community'}
              </button>
            </div>
          </div>

          <h1 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
            {community.name}
            {community.verified && <Shield className="w-4 h-4 text-orange-500 fill-orange-500/20" />}
          </h1>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
            <span className="font-mono text-orange-600 dark:text-orange-400">@{community.handle}</span>
            <span>•</span>
            <span className="capitalize">{community.category || 'Business'}</span>
          </div>

          {community.description && (
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">
              {community.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span>
              <strong className="text-zinc-900 dark:text-white">{community.memberCount || 1}</strong> members
            </span>
            <span>
              <strong className="text-zinc-900 dark:text-white">{communityPosts.length}</strong> posts
            </span>
            <span>
              <strong className="text-orange-600 dark:text-orange-400 font-bold">{communityOffers.length}</strong> deals
            </span>
          </div>
        </div>

        {/* Tab Navigation: Posts, Deals/Coupons, Rewards, Events, About */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTab('posts')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              tab === 'posts'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Posts ({communityPosts.length})
          </button>
          <button
            onClick={() => setTab('deals')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              tab === 'deals'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Offers ({communityOffers.length})
          </button>
          <button
            onClick={() => setTab('rewards')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              tab === 'rewards'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Rewards ({communityRewards.length})
          </button>
          <button
            onClick={() => setTab('events')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              tab === 'events'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Events ({communityEvents.length})
          </button>
          <button
            onClick={() => setTab('about')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1 ${
              tab === 'about'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </div>

        {/* Tab 1: Posts */}
        {tab === 'posts' && (
          <div className="p-4 space-y-3">
            <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                Share an announcement in this circle
              </span>
              <button
                onClick={currentUser ? onOpenCreatePost : onOpenAuth}
                className="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                + Post
              </button>
            </div>

            {communityPosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No posts in this community yet. Be the first to share an announcement!
              </div>
            ) : (
              communityPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">{post.authorName}</span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{post.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Deals & Offers */}
        {tab === 'deals' && (
          <div className="p-4 space-y-3">
            {communityOffers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <Tag className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                No active offers for this circle right now. Check back soon!
              </div>
            ) : (
              communityOffers.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-600">
                      {deal.discountPercent}% OFF
                    </span>
                    <span className="text-[10px] text-zinc-400">Exp: {deal.expiresAt}</span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{deal.title}</h3>
                  <p className="text-xs text-zinc-500">{deal.description}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                    <span className="font-mono text-xs font-bold text-orange-600">{deal.code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(deal.code);
                        alert(`Copied discount code ${deal.code}!`);
                      }}
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold"
                    >
                      Use Offer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Rewards */}
        {tab === 'rewards' && (
          <div className="p-4 space-y-3">
            {communityRewards.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <Award className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                No rewards catalog created for this business yet.
              </div>
            ) : (
              communityRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
                      {reward.badge || 'Perk'}
                    </span>
                    <span className="font-bold text-sm text-orange-600">{reward.pointsCost} PTS</span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{reward.title}</h3>
                  <p className="text-xs text-zinc-500">{reward.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Events */}
        {tab === 'events' && (
          <div className="p-4 space-y-3">
            {communityEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                No upcoming events scheduled for this circle.
              </div>
            ) : (
              communityEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{event.date}</span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{event.title}</h3>
                  <p className="text-xs text-zinc-500">{event.description}</p>
                  <div className="text-[11px] text-zinc-400">📍 {event.location}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: About & Check-In Rewards Info */}
        {tab === 'about' && (
          <div className="p-4 space-y-4 text-xs">
            {/* About Card */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">About {community.name}</h4>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {community.description || 'Welcome to our circle!'}
              </p>
              <div className="pt-2 text-[11px] text-zinc-500">
                <strong>Rules:</strong> {community.rules || 'Be supportive and respectful.'}
              </div>
            </div>

            {/* Daily Check-In Rewards Schedule */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  Daily Visit Streak Rewards
                </h4>
                <span className="text-[10px] font-bold text-orange-600">
                  +{community.checkInSettings?.pointsPerCheckIn || 10} pts / visit
                </span>
              </div>

              <p className="text-[11px] text-zinc-500">
                Visit this business, scan their Check-In QR, and earn streak points and milestone gifts!
              </p>

              <div className="space-y-1.5">
                {(community.checkInSettings?.milestones || defaultMilestones).map((m) => (
                  <div
                    key={m.day}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-[11px]"
                  >
                    <span className="font-extrabold text-orange-600">Day {m.day}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{m.reward}</span>
                  </div>
                ))}
              </div>

              {isOwner && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 border border-orange-500/30 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition"
                >
                  Customize Check-In Rewards
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Community QR & Check-In QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-orange-500" />
                  {qrType === 'community' ? 'Community QR' : 'Check-In QR'}
                </h3>
                <p className="text-[10px] text-zinc-500">{community.name}</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle QR Type (Community vs Check-In) for owners */}
            {isOwner && (
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setQrType('community')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    qrType === 'community'
                      ? 'bg-white dark:bg-zinc-900 text-orange-600 shadow-sm'
                      : 'text-zinc-500'
                  }`}
                >
                  Community QR
                </button>
                <button
                  type="button"
                  onClick={() => setQrType('checkin')}
                  className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                    qrType === 'checkin'
                      ? 'bg-white dark:bg-zinc-900 text-orange-600 shadow-sm'
                      : 'text-zinc-500'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Check-In QR
                </button>
              </div>
            )}

            {/* Generated QR Code Card */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-inner flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 object-contain" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-zinc-400 text-xs">
                  Generating QR...
                </div>
              )}
              <span className="text-[11px] font-bold text-zinc-900 mt-2">
                {qrType === 'community' ? `@${community.handle}` : 'Store Check-In'}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">
                {qrType === 'community'
                  ? `bizmunity://community/${community.id}`
                  : `bizmunity://checkin/${community.id}`}
              </span>
            </div>

            {/* Action Buttons: Share, Download, Save, Scan */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={handleShareQR}
                className="py-2.5 px-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex flex-col items-center gap-1 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-orange-500" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={handleDownloadQR}
                className="py-2.5 px-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex flex-col items-center gap-1 transition"
              >
                <Download className="w-4 h-4 text-orange-500" />
                <span className="text-[10px]">Download</span>
              </button>

              <button
                onClick={handleSaveQR}
                className="py-2.5 px-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex flex-col items-center gap-1 transition"
              >
                {saved ? <Check className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4 text-orange-500" />}
                <span className="text-[10px]">{saved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={() => {
                  setShowQRModal(false);
                  onOpenScanner?.();
                }}
                className="py-2.5 px-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-xs font-bold text-white flex flex-col items-center gap-1 shadow-md shadow-orange-500/25 transition active:scale-95"
              >
                <Scan className="w-4 h-4" />
                <span className="text-[10px]">Scan</span>
              </button>
            </div>

            {/* Regenerate Check-In QR (for owners on checkin tab) */}
            {isOwner && qrType === 'checkin' && (
              <button
                onClick={handleRegenerateCheckIn}
                disabled={regenerating}
                className="w-full py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-500 flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Check-In QR</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
