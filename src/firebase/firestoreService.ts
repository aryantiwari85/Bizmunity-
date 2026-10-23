import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';
import {
  Community,
  Post,
  Comment,
  NotificationItem,
  Offer,
  Reward,
  RewardHistory,
  EventItem,
  CheckInSettings,
  CheckInMilestone,
  CheckInRecord,
  UserProfile,
} from '../types/bizmunity';
import { calculateCheckInStreak } from '../utils/bizmunityLogic';

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function sendNotification(
  userId: string,
  type: NotificationItem['type'],
  title: string,
  message: string,
  targetId?: string
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid === userId) return; // Don't notify self

  const notifRef = collection(db, 'notifications');
  try {
    await addDoc(notifRef, {
      userId,
      actorId: auth.currentUser.uid,
      actorName: auth.currentUser.displayName || 'A Bizmunity User',
      actorUsername: auth.currentUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user',
      actorAvatar: auth.currentUser.photoURL || '',
      type,
      title,
      message,
      targetId: targetId || '',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to send notification:', err);
  }
}

export function subscribeUserNotifications(
  userId: string,
  callback: (notifications: NotificationItem[]) => void
): Unsubscribe {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(40)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllNotificationsAsRead(notifications: NotificationItem[]): Promise<void> {
  try {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true })));
  } catch (err) {
    console.error('Error marking all as read:', err);
  }
}

// ==========================================
// COMMUNITIES
// ==========================================

export async function checkCommunityHandleAvailable(handle: string): Promise<boolean> {
  const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
  if (!cleanHandle || cleanHandle.length < 2) return false;
  try {
    const q = query(collection(db, 'communities'), where('handle', '==', cleanHandle), limit(1));
    const snap = await getDocs(q);
    return snap.empty;
  } catch (err) {
    console.error('Error checking handle availability:', err);
    return true;
  }
}

