export interface UserProfile {
  id: string;
  uid: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  joinedCommunitiesCount: number;
  createdCommunitiesCount: number;
  loyaltyPoints: number;
  badge?: string;
  streakDays?: number;
  lastActiveDate?: string;
  website?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  handle: string;
  description: string;
  category: string;
  logoUrl?: string;
  coverUrl?: string;
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  memberCount: number;
  followerCount: number;
  rules?: string;
  verified?: boolean;
  location?: string;
  website?: string;
  phone?: string;
  maxDailyCheckIns?: number;
  checkInRewardDays?: number;
  checkInRewardDesc?: string;
  postsCount?: number;
  offersCount?: number;
  rewardsCount?: number;
  viewsCount?: number;
  checkInSettings?: CheckInSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInMilestone {
  day: number;
  reward: string;
  bonusPoints?: number;
}

export interface CheckInSettings {
  enabled: boolean;
  pointsPerCheckIn: number;
  maxDailyCheckIns?: number;
  checkInRewardDays?: number;
  checkInRewardDesc?: string;
  streakProtection?: boolean;
  milestones: CheckInMilestone[];
  checkInCode: string;
}

export interface CommunityAnalytics {
  communityId: string;
  totalViews: number;
  totalFollowers: number;
  totalPosts: number;
  totalCheckins: number;
  totalOffers: number;
  totalRewards: number;
  totalPointsAwarded: number;
  totalRedemptions: number;
  weeklyGrowth: number;
  updatedAt?: string;
}

export interface CheckInRecord {
  id: string;
  userId: string;
  communityId: string;
  communityName: string;
  streak: number;
  pointsEarned: number;
  milestoneReward?: string;
  dateStr: string;
  timestamp: string;
}

export type QRType = 'user' | 'community' | 'checkin';

export interface UserQRPayload {
  type: 'user';
  userId: string;
  username: string;
  name: string;
  profileRef: string;
  timestamp?: number;
}

export interface CommunityQRPayload {
  type: 'community';
  communityId: string;
  name: string;
  handle: string;
  url: string;
  timestamp?: number;
}

export interface CheckInQRPayload {
  type: 'checkin';
  communityId: string;
  name: string;
  checkInCode: string;
  pointsPerCheckIn?: number;
  timestamp?: number;
}

export type BizmunityQRPayload = UserQRPayload | CommunityQRPayload | CheckInQRPayload;

export type PostType = 'text' | 'image' | 'video' | 'announcement' | 'offer' | 'event';

export interface Post {
  id: string;
  authorId: string;
  ownerId?: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorRole?: string;
  communityId?: string;
  communityName?: string;
  content: string;
  mediaUrls?: string[];
  type: PostType;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount?: number;
  pinned?: boolean;
  archived?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  tag?: string;
  timestamp?: number | string;
  eventDetails?: {
    date: string;
    time?: string;
    location: string;
    title: string;
  };
  offerDetails?: {
    code: string;
    discount?: string;
    discountPercent: number;
    expiresAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  parentCommentId?: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorAvatar?: string;
  type: 'like' | 'comment' | 'follow' | 'community_update' | 'offer' | 'reward' | 'announcement';
  title: string;
  message: string;
  targetId?: string;
  read: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  businessId: string;
  communityId?: string;
  communityName?: string;
  title: string;
  discountPercent: number;
  description: string;
  code: string;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export interface Reward {
  id: string;
  businessId: string;
  communityId?: string;
  communityName?: string;
  title: string;
  pointsCost: number;
  description: string;
  badge?: string;
  active: boolean;
  createdAt: string;
}

export interface RewardHistory {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  pointsSpent: number;
  redeemedAt: string;
  status: 'active' | 'used' | 'expired';
}

export interface EventItem {
  id: string;
  communityId: string;
  communityName?: string;
  organizerId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  rsvpCount: number;
  isRsvped?: boolean;
  createdAt: string;
}
