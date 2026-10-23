import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  Gift,
  Tag,
  Copy,
  Check,
  Clock,
  PlusCircle,
  Loader2,
  X,
  QrCode,
  Scan,
} from 'lucide-react';
import { Offer, Reward, RewardHistory, Community } from '../../types/bizmunity';
import { useAuth } from '../../context/AuthContext';
import { createOffer, createReward, redeemReward } from '../../firebase/firestoreService';

interface LoyaltyScreenProps {
  offers: Offer[];
  rewards: Reward[];
  rewardHistory: RewardHistory[];
  communities: Community[];
  onOpenQR?: () => void;
  onOpenScanner?: () => void;
  onOpenAuth: () => void;
}

export const LoyaltyScreen: React.FC<LoyaltyScreenProps> = ({
  offers,
  rewards,
  rewardHistory,
  communities,
  onOpenQR,
  onOpenScanner,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [tab, setTab] = useState<'rewards' | 'offers' | 'history'>('rewards');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Business creator modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'reward' | 'offer'>('reward');
  const [itemTitle, setItemTitle] = useState('');
  const [itemPoints, setItemPoints] = useState(100);
  const [itemDesc, setItemDesc] = useState('');
  const [itemBadge, setItemBadge] = useState('Gold');
  const [offerCode, setOfferCode] = useState('');
  const [offerDiscount, setOfferDiscount] = useState(20);
  const [selectedCommId, setSelectedCommId] = useState('');
  const [creating, setCreating] = useState(false);

  const currentPoints = userProfile?.loyaltyPoints || 0;
  const streakDays = userProfile?.streakDays || 1;

  let tier = 'Bronze Member';
  let nextTarget = 500;
  if (currentPoints >= 2000) {
    tier = 'Diamond Founder';
    nextTarget = 5000;
  } else if (currentPoints >= 1000) {
    tier = 'Platinum Pioneer';
    nextTarget = 2000;
  } else if (currentPoints >= 500) {
    tier = 'Gold Partner';
    nextTarget = 1000;
  } else if (currentPoints >= 200) {
    tier = 'Silver Member';
    nextTarget = 500;
  }

  const progressPercent = Math.min(100, Math.round((currentPoints / nextTarget) * 100));

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRedeem = async (reward: Reward) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (currentPoints < reward.pointsCost) {
      alert(`You need ${reward.pointsCost} points, but have ${currentPoints} points.`);
      return;
    }

    if (confirm(`Redeem "${reward.title}" for ${reward.pointsCost} points?`)) {
      setRedeemingId(reward.id);
      try {
        await redeemReward(reward);
        setTab('history');
      } catch (err: any) {
        alert(err.message || 'Redemption failed.');
      } finally {
        setRedeemingId(null);
      }
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreating(true);
    try {
      const comm = communities.find((c) => c.id === selectedCommId);
      if (createMode === 'reward') {
        await createReward(
          itemTitle,
          Number(itemPoints),
          itemDesc,
          itemBadge,
          selectedCommId || undefined,
          comm?.name || undefined
        );
      } else {
        await createOffer(
          itemTitle,
          offerCode,
          Number(offerDiscount),
          itemDesc,
          new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          selectedCommId || undefined,
          comm?.name || undefined
        );
      }
      setShowCreateModal(false);
      setItemTitle('');
      setItemDesc('');
      setOfferCode('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top Header */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-black text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            Loyalty Club & Perks
          </h2>
          <p className="text-[10px] text-zinc-400">Earn points on streaks & redeem business vouchers</p>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1 border border-orange-500/20"
              title="Rewards QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setShowCreateModal(true);
            }}
            className="p-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" /> Perk
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {/* Android Material Loyalty Wallet Card */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950 rounded-3xl p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {tier}
            </span>

            <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-current" /> {streakDays}d Streak
            </span>
          </div>

          <div>
            <span className="text-3xl font-black">{currentPoints}</span>
            <span className="text-xs text-orange-400 ml-1.5 font-bold">PTS</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Bizmunity Wallet Balance</p>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Next Milestone</span>
              <span>{currentPoints} / {nextTarget}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* QR Action Buttons in Rewards */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
            {onOpenQR && (
              <button
                onClick={onOpenQR}
                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <QrCode className="w-4 h-4 text-orange-400" />
                My Profile QR
              </button>
            )}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95"
              >
                <Scan className="w-4 h-4" />
                Scan Check-In QR
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setTab('rewards')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              tab === 'rewards'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold'
                : 'text-zinc-500'
            }`}
          >
            Catalog ({rewards.length})
          </button>
          <button
            onClick={() => setTab('offers')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              tab === 'offers'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold'
                : 'text-zinc-500'
            }`}
          >
            Deals ({offers.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              tab === 'history'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold'
                : 'text-zinc-500'
            }`}
          >
            Unlocked Rewards ({rewardHistory.length})
          </button>
        </div>

        {/* TAB 1: REWARDS */}
        {tab === 'rewards' && (
          <div className="space-y-3">
            {rewards.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No active rewards in catalog. Be the first business to publish a perk!
              </div>
            ) : (
              rewards.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs shadow-sm"
                >
                  <div className="pr-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white">{r.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {r.badge || 'VIP'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {r.description}
                    </p>
                    <span className="font-black text-orange-600 dark:text-orange-400 block">
                      {r.pointsCost} Points
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={redeemingId === r.id}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-sm shrink-0"
                  >
                    {redeemingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Redeem'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: OFFERS */}
        {tab === 'offers' && (
          <div className="space-y-3">
            {offers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No promo codes available right now.
              </div>
            ) : (
              offers.map((o) => (
                <div
                  key={o.id}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <span className="text-xl font-black text-emerald-600 block">
                      {o.discountPercent}% OFF
                    </span>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{o.title}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono mt-1">Code: {o.code}</p>
                  </div>

                  <button
                    onClick={() => handleCopy(o.code)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm shrink-0"
                  >
                    {copiedCode === o.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode === o.code ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: VOUCHERS */}
        {tab === 'history' && (
          <div className="space-y-3">
            {rewardHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No redeemed vouchers yet. Redeem rewards with your loyalty points!
              </div>
            ) : (
              rewardHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{h.rewardTitle}</h4>
                    <p className="text-[10px] text-zinc-400">
                      Redeemed {new Date(h.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px]">
                    Active Voucher
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CREATE OFFER / REWARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm">
                {createMode === 'reward' ? 'Publish Reward Perk' : 'Publish Deal Coupon'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Free 1-on-1 Strategy Session"
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                />
              </div>

              {createMode === 'reward' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Points Cost</label>
                    <input
                      type="number"
                      min={10}
                      value={itemPoints}
                      onChange={(e) => setItemPoints(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Badge</label>
                    <select
                      value={itemBadge}
                      onChange={(e) => setItemBadge(e.target.value)}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    >
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Discount %</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={offerDiscount}
                      onChange={(e) => setOfferDiscount(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                      placeholder="BIZ20"
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Description & Terms</label>
                <textarea
                  rows={2}
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Terms of redemption..."
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl border text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-orange-600 text-white font-bold rounded-xl shadow-sm"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
