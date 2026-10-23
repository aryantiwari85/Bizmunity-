import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { AndroidShell } from './AndroidShell';
import { AndroidBottomNav, AndroidTab } from './AndroidBottomNav';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { PhoneOtpScreen } from './screens/PhoneOtpScreen';
import { UsernameSetupScreen } from './screens/UsernameSetupScreen';
import { FeedScreen } from './screens/FeedScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { CommunitiesScreen } from './screens/CommunitiesScreen';
import { CommunityDetailsScreen } from './screens/CommunityDetailsScreen';
import { CreateCommunityScreen } from './screens/CreateCommunityScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { LoyaltyScreen } from './screens/LoyaltyScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CommentsBottomSheet } from './components/CommentsBottomSheet';
import { UserQRCodeModal } from '../components/UserQRCodeModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { ScannedProfileModal } from '../components/ScannedProfileModal';
import { MyCommunitiesModal } from '../components/MyCommunitiesModal';
import {
  subscribeFeedPosts,
  subscribeCommunities,
  subscribeOffers,
  subscribeRewards,
  subscribeEvents,
  subscribeCreators,
  subscribeUserNotifications,
  subscribeUserLikes,
  subscribeUserSavedPosts,
  subscribeUserJoinedCommunities,
  subscribeUserRewardHistory,
} from '../firebase/firestoreService';
import {
  Post,
  Community,
  Offer,
  Reward,
  EventItem,
  NotificationItem,
  RewardHistory,
  UserProfile,
} from '../types/bizmunity';

