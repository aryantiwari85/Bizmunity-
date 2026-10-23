import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Users,
  Building2,
  Store,
  Gift,
  Coins,
  Shield,
  ShieldCheck,
  User,
  Ban,
  MessageSquare,
  Plus,
  Trash2,
  Rocket,
  QrCode,
  MapPin,
  Globe,
  Phone,
  Layers,
  ChevronDown,
  Info,
  X,
  Flame,
  Award,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { createCommunity, checkCommunityHandleAvailable } from '../../firebase/firestoreService';
import { compressImage } from '../../utils/imageCompressor';
import { CheckInMilestone, Community } from '../../types/bizmunity';

interface CreateCommunityScreenProps {
  onSuccess: (communityId?: string) => void;
  onGoBack: () => void;
}

const CATEGORIES = [
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

const PRESET_LOGOS = [
  {
    name: 'Coffee Cup',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop',
  },
  {
    name: 'Modern Tech',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop',
  },
  {
    name: 'Fitness Gym',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop',
  },
  {
    name: 'Boutique Store',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
  },
  {
    name: 'Art & Studio',
    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300&h=300&fit=crop',
  },
];

const PRESET_BANNERS = [
  {
    name: 'Café Ambient',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=675&fit=crop',
  },
  {
    name: 'Tech Space',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=675&fit=crop',
  },
  {
    name: 'Lounge Bar',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop',
  },
  {
    name: 'Store Front',
    url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=675&fit=crop',
  },
  {
    name: 'Neon Glow',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=675&fit=crop',
  },
];

const DEFAULT_RULES = [
  { id: '1', icon: 'user', text: 'Be respectful to everyone' },
  { id: '2', icon: 'ban', text: 'No spam or irrelevant content' },
  { id: '3', icon: 'shield', text: 'Keep it business and community related' },
  { id: '4', icon: 'chat', text: 'Feel free to share reviews and suggestions' },
];

export const CreateCommunityScreen: React.FC<CreateCommunityScreenProps> = ({
  onSuccess,
  onGoBack,
}) => {
  // Navigation Flow State
  // 0: Welcome Screen
  // 1: Step 1 - Basic Information
  // 2: Step 2 - Visual Branding
  // 3: Step 3 - About Your Community
  // 4: Step 4 - Check-In Rewards
  // 5: Review & Launch
  // 6: Success Screen
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form Fields - Preserved across Back / Next
  const [name, setName] = useState('Brew Lab');
  const [handle, setHandle] = useState('brew_lab');
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Handle Availability State
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('available');
  const [handleCheckedValue, setHandleCheckedValue] = useState('');

  // Branding Fields
  const [logo, setLogo] = useState(PRESET_LOGOS[0].url);
  const [cover, setCover] = useState(PRESET_BANNERS[0].url);

  // Step 3: About & Guidelines
  const [desc, setDesc] = useState(
    'A cozy café community for coffee lovers. Share your experiences, discover new flavors, get exclusive offers and be part of our growing Brew Lab family.'
  );
  const [rulesList, setRulesList] = useState<{ id: string; icon: string; text: string }[]>(DEFAULT_RULES);
  const [newRuleText, setNewRuleText] = useState('');
  const [showAddRuleInput, setShowAddRuleInput] = useState(false);
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');

  // Step 4: Loyalty & Check-in Rewards
  const [enableCheckIn, setEnableCheckIn] = useState(true);
  const [pointsPerCheckIn, setPointsPerCheckIn] = useState(10);
  const [streakProtection, setStreakProtection] = useState(false);
  const [milestones, setMilestones] = useState<CheckInMilestone[]>([
    { day: 7, reward: 'Free Coffee' },
    { day: 14, reward: '50 Bonus Points', bonusPoints: 50 },
    { day: 30, reward: '20% Discount' },
    { day: 45, reward: 'Free Dessert' },
  ]);

  // Milestone Add Modal / Inline
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [addDay, setAddDay] = useState(60);
  const [addReward, setAddReward] = useState('');
  const [addBonus, setAddBonus] = useState(0);

  // General App State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [createdCommunity, setCreatedCommunity] = useState<Community | null>(null);

  // Hidden File Inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Real-time debounced handle availability check
  useEffect(() => {
    const clean = handle.trim().replace(/^@/, '').toLowerCase();
    if (!clean || clean.length < 2) {
      setHandleStatus('idle');
      return;
    }

    if (clean === handleCheckedValue) return;

    setHandleStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkCommunityHandleAvailable(clean);
        setHandleStatus(isAvail ? 'available' : 'taken');
        setHandleCheckedValue(clean);
      } catch (e) {
        setHandleStatus('available');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [handle, handleCheckedValue]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.9);
      setLogo(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 675, 0.85);
      setCover(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  // Step 1 validation
  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a community name.');
      return false;
    }
    if (!handle.trim()) {
      setErrorMsg('Please enter a username handle.');
      return false;
    }
    if (handleStatus === 'taken') {
      setErrorMsg('This username handle is already taken. Please choose another.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  // Step 3 Rule addition
  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setRulesList([
      ...rulesList,
      {
        id: Date.now().toString(),
        icon: 'shield',
        text: newRuleText.trim(),
      },
    ]);
    setNewRuleText('');
    setShowAddRuleInput(false);
  };

  const handleRemoveRule = (id: string) => {
    setRulesList(rulesList.filter((r) => r.id !== id));
  };

  // Step 4 Milestone addition
  const handleSaveNewMilestone = () => {
    if (!addReward.trim() || addDay <= 0) return;
    const updated = [
      ...milestones.filter((m) => m.day !== addDay),
      {
        day: Number(addDay),
        reward: addReward.trim(),
        bonusPoints: Number(addBonus) || undefined,
      },
    ].sort((a, b) => a.day - b.day);

    setMilestones(updated);
    setAddReward('');
    setAddBonus(0);
    setAddDay(Number(addDay) + 15);
    setShowAddMilestone(false);
  };

  const handleRemoveMilestone = (day: number) => {
    setMilestones(milestones.filter((m) => m.day !== day));
  };

  // Submit Community to Firebase
  const handleLaunchCommunity = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
      const compiledRules = rulesList.map((r) => `• ${r.text}`).join('\n');

      const comm = await createCommunity(
        name.trim(),
        cleanHandle,
        desc.trim(),
        category,
        logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanHandle}`,
        cover || PRESET_BANNERS[0].url,
        compiledRules,
        {
          enabled: enableCheckIn,
          pointsPerCheckIn: Number(pointsPerCheckIn) || 10,
          streakProtection,
          milestones,
        },
        {
          location: location.trim() || undefined,
          website: website.trim() || undefined,
          phone: phone.trim() || undefined,
          maxDailyCheckIns: 1,
        }
      );

      setCreatedCommunity(comm);
      setCurrentStep(6); // Navigate to Success Screen
    } catch (err: any) {
      console.error('Failed to create community:', err);
      setErrorMsg(err.message || 'Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to create another
  const handleResetForAnother = () => {
    setName('');
    setHandle('');
    setDesc('');
    setCategory(CATEGORIES[0]);
    setLogo(PRESET_LOGOS[0].url);
    setCover(PRESET_BANNERS[0].url);
    setMilestones([
      { day: 7, reward: 'Free Welcome Gift' },
      { day: 14, reward: '50 Bonus Points', bonusPoints: 50 },
      { day: 30, reward: '15% Off Discount' },
    ]);
    setCreatedCommunity(null);
    setCurrentStep(0);
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    setErrorMsg('');
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep === 0) {
      onGoBack();
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Render Rule Icon helper
  const renderRuleIcon = (iconType: string) => {
    switch (iconType) {
      case 'user':
        return <User className="w-4 h-4 text-orange-500 shrink-0" />;
      case 'ban':
        return <Ban className="w-4 h-4 text-orange-500 shrink-0" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-orange-500 shrink-0" />;
      default:
        return <Shield className="w-4 h-4 text-orange-500 shrink-0" />;
    }
  };

  // =========================================================================
  // SCREEN 0: WELCOME SCREEN (Matches frame 1 in design mockup)
  // =========================================================================
  if (currentStep === 0) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white select-none overflow-hidden">
        {/* Top App Bar */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <button
            onClick={onGoBack}
            className="p-2 -ml-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-6" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Bizmunity Logo & Wordmark */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-14 h-14 relative flex items-center justify-center mb-1">
                <img
                  src="/bizmunity-logo.svg"
                  alt="Bizmunity"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-[#0A1C3E] dark:text-white flex items-center">
                biz<span className="text-orange-500">munity</span>
              </span>
            </div>

            {/* Headline & Subtitle */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Create Your Community
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Build your business, brand or interest community and start connecting with people.
              </p>
            </div>

            {/* 3 Value Cards (Identical to mockup frame 1) */}
            <div className="space-y-3.5 pt-2">
              {/* Card 1: Get Your Own Space */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Get Your Own Space</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                    Share updates, offers, events and more.
                  </p>
                </div>
              </div>

              {/* Card 2: Grow Your Community */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Grow Your Community</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                    Attract members and build loyalty.
                  </p>
                </div>
              </div>

              {/* Card 3: Earn Customer Loyalty */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Flame className="w-6 h-6 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Earn Customer Loyalty</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                    Enable check-ins and reward your members.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action: Let's Get Started */}
          <div className="pt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>Let's Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 6: SUCCESS SCREEN (Matches frame 7 in design mockup)
  // =========================================================================
  if (currentStep === 6) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white select-none overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-between items-center text-center">
          <div className="w-full max-w-sm space-y-6 pt-4 flex flex-col items-center">
            {/* Animated Large Green Checkmark with Confetti style */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              {/* Confetti particles */}
              <div className="absolute -top-3 -left-3 w-3 h-3 rounded-full bg-orange-400 animate-ping" />
              <div className="absolute top-1 -right-4 w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-blue-500" />
              <div className="absolute bottom-1 -left-4 w-2.5 h-2.5 rounded-full bg-pink-500" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Your Community is Live!
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                <strong className="text-zinc-800 dark:text-zinc-200">{name}</strong> has been created successfully. You can now start posting, invite members and grow your community.
              </p>
            </div>

            {/* Live Community Mini Preview Card */}
            <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md text-left">
              <div className="h-24 w-full relative bg-zinc-800 overflow-hidden">
                <img src={cover} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="px-4 pb-4 pt-0 relative flex flex-col items-center text-center -mt-8">
                <div className="w-16 h-16 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden shadow-lg bg-zinc-900 shrink-0 mb-2">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">{name}</h3>
                <p className="text-[11px] font-mono text-zinc-500 mb-1.5">@{handle.replace(/^@/, '')}</p>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 mb-3">
                  {category}
                </span>

                <div className="w-full grid grid-cols-3 gap-2 py-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <div>
                    <span className="block font-black text-xs text-zinc-900 dark:text-white">1</span>
                    <span className="text-[10px] text-zinc-400">Member</span>
                  </div>
                  <div>
                    <span className="block font-black text-xs text-zinc-900 dark:text-white">0</span>
                    <span className="text-[10px] text-zinc-400">Posts</span>
                  </div>
                  <div>
                    <span className="block font-black text-xs text-zinc-900 dark:text-white">0</span>
                    <span className="text-[10px] text-zinc-400">Check-ins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-2.5 pt-6">
            <button
              onClick={() => onSuccess(createdCommunity?.id)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>Go to Community</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetForAnother}
              className="w-full py-3 px-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
            >
              Create Another Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEPS 1 to 5 (WIZARD FLOW WITH STEPPER)
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white select-none overflow-hidden">
      {/* Hidden File Inputs for Logo and Banner */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleBannerUpload}
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="h-12 px-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
        <button
          onClick={handleBack}
          className="p-1.5 -ml-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition active:scale-95 flex items-center gap-1 text-xs font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-xs tracking-tight text-zinc-900 dark:text-white">
          Create Community
        </h2>
        <div className="w-6" />
      </div>

      {/* Modern Stepper Indicator (Steps 1 to 4) - Hidden on Review Step 5 */}
      {currentStep >= 1 && currentStep <= 4 && (
        <div className="px-8 py-3.5 bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between relative max-w-xs mx-auto">
            {/* Connecting Line */}
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-200 dark:bg-zinc-800 z-0" />
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 h-0.5 bg-orange-500 transition-all duration-300 z-0"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />

            {[1, 2, 3, 4].map((stepNum) => {
              const isActive = currentStep === stepNum;
              const isPast = currentStep > stepNum;
              return (
                <div
                  key={stepNum}
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-110 ring-4 ring-orange-100 dark:ring-orange-950/80'
                      : isPast
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNum}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-5">
        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1: BASIC INFORMATION (Matches frame 2 in design mockup) */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                Basic Information
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Give your community a name and choose the right category.
              </p>
            </div>

            {/* Field: Community Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Community Name <span className="text-orange-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!handle || handle === handleCheckedValue) {
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                    }
                  }}
                  placeholder="e.g. Brew Lab"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none text-xs font-semibold text-zinc-900 dark:text-white transition"
                />
              </div>
              <p className="text-[11px] text-zinc-400 px-1">
                Choose a simple name people can easily remember.
              </p>
            </div>

            {/* Field: Username (Handle) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Username (Handle) <span className="text-orange-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-zinc-400 font-bold text-xs select-none">
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="brew_lab"
                  className="w-full pl-8 pr-10 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none text-xs font-semibold font-mono text-zinc-900 dark:text-white transition"
                />
                <div className="absolute right-3.5 flex items-center">
                  {handleStatus === 'checking' && (
                    <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                  )}
                  {handleStatus === 'available' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {handleStatus === 'taken' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Status text */}
              <div className="px-1 text-[11px] flex items-center gap-1.5">
                {handleStatus === 'available' && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span>🌱</span> This handle is available!
                  </span>
                )}
                {handleStatus === 'taken' && (
                  <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <span>❌</span> Handle already taken, please try another.
                  </span>
                )}
                {handleStatus === 'checking' && (
                  <span className="text-zinc-400">Checking availability...</span>
                )}
                {handleStatus === 'idle' && (
                  <span className="text-zinc-400">Letters, numbers, and underscores allowed.</span>
                )}
              </div>
            </div>

            {/* Field: Category Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Category <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none">
                  <Store className="w-4 h-4" />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none text-xs font-semibold text-zinc-900 dark:text-white appearance-none transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Helper Hint Box (Matches mockup frame 2 lightbulb card) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
                Choose a clear name and category so people can easily find your community.
              </p>
            </div>

            {/* Onboarding hint tooltip */}
            {showTutorial && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Tip: This will be your public community address.
                </span>
                <button
                  type="button"
                  onClick={() => setShowTutorial(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline text-[10px]"
                >
                  Skip tips
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: VISUAL BRANDING (Matches frame 3 in design mockup) */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                Add Visual Identity
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Upload a logo and cover banner to make your community look professional.
              </p>
            </div>

            {/* Section 1: Community Logo */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Community Logo
              </label>

              <div className="flex flex-col items-center justify-center py-2">
                {/* Circular Logo Preview with Camera Badge */}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden cursor-pointer group active:scale-95 transition-all"
                >
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-full h-full object-cover group-hover:opacity-90 transition"
                  />
                  {/* Camera Badge at bottom-right */}
                  <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-zinc-900/90 text-white flex items-center justify-center shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <span>Upload Logo</span>
                </button>
                <span className="text-[10px] text-zinc-400">(Square image recommended)</span>
              </div>

              {/* Quick Preset Logos */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-zinc-500 block mb-1.5">
                  Or choose a preset style:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_LOGOS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setLogo(p.url)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition ${
                        logo === p.url
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Cover Banner */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Cover Banner
              </label>

              {/* 16:9 Banner Preview with Camera Badge */}
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer group active:scale-[0.99] transition-all bg-zinc-800"
              >
                <img
                  src={cover}
                  alt="Cover Banner"
                  className="w-full h-full object-cover group-hover:opacity-90 transition"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />
                {/* Camera badge */}
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-zinc-900/90 text-white flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Upload Banner
                </button>
                <p className="text-[10px] text-zinc-400">(16:9 ratio recommended)</p>
              </div>

              {/* Quick Preset Banners */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-zinc-500 block mb-1.5">
                  Or select a banner theme:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_BANNERS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setCover(p.url)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition ${
                        cover === p.url
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-5 h-3.5 rounded object-cover" />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: ABOUT YOUR COMMUNITY (Matches frame 4 in design mockup) */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                About Your Community
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Tell people what your community is about and set a few simple guidelines.
              </p>
            </div>

            {/* Field: Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Description
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {desc.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="A cozy café community for coffee lovers. Share your experiences, discover new flavors, get exclusive offers and be part of our growing Brew Lab family."
                className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none text-xs text-zinc-900 dark:text-white resize-none leading-relaxed transition"
              />
            </div>

            {/* Field: Community Guidelines (Rules) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Community Guidelines (Rules)
                </label>
                <span className="text-[10px] text-zinc-400">{rulesList.length} rules</span>
              </div>

              {/* List of Rule Cards (Matches frame 4 cards with icons) */}
              <div className="space-y-2">
                {rulesList.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      {renderRuleIcon(rule.icon)}
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {rule.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Rule */}
              {showAddRuleInput ? (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    placeholder="Enter new community guideline..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRuleInput(false)}
                    className="px-2 py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddRuleInput(true)}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                >
                  <Plus className="w-4 h-4 text-orange-500" />
                  <span>Add Rule</span>
                </button>
              )}
            </div>

            {/* Optional Business Details (Location, Website, Phone) */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block">
                Additional Details (Optional)
              </span>

              <div className="space-y-2">
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location / Address (e.g. 104 Main St, Downtown)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="relative flex items-center">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Website (e.g. https://brewlab.com)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contact Number (optional)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: CHECK-IN REWARDS (Matches frame 5 in design mockup) */}
        {/* ================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                Check-In Rewards (Optional)
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Turn on daily check-ins to reward your customers and keep them coming back.
              </p>
            </div>

            {/* Illustrated Explanation Workflow Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200/50 dark:border-orange-950/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block mb-1">
                How Daily Check-In Loyalty Works
              </span>
              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 px-1 pt-1">
                <span>Visit Store</span>
                <span className="text-orange-500">➔</span>
                <span>Scan QR</span>
                <span className="text-orange-500">➔</span>
                <span>Earn Points</span>
                <span className="text-orange-500">➔</span>
                <span>Unlock Rewards</span>
              </div>
            </div>

            {/* Card 1: Enable Check-In Rewards Toggle */}
            <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                    Enable Check-In Rewards
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                    Customers scan your Check-in QR at your store/visits to earn points and build streaks.
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableCheckIn}
                  onChange={(e) => setEnableCheckIn(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {enableCheckIn && (
              <div className="space-y-4">
                {/* Card 2: Points Per Check-In */}
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Points Per Check-In
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500">
                        <Coins className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={pointsPerCheckIn}
                        onChange={(e) => setPointsPerCheckIn(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 font-bold text-xs text-zinc-900 dark:text-white"
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 px-1">Points</span>
                  </div>
                </div>

                {/* Card 3: Streak Protection Toggle */}
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Streak Protection</h4>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        Allow 1 day miss without breaking streak.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={streakProtection}
                      onChange={(e) => setStreakProtection(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {/* Milestone Rewards Section (Matches mockup frame 5 with Day 7 Free Coffee, etc.) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Milestone Rewards
                      </h3>
                      <p className="text-[10px] text-zinc-500">
                        Add rewards for special streak days.
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {milestones.length} Milestones
                    </span>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-2">
                    {milestones.map((m) => (
                      <div
                        key={m.day}
                        className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400">
                            Day {m.day}
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {m.reward} {m.bonusPoints ? `(+${m.bonusPoints} pts)` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(m.day)}
                          className="p-1 text-zinc-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Milestone Form */}
                  {showAddMilestone ? (
                    <div className="p-3.5 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 space-y-3">
                      <h4 className="text-xs font-bold text-orange-900 dark:text-orange-300">
                        Add New Streak Milestone
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-zinc-500 block mb-1">Day</label>
                          <input
                            type="number"
                            min="1"
                            value={addDay}
                            onChange={(e) => setAddDay(Number(e.target.value))}
                            className="w-full p-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                            Reward Title
                          </label>
                          <input
                            type="text"
                            value={addReward}
                            onChange={(e) => setAddReward(e.target.value)}
                            placeholder="e.g. Free Dessert"
                            className="w-full p-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddMilestone(false)}
                          className="text-xs text-zinc-500 hover:text-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNewMilestone}
                          className="px-4 py-1.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-sm"
                        >
                          Save Milestone
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddMilestone(true)}
                      className="w-full py-2.5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                    >
                      <Plus className="w-4 h-4 text-orange-500" />
                      <span>Add Milestone</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* REVIEW & LAUNCH (Matches frame 6 in design mockup) */}
        {/* ================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                Review & Launch
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Almost ready! Please review your community details before launching.
              </p>
            </div>

            {/* Profile Card Preview (Identical to frame 6 in mockup) */}
            <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg text-left">
              {/* Cover Banner */}
              <div className="h-32 w-full relative bg-zinc-800 overflow-hidden">
                <img src={cover} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* Profile Card Info */}
              <div className="px-5 pb-5 pt-0 relative flex flex-col items-center text-center -mt-10">
                {/* Logo with White Border */}
                <div className="w-20 h-20 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden shadow-xl bg-zinc-900 shrink-0 mb-2">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                </div>

                <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
                  {name}
                </h2>
                <span className="text-xs font-mono text-zinc-500 block mb-1.5">
                  @{handle.replace(/^@/, '')}
                </span>

                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 mb-3">
                  {category}
                </span>

                {/* 3-Column Stats Row */}
                <div className="w-full grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 dark:border-zinc-800 text-center mb-3">
                  <div>
                    <span className="block font-black text-xs text-zinc-900 dark:text-white">0</span>
                    <span className="text-[10px] text-zinc-400">Members</span>
                  </div>
                  <div>
                    <span className="block font-black text-xs text-zinc-900 dark:text-white">0</span>
                    <span className="text-[10px] text-zinc-400">Posts</span>
                  </div>
                  <div>
                    <span className="block font-black text-xs text-zinc-900 dark:text-white">0</span>
                    <span className="text-[10px] text-zinc-400">Check-ins</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed px-1 mb-4 text-left w-full">
                  {desc}
                </p>

                {/* Check-In Reward summary pill */}
                <div className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-white block">
                        Check-In Reward
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {enableCheckIn
                          ? `${pointsPerCheckIn} points per check-in • ${milestones.length} milestone rewards`
                          : 'Check-in rewards disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar: Back and Next / Launch Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-30 max-w-md mx-auto">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="flex-1 py-3 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Next or Launch Button */}
        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLaunchCommunity}
            disabled={loading}
            className="flex-[1.5] py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <span>Launch Community</span>
                <Rocket className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
