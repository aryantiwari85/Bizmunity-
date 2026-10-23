import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Share2,
  Download,
  Bookmark,
  Scan,
  Check,
  Building2,
  QrCode,
  User,
  ChevronDown,
  Plus,
  RefreshCw,
  Sparkles,
  Flame,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BizmunityLogo } from './BizmunityLogo';
import { Community } from '../types/bizmunity';
import { regenerateCommunityCheckInCode } from '../firebase/firestoreService';

interface UserQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
  onOpenAuth?: () => void;
  onCreateNewCommunity?: () => void;
  userCommunities?: Community[];
}

export const UserQRCodeModal: React.FC<UserQRCodeModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
  onOpenAuth,
  onCreateNewCommunity,
  userCommunities = [],
}) => {
  const { currentUser, userProfile } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'community' | 'checkin'>('profile');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [showCommunityPicker, setShowCommunityPicker] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [localCheckInCode, setLocalCheckInCode] = useState<string>('');

  const hasCommunities = userCommunities.length > 0;

  // Set default community when communities are available
  useEffect(() => {
    if (userCommunities.length > 0) {
      if (!selectedCommunityId || !userCommunities.some((c) => c.id === selectedCommunityId)) {
        setSelectedCommunityId(userCommunities[0].id);
      }
    } else {
      setSelectedCommunityId('');
      if (activeTab !== 'profile') {
        setActiveTab('profile');
      }
    }
  }, [userCommunities, selectedCommunityId, activeTab]);

  const selectedCommunity = userCommunities.find((c) => c.id === selectedCommunityId) || userCommunities[0] || null;

  // Keep local check-in code in sync with selected community
  useEffect(() => {
    if (selectedCommunity) {
      setLocalCheckInCode(
        selectedCommunity.checkInSettings?.checkInCode ||
          `CHK_${selectedCommunity.id.substring(0, 6).toUpperCase()}_01`
      );
    }
  }, [selectedCommunity]);

  // Generate QR Code based on active tab and settings
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const generate = async () => {
      try {
        let payload = '';

        if (activeTab === 'profile') {
          // 1. MY PROFILE QR
          payload = JSON.stringify({
            type: 'user',
            userId: currentUser.uid,
            username: userProfile?.username || 'member',
            name: userProfile?.name || currentUser.displayName || 'Bizmunity Member',
            profileRef: `bizmunity://user/${currentUser.uid}`,
            timestamp: Date.now(),
          });
        } else if (activeTab === 'community' && selectedCommunity) {
          // 2. MY COMMUNITY QR
          payload = JSON.stringify({
            type: 'community',
            communityId: selectedCommunity.id,
            name: selectedCommunity.name,
            handle: selectedCommunity.handle,
            url: `bizmunity://community/${selectedCommunity.id}`,
            timestamp: Date.now(),
          });
        } else if (activeTab === 'checkin' && selectedCommunity) {
          // 3. CHECK-IN QR
          const code =
            localCheckInCode ||
            selectedCommunity.checkInSettings?.checkInCode ||
            `CHK_${selectedCommunity.id.substring(0, 6).toUpperCase()}_01`;

          payload = JSON.stringify({
            type: 'checkin',
            communityId: selectedCommunity.id,
            name: selectedCommunity.name,
            checkInCode: code,
            pointsPerCheckIn: selectedCommunity.checkInSettings?.pointsPerCheckIn || 10,
            timestamp: Date.now(),
          });
        }

        if (!payload) return;

        const url = await QRCode.toDataURL(payload, {
          width: 600,
          margin: 2,
          color: {
            dark: '#0A1C3E', // Bizmunity navy
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generate();
  }, [isOpen, currentUser, userProfile, activeTab, selectedCommunity, localCheckInCode]);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 mx-auto flex items-center justify-center">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-black text-lg text-zinc-900 dark:text-white">Your Permanent Personal QR</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Sign in to view, share, download, and scan personal, community, and check-in QR codes.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenAuth?.();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 text-xs active:scale-95 transition"
            >
              Sign In to View QR
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Actions
  const handleShare = async () => {
    let text = '';
    if (activeTab === 'profile') {
      text = `Connect with @${userProfile?.username || 'member'} on Bizmunity! Scan my QR or visit: bizmunity://user/${currentUser.uid}`;
    } else if (activeTab === 'community' && selectedCommunity) {
      text = `Join ${selectedCommunity.name} (@${selectedCommunity.handle}) on Bizmunity! Scan or open: bizmunity://community/${selectedCommunity.id}`;
    } else if (activeTab === 'checkin' && selectedCommunity) {
      text = `Check in at ${selectedCommunity.name} to earn daily streak rewards and bonus points! Scan QR code in Bizmunity.`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bizmunity QR',
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

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    let fileName = `bizmunity_${userProfile?.username || 'user'}_profile_qr.png`;
    if (activeTab === 'community' && selectedCommunity) {
      fileName = `bizmunity_${selectedCommunity.handle}_community_qr.png`;
    } else if (activeTab === 'checkin' && selectedCommunity) {
      fileName = `bizmunity_${selectedCommunity.handle}_checkin_qr.png`;
    }
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRegenerateCheckIn = async () => {
    if (!selectedCommunity) return;
    if (
      confirm(
        `Regenerate Check-In QR for "${selectedCommunity.name}"? Previous printed QR codes will no longer work.`
      )
    ) {
      setRegenerating(true);
      try {
        const newCode = await regenerateCommunityCheckInCode(selectedCommunity.id);
        setLocalCheckInCode(newCode);
      } catch (err: any) {
        alert(err.message || 'Failed to regenerate code');
      } finally {
        setRegenerating(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                Bizmunity QR Hub
              </h2>
              <p className="text-[10px] text-zinc-400">
                {activeTab === 'profile'
                  ? 'Permanent Profile QR'
                  : activeTab === 'community'
                  ? 'Community Hub QR'
                  : 'Customer Check-In QR'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Only 3 QR types */}
        {hasCommunities && (
          <div className="p-2 bg-zinc-100 dark:bg-zinc-950 flex gap-1 border-b border-zinc-200 dark:border-zinc-800/80">
            {/* Tab 1: Profile QR */}
            <button
              onClick={() => {
                setActiveTab('profile');
                setShowCommunityPicker(false);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>

            {/* Tab 2: Community QR */}
            <button
              onClick={() => {
                setActiveTab('community');
                setShowCommunityPicker(false);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'community'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>

            {/* Tab 3: Check-In QR */}
            <button
              onClick={() => {
                setActiveTab('checkin');
                setShowCommunityPicker(false);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'checkin'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Check-In</span>
            </button>
          </div>
        )}

        {/* Scrollable Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* COMMUNITY SELECTOR (Google Pay / PhonePe style) for Community & Check-In tabs */}
          {(activeTab === 'community' || activeTab === 'checkin') && selectedCommunity && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
                  Current Community
                </span>
                {userCommunities.length > 1 && (
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                    ▼ {selectedCommunity.name}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => userCommunities.length > 1 && setShowCommunityPicker(!showCommunityPicker)}
                className={`w-full p-2.5 rounded-2xl border transition flex items-center justify-between text-left ${
                  userCommunities.length > 1
                    ? 'bg-zinc-50 dark:bg-zinc-800/80 border-orange-500/30 hover:border-orange-500 cursor-pointer shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 cursor-default'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                    {selectedCommunity.logoUrl ? (
                      <img
                        src={selectedCommunity.logoUrl}
                        alt={selectedCommunity.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedCommunity.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs block text-zinc-900 dark:text-white truncate">
                      {selectedCommunity.name}
                    </span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono">
                      @{selectedCommunity.handle}
                    </span>
                  </div>
                </div>

                {userCommunities.length > 1 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg">
                    <span>Change</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        showCommunityPicker ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                )}
              </button>

              {/* Google Pay / PhonePe Dropdown Account Selection Modal / Menu */}
              {showCommunityPicker && userCommunities.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl z-30 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <span className="text-[10px] font-bold text-zinc-400 px-2 py-1 block">
                    Tap to change:
                  </span>
                  {userCommunities.map((comm) => {
                    const isSelected = comm.id === selectedCommunity.id;
                    return (
                      <button
                        key={comm.id}
                        type="button"
                        onClick={() => {
                          setSelectedCommunityId(comm.id);
                          setShowCommunityPicker(false);
                        }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition ${
                          isSelected
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-xs font-bold w-3.5 text-center shrink-0 ${
                              isSelected ? 'text-orange-600 dark:text-orange-400' : 'opacity-0'
                            }`}
                          >
                            ✓
                          </span>
                          <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                            {comm.logoUrl ? (
                              <img src={comm.logoUrl} alt={comm.name} className="w-full h-full object-cover" />
                            ) : (
                              comm.name.charAt(0)
                            )}
                          </div>
                          <span className="text-xs truncate">{comm.name}</span>
                        </div>
                        {isSelected && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold px-1.5 py-0.5 rounded bg-orange-500/10">Active</span>}
                      </button>
                    );
                  })}

                  {onCreateNewCommunity && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommunityPicker(false);
                        onClose();
                        onCreateNewCommunity();
                      }}
                      className="w-full mt-1 pt-2 border-t border-zinc-200 dark:border-zinc-700 p-2 text-xs font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Community</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QR Display Card */}
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Top Badge for QR Type */}
            <div className="mb-2">
              {activeTab === 'profile' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  Personal Profile QR
                </span>
              )}
              {activeTab === 'community' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  Community Profile QR
                </span>
              )}
              {activeTab === 'checkin' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-emerald-500" /> Daily Check-In QR
                </span>
              )}
            </div>

            {/* Rendered QR Image */}
            <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-zinc-100">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
                />
              ) : (
                <div className="w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center text-xs text-zinc-400">
                  Generating QR...
                </div>
              )}

              {/* Center Logo Pill */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-white shadow-md border border-zinc-200 flex items-center justify-center overflow-hidden">
                  {activeTab === 'profile' ? (
                    userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <BizmunityLogo size="sm" showText={false} />
                    )
                  ) : selectedCommunity?.logoUrl ? (
                    <img
                      src={selectedCommunity.logoUrl}
                      alt={selectedCommunity.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BizmunityLogo size="sm" showText={false} />
                  )}
                </div>
              </div>
            </div>

            {/* Target Details */}
            <div className="mt-3">
              <h3 className="font-extrabold text-sm text-zinc-900">
                {activeTab === 'profile'
                  ? userProfile?.name || currentUser.displayName || 'Bizmunity Member'
                  : selectedCommunity?.name || 'Community'}
              </h3>
              <p className="text-xs text-orange-600 font-mono font-bold">
                @{activeTab === 'profile' ? userProfile?.username || 'member' : selectedCommunity?.handle || 'circle'}
              </p>
            </div>
          </div>

          {/* Description & Scanning Instructions */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
            {activeTab === 'profile' && (
              <>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Scanning this QR opens your profile:
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  • Profile details & stats • Follow & Direct Message • Communities you've joined • Public posts
                </p>
              </>
            )}

            {activeTab === 'community' && (
              <>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Scanning this QR opens your community:
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  • Community profile • +Join circle • Posts, offers, events & rewards catalog
                </p>
              </>
            )}

            {activeTab === 'checkin' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Customer Daily Check-In
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    +{selectedCommunity?.checkInSettings?.pointsPerCheckIn || 10} pts/day
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Print or display this at your store counter. Customers scan to check in, build streaks, and unlock your milestone rewards. This QR never changes unless regenerated.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons: Share, Download, Save, Scan (+ Regenerate for Check-In) */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {/* 1. Share */}
            <button
              onClick={handleShare}
              className="py-2.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex flex-col items-center gap-1 transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-orange-500" />}
              <span className="text-[10px]">{copied ? 'Copied' : 'Share'}</span>
            </button>

            {/* 2. Download */}
            <button
              onClick={handleDownload}
              className="py-2.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex flex-col items-center gap-1 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-orange-500" />
              <span className="text-[10px]">Download</span>
            </button>

            {/* 3. Save */}
            <button
              onClick={handleSave}
              className="py-2.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex flex-col items-center gap-1 transition active:scale-95"
            >
              {savedSuccess ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Bookmark className="w-4 h-4 text-orange-500" />
              )}
              <span className="text-[10px]">{savedSuccess ? 'Saved' : 'Save'}</span>
            </button>

            {/* 4. Scan */}
            <button
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="py-2.5 px-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-2xl text-xs font-bold text-white flex flex-col items-center gap-1 shadow-md shadow-orange-500/25 transition active:scale-95"
            >
              <Scan className="w-4 h-4" />
              <span className="text-[10px]">Scan</span>
            </button>
          </div>

          {/* Regenerate Check-In QR (only on checkin tab for owners) */}
          {activeTab === 'checkin' && selectedCommunity && (
            <button
              onClick={handleRegenerateCheckIn}
              disabled={regenerating}
              className="w-full py-2 px-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Check-In QR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