export const AndroidApp: React.FC = () => {
  const { currentUser, userProfile, isNewGoogleUser, loading, authReady } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  // Navigation State
  const [screen, setScreen] = useState<
    | 'splash'
    | 'onboarding'
    | 'main'
    | 'login'
    | 'register'
    | 'phone'
    | 'username-setup'
    | 'community-details'
    | 'create-community'
    | 'create-post'
    | 'edit-profile'
    | 'notifications'
    | 'settings'
  >('splash');

  const [currentTab, setCurrentTab] = useState<AndroidTab>('feed');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [userQrModalOpen, setUserQrModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [myCommunitiesModalOpen, setMyCommunitiesModalOpen] = useState(false);

  // Real-time Firestore state
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([]);

  // User engagement sets
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Global Firestore Subscriptions
  useEffect(() => {
    const unsubFeed = subscribeFeedPosts((list) => {
      setPosts(list);
      setLoadingPosts(false);
    });

    const unsubComm = subscribeCommunities((list) => {
      setCommunities(list);
    });

    const unsubOffers = subscribeOffers((list) => {
      setOffers(list);
    });

    const unsubRewards = subscribeRewards((list) => {
      setRewards(list);
    });

    const unsubEvents = subscribeEvents((list) => {
      setEvents(list);
    });

    const unsubCreators = subscribeCreators((list) => {
      setCreators(list);
    });

    return () => {
      unsubFeed();
      unsubComm();
      unsubOffers();
      unsubRewards();
      unsubEvents();
      unsubCreators();
    };
  }, []);

  // Merged creators list combining registered profiles, community owners, and post authors
  const allCreators = useMemo(() => {
    const map = new Map<string, UserProfile>();
    // 1. From users collection
    creators.forEach((u) => {
      const id = u.uid || u.id;
      if (id) map.set(id, u);
    });
    // 2. From community owners
    communities.forEach((c) => {
      if (c.ownerId && !map.has(c.ownerId)) {
        map.set(c.ownerId, {
          id: c.ownerId,
          uid: c.ownerId,
          name: c.ownerName || 'Community Founder',
          username: c.handle || 'founder',
          email: '',
          avatar: c.ownerAvatar,
          bio: `Founder of ${c.name} · ${c.category}`,
          followersCount: c.followerCount || 0,
          followingCount: 0,
          joinedCommunitiesCount: 1,
          createdCommunitiesCount: 1,
          loyaltyPoints: 100,
          badge: 'Founder',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
        });
      }
    });
    // 3. From post authors
    posts.forEach((p) => {
      if (p.authorId && !map.has(p.authorId)) {
        map.set(p.authorId, {
          id: p.authorId,
          uid: p.authorId,
          name: p.authorName || 'Creator',
          username: p.authorUsername || 'creator',
          email: '',
          avatar: p.authorAvatar,
          bio: `Active Member in ${p.communityName || 'Bizmunity'}`,
          followersCount: 12,
          followingCount: 6,
          joinedCommunitiesCount: 1,
          createdCommunitiesCount: 0,
          loyaltyPoints: 50,
          badge: p.authorRole || 'Creator',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.createdAt || new Date().toISOString(),
        });
      }
    });
    return Array.from(map.values());
  }, [creators, communities, posts]);

  // User-specific Firestore Subscriptions
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLikedPostIds(new Set());
      setSavedPostIds(new Set());
      setJoinedCommunityIds([]);
      setRewardHistory([]);
      return;
    }

    const unsubNotifs = subscribeUserNotifications(currentUser.uid, (list) => {
      setNotifications(list);
    });

    const unsubLikes = subscribeUserLikes(currentUser.uid, (set) => {
      setLikedPostIds(set);
    });

    const unsubSaved = subscribeUserSavedPosts(currentUser.uid, (set) => {
      setSavedPostIds(set);
    });

    const unsubJoined = subscribeUserJoinedCommunities(currentUser.uid, (ids) => {
      setJoinedCommunityIds(ids);
    });

    const unsubHistory = subscribeUserRewardHistory(currentUser.uid, (list) => {
      setRewardHistory(list);
    });

    return () => {
      unsubNotifs();
      unsubLikes();
      unsubSaved();
      unsubJoined();
      unsubHistory();
    };
  }, [currentUser]);

  // Derived user lists
  const userPosts = posts.filter((p) => p.authorId === currentUser?.uid);
  const savedPostsList = posts.filter((p) => savedPostIds.has(p.id));

  // Splash screen completion: If already logged in -> Home Screen (or UsernameSetup if new); If first-time / not logged in -> Login Screen
  useEffect(() => {
    if (!splashFinished) return;
    if (loading) return; // Wait until Firebase Auth restores session if present

    if (currentUser) {
      if (!userProfile?.username || isNewGoogleUser) {
        setScreen('username-setup');
      } else {
        setScreen('main');
      }
    } else {
      setScreen('login');
    }
  }, [splashFinished, loading, currentUser, userProfile, isNewGoogleUser]);

  const handleSplashDone = () => {
    setSplashFinished(true);
  };

  const handleOnboardingDone = () => {
    setScreen('login');
  };

  // Workflow for "+" Floating Action Button:
  // Case 1: User has NO community -> Open Create Community flow
  // Case 2: User ALREADY has community -> Open My Communities modal (or create new community / select community)
  const handlePlusButtonWorkflow = () => {
    if (!currentUser) {
      setScreen('login');
      return;
    }

    const owned = communities.filter((c) => c.ownerId === currentUser.uid);
    if (owned.length === 0) {
      // Case 1: No community -> Open Create Community screen directly
      setScreen('create-community');
    } else {
      // Case 2: Already has community -> Open My Communities bottom sheet
      setMyCommunitiesModalOpen(true);
    }
  };

  return (
    <AndroidShell>
      {/* 1. Splash Screen */}
      {screen === 'splash' && <SplashScreen onComplete={handleSplashDone} />}

      {/* 2. Onboarding Screen */}
      {screen === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingDone} />}

      {/* 3. Authentication Screens */}
      {screen === 'login' && (
        <LoginScreen
          onSuccess={(isNewUser) => {
            if (isNewUser || !userProfile?.username) {
              setScreen('username-setup');
            } else {
              setScreen('main');
            }
          }}
          onGoToRegister={() => setScreen('register')}
          onGoToPhone={() => setScreen('phone')}
          onExploreGuest={() => setScreen('main')}
        />
      )}

      {screen === 'register' && (
        <RegisterScreen
          onSuccess={(isNewUser) => {
            if (isNewUser) {
              setScreen('username-setup');
            } else {
              setScreen('main');
            }
          }}
          onGoToLogin={() => setScreen('login')}
          onGoToPhone={() => setScreen('phone')}
        />
      )}

      {screen === 'phone' && (
        <PhoneOtpScreen
          onSuccess={(isNewUser) => {
            if (isNewUser || !userProfile?.username) {
              setScreen('username-setup');
            } else {
              setScreen('main');
            }
          }}
          onGoBack={() => setScreen('login')}
        />
      )}

      {/* 4. Username Setup (for new Google/Phone users who need to claim @username) */}
      {screen === 'username-setup' && (
        <UsernameSetupScreen
          onSuccess={() => setScreen('main')}
        />
      )}

      {/* 4. Overlay & Sub-screens */}
      {screen === 'community-details' && selectedCommunity && (
        <CommunityDetailsScreen
          community={selectedCommunity}
          posts={posts}
          offers={offers}
          rewards={rewards}
          events={events}
          isJoined={joinedCommunityIds.includes(selectedCommunity.id)}
          onGoBack={() => setScreen('main')}
          onOpenCreatePost={() => setScreen('create-post')}
          onOpenScanner={() => setScannerModalOpen(true)}
          onOpenAuth={() => setScreen('login')}
        />
      )}

      {screen === 'create-community' && (
        <CreateCommunityScreen
          onSuccess={(commId) => {
            if (commId) {
              const comm = communities.find((c) => c.id === commId);
              if (comm) {
                setSelectedCommunity(comm);
                setScreen('community-details');
                return;
              }
            }
            setScreen('main');
          }}
          onGoBack={() => setScreen('main')}
        />
      )}

      {screen === 'create-post' && (
        <CreatePostScreen
          communities={communities}
          initialCommunityId={selectedCommunity?.id}
          onSuccess={() => setScreen('main')}
          onGoBack={() => setScreen('main')}
        />
      )}

      {screen === 'edit-profile' && (
        <EditProfileScreen
          onSuccess={() => setScreen('main')}
          onGoBack={() => setScreen('main')}
        />
      )}

      {screen === 'notifications' && (
        <NotificationsScreen
          notifications={notifications}
          onGoBack={() => setScreen('main')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          onGoBack={() => setScreen('main')}
          onOpenQR={() => setUserQrModalOpen(true)}
          onLogout={() => setScreen('login')}
        />
      )}

      {/* 5. Main Tab Destinations with Bottom Navigation */}
      {screen === 'main' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentTab === 'feed' && (
              <FeedScreen
                posts={posts}
                communities={communities}
                creators={allCreators}
                notifications={notifications}
                likedPostIds={likedPostIds}
                savedPostIds={savedPostIds}
                loading={loadingPosts}
                onRefresh={() => {
                  setLoadingPosts(true);
                  setTimeout(() => setLoadingPosts(false), 500);
                }}
                onOpenCreatePost={handlePlusButtonWorkflow}
                onOpenNotifications={() => setScreen('notifications')}
                onOpenQR={() => setUserQrModalOpen(true)}
                onCommunityClick={(commId) => {
                  const comm = communities.find((c) => c.id === commId);
                  if (comm) {
                    setSelectedCommunity(comm);
                    setScreen('community-details');
                  }
                }}
                onPostClick={(post) => setActiveCommentPost(post)}
                onCreatorClick={(uid) => setScannedUserId(uid)}
                onOpenComments={(post) => setActiveCommentPost(post)}
                onOpenAuth={() => setScreen('login')}
              />
            )}

            {currentTab === 'explore' && (
              <ExploreScreen
                communities={communities}
                posts={posts}
                creators={allCreators}
                onCommunityClick={(commId) => {
                  const comm = communities.find((c) => c.id === commId);
                  if (comm) {
                    setSelectedCommunity(comm);
                    setScreen('community-details');
                  }
                }}
                onPostClick={(post) => setActiveCommentPost(post)}
                onCreatorClick={(uid) => setScannedUserId(uid)}
                onOpenAuth={() => setScreen('login')}
              />
            )}

            {currentTab === 'communities' && (
              <CommunitiesScreen
                communities={communities}
                joinedCommunityIds={joinedCommunityIds}
                onSelectCommunity={(comm) => {
                  setSelectedCommunity(comm);
                  setScreen('community-details');
                }}
                onOpenCreateCommunity={() =>
                  currentUser ? setScreen('create-community') : setScreen('login')
                }
                onOpenAuth={() => setScreen('login')}
              />
            )}

            {currentTab === 'loyalty' && (
              <LoyaltyScreen
                offers={offers}
                rewards={rewards}
                rewardHistory={rewardHistory}
                communities={communities}
                onOpenQR={() => setUserQrModalOpen(true)}
                onOpenScanner={() => setScannerModalOpen(true)}
                onOpenAuth={() => setScreen('login')}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileScreen
                userPosts={userPosts}
                savedPosts={savedPostsList}
                communities={communities}
                joinedCommunityIds={joinedCommunityIds}
                rewardHistory={rewardHistory}
                onOpenEditProfile={() => setScreen('edit-profile')}
                onOpenSettings={() => setScreen('settings')}
                onOpenQR={() => setUserQrModalOpen(true)}
                onCommunityClick={(commId) => {
                  const comm = communities.find((c) => c.id === commId);
                  if (comm) {
                    setSelectedCommunity(comm);
                    setScreen('community-details');
                  }
                }}
                onOpenAuth={() => setScreen('login')}
              />
            )}
          </div>

          {/* Android Bottom Navigation Bar with Middle Floating Action Button */}
          <AndroidBottomNav
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onOpenScanner={() => setScannerModalOpen(true)}
            unreadCount={notifications.filter((n) => !n.read).length}
          />
        </div>
      )}

      {/* Comments Slide-up Bottom Sheet */}
      <CommentsBottomSheet
        post={activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        onOpenAuth={() => setScreen('login')}
      />

      {/* 1. Permanent Personal & Business QR Code Modal */}
      <UserQRCodeModal
        isOpen={userQrModalOpen}
        onClose={() => setUserQrModalOpen(false)}
        onOpenScanner={() => {
          setUserQrModalOpen(false);
          setScannerModalOpen(true);
        }}
        onOpenAuth={() => setScreen('login')}
        onCreateNewCommunity={() => {
          setUserQrModalOpen(false);
          setScreen('create-community');
        }}
        userCommunities={communities.filter((c) => c.ownerId === currentUser?.uid)}
      />

      {/* 2. Interactive Camera / Photo QR Scanner */}
      <QRScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScannedUser={(uid) => {
          setScannerModalOpen(false);
          setScannedUserId(uid);
        }}
        onScannedBusiness={(commId) => {
          setScannerModalOpen(false);
          const comm = communities.find((c) => c.id === commId);
          if (comm) {
            setSelectedCommunity(comm);
            setScreen('community-details');
          }
        }}
      />

      {/* 3. Scanned User Profile Modal */}
      {scannedUserId && (
        <ScannedProfileModal
          userId={scannedUserId}
          onClose={() => setScannedUserId(null)}
          onOpenCommunity={(commId) => {
            setScannedUserId(null);
            const comm = communities.find((c) => c.id === commId);
            if (comm) {
              setSelectedCommunity(comm);
              setScreen('community-details');
            }
          }}
        />
      )}
      {/* 4. My Communities Selection Modal (Triggered by '+' button when user owns communities) */}
      <MyCommunitiesModal
        isOpen={myCommunitiesModalOpen}
        onClose={() => setMyCommunitiesModalOpen(false)}
        ownedCommunities={communities.filter((c) => c.ownerId === currentUser?.uid)}
        onSelectCommunity={(comm) => {
          setSelectedCommunity(comm);
          setScreen('community-details');
        }}
        onCreateNewCommunity={() => {
          setScreen('create-community');
        }}
      />
    </AndroidShell>
  );
};