export async function createCommunity(
  name: string,
  handle: string,
  description: string,
  category: string,
  logoUrl?: string,
  coverUrl?: string,
  rules?: string,
  customCheckInSettings?: Partial<CheckInSettings>,
  extraDetails?: {
    location?: string;
    website?: string;
    phone?: string;
    maxDailyCheckIns?: number;
    checkInRewardDays?: number;
    checkInRewardDesc?: string;
  }
): Promise<Community> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to create a community.');

  const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
  const commRef = doc(collection(db, 'communities'));

  const defaultMilestones = [
    { day: 3, reward: '30 Bonus Points', bonusPoints: 30 },
    { day: 5, reward: 'Free Coffee' },
    { day: 10, reward: '100 Bonus Points', bonusPoints: 100 },
    { day: 15, reward: '20% Discount' },
    { day: 30, reward: 'Premium Reward', bonusPoints: 200 },
  ];

  const newComm: Community = {
    id: commRef.id,
    name,
    handle: cleanHandle,
    description,
    category,
    logoUrl: logoUrl || '',
    coverUrl: coverUrl || '',
    ownerId: user.uid,
    ownerName: user.displayName || 'Community Founder',
    ownerAvatar: user.photoURL || '',
    memberCount: 1,
    followerCount: 0,
    postsCount: 0,
    offersCount: 0,
    rewardsCount: 0,
    viewsCount: 0,
    location: extraDetails?.location || '',
    website: extraDetails?.website || '',
    phone: extraDetails?.phone || '',
    maxDailyCheckIns: extraDetails?.maxDailyCheckIns ?? 1,
    checkInRewardDays: extraDetails?.checkInRewardDays,
    checkInRewardDesc: extraDetails?.checkInRewardDesc,
    rules: rules || 'Be respectful, support fellow members, and keep content business-focused.',
    checkInSettings: {
      enabled: customCheckInSettings?.enabled !== undefined ? customCheckInSettings.enabled : true,
      pointsPerCheckIn: customCheckInSettings?.pointsPerCheckIn ?? 10,
      maxDailyCheckIns: extraDetails?.maxDailyCheckIns ?? 1,
      checkInRewardDays: extraDetails?.checkInRewardDays,
      checkInRewardDesc: extraDetails?.checkInRewardDesc,
      streakProtection: customCheckInSettings?.streakProtection ?? false,
      checkInCode:
        customCheckInSettings?.checkInCode ||
        `CHK_${commRef.id.substring(0, 6).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      milestones: customCheckInSettings?.milestones || defaultMilestones,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(commRef, newComm);

    // Auto-join owner as admin/owner in communityMembers
    const memberDocId = `${newComm.id}_${user.uid}`;
    await setDoc(doc(db, 'communityMembers', memberDocId), {
      communityId: newComm.id,
      userId: user.uid,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });

    // Initialize Community Analytics document
    await setDoc(doc(db, 'communityAnalytics', newComm.id), {
      communityId: newComm.id,
      totalViews: 0,
      totalFollowers: 0,
      totalPosts: 0,
      totalCheckins: 0,
      totalOffers: 0,
      totalRewards: 0,
      totalPointsAwarded: 0,
      totalRedemptions: 0,
      weeklyGrowth: 0,
      updatedAt: new Date().toISOString(),
    });

    // Update user's created count
    await updateDoc(doc(db, 'users', user.uid), {
      createdCommunitiesCount: increment(1),
      joinedCommunitiesCount: increment(1),
      loyaltyPoints: increment(50), // reward for community creation
    });

    return newComm;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'communities');
  }
}

export async function updateCommunity(
  communityId: string,
  updates: Partial<Community>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'communities', communityId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `communities/${communityId}`);
  }
}

export async function deleteCommunity(communityId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'communities', communityId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `communities/${communityId}`);
  }
}

export async function joinCommunity(communityId: string, communityName?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to join this community.');

  const memberDocId = `${communityId}_${user.uid}`;
  const memberRef = doc(db, 'communityMembers', memberDocId);
  const commRef = doc(db, 'communities', communityId);
  const userRef = doc(db, 'users', user.uid);

  try {
    await runTransaction(db, async (txn) => {
      const snap = await txn.get(memberRef);
      if (snap.exists()) return; // already a member

      txn.set(memberRef, {
        communityId,
        userId: user.uid,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });

      txn.update(commRef, {
        memberCount: increment(1),
        updatedAt: new Date().toISOString(),
      });

      txn.update(userRef, {
        joinedCommunitiesCount: increment(1),
        loyaltyPoints: increment(15), // Reward for joining community
      });
    });

    // Notify community owner
    const commSnap = await getDoc(commRef);
    if (commSnap.exists()) {
      sendNotification(
        commSnap.data().ownerId,
        'community_update',
        'New Community Member',
        `${user.displayName || 'A member'} joined ${communityName || 'your community'}!`,
        communityId
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `communityMembers/${memberDocId}`);
  }
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const memberDocId = `${communityId}_${user.uid}`;
  const memberRef = doc(db, 'communityMembers', memberDocId);
  const commRef = doc(db, 'communities', communityId);
  const userRef = doc(db, 'users', user.uid);

  try {
    await runTransaction(db, async (txn) => {
      const snap = await txn.get(memberRef);
      if (!snap.exists()) return;

      txn.delete(memberRef);
      txn.update(commRef, {
        memberCount: increment(-1),
        updatedAt: new Date().toISOString(),
      });
      txn.update(userRef, {
        joinedCommunitiesCount: increment(-1),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `communityMembers/${memberDocId}`);
  }
}

export async function followCommunity(communityId: string, communityName?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to follow this community.');

  const followDocId = `${communityId}_${user.uid}`;
  const followRef = doc(db, 'communityFollowers', followDocId);
  const commRef = doc(db, 'communities', communityId);
  const analyticsRef = doc(db, 'communityAnalytics', communityId);

  try {
    await runTransaction(db, async (txn) => {
      const snap = await txn.get(followRef);
      if (snap.exists()) return;

      txn.set(followRef, {
        id: followDocId,
        communityId,
        userId: user.uid,
        userName: user.displayName || 'Member',
        userAvatar: user.photoURL || '',
        followedAt: new Date().toISOString(),
      });

      txn.update(commRef, {
        followerCount: increment(1),
        updatedAt: new Date().toISOString(),
      });

      const analyticsSnap = await txn.get(analyticsRef);
      if (analyticsSnap.exists()) {
        txn.update(analyticsRef, {
          totalFollowers: increment(1),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const commSnap = await getDoc(commRef);
    if (commSnap.exists()) {
      sendNotification(
        commSnap.data().ownerId,
        'follow',
        'New Community Follower',
        `${user.displayName || 'A member'} followed ${communityName || 'your community'}!`,
        communityId
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `communityFollowers/${followDocId}`);
  }
}

export async function unfollowCommunity(communityId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const followDocId = `${communityId}_${user.uid}`;
  const followRef = doc(db, 'communityFollowers', followDocId);
  const commRef = doc(db, 'communities', communityId);
  const analyticsRef = doc(db, 'communityAnalytics', communityId);

  try {
    await runTransaction(db, async (txn) => {
      const snap = await txn.get(followRef);
      if (!snap.exists()) return;

      txn.delete(followRef);
      txn.update(commRef, {
        followerCount: increment(-1),
        updatedAt: new Date().toISOString(),
      });

      const analyticsSnap = await txn.get(analyticsRef);
      if (analyticsSnap.exists()) {
        txn.update(analyticsRef, {
          totalFollowers: increment(-1),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `communityFollowers/${followDocId}`);
  }
}

export function subscribeUserCommunityFollows(
  userId: string,
  callback: (followedIds: Set<string>) => void
): Unsubscribe {
  if (!userId) {
    callback(new Set());
    return () => {};
  }

  const q = query(collection(db, 'communityFollowers'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const set = new Set<string>();
      snapshot.docs.forEach((d) => {
        const commId = d.data().communityId;
        if (commId) set.add(commId);
      });
      callback(set);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'communityFollowers');
    }
  );
}

export function subscribeCommunityAnalytics(
  communityId: string,
  callback: (analytics: any | null) => void
): Unsubscribe {
  if (!communityId) {
    callback(null);
    return () => {};
  }
  const ref = doc(db, 'communityAnalytics', communityId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `communityAnalytics/${communityId}`);
    }
  );
}

export async function recordCommunityView(communityId: string): Promise<void> {
  if (!communityId) return;
  try {
    const commRef = doc(db, 'communities', communityId);
    const analyticsRef = doc(db, 'communityAnalytics', communityId);
    await updateDoc(commRef, { viewsCount: increment(1) }).catch(() => {});
    await updateDoc(analyticsRef, { totalViews: increment(1) }).catch(() => {});
  } catch (err) {
    console.warn('Failed to record community view:', err);
  }
}

export function subscribeCommunities(callback: (communities: Community[]) => void): Unsubscribe {
  const q = query(collection(db, 'communities'), orderBy('memberCount', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Community));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'communities');
    }
  );
}

export function subscribeUserJoinedCommunities(
  userId: string,
  callback: (communityIds: string[]) => void
): Unsubscribe {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, 'communityMembers'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const ids = snapshot.docs.map((d) => d.data().communityId as string);
      callback(ids);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'communityMembers');
    }
  );
}

// ==========================================
// POSTS & FEED
// ==========================================

export async function createPost(
  content: string,
  type: Post['type'] = 'text',
  mediaUrls: string[] = [],
  communityId?: string,
  communityName?: string,
  extra?: {
    eventDetails?: Post['eventDetails'];
    offerDetails?: Post['offerDetails'];
    tag?: string;
  }
): Promise<Post> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to publish a post.');

  if (!communityId) {
    throw new Error('A post must belong to a community. Please select or create a community first.');
  }

  const postsRef = collection(db, 'posts');
  const newPostDoc = doc(postsRef);
  const commPostRef = doc(db, 'communityPosts', newPostDoc.id);

  const postData = {
    id: newPostDoc.id,
    authorId: user.uid,
    ownerId: user.uid,
    authorName: user.displayName || 'Bizmunity Creator',
    authorUsername: user.displayName?.toLowerCase().replace(/\s+/g, '_') || 'creator',
    authorAvatar: user.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.uid}`,
    communityId,
    communityName: communityName || '',
    content,
    mediaUrls,
    type,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    pinned: false,
    archived: false,
    tag: extra?.tag || (type === 'announcement' ? 'Announcement' : type === 'offer' ? 'Special Offer' : type === 'event' ? 'Event' : 'Discussion'),
    eventDetails: extra?.eventDetails || null,
    offerDetails: extra?.offerDetails || null,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(newPostDoc, postData);
    await setDoc(commPostRef, postData);

    // Update community posts count
    const commRef = doc(db, 'communities', communityId);
    const analyticsRef = doc(db, 'communityAnalytics', communityId);
    await updateDoc(commRef, { postsCount: increment(1), updatedAt: new Date().toISOString() }).catch(() => {});
    await updateDoc(analyticsRef, { totalPosts: increment(1), updatedAt: new Date().toISOString() }).catch(() => {});

    // Reward loyalty points for posting
    await updateDoc(doc(db, 'users', user.uid), {
      loyaltyPoints: increment(20),
    });

    return postData as Post;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'posts');
  }
}

