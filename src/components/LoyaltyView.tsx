import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  Gift,
  Tag,
  CheckCircle,
  PlusCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  X,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Offer, Reward, RewardHistory, Community } from '../types/bizmunity';
import { useAuth } from '../context/AuthContext';
import {
  createOffer,
  createReward,
  redeemReward,
} from '../firebase/firestoreService';

interface LoyaltyViewProps {
  offers: Offer[];
  rewards: Reward[];
  rewardHistory: RewardHistory[];
  communities: Community[];
  onOpenAuth: () => void;
}

export const LoyaltyView: React.FC<LoyaltyViewProps> = ({
  offers,
  rewards,
  rewardHistory,
  communities,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'rewards' | 'offers' | 'history'>('rewards');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Business creator modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'reward' | 'offer'>('reward');
  const [itemTitle, setItemTitle] = useState('');
  const [itemPoints, setItemPoints] = useState(100);
  const [itemDesc, setItemDesc] = useState('');
  const [itemBadge, setItemBadge] = useState('Gold');
  const [offerCode, setOfferCode] = useState('');
  const [offerDiscount, setOfferDiscount] = useState(20);
  const [offerExpiry, setOfferExpiry] = useState('');
  const [selectedCommId, setSelectedCommId] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const currentPoints = userProfile?.loyaltyPoints || 0;
  const streakDays = userProfile?.streakDays || 1;

  // Calculate tier
  let tier = 'Bronze Member';
  let tierNextTarget = 500;
  if (currentPoints >= 2000) {
    tier = 'Diamond Founder';
    tierNextTarget = 5000;
  } else if (currentPoints >= 1000) {
    tier = 'Platinum Pioneer';
    tierNextTarget = 2000;
  } else if (currentPoints >= 500) {
    tier = 'Gold Partner';
    tierNextTarget = 1000;
  } else if (currentPoints >= 200) {
    tier = 'Silver Member';
    tierNextTarget = 500;
  }

  const progressPercent = Math.min(100, Math.round((currentPoints / tierNextTarget) * 100));

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
      alert(`You need ${reward.pointsCost} points for this reward, but have ${currentPoints} points.`);
      return;
    }

    if (confirm(`Redeem "${reward.title}" for ${reward.pointsCost} points?`)) {
      setRedeemingId(reward.id);
      try {
        await redeemReward(reward);
        setActiveTab('history');
      } catch (err: any) {
        alert(err.message || 'Redemption failed.');
      } finally {
        setRedeemingId(null);
      }
    }
  };

  const handleCreateBusinessItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setCreating(true);
    setMessage('');
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
          offerExpiry || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          selectedCommId || undefined,
          comm?.name || undefined
        );
      }
      setShowCreateModal(false);
      setItemTitle('');
      setItemDesc('');
      setOfferCode('');
    } catch (err: any) {
      setMessage(err.message || 'Failed to create reward/offer.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loyalty & Streaks Overview Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Bizmunity Loyalty Club
              </span>
              <span className="text-xs text-zinc-400 font-semibold">{tier}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{currentPoints}</span>
              <span className="text-base sm:text-lg font-semibold text-orange-400">Points Available</span>
            </h2>

            {/* Streak & Milestone Progress */}
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5 font-medium">
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame className="w-4 h-4 fill-current" />
                  <strong>{streakDays} Day Streak</strong>
                </span>
                <span>
                  {currentPoints} / {tierNextTarget} pts to next tier
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else {
                  setShowCreateModal(true);
                  setCreateMode('reward');
                }
              }}
              className="px-4 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-orange-600" />
              <span>Create Business Reward</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else {
                  setShowCreateModal(true);
                  setCreateMode('offer');
                }
              }}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/30"
            >
              <Tag className="w-4 h-4" />
              <span>Publish Coupon Deal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            Redeemable Rewards ({rewards.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'offers'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            Special Deals & Coupons ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            My Redemption History ({rewardHistory.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div>
          {rewards.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
              <Gift className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No active rewards in catalog yet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                Businesses and community owners can publish perks, discounts, or swag that members can redeem with their loyalty points!
              </p>
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else {
                    setShowCreateModal(true);
                    setCreateMode('reward');
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Create First Reward
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {reward.badge || 'Perk'}
                      </span>
                      <span className="font-extrabold text-sm text-orange-600 dark:text-orange-400">
                        {reward.pointsCost} Points
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-3">
                      {reward.description || 'Exclusive loyalty reward for active Bizmunity members.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={redeemingId === reward.id}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {redeemingId === reward.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Redeem Now'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPECIAL OFFERS & COUPONS */}
      {activeTab === 'offers' && (
        <div>
          {offers.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
              <Tag className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No active offers right now
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                Be the first business to publish a coupon code, cashback, or discount for Bizmunity members!
              </p>
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else {
                    setShowCreateModal(true);
                    setCreateMode('offer');
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Publish Coupon Offer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {offer.discountPercent}% OFF
                      </span>
                      {offer.expiresAt && (
                        <span className="text-[11px] text-zinc-400">
                          Expires: {new Date(offer.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
                      {offer.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4">
                      {offer.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                        Promo Code
                      </span>
                      <span className="font-mono font-bold text-sm text-zinc-900 dark:text-white">
                        {offer.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(offer.code)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      {copiedCode === offer.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode === offer.code ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REDEMPTION HISTORY */}
      {activeTab === 'history' && (
        <div>
          {rewardHistory.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-zinc-400">
              You haven't redeemed any rewards yet. Earn points by engaging in feed and redeem rewards!
            </div>
          ) : (
            <div className="space-y-3">
              {rewardHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {item.rewardTitle}
                      </h4>
                      <p className="text-zinc-400">
                        Redeemed on {new Date(item.redeemedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-orange-600 dark:text-orange-400 block">
                      -{item.pointsSpent} Points
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE OFFER / REWARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {createMode === 'reward' ? 'Create Loyalty Reward' : 'Create Special Deal / Coupon'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && <div className="mb-3 p-2 rounded bg-red-50 text-red-600">{message}</div>}

            <form onSubmit={handleCreateBusinessItem} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder={createMode === 'reward' ? 'e.g. Free 1-on-1 Founder Consultation' : 'e.g. 20% Off Pro Annual Plan'}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              {createMode === 'reward' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Points Cost</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={itemPoints}
                      onChange={(e) => setItemPoints(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Tier Badge</label>
                    <select
                      value={itemBadge}
                      onChange={(e) => setItemBadge(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
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
                      required
                      min={1}
                      max={100}
                      value={offerDiscount}
                      onChange={(e) => setOfferDiscount(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                      className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
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
                  placeholder="Explain how members can redeem this perk or coupon..."
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Link to Community (Optional)</label>
                <select
                  value={selectedCommId}
                  onChange={(e) => setSelectedCommId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">General Bizmunity Network</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
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