export function subscribeFeedPosts(
  callback: (posts: Post[]) => void,
  communityIdFilter?: string,
  postLimit: number = 30
): Unsubscribe {
  let q;
  if (communityIdFilter) {
    q = query(
      collection(db, 'posts'),
      where('communityId', '==', communityIdFilter),
      orderBy('createdAt', 'desc'),
      limit(postLimit)
    );
  } else {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(postLimit));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      callback(posts);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'posts');
    }
  );
}

export function subscribeCommunityPosts(
  communityId: string,
  callback: (posts: Post[]) => void,
  limitCount: number = 50
): Unsubscribe {
  if (!communityId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, 'posts'),
    where('communityId', '==', communityId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      callback(posts);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'posts');
    }
  );
}

export async function deletePost(postId: string, communityId?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to delete this post.');

  const postRef = doc(db, 'posts', postId);
  const commPostRef = doc(db, 'communityPosts', postId);

  try {
    const snap = await getDoc(postRef);
    let resolvedCommId = communityId;
    if (snap.exists()) {
      const data = snap.data();
      if (data.authorId !== user.uid && data.ownerId !== user.uid) {
        throw new Error('Only the author or owner can delete this post.');
      }
      resolvedCommId = resolvedCommId || data.communityId;
    }

    await deleteDoc(postRef);
    await deleteDoc(commPostRef).catch(() => {});

    if (resolvedCommId) {
      const commRef = doc(db, 'communities', resolvedCommId);
      const analyticsRef = doc(db, 'communityAnalytics', resolvedCommId);
      await updateDoc(commRef, { postsCount: increment(-1) }).catch(() => {});
      await updateDoc(analyticsRef, { totalPosts: increment(-1) }).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
  }
}

export async function editPost(postId: string, newContent: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to edit this post.');

  const postRef = doc(db, 'posts', postId);
  const commPostRef = doc(db, 'communityPosts', postId);

  const updates = { content: newContent, updatedAt: new Date().toISOString() };
  try {
    await updateDoc(postRef, updates);
    await updateDoc(commPostRef, updates).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function pinPost(postId: string, pinned: boolean): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const commPostRef = doc(db, 'communityPosts', postId);
  const updates = { pinned, updatedAt: new Date().toISOString() };
  try {
    await updateDoc(postRef, updates);
    await updateDoc(commPostRef, updates).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function archivePost(postId: string, archived: boolean): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const commPostRef = doc(db, 'communityPosts', postId);
  const updates = { archived, updatedAt: new Date().toISOString() };
  try {
    await updateDoc(postRef, updates);
    await updateDoc(commPostRef, updates).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function toggleLikePost(post: Post, isCurrentlyLiked: boolean): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to like posts.');

  const likeDocId = `${user.uid}_${post.id}`;
  const likeRef = doc(db, 'likes', likeDocId);
  const postRef = doc(db, 'posts', post.id);

  try {
    if (isCurrentlyLiked) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, {
        likesCount: increment(-1),
        updatedAt: new Date().toISOString(),
      });
      return false;
    } else {
      await setDoc(likeRef, {
        userId: user.uid,
        targetId: post.id,
        targetType: 'post',
        createdAt: new Date().toISOString(),
      });
      await updateDoc(postRef, {
        likesCount: increment(1),
        updatedAt: new Date().toISOString(),
      });

      // Send notification to author
      sendNotification(
        post.authorId,
        'like',
        'Liked Your Post',
        `${user.displayName || 'Someone'} liked your post "${post.content.slice(0, 30)}..."`,
        post.id
      );

      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `likes/${likeDocId}`);
  }
}

export async function toggleSavePost(postId: string, isCurrentlySaved: boolean): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to save posts.');

  const saveDocId = `${user.uid}_${postId}`;
  const saveRef = doc(db, 'savedPosts', saveDocId);
  const postRef = doc(db, 'posts', postId);

  try {
    if (isCurrentlySaved) {
      await deleteDoc(saveRef);
      await updateDoc(postRef, {
        savesCount: increment(-1),
        updatedAt: new Date().toISOString(),
      });
      return false;
    } else {
      await setDoc(saveRef, {
        userId: user.uid,
        postId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(postRef, {
        savesCount: increment(1),
        updatedAt: new Date().toISOString(),
      });
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `savedPosts/${saveDocId}`);
  }
}

export function subscribeUserLikes(userId: string, callback: (likedPostIds: Set<string>) => void): Unsubscribe {
  if (!userId) {
    callback(new Set());
    return () => {};
  }
  const q = query(collection(db, 'likes'), where('userId', '==', userId), where('targetType', '==', 'post'));
  return onSnapshot(
    q,
    (snapshot) => {
      const set = new Set<string>();
      snapshot.docs.forEach((d) => set.add(d.data().targetId));
      callback(set);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'likes');
    }
  );
}

export function subscribeUserSavedPosts(userId: string, callback: (savedPostIds: Set<string>) => void): Unsubscribe {
  if (!userId) {
    callback(new Set());
    return () => {};
  }
  const q = query(collection(db, 'savedPosts'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const set = new Set<string>();
      snapshot.docs.forEach((d) => set.add(d.data().postId));
      callback(set);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'savedPosts');
    }
  );
}

// ==========================================
// COMMENTS
// ==========================================

export async function addComment(
  postId: string,
  content: string,
  postAuthorId?: string,
  parentCommentId?: string
): Promise<Comment> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to comment.');

  const commentsRef = collection(db, 'comments');
  const postRef = doc(db, 'posts', postId);

  const commentData = {
    postId,
    authorId: user.uid,
    authorName: user.displayName || 'Bizmunity Member',
    authorUsername: user.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user',
    authorAvatar: user.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.uid}`,
    content,
    parentCommentId: parentCommentId || null,
    likesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(commentsRef, commentData);
    await updateDoc(postRef, {
      commentsCount: increment(1),
      updatedAt: new Date().toISOString(),
    });

    // Reward for active engagement
    await updateDoc(doc(db, 'users', user.uid), {
      loyaltyPoints: increment(5),
    });

    if (postAuthorId) {
      sendNotification(
        postAuthorId,
        'comment',
        'New Comment on Post',
        `${user.displayName || 'Someone'} commented: "${content.slice(0, 30)}..."`,
        postId
      );
    }

    return { id: docRef.id, ...commentData } as Comment;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'comments');
  }
}

export function subscribeComments(postId: string, callback: (comments: Comment[]) => void): Unsubscribe {
  const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'comments');
    }
  );
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), {
      commentsCount: increment(-1),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
  }
}

// ==========================================
// FOLLOW SYSTEM
// ==========================================

export async function toggleFollowUser(
  firstArg: string,
  secondArg: string,
  thirdArg?: boolean
): Promise<boolean> {
  const user = auth.currentUser;
  let followerId: string;
  let targetUserId: string;
  let isFollowing: boolean;

  if (typeof thirdArg === 'boolean') {
    if (!user) throw new Error('Please sign in to follow.');
    followerId = user.uid;
    targetUserId = firstArg;
    isFollowing = thirdArg;
  } else {
    followerId = firstArg;
    targetUserId = secondArg;
    const followId = `${followerId}_${targetUserId}`;
    const followSnap = await getDoc(doc(db, 'followers', followId));
    isFollowing = followSnap.exists();
  }

  const followId = `${followerId}_${targetUserId}`;
  const followerRef = doc(db, 'followers', followId);
  const followingRef = doc(db, 'following', followId);
  const myUserRef = doc(db, 'users', followerId);
  const targetUserRef = doc(db, 'users', targetUserId);

  try {
    if (isFollowing) {
      await deleteDoc(followerRef);
      await deleteDoc(followingRef);
      await updateDoc(myUserRef, { followingCount: increment(-1) }).catch(() => {});
      await updateDoc(targetUserRef, { followersCount: increment(-1) }).catch(() => {});
      return false;
    } else {
      await setDoc(followerRef, {
        id: followId,
        followerId: followerId,
        targetId: targetUserId,
        targetType: 'user',
        createdAt: new Date().toISOString(),
      });
      await setDoc(followingRef, {
        id: followId,
        userId: followerId,
        targetId: targetUserId,
        targetType: 'user',
        createdAt: new Date().toISOString(),
      });
      await updateDoc(myUserRef, { followingCount: increment(1) }).catch(() => {});
      await updateDoc(targetUserRef, { followersCount: increment(1) }).catch(() => {});

      if (user && user.uid === followerId) {
        sendNotification(
          targetUserId,
          'follow',
          'New Follower',
          `${user.displayName || 'Someone'} started following your profile.`,
          user.uid
        ).catch(() => {});
      }
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `followers/${followId}`);
  }
}

export function subscribeUserFollowing(userId: string, callback: (followingIds: Set<string>) => void): Unsubscribe {
  if (!userId) {
    callback(new Set());
    return () => {};
  }
  const q = query(collection(db, 'following'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const set = new Set<string>();
      snapshot.docs.forEach((d) => set.add(d.data().targetId));
      callback(set);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'following');
    }
  );
}

// ==========================================
// LOYALTY & REWARDS
// ==========================================

export async function createOffer(
  title: string,
  code: string,
  discountPercent: number,
  description: string,
  expiresAt: string,
  communityId?: string,
  communityName?: string
): Promise<Offer> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to create offers.');

  const offersRef = collection(db, 'offers');
  const offerData = {
    businessId: user.uid,
    communityId: communityId || '',
    communityName: communityName || '',
    title,
    code: code.toUpperCase(),
    discountPercent,
    description,
    expiresAt,
    active: true,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(offersRef, offerData);
    const result = { id: docRef.id, ...offerData };

    if (communityId) {
      await setDoc(doc(db, 'communityOffers', docRef.id), result).catch(() => {});
      await updateDoc(doc(db, 'communities', communityId), {
        offersCount: increment(1),
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
      await updateDoc(doc(db, 'communityAnalytics', communityId), {
        totalOffers: increment(1),
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'offers');
  }
}

export function subscribeOffers(callback: (offers: Offer[]) => void): Unsubscribe {
  const q = query(collection(db, 'offers'), where('active', '==', true), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'offers');
    }
  );
}

export async function createReward(
  title: string,
  pointsCost: number,
  description: string,
  badge?: string,
  communityId?: string,
  communityName?: string
): Promise<Reward> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to create rewards.');

  const rewardsRef = collection(db, 'rewards');
  const rewardData = {
    businessId: user.uid,
    communityId: communityId || '',
    communityName: communityName || '',
    title,
    pointsCost,
    description,
    badge: badge || 'Bronze',
    active: true,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(rewardsRef, rewardData);
    const result = { id: docRef.id, ...rewardData };

    if (communityId) {
      await setDoc(doc(db, 'communityRewards', docRef.id), result).catch(() => {});
      await updateDoc(doc(db, 'communities', communityId), {
        rewardsCount: increment(1),
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
      await updateDoc(doc(db, 'communityAnalytics', communityId), {
        totalRewards: increment(1),
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'rewards');
  }
}

export function subscribeRewards(callback: (rewards: Reward[]) => void): Unsubscribe {
  const q = query(collection(db, 'rewards'), where('active', '==', true), orderBy('pointsCost', 'asc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Reward));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rewards');
    }
  );
}

export async function redeemReward(reward: Reward): Promise<RewardHistory> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to redeem rewards.');

  const userRef = doc(db, 'users', user.uid);
  const historyRef = doc(collection(db, 'rewardHistory'));

  try {
    return await runTransaction(db, async (txn) => {
      const userSnap = await txn.get(userRef);
      if (!userSnap.exists()) throw new Error('User profile not found.');

      const currentPoints = userSnap.data().loyaltyPoints || 0;
      if (currentPoints < reward.pointsCost) {
        throw new Error(`Insufficient points. You have ${currentPoints} points, but this reward requires ${reward.pointsCost}.`);
      }

      txn.update(userRef, {
        loyaltyPoints: increment(-reward.pointsCost),
      });

      const historyItem: RewardHistory = {
        id: historyRef.id,
        userId: user.uid,
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsSpent: reward.pointsCost,
        redeemedAt: new Date().toISOString(),
        status: 'active',
      };

      txn.set(historyRef, historyItem);
      return historyItem;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'rewardHistory');
  }
}

export function subscribeUserRewardHistory(
  userId: string,
  callback: (history: RewardHistory[]) => void
): Unsubscribe {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'rewardHistory'), where('userId', '==', userId), orderBy('redeemedAt', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RewardHistory));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rewardHistory');
    }
  );
}

// ==========================================
// EVENTS
// ==========================================

export async function createEvent(
  title: string,
  date: string,
  location: string,
  description: string,
  communityId: string,
  communityName: string
): Promise<EventItem> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to schedule events.');

  const eventsRef = collection(db, 'events');
  const eventData = {
    communityId,
    communityName,
    organizerId: user.uid,
    title,
    date,
    location,
    description,
    rsvpCount: 1,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(eventsRef, eventData);
    return { id: docRef.id, ...eventData };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'events');
  }
}

export function subscribeEvents(callback: (events: EventItem[]) => void): Unsubscribe {
  const q = query(collection(db, 'events'), orderBy('date', 'asc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'events');
    }
  );
}

// ==========================================
// QR CODES, LOYALTY, COUPONS & SOCIAL
// ==========================================

/**
 * Award loyalty points from scanning a business QR code
 * Enforces duplicate prevention!
 */
export async function awardLoyaltyPoints(
  userId: string,
  points: number,
  businessId: string,
  businessName: string,
  qrCode: string
): Promise<{ success: boolean; newTotal: number }> {
  const userRef = doc(db, 'users', userId);
  const scanRecordId = `${userId}_${qrCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const scanRecordRef = doc(db, 'reward_history', scanRecordId);

  try {
    return await runTransaction(db, async (transaction) => {
      const recordDoc = await transaction.get(scanRecordRef);
      if (recordDoc.exists()) {
        throw new Error('You have already scanned and claimed this loyalty QR reward!');
      }

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User account not found.');
      }

      const currentPoints = userDoc.data().loyaltyPoints || 0;
      const newTotal = currentPoints + points;

      // Update user points
      transaction.update(userRef, {
        loyaltyPoints: newTotal,
        updatedAt: new Date().toISOString(),
      });

      // Write permanent reward history record
      transaction.set(scanRecordRef, {
        id: scanRecordId,
        userId,
        businessId,
        businessName,
        points,
        type: 'earned',
        description: `Earned ${points} loyalty points from ${businessName}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        code: qrCode,
        createdAt: new Date().toISOString(),
      });

      return { success: true, newTotal };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `reward_history/${scanRecordId}`);
  }
}

/**
 * Redeem a single-use coupon from scanning a coupon QR code
 * Enforces duplicate redemption prevention!
 */
export async function redeemCoupon(
  userId: string,
  couponId: string,
  code: string,
  businessId: string,
  title: string
): Promise<{ success: boolean; message: string }> {
  const cleanId = `${couponId}_${userId}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const redemptionRef = doc(db, 'coupon_redemption', cleanId);

  try {
    const existing = await getDoc(redemptionRef);
    if (existing.exists()) {
      throw new Error('This coupon has already been redeemed by your account.');
    }

    await setDoc(redemptionRef, {
      id: cleanId,
      couponId,
      userId,
      code,
      businessId,
      title,
      redeemedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Coupon redeemed successfully!' };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `coupon_redemption/${cleanId}`);
  }
}

// ==========================================
// CHECK-IN SYSTEM
// ==========================================

export async function updateCommunityCheckInSettings(
  communityId: string,
  settings: CheckInSettings
): Promise<void> {
  try {
    await updateDoc(doc(db, 'communities', communityId), {
      checkInSettings: settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `communities/${communityId}`);
  }
}

export async function regenerateCommunityCheckInCode(communityId: string): Promise<string> {
  const newCode = `CHK_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  try {
    await updateDoc(doc(db, 'communities', communityId), {
      'checkInSettings.checkInCode': newCode,
      updatedAt: new Date().toISOString(),
    });
    return newCode;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `communities/${communityId}`);
    return newCode;
  }
}

export interface CheckInResult {
  success: boolean;
  alreadyCheckedIn?: boolean;
  message?: string;
  streak?: number;
  pointsEarned?: number;
  milestoneReward?: string;
  communityName?: string;
  communityId?: string;
}

export async function performCommunityCheckIn(
  userId: string,
  communityId: string,
  checkInCode: string
): Promise<CheckInResult> {
  try {
    const commRef = doc(db, 'communities', communityId);
    const commSnap = await getDoc(commRef);

    if (!commSnap.exists()) {
      return {
        success: false,
        message: 'Community not found or has been removed.',
      };
    }

    const commData = commSnap.data() as Community;
    const settings = commData.checkInSettings;

    if (settings && settings.enabled === false) {
      return {
        success: false,
        message: `${commData.name} does not currently have Daily Check-In enabled.`,
      };
    }

    // Check code validity if code is set
    if (settings?.checkInCode && settings.checkInCode !== checkInCode) {
      return {
        success: false,
        message: 'This Check-In QR is outdated or invalid. Please scan the current QR from the business.',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const userCheckInId = `${communityId}_${userId}_${todayStr}`;
    const todayCheckInRef = doc(db, 'check_ins', userCheckInId);
    const userRef = doc(db, 'users', userId);

    return await runTransaction(db, async (txn) => {
      const todayDoc = await txn.get(todayCheckInRef);
      if (todayDoc.exists()) {
        const existingData = todayDoc.data() as CheckInRecord;
        return {
          success: false,
          alreadyCheckedIn: true,
          streak: existingData.streak || 1,
          communityName: commData.name,
          message: `You've already checked in at ${commData.name} today! Come back tomorrow to continue your streak.`,
        };
      }

      const userSnap = await txn.get(userRef);
      const userData = userSnap.data() || {};

      const lastCheckInDate = userData[`lastCheckIn_${communityId}`] || userData.lastActiveDate;
      const currentStreak = userData[`streak_${communityId}`] || userData.streakDays || 0;

      const streakCalc = calculateCheckInStreak(
        lastCheckInDate,
        currentStreak,
        todayStr,
        settings?.streakProtection || false
      );

      const basePoints = settings?.pointsPerCheckIn || 10;
      let totalPoints = basePoints;

      // Check for milestone reward for this exact streak day
      let milestoneReward: string | undefined = undefined;
      if (settings?.milestones && Array.isArray(settings.milestones)) {
        const found = settings.milestones.find((m) => m.day === streakCalc.newStreak);
        if (found) {
          milestoneReward = found.reward;
          if (found.bonusPoints && found.bonusPoints > 0) {
            totalPoints += found.bonusPoints;
          }
        }
      }

      // Record check-in
      const checkInRecord: CheckInRecord = {
        id: userCheckInId,
        userId,
        communityId,
        communityName: commData.name,
        streak: streakCalc.newStreak,
        pointsEarned: totalPoints,
        milestoneReward,
        dateStr: todayStr,
        timestamp: new Date().toISOString(),
      };
      txn.set(todayCheckInRef, checkInRecord);
      txn.set(doc(db, 'communityCheckins', userCheckInId), checkInRecord);

      // Update community analytics checkins
      const commAnalyticsRef = doc(db, 'communityAnalytics', communityId);
      txn.update(commAnalyticsRef, {
        totalCheckins: increment(1),
        totalPointsAwarded: increment(totalPoints),
        updatedAt: new Date().toISOString(),
      });

      // Record in reward_history for audit and rewards section
      const historyId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      txn.set(doc(db, 'reward_history', historyId), {
        id: historyId,
        userId,
        businessId: communityId,
        businessName: commData.name,
        points: totalPoints,
        type: 'earned',
        description: milestoneReward
          ? `Checked in at ${commData.name} (Day ${streakCalc.newStreak} Streak! Reached milestone: ${milestoneReward})`
          : `Daily Check-In at ${commData.name} (Day ${streakCalc.newStreak} Streak)`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString(),
      });

      // Update user document
      txn.update(userRef, {
        loyaltyPoints: increment(totalPoints),
        streakDays: streakCalc.newStreak,
        lastActiveDate: todayStr,
        [`streak_${communityId}`]: streakCalc.newStreak,
        [`lastCheckIn_${communityId}`]: todayStr,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        streak: streakCalc.newStreak,
        pointsEarned: totalPoints,
        milestoneReward,
        communityName: commData.name,
        communityId,
      };
    });
  } catch (err: any) {
    console.error('Check-in error:', err);
    return {
      success: false,
      message: err.message || 'Failed to process check-in. Please try again.',
    };
  }
}

/**
 * Fetch user profile by UID
 */
export async function getUserProfile(userId: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }
}

/**
 * Fetch posts created by a specific user
 */
export async function getUserPosts(userId: string): Promise<Post[]> {
  try {
    const q = query(collection(db, 'posts'), where('authorId', '==', userId), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'posts');
  }
}

/**
 * Fetch communities owned or joined by user
 */
export async function getUserCommunities(userId: string): Promise<Community[]> {
  try {
    const q = query(collection(db, 'communities'), where('ownerId', '==', userId), limit(15));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Community));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'communities');
  }
}

/**
 * Send direct message
 */
export async function sendDirectMessage(senderId: string, receiverId: string, content: string): Promise<void> {
  try {
    await addDoc(collection(db, 'messages'), {
      senderId,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'messages');
  }
}

/**
 * Subscribe to registered creators/users in Firestore
 */
export function subscribeCreators(callback: (creators: UserProfile[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'users'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((d) => ({ id: d.id, uid: d.id, ...d.data() } as UserProfile));
        callback(users);
      },
      (err) => {
        console.warn('Could not subscribe users collection:', err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('Error setting up creators subscription:', err);
    callback([]);
    return () => {};
  }
}


